#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from copy import deepcopy
import re
from typing import Any, Dict, List


SUPPORTED_SOURCES = {"nodes", "links", "ringChains"}
SUPPORTED_VIEWS = {"gis", "logic"}
SUPPORTED_OPERATIONS = {
    "switch_version",
    "switch_view",
    "set_filter",
    "clear_filter",
    "set_highlight",
    "clear_highlight",
    "locate",
    "clear_locate",
    "clear_visualization",
    "set_node_style_rules",
    "clear_node_style_rules",
    "set_link_style_rules",
    "clear_link_style_rules",
}


def default_ui_state(version_id: str = "") -> Dict[str, Any]:
    """创建浏览器可视化状态初始值.

    Args:
        version_id: 初始数据版本标识.

    Returns:
        可被前端直接投影的状态字典.
    """
    return {
        "version_id": version_id,
        "view": "gis",
        "filter": None,
        "highlight": None,
        "locate": None,
        "highlight_contrast": 0.72,
        "node_style_rules": [],
        "link_style_rules": [],
    }


def reduce_ui_state(current: Dict[str, Any], operations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """按顺序原子应用一组可视化操作.

    Args:
        current: 当前可视化状态.
        operations: 标准操作列表.

    Returns:
        应用全部操作后的新状态.

    Raises:
        ValueError: 操作名称或参数不合法.
    """
    state = default_ui_state()
    state.update(deepcopy(current or {}))
    for operation in operations:
        op = str(operation.get("op", ""))
        if op not in SUPPORTED_OPERATIONS:
            raise ValueError("不支持的可视化操作: {}".format(op))
        if op == "switch_version":
            version_id = str(operation.get("version_id") or "").strip()
            if not version_id:
                raise ValueError("switch_version 必须提供 version_id")
            state["version_id"] = version_id
        elif op == "switch_view":
            view = str(operation.get("view") or "")
            if view not in SUPPORTED_VIEWS:
                raise ValueError("view 仅支持 gis 或 logic")
            state["view"] = view
        elif op == "set_filter":
            state["filter"] = _condition_group(operation)
        elif op == "clear_filter":
            state["filter"] = None
        elif op == "set_highlight":
            state["highlight"] = _condition_group(operation)
            contrast = operation.get("contrast")
            if contrast is not None:
                value = float(contrast)
                if value < 0 or value > 1:
                    raise ValueError("highlight contrast 必须在 0 到 1 之间")
                state["highlight_contrast"] = value
        elif op == "clear_highlight":
            state["highlight"] = None
        elif op == "locate":
            state["locate"] = _condition_group(operation)
        elif op == "clear_locate":
            state["locate"] = None
        elif op == "clear_visualization":
            state["filter"] = None
            state["highlight"] = None
            state["locate"] = None
        elif op == "set_node_style_rules":
            state["node_style_rules"] = _node_style_rules(operation.get("rules"))
        elif op == "clear_node_style_rules":
            state["node_style_rules"] = []
        elif op == "set_link_style_rules":
            state["link_style_rules"] = _link_style_rules(operation.get("rules"))
        elif op == "clear_link_style_rules":
            state["link_style_rules"] = []
    return state


def _condition_group(operation: Dict[str, Any]) -> Dict[str, Any]:
    """校验并提取操作中的条件组."""
    source = str(operation.get("source") or "nodes")
    mode = str(operation.get("mode") or "all")
    conditions = operation.get("conditions") or []
    if source not in SUPPORTED_SOURCES:
        raise ValueError("source 仅支持 nodes、links 或 ringChains")
    if mode not in {"all", "any"}:
        raise ValueError("mode 仅支持 all 或 any")
    if not isinstance(conditions, list) or not conditions:
        raise ValueError("条件操作必须至少包含一条 conditions")
    normalized = []
    for condition in conditions:
        field = str(condition.get("field") or "").strip()
        if not field:
            raise ValueError("condition.field 不能为空")
        normalized.append({
            "field": field,
            "op": str(condition.get("op") or "contains"),
            "value": condition.get("value", ""),
        })
    return {"source": source, "mode": mode, "conditions": normalized}


def _node_style_rules(rules: Any) -> List[Dict[str, Any]]:
    """校验并标准化网元样式规则."""
    if not isinstance(rules, list):
        raise ValueError("set_node_style_rules.rules 必须是数组")
    normalized = []
    for rule in rules:
        group = _condition_group(rule)
        size = float(rule.get("size", 10))
        if size < 4 or size > 40:
            raise ValueError("网元样式 size 必须在 4 到 40 之间")
        shape = str(rule.get("shape") or "circle")
        if shape not in {"circle", "square", "diamond", "triangle"}:
            raise ValueError("网元样式 shape 不合法")
        normalized.append({
            **group,
            "color": _color(rule.get("color"), "网元样式"),
            "size": size,
            "shape": shape,
            "label": str(rule.get("label") or ""),
        })
    return normalized


def _link_style_rules(rules: Any) -> List[Dict[str, Any]]:
    """校验并标准化链路样式规则."""
    if not isinstance(rules, list):
        raise ValueError("set_link_style_rules.rules 必须是数组")
    normalized = []
    for rule in rules:
        group = _condition_group(rule)
        line_style = str(rule.get("line_style") or rule.get("lineStyle") or "solid")
        width = str(rule.get("width") or "medium")
        if line_style not in {"solid", "dash", "dot"}:
            raise ValueError("链路样式 line_style 不合法")
        if width not in {"thin", "medium", "thick"}:
            raise ValueError("链路样式 width 不合法")
        normalized.append({
            **group,
            "color": _color(rule.get("color"), "链路样式"),
            "line_style": line_style,
            "width": width,
        })
    return normalized


def _color(value: Any, name: str) -> str:
    """校验六位十六进制颜色."""
    color = str(value or "")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", color):
        raise ValueError("{} color 必须是 #RRGGBB".format(name))
    return color.lower()
