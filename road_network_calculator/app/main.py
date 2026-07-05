import os
import tempfile
import time
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from road_network import RoadDistanceCalculator, RoadNetwork, RoadNetworkLoader

import numpy as np

from .schemas import BatchRouteItem, BatchRouteRequest, BatchRouteResponse, NetworkPreview, NetworkStatus, NetworkViewport, RouteRequest, RouteResponse

BASE_DIR = Path(__file__).resolve().parents[1]
WEB_DIR = BASE_DIR / "web"

app = FastAPI(title="Road Network Calculator", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

_network = None
_calculator = None
MAX_SNAP_DISTANCE_M = 1000.0


@app.get("/")
def index():
    return FileResponse(str(WEB_DIR / "index.html"))


@app.get("/api/network/status", response_model=NetworkStatus)
def network_status():
    if _network is None:
        return NetworkStatus(loaded=False)
    return NetworkStatus(
        loaded=True,
        nodes=_network.node_count,
        edges=_network.undirected_edge_count,
        metadata=dict(_network.metadata),
    )


@app.get("/api/network/preview", response_model=NetworkPreview)
def network_preview(limit: int = Query(5000, ge=1, le=50000)):
    if _network is None:
        raise HTTPException(status_code=400, detail="Road network is not loaded")

    total_edges = _network.undirected_edge_count
    edge_indices = _sample_indices(np.arange(total_edges), limit)
    lines = _edge_indices_to_lines(edge_indices)
    return NetworkPreview(total_edges=total_edges, returned_edges=len(lines), lines=lines)


@app.get("/api/network/viewport", response_model=NetworkViewport)
def network_viewport(
    west: float = Query(..., ge=-180, le=180),
    south: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    north: float = Query(..., ge=-90, le=90),
    limit: int = Query(12000, ge=100, le=100000),
):
    if _network is None:
        raise HTTPException(status_code=400, detail="Road network is not loaded")
    if west > east:
        west, east = east, west
    if south > north:
        south, north = north, south

    u = _network.edge_u
    v = _network.edge_v
    u_lons = _network.node_lons[u]
    v_lons = _network.node_lons[v]
    u_lats = _network.node_lats[u]
    v_lats = _network.node_lats[v]

    edge_min_lon = np.minimum(u_lons, v_lons)
    edge_max_lon = np.maximum(u_lons, v_lons)
    edge_min_lat = np.minimum(u_lats, v_lats)
    edge_max_lat = np.maximum(u_lats, v_lats)
    mask = (edge_max_lon >= west) & (edge_min_lon <= east) & (edge_max_lat >= south) & (edge_min_lat <= north)
    matched = np.flatnonzero(mask)
    sampled = _sample_indices(matched, limit)
    lines = _edge_indices_to_lines(sampled)

    return NetworkViewport(
        total_edges=_network.undirected_edge_count,
        matched_edges=int(len(matched)),
        returned_edges=len(lines),
        bounds={"west": west, "south": south, "east": east, "north": north},
        lines=lines,
    )


def _sample_indices(indices, limit: int):
    if len(indices) <= limit:
        return indices
    positions = np.linspace(0, len(indices) - 1, num=limit, dtype=np.int64)
    return indices[positions]


def _edge_indices_to_lines(edge_indices):
    lines = []
    for edge_index in edge_indices:
        a = int(_network.edge_u[int(edge_index)])
        b = int(_network.edge_v[int(edge_index)])
        lines.append(
            [
                (float(_network.node_lons[a]), float(_network.node_lats[a])),
                (float(_network.node_lons[b]), float(_network.node_lats[b])),
            ]
        )
    return lines


@app.post("/api/network/upload", response_model=NetworkStatus)
async def upload_network(file: UploadFile = File(...)):
    global _network, _calculator

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    suffix = ".csv"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            tmp.write(chunk)

    try:
        loader = RoadNetworkLoader()
        network = loader.load_csv(tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    _network = network
    _calculator = RoadDistanceCalculator(network)
    return NetworkStatus(
        loaded=True,
        nodes=network.node_count,
        edges=network.undirected_edge_count,
        metadata=dict(network.metadata),
    )


@app.post("/api/route", response_model=RouteResponse)
def route(request: RouteRequest):
    if _calculator is None:
        raise HTTPException(status_code=400, detail="Road network is not loaded")

    result = _calculator.shortest_path(
        request.start_lon,
        request.start_lat,
        request.end_lon,
        request.end_lat,
        max_snap_distance_m=MAX_SNAP_DISTANCE_M,
    )
    if not result.reachable and (
        result.snap_start_distance_m > MAX_SNAP_DISTANCE_M or result.snap_end_distance_m > MAX_SNAP_DISTANCE_M
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Start or end point is more than 1000m from the loaded road network. "
                "Routing cannot continue."
            ),
        )
    return RouteResponse(
        distance_m=result.distance_m,
        path=result.path,
        snapped_start=result.snapped_start,
        snapped_end=result.snapped_end,
        timings_ms=result.timings_ms,
        reachable=result.reachable,
        snap_start_distance_m=result.snap_start_distance_m,
        snap_end_distance_m=result.snap_end_distance_m,
    )


@app.post("/api/routes/batch", response_model=BatchRouteResponse)
def batch_route(request: BatchRouteRequest):
    if _calculator is None:
        raise HTTPException(status_code=400, detail="Road network is not loaded")

    results = []
    for index, item in enumerate(request.routes):
        result = _calculator.shortest_path(
            item.start_lon,
            item.start_lat,
            item.end_lon,
            item.end_lat,
            max_snap_distance_m=MAX_SNAP_DISTANCE_M,
        )
        if not result.reachable and (
            result.snap_start_distance_m > MAX_SNAP_DISTANCE_M or result.snap_end_distance_m > MAX_SNAP_DISTANCE_M
        ):
            results.append(
                BatchRouteItem(
                    index=index,
                    ok=False,
                    error=(
                        "Start or end point is more than 1000m from the loaded road network. "
                        "Routing cannot continue."
                    ),
                    route=item,
                )
            )
            continue

        results.append(
            BatchRouteItem(
                index=index,
                ok=result.reachable,
                error="" if result.reachable else "No connected path was found between the snapped nodes.",
                route=item,
                result=RouteResponse(
                    distance_m=result.distance_m,
                    path=result.path,
                    snapped_start=result.snapped_start,
                    snapped_end=result.snapped_end,
                    timings_ms=result.timings_ms,
                    reachable=result.reachable,
                    snap_start_distance_m=result.snap_start_distance_m,
                    snap_end_distance_m=result.snap_end_distance_m,
                ),
            )
        )

    return BatchRouteResponse(results=results)
