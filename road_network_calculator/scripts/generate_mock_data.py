import argparse
import csv
from pathlib import Path


def generate_grid(output: str, grid_size: int, step: float, origin_lon: float, origin_lat: float) -> None:
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["WKT"])

        for y in range(grid_size):
            lat = origin_lat + y * step
            for x in range(grid_size - 1):
                lon1 = origin_lon + x * step
                lon2 = origin_lon + (x + 1) * step
                writer.writerow([f"LINESTRING({lon1:.7f} {lat:.7f},{lon2:.7f} {lat:.7f})"])

        for x in range(grid_size):
            lon = origin_lon + x * step
            for y in range(grid_size - 1):
                lat1 = origin_lat + y * step
                lat2 = origin_lat + (y + 1) * step
                writer.writerow([f"LINESTRING({lon:.7f} {lat1:.7f},{lon:.7f} {lat2:.7f})"])


def main():
    parser = argparse.ArgumentParser(description="Generate mock grid road network CSV.")
    parser.add_argument("--output", default="data/mock_small.csv")
    parser.add_argument("--grid-size", type=int, default=20)
    parser.add_argument("--step", type=float, default=0.001)
    parser.add_argument("--origin-lon", type=float, default=116.0)
    parser.add_argument("--origin-lat", type=float, default=39.0)
    args = parser.parse_args()

    generate_grid(args.output, args.grid_size, args.step, args.origin_lon, args.origin_lat)
    edge_count = 2 * args.grid_size * (args.grid_size - 1)
    print(f"generated {args.output} nodes={args.grid_size * args.grid_size} edges={edge_count}")


if __name__ == "__main__":
    main()

