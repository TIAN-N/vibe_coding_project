import argparse
import csv
import random
import sys
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from road_network import RoadNetworkLoader
from road_network.geometry import haversine_m


def largest_component_nodes(network):
    visited = bytearray(network.node_count)
    best_component = []

    for start in range(network.node_count):
        if visited[start]:
            continue
        component = []
        queue = deque([start])
        visited[start] = 1
        while queue:
            node = queue.popleft()
            component.append(node)
            left = int(network.offsets[node])
            right = int(network.offsets[node + 1])
            for pos in range(left, right):
                neighbor = int(network.neighbors[pos])
                if not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        if len(component) > len(best_component):
            best_component = component

    return best_component


def generate_pairs(network, nodes, count, min_distance_km, max_distance_km, seed, max_attempts):
    rng = random.Random(seed)
    pairs = []
    seen = set()
    min_m = min_distance_km * 1000.0
    max_m = max_distance_km * 1000.0

    attempts = 0
    while len(pairs) < count and attempts < max_attempts:
        attempts += 1
        src = rng.choice(nodes)
        sink = rng.choice(nodes)
        if src == sink:
            continue
        key = (min(src, sink), max(src, sink))
        if key in seen:
            continue

        src_lon = float(network.node_lons[src])
        src_lat = float(network.node_lats[src])
        sink_lon = float(network.node_lons[sink])
        sink_lat = float(network.node_lats[sink])
        straight_m = haversine_m(src_lon, src_lat, sink_lon, sink_lat)
        if straight_m < min_m or straight_m > max_m:
            continue

        seen.add(key)
        pairs.append(
            {
                "Src NE Name": f"BKK_SRC_{len(pairs) + 1:05d}",
                "Sink NE Name": f"BKK_SINK_{len(pairs) + 1:05d}",
                "Src Lon": f"{src_lon:.7f}",
                "Src Lat": f"{src_lat:.7f}",
                "Sink Lon": f"{sink_lon:.7f}",
                "Sink Lat": f"{sink_lat:.7f}",
            }
        )

    if len(pairs) < count:
        raise RuntimeError(
            f"Only generated {len(pairs)} pairs after {attempts} attempts. "
            "Relax distance bounds or reduce count."
        )
    return pairs


def write_pairs(output_path, pairs):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(
            fp,
            fieldnames=["Src NE Name", "Sink NE Name", "Src Lon", "Src Lat", "Sink Lon", "Sink Lat"],
        )
        writer.writeheader()
        writer.writerows(pairs)


def main():
    parser = argparse.ArgumentParser(description="Generate source-sink pairs from real road network nodes.")
    parser.add_argument("--network-csv", type=Path, default=Path("data/osm_bangkok_roads.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/bangkok_source_sink_pairs.csv"))
    parser.add_argument("--count", type=int, default=300)
    parser.add_argument("--min-distance-km", type=float, default=0.5)
    parser.add_argument("--max-distance-km", type=float, default=25.0)
    parser.add_argument("--seed", type=int, default=20260708)
    parser.add_argument("--max-attempts", type=int, default=300000)
    args = parser.parse_args()

    network = RoadNetworkLoader().load_csv(str(args.network_csv))
    component = largest_component_nodes(network)
    pairs = generate_pairs(
        network,
        component,
        args.count,
        args.min_distance_km,
        args.max_distance_km,
        args.seed,
        args.max_attempts,
    )
    write_pairs(args.output, pairs)
    print(f"network nodes={network.node_count} edges={network.undirected_edge_count}")
    print(f"largest component nodes={len(component)}")
    print(f"wrote pairs={len(pairs)} output={args.output}")


if __name__ == "__main__":
    main()
