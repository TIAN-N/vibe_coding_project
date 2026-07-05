import argparse
import csv
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from road_network import RoadDistanceCalculator, RoadNetworkLoader


def load_samples(sample_csv):
    with open(sample_csv, "r", encoding="utf-8-sig", newline="") as fp:
        return list(csv.DictReader(fp))


def main():
    parser = argparse.ArgumentParser(description="Run sample route queries against a WKT road CSV.")
    parser.add_argument("--network-csv", required=True)
    parser.add_argument("--samples", default="data/sample_routes.csv")
    parser.add_argument("--city", required=True)
    args = parser.parse_args()

    network = RoadNetworkLoader().load_csv(args.network_csv)
    calculator = RoadDistanceCalculator(network)
    samples = [row for row in load_samples(args.samples) if row["city"].lower() == args.city.lower()]

    print(
        "network={} nodes={} edges={} load_ms={:.2f}".format(
            args.network_csv,
            network.node_count,
            network.undirected_edge_count,
            network.metadata["load_time_ms"],
        )
    )
    for sample in samples:
        result = calculator.shortest_path(
            float(sample["start_lon"]),
            float(sample["start_lat"]),
            float(sample["end_lon"]),
            float(sample["end_lat"]),
        )
        print(
            "{} reachable={} distance={:.1f}m snap={:.2f}ms search={:.2f}ms total={:.2f}ms path_nodes={}".format(
                sample["name"],
                result.reachable,
                result.distance_m,
                result.timings_ms["snap"],
                result.timings_ms["search"],
                result.timings_ms["total"],
                len(result.path),
            )
        )


if __name__ == "__main__":
    main()
