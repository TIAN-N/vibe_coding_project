import argparse
import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

CITY_BBOXES = {
    "bangkok": (13.7200, 100.4700, 13.7900, 100.5700),
    "chiang_mai": (18.7600, 98.9400, 18.8300, 99.0200),
    "manila": (14.5500, 120.9600, 14.6400, 121.0400),
    "cebu": (10.2700, 123.8500, 10.3600, 123.9400),
}

EXCLUDED_HIGHWAYS = (
    "footway",
    "cycleway",
    "path",
    "steps",
    "track",
    "bridleway",
    "construction",
    "proposed",
    "raceway",
    "corridor",
    "elevator",
    "platform",
)


def build_query(bbox):
    south, west, north, east = bbox
    excluded = "|".join(EXCLUDED_HIGHWAYS)
    return f"""
[out:json][timeout:120];
(
  way["highway"]["highway"!~"^({excluded})$"]({south},{west},{north},{east});
);
out geom;
"""


def fetch_overpass(query, endpoints=None):
    endpoints = endpoints or OVERPASS_URLS
    data = urllib.parse.urlencode({"data": query}).encode("utf-8")
    last_error = None
    for endpoint in endpoints:
        request = urllib.request.Request(
            endpoint,
            data=data,
            headers={"User-Agent": "road-network-calculator/0.1"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            last_error = exc
            print(f"endpoint failed: {endpoint} error={exc}")
    raise last_error


def way_to_wkt(way):
    geometry = way.get("geometry") or []
    if len(geometry) < 2:
        return None
    coords = []
    for point in geometry:
        lon = float(point["lon"])
        lat = float(point["lat"])
        coords.append(f"{lon:.7f} {lat:.7f}")
    return "LINESTRING({})".format(",".join(coords))


def write_wkt_csv(payload, output):
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    rows = 0
    with output_path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["WKT"])
        for element in payload.get("elements", []):
            if element.get("type") != "way":
                continue
            wkt = way_to_wkt(element)
            if not wkt:
                continue
            writer.writerow([wkt])
            rows += 1
    return rows


def fetch_city(city, output_dir, endpoints=None):
    if city not in CITY_BBOXES:
        raise ValueError("Unknown city '{}'. Known: {}".format(city, ", ".join(sorted(CITY_BBOXES))))
    query = build_query(CITY_BBOXES[city])
    payload = fetch_overpass(query, endpoints=endpoints)
    output = Path(output_dir) / f"osm_{city}_roads.csv"
    rows = write_wkt_csv(payload, output)
    return output, rows


def main():
    parser = argparse.ArgumentParser(description="Fetch OSM road ways from Overpass and export WKT CSV.")
    parser.add_argument(
        "--city",
        action="append",
        choices=sorted(CITY_BBOXES.keys()),
        help="City to fetch. Can be passed multiple times. Defaults to bangkok and manila.",
    )
    parser.add_argument("--output-dir", default="data")
    parser.add_argument("--endpoint", action="append", help="Override Overpass endpoint. Can be passed multiple times.")
    parser.add_argument("--sleep", type=float, default=3.0)
    args = parser.parse_args()

    cities = args.city or ["bangkok", "manila"]
    for index, city in enumerate(cities):
        if index:
            time.sleep(args.sleep)
        output, rows = fetch_city(city, args.output_dir, endpoints=args.endpoint)
        print(f"wrote {output} rows={rows}")


if __name__ == "__main__":
    main()
