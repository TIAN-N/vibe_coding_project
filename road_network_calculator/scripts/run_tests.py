import csv
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from road_network import RoadDistanceCalculator, RoadNetworkLoader
from road_network.geometry import haversine_m, parse_linestring_wkt


def test_geometry():
    assert parse_linestring_wkt("LINESTRING(116 39,117 40)") == [(116.0, 39.0), (117.0, 40.0)]
    distance = haversine_m(116.0, 39.0, 116.0, 40.0)
    assert 111000 < distance < 112000


def test_loader_and_calculator():
    with tempfile.TemporaryDirectory() as tmp_dir:
        csv_path = os.path.join(tmp_dir, "network.csv")
        with open(csv_path, "w", encoding="utf-8", newline="") as fp:
            writer = csv.writer(fp)
            writer.writerow(["WKT"])
            writer.writerow(["LINESTRING(116.000 39.000,116.001 39.000)"])
            writer.writerow(["LINESTRING(116.001 39.000,116.001 39.001)"])
            writer.writerow(["LINESTRING(116.000 39.000,116.000 39.001)"])
            writer.writerow(["LINESTRING(116.000 39.001,116.001 39.001)"])

        network = RoadNetworkLoader().load_csv(csv_path)
        assert network.node_count == 4
        assert network.undirected_edge_count == 4

        result = RoadDistanceCalculator(network).shortest_path(116.0, 39.0, 116.001, 39.001)
        assert result.reachable
        assert 100 < result.distance_m < 230
        assert result.path[0] == (116.0, 39.0)
        assert result.path[-1] == (116.001, 39.001)

        far_result = RoadDistanceCalculator(network).shortest_path(
            0.0,
            0.0,
            116.001,
            39.001,
            max_snap_distance_m=1000.0,
        )
        assert not far_result.reachable
        assert far_result.snap_start_distance_m > 1000.0
        assert far_result.path == []

        lower_csv_path = os.path.join(tmp_dir, "network_lower.csv")
        with open(lower_csv_path, "w", encoding="utf-8", newline="") as fp:
            writer = csv.writer(fp)
            writer.writerow(["wkt"])
            writer.writerow(["LINESTRING(116.000 39.000,116.001 39.000)"])

        lower_network = RoadNetworkLoader().load_csv(lower_csv_path)
        assert lower_network.node_count == 2
        assert lower_network.undirected_edge_count == 1


def main():
    tests = [test_geometry, test_loader_and_calculator]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS total={len(tests)}")


if __name__ == "__main__":
    main()
