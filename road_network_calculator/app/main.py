import os
import tempfile
import time
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from road_network import RoadDistanceCalculator, RoadNetwork, RoadNetworkLoader

from .schemas import NetworkStatus, RouteRequest, RouteResponse

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
    )
    return RouteResponse(
        distance_m=result.distance_m,
        path=result.path,
        snapped_start=result.snapped_start,
        snapped_end=result.snapped_end,
        timings_ms=result.timings_ms,
        reachable=result.reachable,
    )

