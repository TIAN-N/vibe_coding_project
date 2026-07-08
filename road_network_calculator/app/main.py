import os
import tempfile
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from road_network import RoadDistanceCalculator, RoadNetwork, RoadNetworkLoader
from road_network.batch_router import BatchRouteCalculator

import numpy as np

from .schemas import BatchRouteItem, BatchRouteJobStatus, BatchRoutePreviewResponse, BatchRouteRequest, BatchRouteResponse, BatchRouteStartResponse, NetworkPreview, NetworkStatus, NetworkViewport, RouteRequest, RouteResponse, UploadJobStatus, UploadStartResponse

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
_upload_jobs = {}
_upload_jobs_lock = threading.Lock()
_batch_jobs = {}
_batch_jobs_lock = threading.Lock()
BATCH_RESULT_DIR = BASE_DIR / "batch_results"


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


@app.post("/api/network/upload/start", response_model=UploadStartResponse)
async def start_upload_network(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    job_id = uuid.uuid4().hex
    suffix = ".csv"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        _set_upload_job(
            job_id,
            state="saving",
            stage="saving",
            progress=1.0,
            message="Saving uploaded file",
            bytes_read=0,
            total_bytes=0,
            nodes=0,
            edges=0,
            error="",
            network=None,
        )
        bytes_written = 0
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            tmp.write(chunk)
            bytes_written += len(chunk)
            _update_upload_job(
                job_id,
                progress=min(9.0, 1.0 + (bytes_written / max(bytes_written, 1)) * 8.0),
                bytes_read=bytes_written,
                total_bytes=bytes_written,
            )

    _update_upload_job(job_id, state="queued", stage="queued", progress=10.0, message="Queued for parsing")
    thread = threading.Thread(target=_load_network_job, args=(job_id, tmp_path), daemon=True)
    thread.start()
    return UploadStartResponse(job_id=job_id)


@app.get("/api/network/upload/status/{job_id}", response_model=UploadJobStatus)
def upload_job_status(job_id: str):
    with _upload_jobs_lock:
        job = _upload_jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Upload job was not found")
        return UploadJobStatus(job_id=job_id, **dict(job))


def _load_network_job(job_id: str, csv_path: str):
    global _network, _calculator

    def on_progress(payload):
        _update_upload_job(
            job_id,
            state="running",
            stage=payload.get("stage", "running"),
            progress=float(payload.get("progress", 0.0)),
            message=payload.get("message", ""),
            bytes_read=int(payload.get("bytes_read", 0) or 0),
            total_bytes=int(payload.get("total_bytes", 0) or 0),
            nodes=int(payload.get("nodes", 0) or 0),
            edges=int(payload.get("edges", 0) or 0),
        )

    try:
        _update_upload_job(job_id, state="running", stage="parsing", progress=10.0, message="Parsing WKT rows")
        loader = RoadNetworkLoader()
        network = loader.load_csv(csv_path, progress_callback=on_progress)
        calculator = RoadDistanceCalculator(network)
        _network = network
        _calculator = calculator
        status = NetworkStatus(
            loaded=True,
            nodes=network.node_count,
            edges=network.undirected_edge_count,
            metadata=dict(network.metadata),
        )
        _update_upload_job(
            job_id,
            state="done",
            stage="done",
            progress=100.0,
            message="Road network loaded",
            bytes_read=int(os.path.getsize(csv_path)),
            total_bytes=int(os.path.getsize(csv_path)),
            nodes=network.node_count,
            edges=network.undirected_edge_count,
            network=status,
        )
    except Exception as exc:
        _update_upload_job(job_id, state="failed", stage="failed", progress=100.0, message="Load failed", error=str(exc))
    finally:
        try:
            os.remove(csv_path)
        except OSError:
            pass


def _set_upload_job(job_id: str, **payload):
    with _upload_jobs_lock:
        _upload_jobs[job_id] = payload


def _update_upload_job(job_id: str, **payload):
    with _upload_jobs_lock:
        job = _upload_jobs.setdefault(
            job_id,
            {
                "state": "unknown",
                "stage": "",
                "progress": 0.0,
                "message": "",
                "bytes_read": 0,
                "total_bytes": 0,
                "nodes": 0,
                "edges": 0,
                "error": "",
                "network": None,
            },
        )
        job.update(payload)


@app.post("/api/batch-routes/upload/start", response_model=BatchRouteStartResponse)
async def start_batch_routes(
    file: UploadFile = File(...),
    straight_distance_threshold_km: float = Form(30.0),
    workers: int = Form(4),
):
    if _network is None or _calculator is None:
        raise HTTPException(status_code=400, detail="road network unavailable")
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    BATCH_RESULT_DIR.mkdir(parents=True, exist_ok=True)
    job_id = uuid.uuid4().hex
    output_filename = _timestamped_batch_filename()
    input_path = str(BATCH_RESULT_DIR / f"batch_route_input_{job_id}.csv")
    output_path = str(BATCH_RESULT_DIR / f"batch_route_result_{job_id}.csv")

    with open(input_path, "wb") as fp:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            fp.write(chunk)

    _set_batch_job(
        job_id,
        state="queued",
        progress=0.0,
        completed=0,
        total=0,
        success=0,
        failed=0,
        skipped_by_threshold=0,
        message="Queued",
        error="",
        download_ready=False,
        output_path=output_path,
        output_filename=output_filename,
        input_path=input_path,
        preview_rows=[],
    )
    network_ref = _network
    calculator_ref = _calculator
    thread = threading.Thread(
        target=_run_batch_route_job,
        args=(job_id, input_path, output_path, straight_distance_threshold_km, workers, network_ref, calculator_ref),
        daemon=True,
    )
    thread.start()
    return BatchRouteStartResponse(job_id=job_id)


@app.get("/api/batch-routes/status/{job_id}", response_model=BatchRouteJobStatus)
def batch_route_status(job_id: str):
    with _batch_jobs_lock:
        job = _batch_jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Batch route job was not found")
        return BatchRouteJobStatus(job_id=job_id, **_public_batch_job(job))


@app.get("/api/batch-routes/download/{job_id}")
def batch_route_download(job_id: str):
    with _batch_jobs_lock:
        job = _batch_jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Batch route job was not found")
        output_path = job.get("output_path")
        output_filename = job.get("output_filename") or _timestamped_batch_filename()
        if job.get("state") != "done" or not output_path or not os.path.exists(output_path):
            raise HTTPException(status_code=400, detail="Batch route result is not ready")
    return FileResponse(output_path, media_type="text/csv", filename=output_filename)


@app.get("/api/batch-routes/preview/{job_id}", response_model=BatchRoutePreviewResponse)
def batch_route_preview(job_id: str, src: str = "", sink: str = "", limit: int = Query(50, ge=1, le=200)):
    with _batch_jobs_lock:
        job = _batch_jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Batch route job was not found")
        rows = list(job.get("preview_rows") or [])

    src_l = src.strip().lower()
    sink_l = sink.strip().lower()
    if src_l:
        rows = [row for row in rows if src_l in str(row.get("Src NE Name", "")).lower()]
    if sink_l:
        rows = [row for row in rows if sink_l in str(row.get("Sink NE Name", "")).lower()]
    return BatchRoutePreviewResponse(rows=rows[:limit])


def _run_batch_route_job(job_id, input_path, output_path, threshold_km, workers, network_ref, calculator_ref):
    try:
        _update_batch_job(job_id, state="running", message="Calculating routes")

        def on_progress(payload):
            update = {
                "state": "running",
                "message": "Calculating routes",
                "progress": float(payload.get("progress", 0.0)),
                "completed": int(payload.get("completed", 0)),
                "total": int(payload.get("total", 0)),
                "success": int(payload.get("success", 0)),
                "failed": int(payload.get("failed", 0)),
                "skipped_by_threshold": int(payload.get("skipped_by_threshold", 0)),
            }
            if payload.get("preview_rows") is not None:
                update["preview_rows"] = payload.get("preview_rows")
            _update_batch_job(job_id, **update)

        batch = BatchRouteCalculator(network_ref, calculator_ref, max_snap_distance_m=MAX_SNAP_DISTANCE_M)
        batch.run_csv(
            input_csv_path=input_path,
            output_csv_path=output_path,
            straight_distance_threshold_km=threshold_km,
            workers=workers,
            progress_callback=on_progress,
        )
        _update_batch_job(job_id, state="done", progress=100.0, message="Batch route calculation completed", download_ready=True)
    except Exception as exc:
        _update_batch_job(job_id, state="failed", message="Batch route calculation failed", error=str(exc))
    finally:
        try:
            os.remove(input_path)
        except OSError:
            pass


def _set_batch_job(job_id, **payload):
    with _batch_jobs_lock:
        _batch_jobs[job_id] = payload


def _update_batch_job(job_id, **payload):
    with _batch_jobs_lock:
        job = _batch_jobs.setdefault(job_id, {})
        job.update(payload)


def _public_batch_job(job):
    return {
        "state": job.get("state", "unknown"),
        "progress": float(job.get("progress", 0.0)),
        "completed": int(job.get("completed", 0)),
        "total": int(job.get("total", 0)),
        "success": int(job.get("success", 0)),
        "failed": int(job.get("failed", 0)),
        "skipped_by_threshold": int(job.get("skipped_by_threshold", 0)),
        "message": job.get("message", ""),
        "error": job.get("error", ""),
        "download_ready": bool(job.get("download_ready", False)),
    }


def _timestamped_batch_filename():
    return f"batch_route_result_{datetime.now().strftime('%Y%m%d%H%M')}.csv"


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
