#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
import tempfile
import unittest
from pathlib import Path

from app.application.ui_command_service import (
    UiCommandConflictError,
    acknowledge_command,
    get_data_schema,
    get_field_values,
    register_session,
    submit_command,
)
from app.core.config import settings
from app.db.database import get_connection, init_db
from app.infrastructure.ui_state_repository import get_command, get_state


class UiCommandServiceTest(unittest.TestCase):
    """验证统一可视化命令的会话、修订和回执语义."""

    def setUp(self) -> None:
        """创建隔离数据库和最小拓扑版本."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.old_database_path = settings.database_path
        settings.database_path = Path(self.temp_dir.name) / "ui-command-test.db"
        init_db()
        self.version_id = "20260802162313917"
        self._seed_topology()

    def tearDown(self) -> None:
        """恢复数据库配置并清理临时文件."""
        settings.database_path = self.old_database_path
        self.temp_dir.cleanup()

    def test_atomic_command_targets_active_session_and_can_ack(self) -> None:
        """一组操作应只递增一次修订，并可记录真实渲染结果."""
        session = register_session("browser-a", True)["session"]
        command = submit_command({
            "target": "active",
            "expected_revision": 0,
            "requested_by": "test",
            "operations": [
                {"op": "switch_version", "version_id": self.version_id},
                {"op": "switch_view", "view": "logic"},
                {
                    "op": "set_filter",
                    "source": "nodes",
                    "mode": "all",
                    "conditions": [{"field": "Region", "op": "eq", "value": "Metro-North"}],
                },
                {
                    "op": "set_node_style_rules",
                    "rules": [{
                        "source": "nodes",
                        "mode": "all",
                        "conditions": [{"field": "Role", "op": "eq", "value": "CSG"}],
                        "color": "#ff0066",
                        "size": 18,
                        "shape": "diamond",
                    }],
                },
                {
                    "op": "set_link_style_rules",
                    "rules": [{
                        "source": "links",
                        "mode": "all",
                        "conditions": [{"field": "Status", "op": "eq", "value": "Down"}],
                        "color": "#00aa55",
                        "line_style": "dash",
                        "width": "thick",
                    }],
                },
            ],
        })

        self.assertEqual(session["id"], command["session_id"])
        self.assertEqual("accepted", command["status"])
        snapshot = get_state(session["id"])
        self.assertEqual(1, snapshot["revision"])
        self.assertEqual("logic", snapshot["state"]["view"])
        self.assertEqual("Metro-North", snapshot["state"]["filter"]["conditions"][0]["value"])
        self.assertEqual("diamond", snapshot["state"]["node_style_rules"][0]["shape"])
        self.assertEqual("dash", snapshot["state"]["link_style_rules"][0]["line_style"])

        rendered = acknowledge_command(command["id"], {
            "session_id": session["id"],
            "revision": 1,
            "success": True,
            "result": {"visible_nodes": 1, "visible_links": 0},
        })
        self.assertEqual("rendered", rendered["status"])
        self.assertEqual(1, rendered["result"]["render"]["visible_nodes"])

    def test_revision_conflict_is_rejected(self) -> None:
        """过期客户端不得覆盖浏览器的较新状态."""
        session = register_session("browser-a", True)["session"]
        submit_command({
            "target": session["id"],
            "expected_revision": 0,
            "operations": [{"op": "switch_view", "view": "logic"}],
        })
        with self.assertRaises(UiCommandConflictError):
            submit_command({
                "target": session["id"],
                "expected_revision": 0,
                "operations": [{"op": "switch_view", "view": "gis"}],
            })

    def test_waiting_command_is_claimed_when_browser_registers(self) -> None:
        """没有网页时命令应等待，并由后续打开的页面领取."""
        command = submit_command({
            "target": "active",
            "requested_by": "mcp",
            "operations": [
                {"op": "switch_version", "version_id": self.version_id},
                {"op": "switch_view", "view": "logic"},
            ],
        })
        self.assertEqual("waiting_for_browser", command["status"])

        registered = register_session("browser-late", True)
        self.assertEqual(1, registered["ui_state"]["revision"])
        self.assertEqual("logic", registered["ui_state"]["state"]["view"])
        claimed = get_command(command["id"])
        self.assertEqual("accepted", claimed["status"])
        self.assertEqual(registered["session"]["id"], claimed["session_id"])
        rendered = acknowledge_command(command["id"], {
            "session_id": registered["session"]["id"],
            "revision": 1,
            "success": True,
            "result": {"view": "logic"},
        })
        self.assertEqual("rendered", rendered["status"])

    def test_schema_and_field_values_support_llm_planning(self) -> None:
        """数据探查接口应提供字段和去重值."""
        schema = get_data_schema(self.version_id)
        self.assertIn("Region", schema["sources"]["nodes"]["fields"])
        values = get_field_values(self.version_id, "nodes", "Region")
        self.assertEqual(["Metro-North", "Metro-South"], values["values"])

    def _seed_topology(self) -> None:
        """写入测试版本及两条网元数据."""
        summary = {"devices": 2, "links": 1, "rings": 0, "chains": 0}
        rows = [
            {"NE Name": "NODE-A", "Role": "CSG", "Region": "Metro-North"},
            {"NE Name": "NODE-B", "Role": "ASG", "Region": "Metro-South"},
        ]
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
                    (self.version_id, row["NE Name"], row["Role"], json.dumps(row, ensure_ascii=False))
                    for row in rows
                ],
            )


if __name__ == "__main__":
    unittest.main()
