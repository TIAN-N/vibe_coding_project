#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import asyncio
import json
import time
from typing import AsyncIterator, Dict

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.application.ui_command_service import (
    UiCommandConflictError,
    acknowledge_command,
    all_sessions,
    get_capabilities,
    get_data_schema,
    get_field_values,
    get_target_state,
    heartbeat_session,
    register_session,
    submit_command,
)
from app.core.response import ok
from app.infrastructure.ui_state_repository import get_command, get_session, get_state
from app.schemas.ui_schema import (
    UiCommandAckRequest,
    UiCommandRequest,
    UiSessionHeartbeatRequest,
    UiSessionRegisterRequest,
)


router = APIRouter()


@router.post("/sessions/register")
def register(request: UiSessionRegisterRequest) -> Dict[str, object]:
    """注册浏览器标签页并领取等待中的最新可视化命令."""
    try:
        return ok(register_session(request.client_id, request.is_focused, request.active_version_id))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.post("/sessions/{session_id}/heartbeat")
def heartbeat(session_id: str, request: UiSessionHeartbeatRequest) -> Dict[str, object]:
    """上报浏览器页面存活、焦点和当前版本."""
    try:
        return ok(heartbeat_session(session_id, request.is_focused, request.active_version_id))
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("/sessions")
def sessions() -> Dict[str, object]:
    """列出可作为显式控制目标的浏览器会话."""
    return ok(all_sessions())


@router.get("/state")
def state(target: str = "active") -> Dict[str, object]:
    """读取目标浏览器页面的权威可视化状态."""
    return ok(get_target_state(target))


@router.post("/commands")
def commands(request: UiCommandRequest) -> Dict[str, object]:
    """提交原子可视化命令；默认控制最近聚焦页面."""
    payload = _model_to_dict(request)
    payload["operations"] = [_model_to_dict(item) for item in request.operations]
    try:
        return ok(submit_command(payload))
    except UiCommandConflictError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/commands/{command_id}")
def command(command_id: str) -> Dict[str, object]:
    """查询命令接收、渲染或失败状态."""
    value = get_command(command_id)
    if not value:
        raise HTTPException(status_code=404, detail="可视化命令不存在")
    return ok(value)


@router.post("/commands/{command_id}/ack")
def command_ack(command_id: str, request: UiCommandAckRequest) -> Dict[str, object]:
    """接收浏览器完成实际渲染后的回执."""
    try:
        return ok(acknowledge_command(command_id, _model_to_dict(request)))
    except UiCommandConflictError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/sessions/{session_id}/events")
async def session_events(
    session_id: str,
    request: Request,
    after_revision: int = Query(0, ge=0),
) -> StreamingResponse:
    """以 SSE 推送期望状态，浏览器重连后可按修订号续传."""
    if not get_session(session_id):
        raise HTTPException(status_code=404, detail="浏览器会话不存在")
    return StreamingResponse(
        _state_event_stream(session_id, request, after_revision),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/capabilities")
def capabilities() -> Dict[str, object]:
    """返回面向 API 与大模型的可视化能力契约."""
    return ok(get_capabilities())


@router.get("/data-schema/{version_id}")
def data_schema(version_id: str) -> Dict[str, object]:
    """返回指定版本可用于条件表达式的字段."""
    try:
        return ok(get_data_schema(version_id))
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.get("/field-values/{version_id}")
def field_values(
    version_id: str,
    source: str,
    field: str,
    q: str = "",
    limit: int = Query(100, ge=1, le=500),
) -> Dict[str, object]:
    """查询字段候选值，降低大模型构造无效条件的概率."""
    try:
        return ok(get_field_values(version_id, source, field, q, limit))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


async def _state_event_stream(
    session_id: str,
    request: Request,
    after_revision: int,
) -> AsyncIterator[str]:
    """轮询轻量 SQLite 状态并转换成 SSE 事件."""
    revision = after_revision
    last_keepalive = time.monotonic()
    while not await request.is_disconnected():
        snapshot = get_state(session_id)
        if snapshot and int(snapshot["revision"]) > revision:
            revision = int(snapshot["revision"])
            yield "id: {}\nevent: ui_state\ndata: {}\n\n".format(
                revision,
                json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")),
            )
            last_keepalive = time.monotonic()
        elif time.monotonic() - last_keepalive >= 15:
            yield ": keepalive\n\n"
            last_keepalive = time.monotonic()
        await asyncio.sleep(0.5)


def _model_to_dict(model: object) -> Dict[str, object]:
    """兼容 Pydantic 1.x 与 2.x 的模型序列化接口."""
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()
