import csv
import io
import os
import time
from collections import defaultdict
from typing import DefaultDict, Dict, Iterable, List, Tuple

import numpy as np

from .geometry import haversine_m, parse_linestring_wkt
from .graph import RoadNetwork
from .spatial_index import NearestNodeIndex


class RoadNetworkLoader:
    def __init__(self, coord_scale: float = 1e7, deduplicate_edges: bool = True):
        self.coord_scale = coord_scale
        self.deduplicate_edges = deduplicate_edges

    def load_csv(self, csv_path: str, progress_callback=None) -> RoadNetwork:
        started = time.perf_counter()
        total_bytes = os.path.getsize(csv_path)
        coord_to_node: Dict[Tuple[int, int], int] = {}
        lons: List[float] = []
        lats: List[float] = []
        edge_weights: Dict[Tuple[int, int], float] = {} if self.deduplicate_edges else None
        raw_edge_count = 0
        invalid_rows = 0

        self._report_progress(
            progress_callback,
            stage="parsing",
            progress=10.0,
            message="Parsing WKT rows",
            bytes_read=0,
            total_bytes=total_bytes,
            nodes=0,
            edges=0,
        )
        last_progress_report = 0.0

        with open(csv_path, "rb") as raw_fp:
            fp = io.TextIOWrapper(raw_fp, encoding="utf-8-sig", newline="")
            reader = csv.DictReader(fp)
            wkt_field = self._find_wkt_field(reader.fieldnames)
            if wkt_field is None:
                raise ValueError("CSV must contain a WKT column")

            for row in reader:
                if total_bytes:
                    bytes_read = raw_fp.tell()
                    parse_progress = 10.0 + min(60.0, (bytes_read / total_bytes) * 60.0)
                    if parse_progress - last_progress_report >= 1.0:
                        last_progress_report = parse_progress
                        self._report_progress(
                            progress_callback,
                            stage="parsing",
                            progress=parse_progress,
                            message="Parsing WKT rows",
                            bytes_read=bytes_read,
                            total_bytes=total_bytes,
                            nodes=len(lons),
                            edges=raw_edge_count,
                        )
                try:
                    coords = parse_linestring_wkt(self._read_wkt_value(row, wkt_field))
                except Exception:
                    invalid_rows += 1
                    continue

                prev_node_id = None
                prev_lon = None
                prev_lat = None
                for lon, lat in coords:
                    node_id = self._get_or_create_node(coord_to_node, lons, lats, lon, lat)
                    if prev_node_id is not None and node_id != prev_node_id:
                        weight = haversine_m(prev_lon, prev_lat, lon, lat)
                        if weight > 0:
                            a, b = sorted((prev_node_id, node_id))
                            if edge_weights is not None:
                                current = edge_weights.get((a, b))
                                if current is None or weight < current:
                                    edge_weights[(a, b)] = weight
                            raw_edge_count += 1
                    prev_node_id = node_id
                    prev_lon = lon
                    prev_lat = lat

        node_count = len(lons)
        if node_count == 0:
            raise ValueError("No valid road network nodes were loaded")

        if edge_weights is None:
            raise NotImplementedError("Non-deduplicated loading is not implemented")

        self._report_progress(
            progress_callback,
            stage="building_graph",
            progress=72.0,
            message="Building CSR graph",
            bytes_read=total_bytes,
            total_bytes=total_bytes,
            nodes=node_count,
            edges=raw_edge_count,
        )
        offsets, neighbors, weights, edge_u, edge_v = self._build_csr(node_count, edge_weights.items())
        node_lons = np.asarray(lons, dtype=np.float64)
        node_lats = np.asarray(lats, dtype=np.float64)
        self._report_progress(
            progress_callback,
            stage="building_index",
            progress=88.0,
            message="Building nearest-node spatial index",
            bytes_read=total_bytes,
            total_bytes=total_bytes,
            nodes=node_count,
            edges=len(edge_u),
        )
        spatial_index = NearestNodeIndex(node_lons, node_lats)
        total_ms = (time.perf_counter() - started) * 1000.0

        return RoadNetwork(
            node_lons=node_lons,
            node_lats=node_lats,
            offsets=offsets,
            neighbors=neighbors,
            weights=weights,
            edge_u=edge_u,
            edge_v=edge_v,
            spatial_index=spatial_index,
            metadata={
                "load_time_ms": total_ms,
                "raw_edge_count": float(raw_edge_count),
                "invalid_rows": float(invalid_rows),
                "min_lon": float(node_lons.min()),
                "min_lat": float(node_lats.min()),
                "max_lon": float(node_lons.max()),
                "max_lat": float(node_lats.max()),
            },
        )

    def _report_progress(self, progress_callback, **payload):
        if progress_callback is not None:
            progress_callback(payload)

    def _find_wkt_field(self, fieldnames):
        if not fieldnames:
            return None
        for fieldname in fieldnames:
            if fieldname and fieldname.strip().lower() == "wkt":
                return fieldname
        return None

    def _read_wkt_value(self, row, wkt_field):
        value = row.get(wkt_field, "")
        extra_columns = row.get(None)
        if extra_columns:
            return ",".join([value] + extra_columns)
        return value

    def _get_or_create_node(
        self,
        coord_to_node: Dict[Tuple[int, int], int],
        lons: List[float],
        lats: List[float],
        lon: float,
        lat: float,
    ) -> int:
        key = (int(round(lon * self.coord_scale)), int(round(lat * self.coord_scale)))
        node_id = coord_to_node.get(key)
        if node_id is not None:
            return node_id
        node_id = len(lons)
        coord_to_node[key] = node_id
        lons.append(lon)
        lats.append(lat)
        return node_id

    def _build_csr(self, node_count: int, edges: Iterable[Tuple[Tuple[int, int], float]]):
        degree = np.zeros(node_count, dtype=np.int64)
        edge_list = list(edges)
        edge_u = np.empty(len(edge_list), dtype=np.int32 if node_count < 2147483647 else np.int64)
        edge_v = np.empty(len(edge_list), dtype=np.int32 if node_count < 2147483647 else np.int64)
        for (a, b), _ in edge_list:
            degree[a] += 1
            degree[b] += 1

        offsets = np.empty(node_count + 1, dtype=np.int64)
        offsets[0] = 0
        np.cumsum(degree, out=offsets[1:])
        neighbors = np.empty(int(offsets[-1]), dtype=np.int32 if node_count < 2147483647 else np.int64)
        weights = np.empty(int(offsets[-1]), dtype=np.float64)
        cursor = offsets[:-1].copy()

        for edge_index, ((a, b), weight) in enumerate(edge_list):
            edge_u[edge_index] = a
            edge_v[edge_index] = b

            pos = cursor[a]
            neighbors[pos] = b
            weights[pos] = weight
            cursor[a] += 1

            pos = cursor[b]
            neighbors[pos] = a
            weights[pos] = weight
            cursor[b] += 1

        return offsets, neighbors, weights, edge_u, edge_v
