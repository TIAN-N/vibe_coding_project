#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
from typing import Any, Dict, List

from app.db.database import fetch_all


def _decode_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    result = []
    for row in rows:
        raw = json.loads(row["raw_data_json"])
        raw["_row_id"] = row["id"]
        raw["_version_id"] = row["version_id"]
        result.append(raw)
    return result


def get_device_rows(version_id: str) -> List[Dict[str, Any]]:
    """读取指定版本的网元表原始行."""
    rows = fetch_all(
        "SELECT * FROM device_rows WHERE version_id = ? ORDER BY id",
        (version_id,),
    )
    return _decode_rows(rows)


def get_link_rows(version_id: str) -> List[Dict[str, Any]]:
    """读取指定版本的链路表原始行."""
    rows = fetch_all(
        "SELECT * FROM link_rows WHERE version_id = ? ORDER BY id",
        (version_id,),
    )
    return _decode_rows(rows)


def get_ring_chain_rows(version_id: str) -> List[Dict[str, Any]]:
    """读取指定版本的环链表原始行."""
    rows = fetch_all(
        "SELECT * FROM ring_chain_rows WHERE version_id = ? ORDER BY id",
        (version_id,),
    )
    return _decode_rows(rows)


def get_version_dataset(version_id: str) -> Dict[str, List[Dict[str, Any]]]:
    """一次性读取拓扑版本的三张表."""
    return {
        "devices": get_device_rows(version_id),
        "links": get_link_rows(version_id),
        "ringChains": get_ring_chain_rows(version_id),
    }

