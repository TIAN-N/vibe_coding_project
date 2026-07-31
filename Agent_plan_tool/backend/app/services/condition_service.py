#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict, List, Optional, Set, Tuple

from app.schemas.condition_schema import Condition, ConditionGroup, TopologyAction
from app.services.version_service import split_member_path


def row_value(row: Dict[str, Any], field: str) -> Any:
    """读取行字段值，字段不存在时返回空字符串."""
    return row.get(field, "")


def matches_condition(row: Dict[str, Any], condition: Condition) -> bool:
    """判断单行是否满足单条条件."""
    left = row_value(row, condition.field)
    right = condition.value
    op = condition.op
    left_text = "" if left is None else str(left)
    right_text = "" if right is None else str(right)

    if op == "eq":
        return left_text == right_text
    if op == "neq":
        return left_text != right_text
    if op == "contains":
        return right_text.lower() in left_text.lower()
    if op == "not_contains":
        return right_text.lower() not in left_text.lower()
    if op == "startswith":
        return left_text.startswith(right_text)
    if op == "endswith":
        return left_text.endswith(right_text)
    if op == "in":
        values = {item.strip() for item in right_text.split(",")}
        return left_text in values
    if op == "empty":
        return left_text.strip() == ""
    if op == "not_empty":
        return left_text.strip() != ""
    if op in ["gt", "gte", "lt", "lte"]:
        try:
            left_num = float(left_text)
            right_num = float(right_text)
        except ValueError:
            return False
        if op == "gt":
            return left_num > right_num
        if op == "gte":
            return left_num >= right_num
        if op == "lt":
            return left_num < right_num
        return left_num <= right_num
    return False


def matches_group(row: Dict[str, Any], group: ConditionGroup) -> bool:
    """判断单行是否满足条件组."""
    if not group.conditions:
        return True
    checks = [matches_condition(row, condition) for condition in group.conditions]
    return all(checks) if group.mode == "all" else any(checks)


def edge_key(src: str, sink: str) -> str:
    """生成无向链路键."""
    a = str(src).strip()
    b = str(sink).strip()
    return "|||".join(sorted([a, b]))


def resolve_condition_group(
    group: ConditionGroup,
    devices: List[Dict[str, Any]],
    links: List[Dict[str, Any]],
    ring_chains: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """将任意来源条件组解析为节点、链路、环链和环链路径段集合."""
    device_by_name = {str(row.get("NE Name", "")).strip(): row for row in devices}
    matched_nodes: Set[str] = set()
    matched_links: Set[str] = set()
    matched_ring_chains: Set[int] = set()
    matched_segments: Set[str] = set()

    if group.source == "nodes":
        for row in devices:
            name = str(row.get("NE Name", "")).strip()
            if name and matches_group(row, group):
                matched_nodes.add(name)
        for row in links:
            src = str(row.get("Src NE Name", "")).strip()
            sink = str(row.get("Sink NE Name", "")).strip()
            if src in matched_nodes and sink in matched_nodes:
                matched_links.add(edge_key(src, sink))

    elif group.source == "links":
        for row in links:
            if matches_group(row, group):
                src = str(row.get("Src NE Name", "")).strip()
                sink = str(row.get("Sink NE Name", "")).strip()
                if src:
                    matched_nodes.add(src)
                if sink:
                    matched_nodes.add(sink)
                matched_links.add(edge_key(src, sink))

    else:
        for row in ring_chains:
            if matches_group(row, group):
                row_id = int(row.get("_row_id", 0))
                matched_ring_chains.add(row_id)
                members = split_member_path(str(row.get("Member_path", "")))
                valid_members = [member for member in members if member in device_by_name]
                matched_nodes.update(valid_members)
                for index in range(1, len(valid_members)):
                    segment = edge_key(valid_members[index - 1], valid_members[index])
                    matched_segments.add(segment)
                    matched_links.add(segment)

    return {
        "nodes": matched_nodes,
        "links": matched_links,
        "ringChains": matched_ring_chains,
        "segments": matched_segments,
    }


def apply_topology_actions(
    actions: List[TopologyAction],
    devices: List[Dict[str, Any]],
    links: List[Dict[str, Any]],
    ring_chains: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """执行过滤、高亮、定位三类动作，并返回统一拓扑状态."""
    all_nodes = {str(row.get("NE Name", "")).strip() for row in devices if row.get("NE Name")}
    all_links = {
        edge_key(row.get("Src NE Name", ""), row.get("Sink NE Name", ""))
        for row in links
        if row.get("Src NE Name") and row.get("Sink NE Name")
    }

    visible_nodes = set(all_nodes)
    visible_links = set(all_links)
    highlight_nodes: Set[str] = set()
    highlight_links: Set[str] = set()
    locate_nodes: Set[str] = set()
    locate_links: Set[str] = set()
    visible_ring_chains: Optional[Set[int]] = None
    highlight_contrast = 0.72

    for action in actions:
        group = ConditionGroup(source=action.source, mode=action.mode, conditions=action.conditions)
        resolved = resolve_condition_group(group, devices, links, ring_chains)
        if action.type == "filter":
            visible_nodes = set(resolved["nodes"])
            if action.source == "links":
                visible_links = set(resolved["links"])
            else:
                visible_links = link_keys_with_both_endpoints(links, visible_nodes)
            if action.source == "ringChains":
                visible_ring_chains = set(resolved["ringChains"])
        elif action.type == "highlight":
            highlight_nodes = set(resolved["nodes"]) & visible_nodes
            highlight_links = set(resolved["links"]) & visible_links
            highlight_contrast = action.contrast if action.contrast is not None else 0.72
        elif action.type == "locate":
            locate_nodes = set(resolved["nodes"]) & visible_nodes
            locate_links = set(resolved["links"]) & visible_links

    rendered_devices = [
        row for row in devices if str(row.get("NE Name", "")).strip() in visible_nodes
    ]
    rendered_links = [
        row for row in links
        if edge_key(row.get("Src NE Name", ""), row.get("Sink NE Name", "")) in visible_links
    ]

    return {
        "visibleNodeIds": sorted(visible_nodes),
        "visibleLinkIds": sorted(visible_links),
        "highlightNodeIds": sorted(highlight_nodes),
        "highlightLinkIds": sorted(highlight_links),
        "locateNodeIds": sorted(locate_nodes),
        "locateLinkIds": sorted(locate_links),
        "visibleRingChainRowIds": sorted(visible_ring_chains) if visible_ring_chains is not None else None,
        "highlightContrast": highlight_contrast,
        "devices": rendered_devices,
        "links": rendered_links,
        "ringChains": ring_chains,
    }


def link_keys_with_both_endpoints(links: List[Dict[str, Any]], node_ids: Set[str]) -> Set[str]:
    """返回源宿端均在节点集合内的链路键."""
    result = set()
    for row in links:
        src = str(row.get("Src NE Name", "")).strip()
        sink = str(row.get("Sink NE Name", "")).strip()
        if src in node_ids and sink in node_ids:
            result.add(edge_key(src, sink))
    return result


def first_filter_group(actions: List[TopologyAction]) -> Optional[ConditionGroup]:
    """从动作列表中提取第一个过滤条件组."""
    for action in actions:
        if action.type == "filter":
            return ConditionGroup(source=action.source, mode=action.mode, conditions=action.conditions)
    return None

