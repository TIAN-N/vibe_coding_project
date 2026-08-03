#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import asyncio
import os
import time
from typing import Any, Dict, List, Optional

import httpx
from mcp.server.fastmcp import FastMCP


API_BASE_URL = os.getenv("TOPO_API_BASE_URL", "http://127.0.0.1:8011").rstrip("/")
MCP_HOST = os.getenv("TOPO_MCP_HOST", "127.0.0.1")
MCP_PORT = int(os.getenv("TOPO_MCP_PORT", "8013"))

mcp = FastMCP(
    "Topology Visualization Control",
    instructions=(
        "用于控制已打开的拓扑可视化网页。调用可视化工具前，先读取上下文和数据字段；"
        "默认 target=active，表示最近聚焦且在线的浏览器页面。"
    ),
    host=MCP_HOST,
    port=MCP_PORT,
    streamable_http_path="/mcp",
    stateless_http=True,
    json_response=True,
)


@mcp.tool()
async def get_visualization_context(target: str = "active") -> Dict[str, Any]:
    """读取浏览器会话、当前版本、视图、过滤、高亮、定位状态和可用操作."""
    capabilities, state = await asyncio.gather(
        _request("GET", "/api/v1/ui/capabilities"),
        _request("GET", "/api/v1/ui/state", params={"target": target}),
    )
    return {"target": target, "state": state, "capabilities": capabilities}


@mcp.tool()
async def list_topology_versions() -> List[Dict[str, Any]]:
    """列出数据库中可切换的拓扑数据版本，最近解析的版本排在前面."""
    return await _request("GET", "/api/v1/versions")


@mcp.tool()
async def inspect_topology_field(
    version_id: str,
    source: str = "nodes",
    field: str = "",
    query: str = "",
    limit: int = 100,
) -> Dict[str, Any]:
    """查看版本字段；提供 field 时返回候选值，用于构造准确的过滤条件."""
    if not field:
        return await _request("GET", "/api/v1/ui/data-schema/{}".format(version_id))
    return await _request(
        "GET",
        "/api/v1/ui/field-values/{}".format(version_id),
        params={"source": source, "field": field, "q": query, "limit": limit},
    )


@mcp.tool()
async def apply_visualization(
    target: str = "active",
    version_id: Optional[str] = None,
    view: Optional[str] = None,
    filter_spec: Optional[Dict[str, Any]] = None,
    highlight_spec: Optional[Dict[str, Any]] = None,
    locate_spec: Optional[Dict[str, Any]] = None,
    node_style_rules: Optional[List[Dict[str, Any]]] = None,
    link_style_rules: Optional[List[Dict[str, Any]]] = None,
    clear_filter: bool = False,
    clear_highlight: bool = False,
    clear_locate: bool = False,
    clear_node_styles: bool = False,
    clear_link_styles: bool = False,
    wait_for_render: bool = True,
    timeout_seconds: float = 30.0,
) -> Dict[str, Any]:
    """原子应用版本、视图、过滤、高亮、定位和样式，并等待网页渲染完成."""
    operations: List[Dict[str, Any]] = []
    if version_id:
        operations.append({"op": "switch_version", "version_id": version_id})
    if view:
        operations.append({"op": "switch_view", "view": view})
    if clear_filter:
        operations.append({"op": "clear_filter"})
    if clear_highlight:
        operations.append({"op": "clear_highlight"})
    if clear_locate:
        operations.append({"op": "clear_locate"})
    if clear_node_styles:
        operations.append({"op": "clear_node_style_rules"})
    if clear_link_styles:
        operations.append({"op": "clear_link_style_rules"})
    if filter_spec:
        operations.append(_condition_operation("set_filter", filter_spec))
    if highlight_spec:
        operations.append(_condition_operation("set_highlight", highlight_spec))
    if locate_spec:
        operations.append(_condition_operation("locate", locate_spec))
    if node_style_rules is not None:
        operations.append({"op": "set_node_style_rules", "rules": node_style_rules})
    if link_style_rules is not None:
        operations.append({"op": "set_link_style_rules", "rules": link_style_rules})
    if not operations:
        raise ValueError("至少提供一个版本、视图、条件或清除操作")

    command = await _request(
        "POST",
        "/api/v1/ui/commands",
        json_body={
            "target": target,
            "requested_by": "mcp",
            "operations": operations,
        },
    )
    if wait_for_render:
        return await _wait_for_command(command["id"], timeout_seconds)
    return command


