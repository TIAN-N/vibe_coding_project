import math

from road_network.geometry import haversine_m, parse_linestring_wkt


def test_parse_linestring_wkt():
    assert parse_linestring_wkt("LINESTRING(116 39,117 40)") == [(116.0, 39.0), (117.0, 40.0)]


def test_haversine_m_one_degree_latitude():
    distance = haversine_m(116.0, 39.0, 116.0, 40.0)
    assert 111000 < distance < 112000

