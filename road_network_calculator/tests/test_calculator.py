import csv

from road_network import RoadDistanceCalculator, RoadNetworkLoader


def test_shortest_path_on_square_grid(tmp_path):
    csv_path = tmp_path / "network.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["WKT"])
        writer.writerow(["LINESTRING(116.000 39.000,116.001 39.000)"])
        writer.writerow(["LINESTRING(116.001 39.000,116.001 39.001)"])
        writer.writerow(["LINESTRING(116.000 39.000,116.000 39.001)"])
        writer.writerow(["LINESTRING(116.000 39.001,116.001 39.001)"])

    network = RoadNetworkLoader().load_csv(str(csv_path))
    calculator = RoadDistanceCalculator(network)
    result = calculator.shortest_path(116.0, 39.0, 116.001, 39.001)

    assert result.reachable
    assert result.distance_m > 100
    assert result.distance_m < 230
    assert result.path[0] == (116.0, 39.0)
    assert result.path[-1] == (116.001, 39.001)

