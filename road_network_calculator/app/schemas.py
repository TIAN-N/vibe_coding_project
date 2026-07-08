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
    snap_start_distance_m: float
    snap_end_distance_m: float


class BatchRouteRequest(BaseModel):
    routes: List[RouteRequest] = Field(..., min_items=1, max_items=200)


class BatchRouteItem(BaseModel):
    index: int
    ok: bool
    error: str = ""
    route: RouteRequest
    result: Optional[RouteResponse] = None


class BatchRouteResponse(BaseModel):
    results: List[BatchRouteItem]


class NetworkPreview(BaseModel):
    total_edges: int
    returned_edges: int
    lines: List[List[Tuple[float, float]]]


class NetworkViewport(BaseModel):
    total_edges: int
    matched_edges: int
    returned_edges: int
    bounds: Dict[str, float]
    lines: List[List[Tuple[float, float]]]


class NetworkStatus(BaseModel):
    loaded: bool
    nodes: int = 0
    edges: int = 0
    metadata: Dict[str, float] = Field(default_factory=dict)


class UploadStartResponse(BaseModel):
    job_id: str


class UploadJobStatus(BaseModel):
    job_id: str
    state: str
    stage: str = ""
    progress: float = 0.0
    message: str = ""
    bytes_read: int = 0
    total_bytes: int = 0
    nodes: int = 0
    edges: int = 0
    error: str = ""
    network: Optional[NetworkStatus] = None


class BatchRouteStartResponse(BaseModel):
    job_id: str


class BatchRouteJobStatus(BaseModel):
    job_id: str
    state: str
    progress: float = 0.0
    completed: int = 0
    total: int = 0
    success: int = 0
    failed: int = 0
    skipped_by_threshold: int = 0
    message: str = ""
    error: str = ""
    download_ready: bool = False


class BatchRoutePreviewResponse(BaseModel):
    rows: List[Dict[str, str]]
