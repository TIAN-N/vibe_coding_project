import csv
import time

import pytest

from road_network import RoadDistanceCalculator, RoadNetworkLoader
from road_network.batch_router import BatchRouteCalculator, OUTPUT_COLUMNS, path_to_linestring

try:
    from fastapi.testclient import TestClient
except RuntimeError as exc:
    TestClient = None
    TEST_CLIENT_ERROR = str(exc)
else:
    TEST_CLIENT_ERROR = ""

from app.main import app


def write_network_csv(path):
    with path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["WKT"])
        writer.writerow(["LINESTRING(100.000000 13.000000,100.001000 13.000000,100.002000 13.000000,100.003000 13.000000)"])
        writer.writerow(["LINESTRING(100.001000 13.000000,100.001000 13.001000)"])
        writer.writerow(["LINESTRING(100.002000 13.000000,100.002000 13.001000)"])


def write_pair_csv(path, rows):
    with path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(
            fp,
            fieldnames=["Src NE Name", "Sink NE Name", "Src Lon", "Src Lat", "Sink Lon", "Sink Lat"],
        )
        writer.writeheader()
        writer.writerows(rows)


def load_calculator(tmp_path):
    network_path = tmp_path / "network.csv"
    write_network_csv(network_path)
    network = RoadNetworkLoader().load_csv(str(network_path))
    return network, RoadDistanceCalculator(network)


def read_result_rows(path):
    with path.open("r", encoding="utf-8-sig", newline="") as fp:
        return list(csv.DictReader(fp))


def test_batch_route_csv_success_threshold_and_order(tmp_path):
    network, calculator = load_calculator(tmp_path)
    input_path = tmp_path / "pairs.csv"
    output_path = tmp_path / "result.csv"
    write_pair_csv(
        input_path,
        [
            {"Src NE Name": "A", "Sink NE Name": "B", "Src Lon": "100.000000", "Src Lat": "13.000000", "Sink Lon": "100.002000", "Sink Lat": "13.000000"},
            {"Src NE Name": "C", "Sink NE Name": "D", "Src Lon": "100.001000", "Src Lat": "13.000000", "Sink Lon": "100.001000", "Sink Lat": "13.001000"},
            {"Src NE Name": "E", "Sink NE Name": "F", "Src Lon": "100.000000", "Src Lat": "13.000000", "Sink Lon": "101.000000", "Sink Lat": "14.000000"},
            {"Src NE Name": "G", "Sink NE Name": "H", "Src Lon": "bad", "Src Lat": "13.000000", "Sink Lon": "100.001000", "Sink Lat": "13.000000"},
        ],
    )

    progress_events = []
    summary = BatchRouteCalculator(network, calculator).run_csv(
        str(input_path),
        str(output_path),
        straight_distance_threshold_km=1,
        workers=4,
        progress_callback=progress_events.append,
    )

    rows = read_result_rows(output_path)
    assert rows[0]["Src NE Name"] == "A"
    assert rows[1]["Src NE Name"] == "C"
    assert rows[2]["Error Detail"] == "straight distance is longer than threshold"
    assert rows[3]["Error Detail"] == "invalid coordinate"
    assert rows[0]["Route"].startswith("LINESTRING(")
    assert float(rows[0]["Distance"]) > 0
    assert list(rows[0].keys()) == OUTPUT_COLUMNS
    assert summary.total == 4
    assert summary.success == 2
    assert summary.failed == 2
    assert summary.skipped_by_threshold == 1
    assert progress_events[-1]["preview_rows"]


def test_batch_route_snap_failure(tmp_path):
    network, calculator = load_calculator(tmp_path)
    input_path = tmp_path / "pairs.csv"
    output_path = tmp_path / "result.csv"
    write_pair_csv(
        input_path,
        [
            {"Src NE Name": "Far", "Sink NE Name": "B", "Src Lon": "120.000000", "Src Lat": "20.000000", "Sink Lon": "100.002000", "Sink Lat": "13.000000"},
        ],
    )

    BatchRouteCalculator(network, calculator).run_csv(
        str(input_path),
        str(output_path),
        straight_distance_threshold_km=50000,
        workers=2,
    )

    rows = read_result_rows(output_path)
    assert rows[0]["Error Detail"] == "start_node can't snap to network"


def test_linestring_export_format():
    assert path_to_linestring([(100.0, 13.0), (100.001, 13.0)]) == "LINESTRING(100.0000000 13.0000000,100.0010000 13.0000000)"


def test_batch_route_api_end_to_end(tmp_path):
    if TestClient is None:
        pytest.skip(TEST_CLIENT_ERROR)

    client = TestClient(app)
    network_path = tmp_path / "network.csv"
    pair_path = tmp_path / "pairs.csv"
    write_network_csv(network_path)
    write_pair_csv(
        pair_path,
        [
            {"Src NE Name": "API_SRC", "Sink NE Name": "API_SINK", "Src Lon": "100.000000", "Src Lat": "13.000000", "Sink Lon": "100.002000", "Sink Lat": "13.000000"},
        ],
    )

    with network_path.open("rb") as fp:
        response = client.post("/api/network/upload", files={"file": ("network.csv", fp, "text/csv")})
    assert response.status_code == 200
    assert response.json()["loaded"] is True

    with pair_path.open("rb") as fp:
        response = client.post(
            "/api/batch-routes/upload/start",
            files={"file": ("pairs.csv", fp, "text/csv")},
            data={"straight_distance_threshold_km": "30", "workers": "4"},
        )
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    status = None
    for _ in range(60):
        response = client.get(f"/api/batch-routes/status/{job_id}")
        assert response.status_code == 200
        status = response.json()
        if status["state"] == "done":
            break
        time.sleep(0.1)

    assert status["state"] == "done"
    assert status["success"] == 1
    assert status["download_ready"] is True

    response = client.get(f"/api/batch-routes/preview/{job_id}?src=API_SRC&sink=API_SINK")
    assert response.status_code == 200
    rows = response.json()["rows"]
    assert rows[0]["Src NE Name"] == "API_SRC"
    assert rows[0]["Route"].startswith("LINESTRING(")

    response = client.get(f"/api/batch-routes/download/{job_id}")
    assert response.status_code == 200
    assert b"API_SRC" in response.content
