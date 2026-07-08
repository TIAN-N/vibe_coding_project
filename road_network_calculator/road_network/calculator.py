import heapq
import math
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import numpy as np

from .graph import RoadNetwork


@dataclass
class RouteResult:
    distance_m: float
    path: List[Tuple[float, float]]
    snapped_start: Tuple[float, float]
    snapped_end: Tuple[float, float]
    timings_ms: Dict[str, float]
    start_node: int
    end_node: int
    reachable: bool
    snap_start_distance_m: float
    snap_end_distance_m: float


class DijkstraWorkspace:
    def __init__(self, node_count: int):
        self.dist_f = np.full(node_count, np.inf, dtype=np.float64)
        self.dist_b = np.full(node_count, np.inf, dtype=np.float64)
        self.prev_f = np.full(node_count, -1, dtype=np.int64)
        self.prev_b = np.full(node_count, -1, dtype=np.int64)
        self.settled_f = np.zeros(node_count, dtype=np.bool_)
        self.settled_b = np.zeros(node_count, dtype=np.bool_)
        self.touched_f = []
        self.touched_b = []

    def reset(self):
        for node in self.touched_f:
            self.dist_f[node] = np.inf
            self.prev_f[node] = -1
            self.settled_f[node] = False
        for node in self.touched_b:
            self.dist_b[node] = np.inf
            self.prev_b[node] = -1
            self.settled_b[node] = False
        self.touched_f.clear()
        self.touched_b.clear()

    def set_forward(self, node: int, distance: float, previous: int):
        if math.isinf(self.dist_f[node]):
            self.touched_f.append(node)
        self.dist_f[node] = distance
        self.prev_f[node] = previous

    def set_backward(self, node: int, distance: float, previous: int):
        if math.isinf(self.dist_b[node]):
            self.touched_b.append(node)
        self.dist_b[node] = distance
        self.prev_b[node] = previous


