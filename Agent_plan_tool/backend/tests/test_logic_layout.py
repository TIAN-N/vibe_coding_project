#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import csv
import tempfile
import unittest
from pathlib import Path
from typing import Any, Dict, List, Tuple

from algo.layout.logic_layout import LogicLayoutEngine
from algo.layout.logic_layout_preview import render_logic_topology
from app.services.layout_service import LogicLayoutRequest, compute_logic_layout


def build_plain_graph_fixture() -> Tuple[
    List[Dict[str, Any]],
    List[Dict[str, Any]],
]:
    """构造含孤立网元和链路端点补全的通用拓扑."""
    devices = [
        {"NE Name": "A", "Role": "ASG"},
        {"NE Name": "B", "Role": "CSG"},
        {"NE Name": "C", "Role": "CORE"},
    ]
    links = [
        {"Src NE Name": "A", "Sink NE Name": "B"},
        {"Src NE Name": "B", "Sink NE Name": "D"},
    ]
    return devices, links


class LogicLayoutServiceTest(unittest.TestCase):
    """验证原始 NetworkX 逻辑布局及 PNG 文件输出."""

    def test_layout_uses_native_kamada_kawai_for_nodes_and_links(self) -> None:
        """500 节点以内应使用原始 Kamada-Kawai 全图布局."""
        devices, links = build_plain_graph_fixture()
        result = compute_logic_layout(LogicLayoutRequest(
            devices=devices,
            links=links,
            canvas_width=1000,
            canvas_height=700,
        ))
        positions = {node["id"]: node for node in result["nodes"]}

        self.assertTrue(result["layout_available"])
        self.assertEqual("networkx-kamada-kawai", result["algorithm"])
        self.assertEqual(4, result["node_count"])
        self.assertEqual(2, result["edge_count"])
        self.assertEqual({"A", "B", "C", "D"}, set(positions))
        self.assertTrue(all(0 <= node["x"] <= 1000 for node in positions.values()))
        self.assertTrue(all(0 <= node["y"] <= 700 for node in positions.values()))

    def test_layout_is_deterministic(self) -> None:
        """相同网元、链路和 Canvas 应生成相同坐标."""
        devices, links = build_plain_graph_fixture()
        request = LogicLayoutRequest(
            devices=devices,
            links=links,
            canvas_width=1200,
            canvas_height=800,
        )
        first = compute_logic_layout(request)
        second = compute_logic_layout(request)
        self.assertEqual(first["canvas"], second["canvas"])
        self.assertEqual(first["nodes"], second["nodes"])

    def test_engine_does_not_accept_ring_chain_input(self) -> None:
        """引擎构造契约只包含网元表和链路表."""
        devices, links = build_plain_graph_fixture()
        engine = LogicLayoutEngine(devices, links, 1000, 700)
        self.assertFalse(hasattr(engine, "ring_chains"))
        self.assertEqual("networkx-kamada-kawai", engine.compute()["algorithm"])

    def test_node_limit_is_enforced(self) -> None:
        """超过 500 网元时应拒绝生成逻辑视图坐标."""
        devices = [{"NE Name": f"NODE-{index}", "Role": "CSG"} for index in range(501)]
        result = compute_logic_layout(LogicLayoutRequest(devices=devices))
        self.assertFalse(result["layout_available"])
        self.assertEqual(501, result["node_count"])
        self.assertEqual(500, result["node_limit"])

    def test_file_paths_generate_png_from_engine_coordinates(self) -> None:
        """网元表和链路表路径应直接生成有效 PNG 文件."""
        devices, links = build_plain_graph_fixture()
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            device_file = directory / "device.csv"
            link_file = directory / "link.csv"
            output_file = directory / "logic_topology.png"
            self._write_csv(device_file, devices)
            self._write_csv(link_file, links)

            result = render_logic_topology(
                str(device_file),
                str(link_file),
                str(output_file),
                canvas_width=1000,
                canvas_height=700,
            )

            expected = LogicLayoutEngine(devices, links, 1000, 700).compute()
            self.assertEqual(expected["nodes"], result["nodes"])
            self.assertEqual("networkx-kamada-kawai", result["algorithm"])
            self.assertTrue(output_file.is_file())
            self.assertGreater(output_file.stat().st_size, 1000)
            self.assertEqual(b"\x89PNG\r\n\x1a\n", output_file.read_bytes()[:8])

    @staticmethod
    def _write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
        """写入路径驱动测试所需的 CSV 文件."""
        with path.open("w", encoding="utf-8-sig", newline="") as file_handle:
            writer = csv.DictWriter(file_handle, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)


if __name__ == "__main__":
    unittest.main()
