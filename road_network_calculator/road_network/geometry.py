import math
import re
from typing import List, Tuple

EARTH_RADIUS_M = 6371008.8
_LINESTRING_RE = re.compile(r"^\s*LINESTRING\s*\((.*)\)\s*$", re.IGNORECASE)


def parse_linestring_wkt(wkt: str) -> List[Tuple[float, float]]:
    """Parse a LINESTRING WKT into (lon, lat) coordinate pairs."""
    if not isinstance(wkt, str):
        raise ValueError("WKT value must be a string")

    match = _LINESTRING_RE.match(wkt)
    if not match:
        raise ValueError("Only LINESTRING WKT is supported")

    body = match.group(1).strip()
    if not body:
        raise ValueError("LINESTRING must contain coordinates")

    coords = []
    for raw_pair in body.split(","):
        parts = raw_pair.strip().split()
        if len(parts) < 2:
            raise ValueError("Invalid coordinate pair in LINESTRING")
        coords.append((float(parts[0]), float(parts[1])))

    if len(coords) < 2:
        raise ValueError("LINESTRING must contain at least two coordinates")
    return coords


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    lon1_rad = math.radians(lon1)
    lat1_rad = math.radians(lat1)
    lon2_rad = math.radians(lon2)
    lat2_rad = math.radians(lat2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    sin_dlat = math.sin(dlat * 0.5)
    sin_dlon = math.sin(dlon * 0.5)
    a = sin_dlat * sin_dlat + math.cos(lat1_rad) * math.cos(lat2_rad) * sin_dlon * sin_dlon
    return 2.0 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def lonlat_to_local_xy_m(lon: float, lat: float, ref_lat: float) -> Tuple[float, float]:
    lat_rad = math.radians(lat)
    ref_lat_rad = math.radians(ref_lat)
    x = EARTH_RADIUS_M * math.radians(lon) * math.cos(ref_lat_rad)
    y = EARTH_RADIUS_M * lat_rad
    return x, y

