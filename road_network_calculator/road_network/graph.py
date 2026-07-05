from dataclasses import dataclass
from typing import Dict, Optional

import numpy as np

from .spatial_index import NearestNodeIndex


@dataclass
class RoadNetwork:
    node_lons: np.ndarray
    node_lats: np.ndarray
    offsets: np.ndarray
    neighbors: np.ndarray
    weights: np.ndarray
    edge_u: np.ndarray
    edge_v: np.ndarray
    spatial_index: NearestNodeIndex
    metadata: Dict[str, float]

    @property
    def node_count(self) -> int:
        return int(len(self.node_lons))

    @property
    def directed_edge_count(self) -> int:
        return int(len(self.neighbors))

    @property
    def undirected_edge_count(self) -> int:
        return int(len(self.edge_u))
