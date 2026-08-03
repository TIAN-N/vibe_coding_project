#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import argparse
import asyncio
import json
from typing import Any, Dict

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


async def apply_control(url: str, version_id: str, region: str) -> Dict[str, Any]:
    """通过 MCP 协议下发逻辑视图过滤命令并等待浏览器回执.

    Args:
        url: MCP Streamable HTTP 地址.
        version_id: 目标拓扑版本.
        region: Region 精确匹配值.

    Returns:
        MCP 工具结构化结果.
    """
    async with streamable_http_client(url) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            result = await session.call_tool(
                "apply_visualization",
                {
                    "target": "active",
                    "version_id": version_id,
                    "view": "logic",
                    "clear_filter": True,
                    "clear_highlight": True,
                    "clear_locate": True,
                    "filter_spec": {
                        "source": "nodes",
                        "mode": "all",
                        "conditions": [{"field": "Region", "op": "eq", "value": region}],
                    },
                    "wait_for_render": True,
                    "timeout_seconds": 30,
                },
            )
            if result.isError:
                raise RuntimeError("MCP 可视化工具调用失败: {}".format(result.content))
            structured = result.structuredContent or {}
            value = structured.get("result", structured)
            if value.get("status") != "rendered":
                raise RuntimeError("浏览器未完成渲染: {}".format(value))
            return value


def main() -> None:
    """解析参数并执行 MCP 控制链路测试."""
    parser = argparse.ArgumentParser(description="Topology MCP browser control test")
    parser.add_argument("--url", required=True)
    parser.add_argument("--version-id", required=True)
    parser.add_argument("--region", required=True)
    args = parser.parse_args()
    result = asyncio.run(apply_control(args.url, args.version_id, args.region))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
