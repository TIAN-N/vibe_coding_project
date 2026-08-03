#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import argparse
from pathlib import Path
from typing import Any, Dict, List

import matplotlib
import networkx as nx
import numpy as np
import pandas as pd
matplotlib.use("Agg")
from matplotlib import pyplot as plt

from algo.layout.logic_layout import LogicLayoutEngine


def load_table(file_path: str) -> List[Dict[str, Any]]:
    """从 CSV 或 Excel 文件读取表记录.

    Args:
        file_path: 待读取的网元表或链路表路径.

    Returns:
        以字典表示的表记录列表.

    Raises:
        FileNotFoundError: 文件不存在.
        ValueError: 文件格式不受支持.
    """
    path = Path(file_path).expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(f"文件不存在: {path}")

    suffix = path.suffix.lower()
    if suffix == ".csv":
        data_frame = pd.read_csv(path)
    elif suffix in {".xlsx", ".xls"}:
        data_frame = pd.read_excel(path)
    else:
        raise ValueError(f"仅支持 CSV/XLSX/XLS 文件: {path}")
    normalized = data_frame.replace({np.nan: None})
    return normalized.to_dict("records")


def render_logic_topology(
    device_file: str,
    link_file: str,
    output_file: str,
    canvas_width: float = 1400.0,
    canvas_height: float = 900.0,
    node_limit: int = 500,
) -> Dict[str, Any]:
    """使用通用布局引擎将网元表和链路表渲染为 PNG.

    Args:
        device_file: 网元表文件路径，必须包含 ``NE Name``.
        link_file: 链路表文件路径，必须包含 ``Src NE Name`` 和 ``Sink NE Name``.
        output_file: PNG 输出路径.
        canvas_width: PNG 与逻辑 Canvas 的宽度.
        canvas_height: PNG 与逻辑 Canvas 的高度.
        node_limit: 最大可布局节点数量.

    Returns:
        布局引擎结果，并附带绝对 PNG 输出路径.

    Raises:
        ValueError: 输入字段不完整或节点数超过限制.
    """
    devices = load_table(device_file)
    links = load_table(link_file)
    _validate_columns(devices, links)

    engine = LogicLayoutEngine(
        devices,
        links,
        canvas_width,
        canvas_height,
        node_limit,
    )
    result = engine.compute()
    if not result["layout_available"]:
        raise ValueError(str(result.get("reason", "逻辑布局不可用")))

    output_path = Path(output_file).expanduser().resolve()
    if output_path.suffix.lower() != ".png":
        raise ValueError("输出文件必须使用 .png 扩展名")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    _draw_png(result, links, output_path)
    result["output_file"] = str(output_path)
    return result


def _validate_columns(
    devices: List[Dict[str, Any]],
    links: List[Dict[str, Any]],
) -> None:
    """校验逻辑布局依赖的必要字段."""
    device_fields = set(devices[0]) if devices else set()
    link_fields = set(links[0]) if links else set()
    if "NE Name" not in device_fields:
        raise ValueError("网元表缺少必需列: NE Name")
    missing_link_fields = {"Src NE Name", "Sink NE Name"} - link_fields
    if missing_link_fields:
        missing = ", ".join(sorted(missing_link_fields))
        raise ValueError(f"链路表缺少必需列: {missing}")


