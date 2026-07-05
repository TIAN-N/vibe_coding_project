from typing import Optional, Tuple

import numpy as np

from .geometry import lonlat_to_local_xy_m


class NearestNodeIndex:
    def __init__(self, node_lons: np.ndarray, node_lats: np.ndarray):
        if len(node_lons) == 0:
            raise ValueError("Cannot build spatial index without nodes")

        self.node_lons = node_lons
        self.node_lats = node_lats
        self.ref_lat = float(np.mean(node_lats))
        xs = np.empty(len(node_lons), dtype=np.float64)
        ys = np.empty(len(node_lats), dtype=np.float64)
        for i in range(len(node_lons)):
            xs[i], ys[i] = lonlat_to_local_xy_m(float(node_lons[i]), float(node_lats[i]), self.ref_lat)
        self.points = np.column_stack((xs, ys))
        self._tree = self._build_tree()

    def _build_tree(self):
        try:
            from scipy.spatial import cKDTree

            return cKDTree(self.points)
        except Exception:
            return None

    def query(self, lon: float, lat: float) -> Tuple[int, float]:
        x, y = lonlat_to_local_xy_m(lon, lat, self.ref_lat)
        point = np.array([x, y], dtype=np.float64)

        if self._tree is not None:
            distance, node_id = self._tree.query(point, k=1)
            return int(node_id), float(distance)

        diff = self.points - point
        distances = np.einsum("ij,ij->i", diff, diff)
        node_id = int(np.argmin(distances))
        return node_id, float(np.sqrt(distances[node_id]))

