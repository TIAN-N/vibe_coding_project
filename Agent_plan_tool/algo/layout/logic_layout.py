#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import math
from typing import Any, Dict, List, Set, Tuple

import networkx as nx
import numpy as np


class LogicLayoutEngine:
    """逻辑拓扑布局引擎，将旧绘图类重构为坐标 JSON 输出能力."""

    def __init__(
        self,
        devices: List[Dict[str, Any]],
        links: List[Dict[str, Any]],
        ring_chains: List[Dict[str, Any]],
        canvas_width: float,
        canvas_height: float,
        node_limit: int = 500,
    ) -> None:
        self.devices = devices
        self.links = links
        self.ring_chains = ring_chains
        self.canvas_width = max(canvas_width, 800.0)
        self.canvas_height = max(canvas_height, 600.0)
        self.node_limit = node_limit
        self.node_names = [str(row.get("NE Name", "")).strip() for row in devices if row.get("NE Name")]
        self.node_set = set(self.node_names)

    def compute(self) -> Dict[str, Any]:
        """计算逻辑视图坐标."""
        if len(self.node_names) > self.node_limit:
            return {
                "layout_available": False,
                "reason": f"逻辑视图最多支持 {self.node_limit} 个网元，请先过滤后查看。",
                "node_limit": self.node_limit,
                "node_count": len(self.node_names),
            }

        graph = self._build_graph()
        if self._has_ring_chain_paths():
            pos = self._ring_chain_first_layout(graph)
        else:
            pos = self._networkx_layout(graph)

        pos = self._resolve_node_overlap(pos)
        pos = self._normalize_to_canvas(pos)
        return {
            "layout_available": True,
            "node_limit": self.node_limit,
            "node_count": len(self.node_names),
            "canvas": {"width": self.canvas_width, "height": self.canvas_height},
            "nodes": [
                {
                    "id": name,
                    "x": round(float(pos[name][0]), 3),
                    "y": round(float(pos[name][1]), 3),
                    "role": str(device.get("Role", "")),
                }
                for name, device in self._device_items()
                if name in pos
            ],
        }

    def _build_graph(self) -> nx.Graph:
        """基于链路和环链路径构建布局图."""
        graph = nx.Graph()
        graph.add_nodes_from(self.node_names)
        for row in self.links:
            src = str(row.get("Src NE Name", "")).strip()
            sink = str(row.get("Sink NE Name", "")).strip()
            if src in self.node_set and sink in self.node_set:
                graph.add_edge(src, sink, weight=1.0)
        for row in self.ring_chains:
            members = self._valid_members(row)
            for index in range(1, len(members)):
                graph.add_edge(members[index - 1], members[index], weight=2.0)
        return graph

    def _has_ring_chain_paths(self) -> bool:
        """判断是否存在可用环链路径."""
        return any(len(self._valid_members(row)) >= 2 for row in self.ring_chains)

    def _ring_chain_first_layout(self, graph: nx.Graph) -> Dict[str, np.ndarray]:
        """环链优先布局：先保留路径结构，再用轻量力导向调整剩余节点."""
        pos: Dict[str, np.ndarray] = {}
        groups = self._group_ring_chains()
        group_boxes = self._component_boxes(max(len(groups), 1))

        for box, rows in zip(group_boxes, groups.values()):
            self._place_group(box, rows, pos)

        remaining = [name for name in self.node_names if name not in pos]
        if remaining:
            self._place_remaining_components(graph, remaining, pos)

        fixed = set(pos.keys())
        if graph.number_of_edges() and len(graph) > 2:
            try:
                refined = nx.spring_layout(
                    graph,
                    pos={name: pos[name] for name in fixed},
                    fixed=list(fixed) if len(fixed) < len(graph) else None,
                    seed=42,
                    k=1.0 / math.sqrt(max(len(graph), 1)),
                    iterations=60,
                    weight="weight",
                )
                pos.update({name: np.array(value) for name, value in refined.items()})
            except (nx.NetworkXException, ValueError):
                pass
        return pos

    def _networkx_layout(self, graph: nx.Graph) -> Dict[str, np.ndarray]:
        """无环链路径时使用 NetworkX 布局."""
        if len(graph) <= 1:
            return {name: np.array([0.0, 0.0]) for name in graph.nodes}
        if len(graph) <= 300:
            try:
                return {name: np.array(value) for name, value in nx.kamada_kawai_layout(graph).items()}
            except (nx.NetworkXException, ValueError):
                pass
        return {
            name: np.array(value)
            for name, value in nx.spring_layout(graph, seed=42, iterations=120).items()
        }

    def _group_ring_chains(self) -> Dict[str, List[Dict[str, Any]]]:
        """按业务聚合字段组织环链组件."""
        groups: Dict[str, List[Dict[str, Any]]] = {}
        for row in self.ring_chains:
            members = self._valid_members(row)
            if len(members) < 2:
                continue
            key = (
                str(row.get("Belong_agg", "")).strip()
                or str(row.get("Uplink_pair", "")).strip()
                or str(row.get("Root1", "")).strip() + "***" + str(row.get("Root2", "")).strip()
                or str(row.get("Name", "")).strip()
            )
            groups.setdefault(key, []).append(row)
        return groups

    def _component_boxes(self, count: int) -> List[Tuple[float, float, float, float]]:
        """根据画布尺寸生成组件布局盒."""
        columns = max(1, math.ceil(math.sqrt(count * self.canvas_width / self.canvas_height)))
        rows = max(1, math.ceil(count / columns))
        box_width = self.canvas_width / columns
        box_height = self.canvas_height / rows
        boxes = []
        for index in range(count):
            row = index // columns
            column = index % columns
            boxes.append((column * box_width, row * box_height, box_width, box_height))
        return boxes

    def _place_group(
        self,
        box: Tuple[float, float, float, float],
        rows: List[Dict[str, Any]],
        pos: Dict[str, np.ndarray],
    ) -> None:
        """在组件盒内放置环和链."""
        x0, y0, width, height = box
        center_x = x0 + width / 2
        center_y = y0 + height / 2
        lane_count = max(1, len(rows))
        lane_gap = height / (lane_count + 1)

        for index, row in enumerate(rows):
            members = self._valid_members(row)
            if not members:
                continue
            category = str(row.get("Category", "")).lower()
            if category == "ring" and len(members) >= 3:
                radius_x = max(60.0, width * 0.34 * (1 - index * 0.04))
                radius_y = max(45.0, height * 0.28 * (1 - index * 0.04))
                for member_index, member in enumerate(members):
                    angle = 2 * math.pi * member_index / len(members) - math.pi / 2
                    pos.setdefault(
                        member,
                        np.array([center_x + radius_x * math.cos(angle), center_y + radius_y * math.sin(angle)]),
                    )
            else:
                y = y0 + lane_gap * (index + 1)
                start_x = x0 + width * 0.16
                step = width * 0.68 / max(len(members) - 1, 1)
                for member_index, member in enumerate(members):
                    pos.setdefault(member, np.array([start_x + step * member_index, y]))

    def _place_remaining_components(
        self,
        graph: nx.Graph,
        remaining: List[str],
        pos: Dict[str, np.ndarray],
    ) -> None:
        """将未被环链覆盖的节点按连通组件铺排."""
        subgraph = graph.subgraph(remaining)
        components = [list(item) for item in nx.connected_components(subgraph)] if len(subgraph) else [remaining]
        boxes = self._component_boxes(len(components))
        for box, component in zip(boxes, components):
            x0, y0, width, height = box
            columns = max(1, math.ceil(math.sqrt(len(component))))
            for index, node in enumerate(sorted(component)):
                row = index // columns
                column = index % columns
                x = x0 + width * (column + 1) / (columns + 1)
                y = y0 + height * (row + 1) / (math.ceil(len(component) / columns) + 1)
                pos.setdefault(node, np.array([x, y]))

    def _resolve_node_overlap(self, pos: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """按画布尺寸自适应消除节点重叠."""
        if len(pos) < 2:
            return pos
        min_distance = max(26.0, min(self.canvas_width, self.canvas_height) / math.sqrt(len(pos)) * 0.22)
        nodes = list(pos.keys())
        for _ in range(8):
            moved = False
            for i, node_a in enumerate(nodes):
                for node_b in nodes[i + 1:]:
                    diff = pos[node_a] - pos[node_b]
                    distance = float(np.linalg.norm(diff))
                    if 0 < distance < min_distance:
                        offset = (min_distance - distance) / 2
                        direction = diff / distance
                        pos[node_a] = pos[node_a] + direction * offset
                        pos[node_b] = pos[node_b] - direction * offset
                        moved = True
            if not moved:
                break
        return pos

    def _normalize_to_canvas(self, pos: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """将任意布局坐标映射到目标画布."""
        if not pos:
            return {}
        values = np.array(list(pos.values()))
        min_x, min_y = values.min(axis=0)
        max_x, max_y = values.max(axis=0)
        padding = max(48.0, min(self.canvas_width, self.canvas_height) * 0.06)
        range_x = max(float(max_x - min_x), 1.0)
        range_y = max(float(max_y - min_y), 1.0)
        scale = min((self.canvas_width - 2 * padding) / range_x, (self.canvas_height - 2 * padding) / range_y)
        offset_x = padding + (self.canvas_width - 2 * padding - range_x * scale) / 2
        offset_y = padding + (self.canvas_height - 2 * padding - range_y * scale) / 2
        return {
            name: np.array([offset_x + (value[0] - min_x) * scale, offset_y + (value[1] - min_y) * scale])
            for name, value in pos.items()
        }

    def _valid_members(self, row: Dict[str, Any]) -> List[str]:
        """解析 Member_path 中存在于网元表的成员."""
        members = [item.strip() for item in str(row.get("Member_path", "")).split("->") if item.strip()]
        return [item for item in members if item in self.node_set]

    def _device_items(self) -> List[Tuple[str, Dict[str, Any]]]:
        """返回网元名和原始记录."""
        return [(str(row.get("NE Name", "")).strip(), row) for row in self.devices if row.get("NE Name")]

