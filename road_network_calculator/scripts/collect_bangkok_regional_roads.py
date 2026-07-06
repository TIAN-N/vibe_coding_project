import argparse
import csv
import os
import sys
import time
from pathlib import Path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from scripts.fetch_osm_roads import build_query, fetch_overpass

BANGKOK_REGION_BBOXES = {
    "bangkok_core": (13.60, 100.30, 13.95, 100.80),
    "bangkok_east": (13.45, 100.75, 14.15, 101.45),
    "bangkok_west": (13.45, 99.75, 14.15, 100.35),
    "bangkok_north": (13.95, 100.10, 14.75, 101.00),
}


def iter_tiles(bbox, tile_size):
    south, west, north, east = bbox
    lat = south
    while lat < north:
        next_lat = min(north, lat + tile_size)
        lon = west
        while lon < east:
            next_lon = min(east, lon + tile_size)
            yield (lat, lon, next_lat, next_lon)
            lon = next_lon
        lat = next_lat


def coord_key(lon, lat, scale=10000000):
    return int(round(lon * scale)), int(round(lat * scale))


def edge_key(a, b):
    return (a, b) if a <= b else (b, a)


def collect_edges(tile_size, sleep_seconds, max_tiles, output, failures_output):
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    failures_path = Path(failures_output)
    failures_path.parent.mkdir(parents=True, exist_ok=True)

    edges_seen = set()
    tile_count = 0
    failed_tiles = []

    with output_path.open("w", encoding="utf-8", newline="") as out_fp, failures_path.open(
        "w", encoding="utf-8", newline=""
    ) as fail_fp:
        writer = csv.writer(out_fp)
        fail_writer = csv.writer(fail_fp)
        writer.writerow(["WKT"])
        fail_writer.writerow(["region", "south", "west", "north", "east", "error"])

        for region, bbox in BANGKOK_REGION_BBOXES.items():
            for tile in iter_tiles(bbox, tile_size):
                if max_tiles and tile_count >= max_tiles:
                    return len(edges_seen), failed_tiles
                tile_count += 1
                print(f"fetch tile={tile_count} region={region} bbox={tile}", flush=True)
                try:
                    payload = fetch_overpass(build_query(tile))
                except Exception as exc:
                    failed_tiles.append((region, tile, str(exc)))
                    south, west, north, east = tile
                    fail_writer.writerow([region, south, west, north, east, str(exc)])
                    fail_fp.flush()
                    print(f"tile failed region={region} bbox={tile} error={exc}", flush=True)
                    continue

                rows_written = 0
                for element in payload.get("elements", []):
                    if element.get("type") != "way":
                        continue
                    geometry = element.get("geometry") or []
                    for index in range(len(geometry) - 1):
                        lon1 = float(geometry[index]["lon"])
                        lat1 = float(geometry[index]["lat"])
                        lon2 = float(geometry[index + 1]["lon"])
                        lat2 = float(geometry[index + 1]["lat"])
                        if lon1 == lon2 and lat1 == lat2:
                            continue
                        a = coord_key(lon1, lat1)
                        b = coord_key(lon2, lat2)
                        key = edge_key(a, b)
                        if key in edges_seen:
                            continue
                        edges_seen.add(key)
                        writer.writerow([f"LINESTRING({lon1:.7f} {lat1:.7f},{lon2:.7f} {lat2:.7f})"])
                        rows_written += 1

                out_fp.flush()
                print(
                    f"tile done tile={tile_count} new_edges={rows_written} total_edges={len(edges_seen)}",
                    flush=True,
                )

                if sleep_seconds:
                    time.sleep(sleep_seconds)

    return len(edges_seen), failed_tiles


def main():
    parser = argparse.ArgumentParser(description="Collect Bangkok regional OSM roads and export edge-level WKT CSV.")
    parser.add_argument("--output", default="data/osm_bangkok_regions_edges.csv")
    parser.add_argument("--failures-output", default="data/osm_bangkok_regions_failed_tiles.csv")
    parser.add_argument("--tile-size", type=float, default=0.12)
    parser.add_argument("--sleep", type=float, default=1.0)
    parser.add_argument("--max-tiles", type=int, default=0, help="0 means no limit.")
    args = parser.parse_args()

    started = time.perf_counter()
    edge_count, failures = collect_edges(args.tile_size, args.sleep, args.max_tiles, args.output, args.failures_output)
    elapsed = time.perf_counter() - started
    print(f"wrote {args.output} rows={edge_count} failed_tiles={len(failures)} time={elapsed:.2f}s")


if __name__ == "__main__":
    main()
