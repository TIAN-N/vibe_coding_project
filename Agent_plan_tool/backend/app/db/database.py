#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, Iterator, List, Optional, Tuple

from app.core.config import settings


def init_db() -> None:
    """初始化 SQLite 表结构."""
    settings.ensure_dirs()
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS data_versions (
                id TEXT PRIMARY KEY,
                version_name TEXT NOT NULL,
                parse_timestamp TEXT NOT NULL,
                folder_name TEXT NOT NULL,
                device_file_name TEXT,
                link_file_name TEXT,
                ring_chain_file_name TEXT,
                summary_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS device_rows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id TEXT NOT NULL,
                ne_name TEXT NOT NULL,
                role TEXT,
                longitude REAL,
                latitude REAL,
                raw_data_json TEXT NOT NULL,
                FOREIGN KEY(version_id) REFERENCES data_versions(id)
            );

            CREATE TABLE IF NOT EXISTS link_rows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id TEXT NOT NULL,
                src_ne_name TEXT NOT NULL,
                sink_ne_name TEXT NOT NULL,
                route_wkt TEXT,
                raw_data_json TEXT NOT NULL,
                FOREIGN KEY(version_id) REFERENCES data_versions(id)
            );

            CREATE TABLE IF NOT EXISTS ring_chain_rows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id TEXT NOT NULL,
                category TEXT,
                name TEXT,
                root1 TEXT,
                root2 TEXT,
                label TEXT,
                member_num INTEGER,
                member_path TEXT,
                uplink_pair TEXT,
                belong_agg TEXT,
                raw_data_json TEXT NOT NULL,
                FOREIGN KEY(version_id) REFERENCES data_versions(id)
            );

            CREATE TABLE IF NOT EXISTS style_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                scope TEXT NOT NULL,
                version_id TEXT,
                template_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS metric_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                spec_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_device_version ON device_rows(version_id);
            CREATE INDEX IF NOT EXISTS idx_device_name ON device_rows(version_id, ne_name);
            CREATE INDEX IF NOT EXISTS idx_link_version ON link_rows(version_id);
            CREATE INDEX IF NOT EXISTS idx_link_pair ON link_rows(version_id, src_ne_name, sink_ne_name);
            CREATE INDEX IF NOT EXISTS idx_ring_chain_version ON ring_chain_rows(version_id);
            """
        )


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """获取 SQLite 连接，自动提交并关闭."""
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def fetch_all(query: str, params: Tuple[Any, ...] = ()) -> List[Dict[str, Any]]:
    """执行查询并返回字典列表."""
    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(row) for row in rows]


def fetch_one(query: str, params: Tuple[Any, ...] = ()) -> Optional[Dict[str, Any]]:
    """执行查询并返回单行字典."""
    with get_connection() as conn:
        row = conn.execute(query, params).fetchone()
    return dict(row) if row else None

