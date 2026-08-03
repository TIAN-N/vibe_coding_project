#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import argparse
import asyncio
import json
from typing import Any, Dict

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


EXPECTED_TOOLS = {
    "get_visualization_context",
    "list_topology_versions",
    "inspect_topology_field",
    "apply_visualization",
    "clear_visualization",
    "wait_for_visualization",
}


async def run_smoke_test(url: str) -> Dict[str, Any]:
    """通过 Streamable HTTP 验证 MCP 初始化、工具发现和 REST 桥接.

    Args:
        url: MCP Streamable HTTP 完整地址.

    Returns:
        工具列表和基础调用结果摘要.
    """
    async with streamable_http_client(url) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            tools_result = await session.list_tools()
            tool_names = {tool.name for tool in tools_result.tools}
            missing = EXPECTED_TOOLS - tool_names
            if missing:
                raise RuntimeError("缺少 MCP 工具: {}".format(sorted(missing)))

            versions_result = await session.call_tool("list_topology_versions", {})
            context_result = await session.call_tool(
                "get_visualization_context", {"target": "active"}
            )
            if versions_result.isError:
                raise RuntimeError("版本工具调用失败: {}".format(versions_result.content))
            if context_result.isError:
                raise RuntimeError("上下文工具调用失败: {}".format(context_result.content))
            return {
                "tools": sorted(tool_names),
                "version_call_ok": True,
                "context_call_ok": True,
            }


def main() -> None:
    """解析命令行并执行 MCP 冒烟测试."""
    parser = argparse.ArgumentParser(description="Topology MCP Bridge smoke test")
    parser.add_argument("--url", default="http://127.0.0.1:8013/mcp")
    args = parser.parse_args()
    result = asyncio.run(run_smoke_test(args.url))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
