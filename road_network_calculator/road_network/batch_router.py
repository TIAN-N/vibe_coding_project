import csv
import math
import os
import threading
import time
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra as scipy_dijkstra

from .calculator import RoadDistanceCalculator
from .geometry import haversine_m
from .graph import RoadNetwork

INPUT_COLUMNS = ["Src NE Name", "Sink NE Name", "Src Lon", "Src Lat", "Sink Lon", "Sink Lat"]
ROUTE_WKT_COLUMN = "Route WKT"
OUTPUT_COLUMNS = INPUT_COLUMNS + ["Straight Distance", "Distance", ROUTE_WKT_COLUMN, "Error Detail"]
SCIPY_BATCH_MAX_ROWS = 20000
SCIPY_BATCH_MAX_NODES = 500000


@dataclass
class BatchRouteSummary:
    total: int
    completed: int
    success: int
    failed: int
    skipped_by_threshold: int
    elapsed_s: float


class BatchRouteCalculator:
    def __init__(
        self,
        network: RoadNetwork,
        calculator: RoadDistanceCalculator,
        max_snap_distance_m: float = 1000.0,
    ):
        self.network = network
        self.calculator = calculator
        self.max_snap_distance_m = max_snap_distance_m
        self._snap_cache = {}
        self._snap_cache_lock = threading.Lock()
        self._thread_local = threading.local()
        self._csr_matrix = None

    def run_csv(
        self,
        input_csv_path: str,
        output_csv_path: str,
        straight_distance_threshold_km: float,
        workers: int = 4,
        preview_limit: int = 1000,
        progress_callback=None,
    ) -> BatchRouteSummary:
        total = self._count_rows(input_csv_path)
        if 0 < total <= SCIPY_BATCH_MAX_ROWS and self.network.node_count <= SCIPY_BATCH_MAX_NODES:
            return self._run_csv_scipy(
                input_csv_path,
                output_csv_path,
                straight_distance_threshold_km,
                workers=workers,
                preview_limit=preview_limit,
                progress_callback=progress_callback,
                total=total,
            )
        return self._run_csv_threaded(
            input_csv_path,
            output_csv_path,
            straight_distance_threshold_km,
            workers=workers,
            preview_limit=preview_limit,
            progress_callback=progress_callback,
            total=total,
        )

    def _run_csv_threaded(
        self,
        input_csv_path: str,
        output_csv_path: str,
        straight_distance_threshold_km: float,
        workers: int,
        preview_limit: int,
        progress_callback,
        total: int,
    ) -> BatchRouteSummary:
        started = time.perf_counter()
        completed = 0
        success = 0
        failed = 0
        skipped_by_threshold = 0
        preview_rows = []
        threshold_m = max(0.0, float(straight_distance_threshold_km)) * 1000.0
        workers = max(1, int(workers or 1))

        os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
        with open(input_csv_path, "r", encoding="utf-8-sig", newline="") as in_fp, open(
            output_csv_path, "w", encoding="utf-8-sig", newline=""
        ) as out_fp:
            reader = csv.DictReader(in_fp)
            self._validate_columns(reader.fieldnames)
            writer = csv.DictWriter(out_fp, fieldnames=OUTPUT_COLUMNS)
            writer.writeheader()

            pending = {}
            write_buffer = {}
            next_write_index = 0
            max_pending = max(4, workers * 2)
            with ThreadPoolExecutor(max_workers=workers) as executor:
                for row_index, row in enumerate(reader):
                    while len(pending) >= max_pending:
                        completed_delta = self._drain_completed(
                            pending,
                            preview_rows,
                            preview_limit,
                        )
                        next_write_index = self._write_ordered(
                            writer,
                            write_buffer,
                            completed_delta["results"],
                            next_write_index,
                        )
                        completed += completed_delta["completed"]
                        success += completed_delta["success"]
                        failed += completed_delta["failed"]
                        skipped_by_threshold += completed_delta["skipped_by_threshold"]
                        self._report(progress_callback, total, completed, success, failed, skipped_by_threshold)

                    future = executor.submit(self._calculate_row, row_index, row, threshold_m)
                    pending[future] = row_index

                while pending:
                    completed_delta = self._drain_completed(
                        pending,
                        preview_rows,
                        preview_limit,
                    )
                    next_write_index = self._write_ordered(
                        writer,
                        write_buffer,
                        completed_delta["results"],
                        next_write_index,
                    )
                    completed += completed_delta["completed"]
                    success += completed_delta["success"]
                    failed += completed_delta["failed"]
                    skipped_by_threshold += completed_delta["skipped_by_threshold"]
                    self._report(progress_callback, total, completed, success, failed, skipped_by_threshold)

            out_fp.flush()

        elapsed_s = time.perf_counter() - started
        self._report(
            progress_callback,
            total,
            completed,
            success,
            failed,
            skipped_by_threshold,
            preview_rows=preview_rows,
        )
        return BatchRouteSummary(total, completed, success, failed, skipped_by_threshold, elapsed_s)

    def _run_csv_scipy(
        self,
        input_csv_path: str,
        output_csv_path: str,
        straight_distance_threshold_km: float,
        workers: int,
        preview_limit: int,
        progress_callback,
        total: int,
    ) -> BatchRouteSummary:
        started = time.perf_counter()
        threshold_m = max(0.0, float(straight_distance_threshold_km)) * 1000.0
        outputs = []
        tasks = []
        success = 0
        failed = 0
        skipped_by_threshold = 0
        preview_rows = []

        with open(input_csv_path, "r", encoding="utf-8-sig", newline="") as in_fp:
            reader = csv.DictReader(in_fp)
            self._validate_columns(reader.fieldnames)
            for row_index, row in enumerate(reader):
                output, task, skipped = self._prepare_output_and_task(row_index, row, threshold_m)
                outputs.append(output)
                if skipped:
                    skipped_by_threshold += 1
                if task is None:
                    if output["Error Detail"]:
                        failed += 1
                    else:
                        success += 1
                    continue
                tasks.append(task)

        self._report(progress_callback, total, len(outputs) - len(tasks), success, failed, skipped_by_threshold)
        chunk_size = max(16, int(workers or 1) * 16)
        tasks_by_source = {}
        for task in tasks:
            tasks_by_source.setdefault(task["start_node"], []).append(task)
        unique_sources = list(tasks_by_source.keys())
        graph = self._scipy_csr_matrix()

        processed_tasks = 0
        for chunk_start in range(0, len(unique_sources), chunk_size):
            source_chunk = unique_sources[chunk_start : chunk_start + chunk_size]
            distances, predecessors = scipy_dijkstra(
                graph,
                directed=True,
                indices=np.asarray(source_chunk, dtype=np.int64),
                return_predecessors=True,
            )
            if len(source_chunk) == 1:
                distances = distances.reshape(1, -1)
                predecessors = predecessors.reshape(1, -1)

            source_position = {source: pos for pos, source in enumerate(source_chunk)}
            for source in source_chunk:
                row_pos = source_position[source]
                for task in tasks_by_source[source]:
                    output = outputs[task["row_index"]]
                    distance = float(distances[row_pos, task["end_node"]])
                    if math.isinf(distance):
                        output["Error Detail"] = "unreachable"
                        failed += 1
                    else:
                        node_path = self._reconstruct_scipy_path(
                            task["start_node"],
                            task["end_node"],
                            predecessors[row_pos],
                        )
                        path = [(float(self.network.node_lons[n]), float(self.network.node_lats[n])) for n in node_path]
                        output["Distance"] = f"{round(distance, 1):.1f}"
                        output[ROUTE_WKT_COLUMN] = path_to_linestring(path)
                        success += 1
                        if len(preview_rows) < preview_limit:
                            preview = dict(output)
                            preview["row_index"] = task["row_index"]
                            preview_rows.append(preview)
                    processed_tasks += 1

            completed = len(outputs) - len(tasks) + processed_tasks
            self._report(progress_callback, total, completed, success, failed, skipped_by_threshold)

        os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
        with open(output_csv_path, "w", encoding="utf-8-sig", newline="") as out_fp:
            writer = csv.DictWriter(out_fp, fieldnames=OUTPUT_COLUMNS)
            writer.writeheader()
            writer.writerows(outputs)

        elapsed_s = time.perf_counter() - started
        self._report(
            progress_callback,
            total,
            total,
            success,
            failed,
            skipped_by_threshold,
            preview_rows=preview_rows,
        )
        return BatchRouteSummary(total, total, success, failed, skipped_by_threshold, elapsed_s)

    def _prepare_output_and_task(self, row_index: int, row: Dict[str, str], threshold_m: float):
        output = {column: row.get(column, "") for column in INPUT_COLUMNS}
        output["Straight Distance"] = ""
        output["Distance"] = ""
        output[ROUTE_WKT_COLUMN] = ""
        output["Error Detail"] = ""

        try:
            src_lon = float(row["Src Lon"])
            src_lat = float(row["Src Lat"])
            sink_lon = float(row["Sink Lon"])
            sink_lat = float(row["Sink Lat"])
        except Exception:
            output["Error Detail"] = "invalid coordinate"
            return output, None, False

        straight = haversine_m(src_lon, src_lat, sink_lon, sink_lat)
        output["Straight Distance"] = f"{straight:.1f}"
        if threshold_m > 0 and straight > threshold_m:
            output["Error Detail"] = "straight distance is longer than threshold"
            return output, None, True

        start_node, start_snap_distance = self._snap_cached(src_lon, src_lat)
        end_node, end_snap_distance = self._snap_cached(sink_lon, sink_lat)
        if start_snap_distance > self.max_snap_distance_m:
            output["Error Detail"] = "start_node can't snap to network"
            return output, None, False
        if end_snap_distance > self.max_snap_distance_m:
            output["Error Detail"] = "end_node can't snap to network"
            return output, None, False

        return (
            output,
            {
                "row_index": row_index,
                "start_node": int(start_node),
                "end_node": int(end_node),
            },
            False,
        )

    def _scipy_csr_matrix(self):
        if self._csr_matrix is None:
            self._csr_matrix = csr_matrix(
                (self.network.weights, self.network.neighbors, self.network.offsets),
                shape=(self.network.node_count, self.network.node_count),
            )
        return self._csr_matrix

    def _reconstruct_scipy_path(self, start_node: int, end_node: int, predecessors):
        if start_node == end_node:
            return [start_node]
        path = []
        node = int(end_node)
        while node != -9999 and node != start_node:
            path.append(node)
            node = int(predecessors[node])
        if node == -9999:
            return []
        path.append(start_node)
        path.reverse()
        return path

    def _drain_completed(self, pending, preview_rows, preview_limit):
        done, _ = wait(pending.keys(), return_when=FIRST_COMPLETED)
        stats = {"completed": 0, "success": 0, "failed": 0, "skipped_by_threshold": 0, "results": []}
        for future in done:
            pending.pop(future, None)
            result = future.result()
            stats["results"].append(result)
            stats["completed"] += 1
            if result["output"]["Error Detail"]:
                stats["failed"] += 1
            else:
                stats["success"] += 1
                if len(preview_rows) < preview_limit:
                    preview_rows.append(result["preview"])
            if result["skipped_by_threshold"]:
                stats["skipped_by_threshold"] += 1
        return stats

    def _write_ordered(self, writer, write_buffer, results, next_write_index):
        for result in results:
            write_buffer[result["row_index"]] = result["output"]
        while next_write_index in write_buffer:
            writer.writerow(write_buffer.pop(next_write_index))
            next_write_index += 1
        return next_write_index

    def _calculate_row(self, row_index: int, row: Dict[str, str], threshold_m: float):
        output = {column: row.get(column, "") for column in INPUT_COLUMNS}
        output["Straight Distance"] = ""
        output["Distance"] = ""
        output[ROUTE_WKT_COLUMN] = ""
        output["Error Detail"] = ""
        skipped_by_threshold = False

        try:
            src_lon = float(row["Src Lon"])
            src_lat = float(row["Src Lat"])
            sink_lon = float(row["Sink Lon"])
            sink_lat = float(row["Sink Lat"])
        except Exception:
            output["Error Detail"] = "invalid coordinate"
            return {"row_index": row_index, "output": output, "preview": None, "skipped_by_threshold": False}

        straight = haversine_m(src_lon, src_lat, sink_lon, sink_lat)
        output["Straight Distance"] = f"{straight:.1f}"
        if threshold_m > 0 and straight > threshold_m:
            output["Error Detail"] = "straight distance is longer than threshold"
            skipped_by_threshold = True
            return {"row_index": row_index, "output": output, "preview": None, "skipped_by_threshold": skipped_by_threshold}

        result = self.calculator.shortest_path(
            src_lon,
            src_lat,
            sink_lon,
            sink_lat,
            max_snap_distance_m=self.max_snap_distance_m,
        )

        if result.snap_start_distance_m > self.max_snap_distance_m:
            output["Error Detail"] = "start_node can't snap to network"
        elif result.snap_end_distance_m > self.max_snap_distance_m:
            output["Error Detail"] = "end_node can't snap to network"
        elif not result.reachable:
            output["Error Detail"] = "unreachable"
        else:
            output["Distance"] = f"{result.distance_m:.1f}"
            output[ROUTE_WKT_COLUMN] = path_to_linestring(result.path)

        preview = None
        if not output["Error Detail"]:
            preview = dict(output)
            preview["row_index"] = row_index
        return {"row_index": row_index, "output": output, "preview": preview, "skipped_by_threshold": skipped_by_threshold}

    def _snap_cached(self, lon: float, lat: float):
        key = (round(lon, 7), round(lat, 7))
        with self._snap_cache_lock:
            cached = self._snap_cache.get(key)
        if cached is not None:
            return cached
        value = self.network.spatial_index.query(lon, lat)
        with self._snap_cache_lock:
            self._snap_cache.setdefault(key, value)
            return self._snap_cache[key]

    def _workspace(self):
        workspace = getattr(self._thread_local, "workspace", None)
        if workspace is None:
            workspace = self.calculator.create_workspace()
            self._thread_local.workspace = workspace
        return workspace

    def _count_rows(self, csv_path: str) -> int:
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as fp:
            return max(0, sum(1 for _ in fp) - 1)

    def _validate_columns(self, fieldnames):
        if not fieldnames:
            raise ValueError("Input CSV has no header")
        missing = [column for column in INPUT_COLUMNS if column not in fieldnames]
        if missing:
            raise ValueError("Input CSV missing columns: " + ", ".join(missing))

    def _report(
        self,
        callback,
        total,
        completed,
        success,
        failed,
        skipped_by_threshold,
        preview_rows: Optional[List[Dict[str, str]]] = None,
    ):
        if callback is None:
            return
        progress = 100.0 if total == 0 else min(100.0, (completed / total) * 100.0)
        callback(
            {
                "total": total,
                "completed": completed,
                "success": success,
                "failed": failed,
                "skipped_by_threshold": skipped_by_threshold,
                "progress": progress,
                "preview_rows": preview_rows,
            }
        )


def path_to_linestring(path):
    if not path:
        return ""
    coords = ",".join(f"{lon:.7f} {lat:.7f}" for lon, lat in path)
    return f"LINESTRING({coords})"
