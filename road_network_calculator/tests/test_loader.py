import csv

from road_network import RoadNetworkLoader


def test_loader_builds_undirected_graph(tmp_path):
    csv_path = tmp_path / "network.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["WKT"])
        writer.writerow(["LINESTRING(116 39,116.001 39,116.002 39)"])

    network = RoadNetworkLoader().load_csv(str(csv_path))
    assert network.node_count == 3
    assert network.undirected_edge_count == 2
    assert network.directed_edge_count == 4