@mcp.tool()
async def clear_visualization(
    target: str = "active",
    clear_filter: bool = True,
    clear_highlight: bool = True,
    clear_locate: bool = True,
    wait_for_render: bool = True,
    timeout_seconds: float = 30.0,
) -> Dict[str, Any]:
    """清除当前网页中的过滤、高亮和定位状态，可选择只清除其中一类."""
    if clear_filter and clear_highlight and clear_locate:
        operations = [{"op": "clear_visualization"}]
    else:
        operations = []
        if clear_filter:
            operations.append({"op": "clear_filter"})
        if clear_highlight:
            operations.append({"op": "clear_highlight"})
        if clear_locate:
            operations.append({"op": "clear_locate"})
    if not operations:
        raise ValueError("至少选择一种需要清除的可视化状态")
    command = await _request(
        "POST",
        "/api/v1/ui/commands",
        json_body={"target": target, "requested_by": "mcp", "operations": operations},
    )
    if wait_for_render:
        return await _wait_for_command(command["id"], timeout_seconds)
    return command


@mcp.tool()
async def wait_for_visualization(
    command_id: str,
    timeout_seconds: float = 30.0,
) -> Dict[str, Any]:
    """等待指定可视化命令被浏览器实际渲染，返回节点链路数量和布局结果."""
    return await _wait_for_command(command_id, timeout_seconds)


def _condition_operation(op: str, spec: Dict[str, Any]) -> Dict[str, Any]:
    """把 MCP 条件参数转换为 REST 命令操作."""
    operation = {
        "op": op,
        "source": spec.get("source", "nodes"),
        "mode": spec.get("mode", "all"),
        "conditions": spec.get("conditions") or [],
    }
    if op == "set_highlight" and spec.get("contrast") is not None:
        operation["contrast"] = spec["contrast"]
    return operation


async def _wait_for_command(command_id: str, timeout_seconds: float) -> Dict[str, Any]:
    """轮询 REST 命令状态直到浏览器回执或超时."""
    deadline = time.monotonic() + max(0.1, min(float(timeout_seconds), 120.0))
    while True:
        command = await _request("GET", "/api/v1/ui/commands/{}".format(command_id))
        if command.get("status") in {"rendered", "failed", "superseded"}:
            return command
        if time.monotonic() >= deadline:
            return {
                **command,
                "wait_timed_out": True,
                "hint": "命令仍在等待网页。请打开或聚焦拓扑页面后再次调用 wait_for_visualization。",
            }
        await asyncio.sleep(0.25)


async def _request(
    method: str,
    path: str,
    params: Optional[Dict[str, Any]] = None,
    json_body: Optional[Dict[str, Any]] = None,
) -> Any:
    """调用 REST 业务内核并解包统一响应."""
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=35.0) as client:
        response = await client.request(method, path, params=params, json=json_body)
    try:
        payload = response.json()
    except ValueError as error:
        raise RuntimeError("拓扑服务返回非 JSON 内容: HTTP {}".format(response.status_code)) from error
    if not response.is_success or not payload.get("success"):
        message = payload.get("detail") or payload.get("message") or response.text
        raise RuntimeError("拓扑服务请求失败 HTTP {}: {}".format(response.status_code, message))
    return payload.get("data")


if __name__ == "__main__":
    transport = os.getenv("TOPO_MCP_TRANSPORT", "streamable-http")
    mcp.run(transport=transport)
