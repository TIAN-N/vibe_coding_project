#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict, List, Optional, Tuple

import networkx as nx
import numpy as np


class LogicLayoutEngine:
    """基于原始 ``logic_topo_visual.py`` 的通用逻辑布局引擎."""

    _PADDING = 72.0

    def __init__(
        self,
        devices: List[Dict[str, Any]],
        links: List[Dict[str, Any]],
        canvas_width: float,
        canvas_height: float,
        node_limit: int = 500,
    ) -> None:
        """初始化网元、链路和目标画布.

        Args:
            devices: 当前需要呈现的网元记录.
            links: 当前需要呈现的链路记录.
            canvas_width: 浏览器 Canvas 宽度.
            canvas_height: 浏览器 Canvas 高度.
            node_limit: 逻辑视图允许的最大网元数.
        """
        self.devices = devices
        self.links = links
        self.canvas_width = max(float(canvas_width), 320.0)
        self.canvas_height = max(float(canvas_height), 240.0)
        self.node_limit = node_limit
        self.device_by_name = self._build_device_map(devices, links)
        self.node_names = list(self.device_by_name.keys())
        self.node_set = set(self.node_names)

    def compute(self) -> Dict[str, Any]:
        """使用原始 NetworkX 算法计算 Canvas 逻辑坐标.

        Returns:
            包含算法名称、画布信息和全部节点横纵坐标的字典.
        """
        if len(self.node_names) > self.node_limit:
            return {
                "layout_available": False,
                "reason": f"逻辑视图最多支持 {self.node_limit} 个网元，请先过滤后查看。",
                "node_limit": self.node_limit,
                "node_count": len(self.node_names),
            }

        if not self.node_names:
            return self._empty_result()

        graph = self._build_graph()
        positions, algorithm = self._compute_native_layout(graph)
        positions = self._resolve_node_overlap(positions)
        canvas_positions = self._map_to_canvas(positions)
        return self._build_result(canvas_positions, algorithm, graph.number_of_edges())

    @staticmethod
    def _build_device_map(
        devices: List[Dict[str, Any]],
        links: List[Dict[str, Any]],
    ) -> Dict[str, Dict[str, Any]]:
        """按输入顺序合并网元表节点和链路端点."""
        result: Dict[str, Dict[str, Any]] = {}
        for row in devices:
            name = str(row.get("NE Name", "")).strip()
            if name and name not in result:
                result[name] = row

        for row in links:
            for field in ("Src NE Name", "Sink NE Name"):
                name = str(row.get(field, "")).strip()
                if name and name not in result:
                    result[name] = {"NE Name": name, "Role": ""}
        return result

    def _build_graph(self) -> nx.Graph:
        """仅使用网元表和链路表构建 NetworkX 无向图."""
        graph = nx.Graph()
        graph.add_nodes_from(self.node_names)
        for row in self.links:
            src = str(row.get("Src NE Name", "")).strip()
            sink = str(row.get("Sink NE Name", "")).strip()
            if src in self.node_set and sink in self.node_set and src != sink:
                graph.add_edge(src, sink)
        return graph

    @staticmethod
    def _compute_native_layout(
        graph: nx.Graph,
    ) -> Tuple[Dict[str, np.ndarray], str]:
        """复用原始脚本的 Kamada-Kawai/Spring 选择逻辑."""
        if len(graph) > 1000:
            positions = nx.spring_layout(graph, k=0.5, iterations=50, seed=42)
            return positions, "networkx-spring"
        positions = nx.kamada_kawai_layout(graph)
        return positions, "networkx-kamada-kawai"

    @staticmethod
    def _resolve_node_overlap(
        positions: Dict[str, np.ndarray],
        min_distance: Optional[float] = None,
    ) -> Dict[str, np.ndarray]:
        """使用原始脚本的通用位置偏移方法处理节点重叠."""
        if not positions:
            return {}

        normalized = {name: np.array(value, dtype=float) for name, value in positions.items()}
        if min_distance is None:
            all_coords = np.array(list(normalized.values()))
            x_range = all_coords[:, 0].max() - all_coords[:, 0].min()
            y_range = all_coords[:, 1].max() - all_coords[:, 1].min()
            min_distance = max(x_range, y_range, 1.0) * 0.01

        resolved = {name: value.copy() for name, value in normalized.items()}
        nodes = list(resolved.keys())
        for index, left_name in enumerate(nodes):
            for right_name in nodes[index + 1:]:
                difference = resolved[left_name] - resolved[right_name]
                distance = np.linalg.norm(difference)
                if 0 < distance < min_distance:
                    direction = difference / distance
                    offset = (min_distance - distance) / 2.0 + 0.001
                    resolved[left_name] = resolved[left_name] + direction * offset
                    resolved[right_name] = resolved[right_name] - direction * offset
        return resolved

    def _map_to_canvas(
        self,
        positions: Dict[str, np.ndarray],
    ) -> Dict[str, np.ndarray]:
        """将 NetworkX 归一化坐标等比映射到目标 Canvas."""
        if len(positions) == 1:
            name = next(iter(positions))
            return {
                name: np.array([self.canvas_width / 2.0, self.canvas_height / 2.0])
            }

        values = np.array(list(positions.values()), dtype=float)
        min_x, min_y = values.min(axis=0)
        max_x, max_y = values.max(axis=0)
        x_range = float(max_x - min_x)
        y_range = float(max_y - min_y)
        available_width = max(self.canvas_width - 2.0 * self._PADDING, 1.0)
        available_height = max(self.canvas_height - 2.0 * self._PADDING, 1.0)
        scales = []
        if x_range > 0:
            scales.append(available_width / x_range)
        if y_range > 0:
            scales.append(available_height / y_range)
        scale = min(scales) if scales else 1.0
        content_width = x_range * scale
        content_height = y_range * scale
        offset_x = (self.canvas_width - content_width) / 2.0
        offset_y = (self.canvas_height - content_height) / 2.0

        return {
            name: np.array([
                offset_x + (float(value[0]) - min_x) * scale,
                offset_y + (max_y - float(value[1])) * scale,
            ])
            for name, value in positions.items()
        }

    def _empty_result(self) -> Dict[str, Any]:
        """返回空拓扑的有效布局结果."""
        return {
            "layout_available": True,
            "node_limit": self.node_limit,
            "node_count": 0,
            "edge_count": 0,
            "algorithm": "networkx-empty",
            "canvas": self._canvas_payload(),
            "nodes": [],
        }

    def _build_result(
        self,
        positions: Dict[str, np.ndarray],
        algorithm: str,
        edge_count: int,
    ) -> Dict[str, Any]:
        """构建前端可直接消费的布局响应."""
        return {
            "layout_available": True,
            "node_limit": self.node_limit,
            "node_count": len(self.node_names),
            "edge_count": edge_count,
            "algorithm": algorithm,
            "canvas": self._canvas_payload(),
            "nodes": [
                {
                    "id": name,
                    "x": round(float(positions[name][0]), 3),
                    "y": round(float(positions[name][1]), 3),
                    "role": str(self.device_by_name[name].get("Role", "")),
                }
                for name in self.node_names
                if name in positions
            ],
        }

    def _canvas_payload(self) -> Dict[str, float]:
        """返回布局使用的 Canvas 尺寸."""
        return {
            "width": round(self.canvas_width, 3),
            "height": round(self.canvas_height, 3),
            "viewport_width": round(self.canvas_width, 3),
            "viewport_height": round(self.canvas_height, 3),
        }