def _draw_png(
    result: Dict[str, Any],
    links: List[Dict[str, Any]],
    output_path: Path,
) -> None:
    """按布局引擎返回的 Canvas 坐标绘制 PNG."""
    canvas = result["canvas"]
    width = float(canvas["width"])
    height = float(canvas["height"])
    positions = {
        str(node["id"]): np.array([float(node["x"]), float(node["y"])])
        for node in result["nodes"]
    }
    graph = nx.Graph()
    graph.add_nodes_from(positions)
    for row in links:
        src = str(row.get("Src NE Name", "")).strip()
        sink = str(row.get("Sink NE Name", "")).strip()
        if src in positions and sink in positions and src != sink:
            graph.add_edge(src, sink)

    dpi = 120
    figure, axes = plt.subplots(figsize=(width / dpi, height / dpi), dpi=dpi)
    axes.set_facecolor("white")
    figure.patch.set_facecolor("white")
    nx.draw_networkx_edges(
        graph,
        positions,
        ax=axes,
        width=_edge_width(len(graph)),
        edge_color="#8a99a8",
        alpha=0.72,
    )

    roles = {str(node["id"]): str(node.get("role", "")).lower() for node in result["nodes"]}
    _draw_role_nodes(graph, positions, roles, axes, "asg", "s", "#f59e0b")
    _draw_role_nodes(graph, positions, roles, axes, "csg", "^", "#7b8794")
    other_nodes = [name for name in graph if roles.get(name) not in {"asg", "csg"}]
    if other_nodes:
        nx.draw_networkx_nodes(
            graph,
            positions,
            nodelist=other_nodes,
            node_shape="o",
            node_color="#d1495b",
            edgecolors="#44515e",
            linewidths=0.6,
            node_size=_node_size(len(graph)),
            ax=axes,
        )

    label_positions = {
        name: np.array([value[0], value[1] + _label_offset(len(graph))])
        for name, value in positions.items()
    }
    nx.draw_networkx_labels(
        graph,
        label_positions,
        ax=axes,
        font_size=_font_size(len(graph)),
        font_color="#263442",
    )
    axes.set_xlim(0.0, width)
    axes.set_ylim(height, 0.0)
    axes.set_axis_off()
    figure.subplots_adjust(left=0.0, right=1.0, top=1.0, bottom=0.0)
    figure.savefig(output_path, dpi=dpi, facecolor="white", pad_inches=0)
    plt.close(figure)


def _draw_role_nodes(
    graph: nx.Graph,
    positions: Dict[str, np.ndarray],
    roles: Dict[str, str],
    axes: Any,
    role: str,
    shape: str,
    color: str,
) -> None:
    """绘制指定角色的节点集合."""
    nodes = [name for name in graph if roles.get(name) == role]
    if not nodes:
        return
    nx.draw_networkx_nodes(
        graph,
        positions,
        nodelist=nodes,
        node_shape=shape,
        node_color=color,
        edgecolors="#44515e",
        linewidths=0.6,
        node_size=_node_size(len(graph)),
        ax=axes,
    )


def _node_size(node_count: int) -> float:
    """按节点数量计算 PNG 节点面积."""
    return max(22.0, min(240.0, 1450.0 / max(np.sqrt(node_count), 1.0)))


def _edge_width(node_count: int) -> float:
    """按节点数量计算 PNG 链路宽度."""
    return max(0.25, min(1.4, 8.0 / max(np.sqrt(node_count), 1.0)))


def _font_size(node_count: int) -> float:
    """按节点数量计算 PNG 标签字号."""
    return max(2.2, min(8.0, 34.0 / max(np.sqrt(node_count), 1.0)))


def _label_offset(node_count: int) -> float:
    """按节点数量计算 PNG 标签纵向偏移."""
    return max(8.0, min(18.0, 80.0 / max(np.sqrt(node_count), 1.0)))


def parse_args() -> argparse.Namespace:
    """解析命令行参数."""
    parser = argparse.ArgumentParser(description="生成 NetworkX 逻辑拓扑 PNG")
    parser.add_argument("--device-file", required=True, help="网元表 CSV/XLSX 路径")
    parser.add_argument("--link-file", required=True, help="链路表 CSV/XLSX 路径")
    parser.add_argument("--output-file", required=True, help="PNG 输出路径")
    parser.add_argument("--canvas-width", type=float, default=1400.0, help="Canvas 宽度")
    parser.add_argument("--canvas-height", type=float, default=900.0, help="Canvas 高度")
    return parser.parse_args()


def main() -> None:
    """执行文件路径到 PNG 的逻辑拓扑预览流程."""
    args = parse_args()
    result = render_logic_topology(
        args.device_file,
        args.link_file,
        args.output_file,
        args.canvas_width,
        args.canvas_height,
    )
    print(
        "逻辑拓扑已生成: {} ({} 个节点, {} 条链路, {})".format(
            result["output_file"],
            result["node_count"],
            result["edge_count"],
            result["algorithm"],
        )
    )


if __name__ == "__main__":
    main()
