#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict, List

from fastapi import APIRouter

from app.application.ui_command_service import submit_command
from app.core.response import ok
from app.schemas.condition_schema import TopologyQueryRequest
from app.services.topology_service import query_topology
from app.services.view_state_service import clear_view_state, get_view_state, publish_view_state


router = APIRouter()


@router.post("/query")
def query(request: TopologyQueryRequest) -> Dict[str, object]:
    """统一拓扑查询接口，覆盖过滤、高亮、定位."""
    result = query_topology(request)
    if request.apply_to_view:
        result["view_state"] = publish_view_state(
            request.version_id,
            request.view,
            request.actions,
        )
        result["ui_command"] = submit_command({
            "target": "active",
            "requested_by": "legacy-rest-api",
            "operations": _legacy_operations(request),
        })
    return ok(result)


@router.get("/view-state/{version_id}")
def view_state(version_id: str) -> Dict[str, object]:
    """查询指定版本供网页同步的共享控制状态."""
    return ok(get_view_state(version_id))


@router.delete("/view-state/{version_id}")
def clear_published_view_state(version_id: str) -> Dict[str, object]:
    """清空指定版本的共享过滤、高亮和定位动作."""
    legacy_state = clear_view_state(version_id)
    legacy_state["ui_command"] = submit_command({
        "target": "active",
        "requested_by": "legacy-rest-api",
        "operations": [
            {"op": "switch_version", "version_id": version_id},
            {"op": "clear_visualization"},
        ],
    })
    return ok(legacy_state)


def _legacy_operations(request: TopologyQueryRequest) -> List[Dict[str, Any]]:
    """将旧查询动作转换为新的浏览器命令协议."""
    operations: List[Dict[str, Any]] = [
        {"op": "switch_version", "version_id": request.version_id},
        {"op": "switch_view", "view": request.view},
        {"op": "clear_visualization"},
    ]
    action_names = {"filter": "set_filter", "highlight": "set_highlight", "locate": "locate"}
    for action in request.actions:
        value = action.model_dump() if hasattr(action, "model_dump") else action.dict()
        value["op"] = action_names[value.pop("type")]
        operations.append(value)
    return operations
