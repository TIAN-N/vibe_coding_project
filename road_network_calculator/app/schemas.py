from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    start_lon: float = Field(..., ge=-180, le=180)
    start_lat: float = Field(..., ge=-90, le=90)
    end_lon: float = Field(..., ge=-180, le=180)
    end_lat: float = Field(..., ge=-90, le=90)


class RouteResponse(BaseModel):
    distance_m: float
    path: List[Tuple[float, float]]
    snapped_start: Tuple[float, float]
    snapped_end: Tuple[float, float]
    timings_ms: Dict[str, float]
    reachable: bool


class NetworkStatus(BaseModel):
    loaded: bool
    nodes: int = 0
    edges: int = 0
    metadata: Dict[str, float] = Field(default_factory=dict)
