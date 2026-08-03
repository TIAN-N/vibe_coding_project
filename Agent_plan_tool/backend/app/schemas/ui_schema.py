#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.condition_schema import Condition


class UiSessionRegisterRequest(BaseModel):
    """浏览器页面会话注册请求."""

    client_id: str
    is_focused: bool = True
    active_version_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UiSessionHeartbeatRequest(BaseModel):
    """浏览器页面存活与焦点状态."""

    is_focused: bool = False
    active_version_id: Optional[str] = None


class UiOperation(BaseModel):
    """统一可视化操作模型."""

    op: Literal[
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
    ]
    version_id: Optional[str] = None
    view: Optional[Literal["gis", "logic"]] = None
    source: Literal["nodes", "links", "ringChains"] = "nodes"
    mode: Literal["all", "any"] = "all"
    conditions: List[Condition] = Field(default_factory=list)
    contrast: Optional[float] = None
    rules: List[Dict[str, Any]] = Field(default_factory=list)


class UiCommandRequest(BaseModel):
    """可原子执行的浏览器控制命令."""

    target: str = "active"
    request_id: Optional[str] = None
    expected_revision: Optional[int] = None
    requested_by: str = "api"
    operations: List[UiOperation] = Field(default_factory=list)


class UiCommandAckRequest(BaseModel):
    """浏览器渲染完成回执."""

    session_id: str
    revision: int
    success: bool = True
    result: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