class RoadDistanceCalculator:
    def __init__(self, network: RoadNetwork):
        self.network = network

    def create_workspace(self) -> DijkstraWorkspace:
        return DijkstraWorkspace(self.network.node_count)

    def shortest_path(
        self,
        start_lon: float,
        start_lat: float,
        end_lon: float,
        end_lat: float,
        max_snap_distance_m: Optional[float] = None,
    ) -> RouteResult:
        total_started = time.perf_counter()
        snap_started = time.perf_counter()
        start_node, start_snap_distance = self.network.spatial_index.query(start_lon, start_lat)
        end_node, end_snap_distance = self.network.spatial_index.query(end_lon, end_lat)
        snap_ms = (time.perf_counter() - snap_started) * 1000.0

        if max_snap_distance_m is not None and (
            start_snap_distance > max_snap_distance_m or end_snap_distance > max_snap_distance_m
        ):
            total_ms = (time.perf_counter() - total_started) * 1000.0
            return RouteResult(
                distance_m=0.0,
                path=[],
                snapped_start=(float(self.network.node_lons[start_node]), float(self.network.node_lats[start_node])),
                snapped_end=(float(self.network.node_lons[end_node]), float(self.network.node_lats[end_node])),
                timings_ms={
                    "snap": snap_ms,
                    "search": 0.0,
                    "total": total_ms,
                },
                start_node=start_node,
                end_node=end_node,
                reachable=False,
                snap_start_distance_m=float(start_snap_distance),
                snap_end_distance_m=float(end_snap_distance),
            )

        return self.shortest_path_between_nodes(
            start_node,
            end_node,
            float(start_snap_distance),
            float(end_snap_distance),
            snap_ms=snap_ms,
            total_started=total_started,
            workspace=None,
        )

    def shortest_path_between_nodes(
        self,
        start_node: int,
        end_node: int,
        start_snap_distance: float = 0.0,
        end_snap_distance: float = 0.0,
        snap_ms: float = 0.0,
        total_started=None,
        workspace: Optional[DijkstraWorkspace] = None,
    ) -> RouteResult:
        if total_started is None:
            total_started = time.perf_counter()
        search_started = time.perf_counter()
        distance, node_path = self._bidirectional_dijkstra(start_node, end_node, workspace=workspace)
        search_ms = (time.perf_counter() - search_started) * 1000.0

        if math.isinf(distance):
            path = []
            distance_out = 0.0
            reachable = False
        else:
            path = [(float(self.network.node_lons[n]), float(self.network.node_lats[n])) for n in node_path]
            distance_out = round(float(distance), 1)
            reachable = True

        total_ms = (time.perf_counter() - total_started) * 1000.0
        return RouteResult(
            distance_m=distance_out,
            path=path,
            snapped_start=(float(self.network.node_lons[start_node]), float(self.network.node_lats[start_node])),
            snapped_end=(float(self.network.node_lons[end_node]), float(self.network.node_lats[end_node])),
            timings_ms={
                "snap": snap_ms,
                "search": search_ms,
                "total": total_ms,
            },
            start_node=start_node,
            end_node=end_node,
            reachable=reachable,
            snap_start_distance_m=float(start_snap_distance),
            snap_end_distance_m=float(end_snap_distance),
        )

    def _bidirectional_dijkstra(
        self,
        start: int,
        target: int,
        workspace: Optional[DijkstraWorkspace] = None,
    ) -> Tuple[float, List[int]]:
        if start == target:
            return 0.0, [start]

        if workspace is None:
            workspace = self.create_workspace()
        else:
            workspace.reset()

        dist_f = workspace.dist_f
        dist_b = workspace.dist_b
        prev_f = workspace.prev_f
        prev_b = workspace.prev_b
        settled_f = workspace.settled_f
        settled_b = workspace.settled_b

        workspace.set_forward(start, 0.0, -1)
        workspace.set_backward(target, 0.0, -1)
        heap_f = [(0.0, start)]
        heap_b = [(0.0, target)]
        best = math.inf
        meeting = -1

        while heap_f and heap_b:
            min_f = heap_f[0][0]
            min_b = heap_b[0][0]
            if min_f + min_b >= best:
                break

            if min_f <= min_b:
                dist, node = heapq.heappop(heap_f)
                if settled_f[node] or dist != dist_f[node]:
                    continue
                settled_f[node] = True
                if settled_b[node] and dist + dist_b[node] < best:
                    best = dist + dist_b[node]
                    meeting = node
                self._relax(node, dist, workspace, forward=True, heap_this=heap_f)
                best, meeting = self._scan_cross(node, dist_f, dist_b, best, meeting)
            else:
                dist, node = heapq.heappop(heap_b)
                if settled_b[node] or dist != dist_b[node]:
                    continue
                settled_b[node] = True
                if settled_f[node] and dist + dist_f[node] < best:
                    best = dist + dist_f[node]
                    meeting = node
                self._relax(node, dist, workspace, forward=False, heap_this=heap_b)
                best, meeting = self._scan_cross(node, dist_f, dist_b, best, meeting)

        if meeting < 0:
            return math.inf, []
        return best, self._reconstruct_path(start, target, meeting, prev_f, prev_b)

    def _relax(self, node, dist, workspace, forward: bool, heap_this):
        offsets = self.network.offsets
        neighbors = self.network.neighbors
        weights = self.network.weights
        dist_this = workspace.dist_f if forward else workspace.dist_b
        for pos in range(int(offsets[node]), int(offsets[node + 1])):
            nb = int(neighbors[pos])
            nd = dist + float(weights[pos])
            if nd < dist_this[nb]:
                if forward:
                    workspace.set_forward(nb, nd, node)
                else:
                    workspace.set_backward(nb, nd, node)
                heapq.heappush(heap_this, (nd, nb))

    def _scan_cross(self, node, dist_f, dist_b, best, meeting):
        if dist_f[node] + dist_b[node] < best:
            return float(dist_f[node] + dist_b[node]), int(node)
        return best, meeting

    def _reconstruct_path(self, start: int, target: int, meeting: int, prev_f, prev_b) -> List[int]:
        left = []
        node = meeting
        while node != -1:
            left.append(int(node))
            if node == start:
                break
            node = int(prev_f[node])
        left.reverse()

        right = []
        node = int(prev_b[meeting])
        while node != -1:
            right.append(int(node))
            if node == target:
                break
            node = int(prev_b[node])

        return left + right
