#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
import tempfile
import unittest
from pathlib import Path
from typing import Any, Dict

from app.api.query import clear_published_view_state, query, view_state
from app.core.config import settings
from app.db.database import get_connection, init_db
from app.schemas.condition_schema import TopologyQueryRequest


class TopologyViewStateSyncTest(unittest.TestCase):
    """验证外部 API 查询与网页共享状态的持久化边界."""

    def setUp(self) -> None:
        """创建隔离的 SQLite 数据库和最小拓扑版本."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.old_database_path = settings.database_path
        settings.database_path = Path(self.temp_dir.name) / "view-state-test.db"
        init_db()
        self.version_id = "20260802162313917"
        self._seed_topology()

    def tearDown(self) -> None:
        """恢复全局数据库路径并清理临时目录."""
        settings.database_path = self.old_database_path
        self.temp_dir.cleanup()

    def test_query_is_stateless_by_default(self) -> None:
        """未显式发布时，普通查询不应改变网页共享状态."""
        response = query(self._request(apply_to_view=False))

        self.assertTrue(response["success"])
        self.assertEqual(["NODE-A"], response["data"]["state"]["visibleNodeIds"])
        self.assertNotIn("view_state", response["data"])
        self.assertEqual(0, view_state(self.version_id)["data"]["revision"])

    def test_published_query_increments_revision_and_can_be_cleared(self) -> None:
        """显式发布应保存动作、递增修订号并支持通知式清空."""
        first = query(self._request(apply_to_view=True))["data"]["view_state"]
        self.assertEqual(1, first["revision"])
        self.assertEqual("logic", first["view"])
        self.assertEqual("filter", first["actions"][0]["type"])

        stored = view_state(self.version_id)["data"]
        self.assertEqual(first, stored)

        second = query(self._request(apply_to_view=True))["data"]["view_state"]
        self.assertEqual(2, second["revision"])

        cleared = clear_published_view_state(self.version_id)["data"]
        self.assertEqual(3, cleared["revision"])
        self.assertEqual([], cleared["actions"])

    def _request(self, apply_to_view: bool) -> TopologyQueryRequest:
        """构造按 Region 过滤的统一查询请求."""
        return TopologyQueryRequest(
            version_id=self.version_id,
            view="logic",
            apply_to_view=apply_to_view,
            actions=[
                {
                    "type": "filter",
                    "source": "nodes",
                    "mode": "all",
                    "conditions": [
                        {"field": "Region", "op": "eq", "value": "Metro-North"},
                    ],
                },
            ],
        )

    def _seed_topology(self) -> None:
        """写入测试所需版本、网元和链路行."""
        summary: Dict[str, Any] = {"devices": 2, "links": 1, "rings": 0, "chains": 0}
        node_a = {"NE Name": "NODE-A", "Role": "CSG", "Region": "Metro-North"}
        node_b = {"NE Name": "NODE-B", "Role": "CSG", "Region": "Metro-South"}
        link = {"Src NE Name": "NODE-A", "Sink NE Name": "NODE-B"}
        with get_connection() as conn:
            conn.execute(
                """
                INSERT INTO data_versions
                (id, version_name, parse_timestamp, folder_name, summary_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    self.version_id,
                    "测试版本",
                    "2026-08-02-16-23-13-917",
                    "2026-08-02-16-23-13-917_测试版本",
                    json.dumps(summary, ensure_ascii=False),
                    "2026-08-02T16:23:13.917",
                ),
            )
            conn.executemany(
                """
                INSERT INTO device_rows
                (version_id, ne_name, role, raw_data_json)
                VALUES (?, ?, ?, ?)
                """,
                [
                    (self.version_id, "NODE-A", "CSG", json.dumps(node_a, ensure_ascii=False)),
                    (self.version_id, "NODE-B", "CSG", json.dumps(node_b, ensure_ascii=False)),
                ],
            )
            conn.execute(
                """
                INSERT INTO link_rows
                (version_id, src_ne_name, sink_ne_name, raw_data_json)
                VALUES (?, ?, ?, ?)
                """,
                (self.version_id, "NODE-A", "NODE-B", json.dumps(link, ensure_ascii=False)),
            )


if __name__ == "__main__":
    unittest.main()
