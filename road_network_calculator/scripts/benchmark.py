import argparse
import os
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from road_network import RoadDistanceCalculator, RoadNetworkLoader


def run(csv_path: str):
    started = time.perf_counter()
    network = RoadNetworkLoader().load_csv(csv_path)
    load_s = time.perf_counter() - started
    calculator = RoadDistanceCalculator(network)

    min_lon = float(network.node_lons.min())
    max_lon = float(network.node_lons.max())
    min_lat = float(network.node_lats.min())
    max_lat = float(network.node_lats.max())
    lon_span = max_lon - min_lon
    lat_span = max_lat - min_lat

    cases = [
        ("short", min_lon, min_lat, min_lon + lon_span * 0.005, min_lat + lat_span * 0.005),
        ("medium", min_lon, min_lat, min_lon + lon_span * 0.05, min_lat + lat_span * 0.05),
        ("long", min_lon, min_lat, max_lon, max_lat),
    ]

    print(
        "load rows_edges={} nodes={} edges={} time={:.3f}s invalid_rows={}".format(
            int(network.metadata.get("raw_edge_count", 0)),
            network.node_count,
            network.undirected_edge_count,
            load_s,
            int(network.metadata.get("invalid_rows", 0)),
        )
    )

    for name, start_lon, start_lat, end_lon, end_lat in cases:
        result = calculator.shortest_path(start_lon, start_lat, end_lon, end_lat)
        print(
            "query {} distance={:.1f}m snap={:.2f}ms search={:.2f}ms total={:.2f}ms path_nodes={}".format(
                name,
                result.distance_m,
                result.timings_ms["snap"],
                result.timings_ms["search"],
                result.timings_ms["total"],
                len(result.path),
            )
        )


def main():
    parser = argparse.ArgumentParser(description="Benchmark road network loading and routing.")
    parser.add_argument("--csv", required=True)
    args = parser.parse_args()
    run(args.csv)


if __name__ == "__main__":
    main()
