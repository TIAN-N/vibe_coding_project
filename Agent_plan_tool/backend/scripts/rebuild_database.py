#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import argparse
import json
import os
import re
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from app.db.database import get_connection, init_db
from app.services.parser_service import (
    REQUIRED_DEVICE_COLUMNS,
    REQUIRED_LINK_COLUMNS,
    REQUIRED_RING_CHAIN_COLUMNS,
    parse_table,
    parse_upload_tables,
)
from app.services.version_service import (
    build_summary,
    build_version_folder_name,
    insert_device_rows,
    insert_link_rows,
    insert_ring_chain_rows,
    sanitize_version_name,
)


SUPPORTED_SUFFIXES = {".csv", ".xlsx", ".xls"}
TIMESTAMP_PATTERN = re.compile(r"^(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}(?:-\d{3})?)")


def classify_source_file(path: Path) -> Optional[str]:
    """根据表头识别原始文件类型.

    Args:
        path: CSV 或 Excel 原始文件路径.

    Returns:
        device、link、ring_chain，无法识别时返回 None.
    """
    columns = set(str(column).strip() for column in parse_table(path.read_bytes(), path.name).columns)
    if set(REQUIRED_RING_CHAIN_COLUMNS).issubset(columns):
        return "ring_chain"
    if set(REQUIRED_DEVICE_COLUMNS).issubset(columns):
        return "device"
    if set(REQUIRED_LINK_COLUMNS).issubset(columns):
        return "link"
    return None


def derive_version_name(folder: Path, timestamp: str, device_file: Path) -> str:
    """从历史目录或网元文件名推导版本名称."""
    suffix = folder.name[len(timestamp):].lstrip("_-").strip()
    if suffix:
        return sanitize_version_name(suffix)
    stem = re.sub(r"(?i)(?:[_-](?:device|devices|node|nodes|ne))$", "", device_file.stem)
    return sanitize_version_name(stem or folder.name)


def discover_versions(version_root: Path) -> List[Dict[str, Any]]:
    """扫描历史目录并从原始文件解析全部版本."""
    versions: List[Dict[str, Any]] = []
    for folder in sorted(item for item in version_root.iterdir() if item.is_dir()):
        match = TIMESTAMP_PATTERN.match(folder.name)
        if not match:
            continue
        timestamp = match.group(1)
        files_by_type: Dict[str, Path] = {}
        for path in sorted(folder.iterdir()):
            if not path.is_file() or path.suffix.lower() not in SUPPORTED_SUFFIXES:
                continue
            file_type = classify_source_file(path)
            if file_type and file_type not in files_by_type:
                files_by_type[file_type] = path
        if "device" not in files_by_type or "link" not in files_by_type:
            raise ValueError(f"历史版本缺少网元表或链路表：{folder}")

        device_file = files_by_type["device"]
        link_file = files_by_type["link"]
        ring_chain_file = files_by_type.get("ring_chain")
        device_rows, link_rows, ring_chain_rows = parse_upload_tables(
            device_file.read_bytes(),
            device_file.name,
            link_file.read_bytes(),
            link_file.name,
            ring_chain_file.read_bytes() if ring_chain_file else None,
            ring_chain_file.name if ring_chain_file else None,
        )
        version_name = derive_version_name(folder, timestamp, device_file)
        versions.append(
            {
                "source_folder": folder,
                "timestamp": timestamp,
                "version_id": timestamp.replace("-", ""),
                "version_name": version_name,
                "folder_name": build_version_folder_name(timestamp, version_name),
                "device_file": device_file,
                "link_file": link_file,
                "ring_chain_file": ring_chain_file,
                "devices": device_rows,
                "links": link_rows,
                "ring_chains": ring_chain_rows,
                "summary": build_summary(device_rows, link_rows, ring_chain_rows),
            }
        )
    return versions


def timestamp_to_iso(timestamp: str) -> str:
    """将目录时间戳转换为数据库 ISO 时间."""
    base_timestamp = timestamp[:19]
    parsed = datetime.strptime(base_timestamp, "%Y-%m-%d-%H-%M-%S")
    return parsed.isoformat(timespec="seconds")


