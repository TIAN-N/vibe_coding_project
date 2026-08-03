#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.db.database import fetch_all, fetch_one, get_connection


def now_timestamp() -> str:
    """生成版本时间戳."""
    return datetime.now().strftime("%Y-%m-%d-%H-%M-%S-%f")[:-3]


def sanitize_version_name(version_name: Optional[str]) -> str:
    """生成适用于 Windows 文件夹名称的版本名.

    Args:
        version_name: 用户输入的版本名称.

    Returns:
        清理非法字符并限制长度后的版本名称.
    """
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", str(version_name or "").strip())
    cleaned = re.sub(r"\s+", " ", cleaned).rstrip(". ")
    return (cleaned or "未命名版本")[:80]


def build_version_folder_name(parse_timestamp: str, version_name: str) -> str:
    """按时间戳和版本名生成版本文件夹名称."""
    return f"{parse_timestamp}_{sanitize_version_name(version_name)}"


def create_version(
    device_rows: List[Dict[str, Any]],
    link_rows: List[Dict[str, Any]],
    ring_chain_rows: List[Dict[str, Any]],
    source_files: Dict[str, Path],
    version_name: Optional[str] = None,
) -> Dict[str, Any]:
    """创建数据版本并持久化三张表."""
    parse_timestamp = now_timestamp()
    version_id = parse_timestamp.replace("-", "")
    display_name = str(version_name or parse_timestamp).strip() or parse_timestamp
    folder_name = build_version_folder_name(parse_timestamp, display_name)
    version_folder = settings.version_root / folder_name
    version_folder.mkdir(parents=True, exist_ok=True)

    saved_names: Dict[str, Optional[str]] = {"device": None, "link": None, "ring_chain": None}
    for key, path in source_files.items():
        if path and path.exists():
            target = version_folder / path.name
            shutil.copy2(path, target)
            saved_names[key] = target.name

    summary = build_summary(device_rows, link_rows, ring_chain_rows)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO data_versions
            (id, version_name, parse_timestamp, folder_name, device_file_name,
             link_file_name, ring_chain_file_name, summary_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                version_id,
                display_name,
                parse_timestamp,
                folder_name,
                saved_names["device"],
                saved_names["link"],
                saved_names["ring_chain"],
                json.dumps(summary, ensure_ascii=False),
                datetime.now().isoformat(timespec="milliseconds"),
            ),
        )
        insert_device_rows(conn, version_id, device_rows)
        insert_link_rows(conn, version_id, link_rows)
        insert_ring_chain_rows(conn, version_id, ring_chain_rows)

    return {
        "version_id": version_id,
        "version_name": display_name,
        "parse_timestamp": parse_timestamp,
        "folder_name": folder_name,
        "summary": summary,
    }


def build_summary(
    device_rows: List[Dict[str, Any]],
    link_rows: List[Dict[str, Any]],
    ring_chain_rows: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """计算上传版本的基础摘要."""
    device_names = {str(row.get("NE Name", "")).strip() for row in device_rows}
    missing_link_endpoints = 0
    for row in link_rows:
        src = str(row.get("Src NE Name", "")).strip()
        sink = str(row.get("Sink NE Name", "")).strip()
        if src not in device_names or sink not in device_names:
            missing_link_endpoints += 1

    missing_ring_members = 0
    for row in ring_chain_rows:
        for member in split_member_path(str(row.get("Member_path", ""))):
            if member not in device_names:
                missing_ring_members += 1

    return {
        "devices": len(device_rows),
        "links": len(link_rows),
        "rings": sum(1 for row in ring_chain_rows if str(row.get("Category", "")).lower() == "ring"),
        "chains": sum(1 for row in ring_chain_rows if str(row.get("Category", "")).lower() == "link"),
        "missing_link_endpoints": missing_link_endpoints,
        "missing_ring_chain_members": missing_ring_members,
    }


def split_member_path(member_path: str) -> List[str]:
    """拆分环链 Member_path 字段."""
    return [item.strip() for item in member_path.split("->") if item.strip()]


def insert_device_rows(conn: Any, version_id: str, rows: List[Dict[str, Any]]) -> None:
    """批量写入网元行."""
    conn.executemany(
        """
        INSERT INTO device_rows
        (version_id, ne_name, role, longitude, latitude, raw_data_json)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (
                version_id,
                str(row.get("NE Name", "")).strip(),
                str(row.get("Role", "")).strip(),
                to_float(row.get("Longitude")),
                to_float(row.get("Latitude")),
                json.dumps(row, ensure_ascii=False),
            )
            for row in rows
        ],
    )


def insert_link_rows(conn: Any, version_id: str, rows: List[Dict[str, Any]]) -> None:
    """批量写入链路行."""
    conn.executemany(
        """
        INSERT INTO link_rows
        (version_id, src_ne_name, sink_ne_name, route_wkt, raw_data_json)
        VALUES (?, ?, ?, ?, ?)
        """,
        [
            (
                version_id,
                str(row.get("Src NE Name", "")).strip(),
                str(row.get("Sink NE Name", "")).strip(),
                str(row.get("Route WKT", "")).strip(),
                json.dumps(row, ensure_ascii=False),
            )
            for row in rows
        ],
    )


def insert_ring_chain_rows(conn: Any, version_id: str, rows: List[Dict[str, Any]]) -> None:
    """批量写入环链行."""
    conn.executemany(
        """
        INSERT INTO ring_chain_rows
        (version_id, category, name, root1, root2, label, member_num,
         member_path, uplink_pair, belong_agg, raw_data_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                version_id,
                str(row.get("Category", "")).strip(),
                str(row.get("Name", "")).strip(),
                str(row.get("Root1", "")).strip(),
                str(row.get("Root2", "")).strip(),
                str(row.get("Label", "")).strip(),
                to_int(row.get("Member_num")),
                str(row.get("Member_path", "")).strip(),
                str(row.get("Uplink_pair", "")).strip(),
                str(row.get("Belong_agg", "")).strip(),
                json.dumps(row, ensure_ascii=False),
            )
            for row in rows
        ],
    )


def to_float(value: Any) -> Optional[float]:
    """转换浮点数，失败时返回 None."""
    try:
        text = str(value).strip()
        return float(text) if text else None
    except (TypeError, ValueError):
        return None


def to_int(value: Any) -> Optional[int]:
    """转换整数，失败时返回 None."""
    try:
        text = str(value).strip()
        return int(float(text)) if text else None
    except (TypeError, ValueError):
        return None


def list_versions() -> List[Dict[str, Any]]:
    """查询全部数据版本."""
    rows = fetch_all("SELECT * FROM data_versions ORDER BY created_at DESC")
    for row in rows:
        row["summary"] = json.loads(row.pop("summary_json"))
    return rows


def get_version(version_id: str) -> Optional[Dict[str, Any]]:
    """查询单个数据版本."""
    row = fetch_one("SELECT * FROM data_versions WHERE id = ?", (version_id,))
    if row:
        row["summary"] = json.loads(row.pop("summary_json"))
    return row