def insert_restored_version(conn: sqlite3.Connection, version: Dict[str, Any]) -> None:
    """把一个历史原始文件版本写入新数据库."""
    conn.execute(
        """
        INSERT INTO data_versions
        (id, version_name, parse_timestamp, folder_name, device_file_name,
         link_file_name, ring_chain_file_name, summary_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            version["version_id"],
            version["version_name"],
            version["timestamp"],
            version["folder_name"],
            version["device_file"].name,
            version["link_file"].name,
            version["ring_chain_file"].name if version["ring_chain_file"] else None,
            json.dumps(version["summary"], ensure_ascii=False),
            timestamp_to_iso(version["timestamp"]),
        ),
    )
    insert_device_rows(conn, version["version_id"], version["devices"])
    insert_link_rows(conn, version["version_id"], version["links"])
    insert_ring_chain_rows(conn, version["version_id"], version["ring_chains"])


def rename_version_folders(versions: List[Dict[str, Any]]) -> None:
    """将历史目录统一为时间戳加版本名格式."""
    for version in versions:
        source_folder = version["source_folder"]
        target_folder = source_folder.parent / version["folder_name"]
        if source_folder == target_folder:
            continue
        if target_folder.exists():
            raise FileExistsError(f"目标版本目录已存在：{target_folder}")
        source_folder.rename(target_folder)
        version["source_folder"] = target_folder


def remove_snapshots(versions: List[Dict[str, Any]]) -> int:
    """删除历史 parsed_snapshot.json 冗余文件."""
    removed = 0
    for version in versions:
        snapshot = version["source_folder"] / "parsed_snapshot.json"
        if snapshot.exists():
            snapshot.unlink()
            removed += 1
    return removed


def rebuild_database(database_path: Path, version_root: Path) -> Dict[str, Any]:
    """从历史原始文件安全重建 SQLite 数据库.

    Args:
        database_path: 需要重建的 SQLite 文件.
        version_root: 历史版本原始文件根目录.

    Returns:
        备份路径、版本数量和数据行数摘要.
    """
    versions = discover_versions(version_root)
    if not versions:
        raise ValueError(f"未发现可重建的历史版本：{version_root}")
    rename_version_folders(versions)

    temp_database = database_path.with_suffix(".rebuild.tmp")
    if temp_database.exists():
        temp_database.unlink()
    original_database_path = settings.database_path
    try:
        settings.database_path = temp_database
        init_db()
        with get_connection() as conn:
            for version in versions:
                insert_restored_version(conn, version)
        integrity_conn = sqlite3.connect(temp_database)
        try:
            integrity = integrity_conn.execute("PRAGMA integrity_check").fetchone()[0]
        finally:
            integrity_conn.close()
        if integrity != "ok":
            raise sqlite3.DatabaseError(f"重建数据库完整性检查失败：{integrity}")
    finally:
        settings.database_path = original_database_path

    backup_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    backup_path = database_path.with_name(f"{database_path.name}.corrupt-{backup_timestamp}.bak")
    if database_path.exists():
        shutil.copy2(database_path, backup_path)
    os.replace(temp_database, database_path)
    removed_snapshots = remove_snapshots(versions)
    return {
        "database": str(database_path),
        "backup": str(backup_path) if backup_path.exists() else None,
        "versions": len(versions),
        "devices": sum(len(item["devices"]) for item in versions),
        "links": sum(len(item["links"]) for item in versions),
        "ring_chains": sum(len(item["ring_chains"]) for item in versions),
        "removed_snapshots": removed_snapshots,
        "folders": [item["folder_name"] for item in versions],
    }


def parse_args() -> argparse.Namespace:
    """解析命令行参数."""
    parser = argparse.ArgumentParser(description="从历史原始文件重建拓扑 SQLite 数据库")
    parser.add_argument("--database", type=Path, default=settings.database_path)
    parser.add_argument("--versions", type=Path, default=settings.version_root)
    return parser.parse_args()


def main() -> None:
    """执行数据库重建并输出 JSON 摘要."""
    args = parse_args()
    result = rebuild_database(args.database.resolve(), args.versions.resolve())
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
