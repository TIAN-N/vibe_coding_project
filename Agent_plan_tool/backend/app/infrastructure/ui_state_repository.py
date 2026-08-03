#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.db.database import fetch_all, fetch_one, get_connection


def utc_now() -> str:
    """返回可排序的毫秒级本地时间字符串."""
    return datetime.now().isoformat(timespec="milliseconds")


def live_cutoff(seconds: int = 45) -> str:
    """计算活跃浏览器会话的最早心跳时间."""
    return (datetime.now() - timedelta(seconds=seconds)).isoformat(timespec="milliseconds")


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """按会话标识查询浏览器会话."""
    return fetch_one("SELECT * FROM ui_sessions WHERE id = ?", (session_id,))


def get_session_by_client(client_id: str) -> Optional[Dict[str, Any]]:
    """按浏览器稳定客户端标识查询会话."""
    return fetch_one("SELECT * FROM ui_sessions WHERE client_id = ?", (client_id,))


def list_sessions() -> List[Dict[str, Any]]:
    """列出浏览器会话，最近活跃者优先."""
    return fetch_all(
        "SELECT * FROM ui_sessions ORDER BY is_focused DESC, last_seen_at DESC"
    )


def resolve_active_session(target: str = "active") -> Optional[Dict[str, Any]]:
    """解析显式会话或最近聚焦的活跃页面."""
    cutoff = live_cutoff()
    if target and target != "active":
        return fetch_one(
            "SELECT * FROM ui_sessions WHERE id = ? AND status = 'online' AND last_seen_at >= ?",
            (target, cutoff),
        )
    return fetch_one(
        """
        SELECT * FROM ui_sessions
        WHERE status = 'online' AND last_seen_at >= ?
        ORDER BY is_focused DESC, last_seen_at DESC
        LIMIT 1
        """,
        (cutoff,),
    )


def decode_state(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """把 ui_states 数据库行转换为接口状态."""
    if not row:
        return None
    return {
        "session_id": row["session_id"],
        "revision": int(row["revision"]),
        "state": json.loads(row["state_json"]),
        "source": row["source"],
        "command_id": row["last_command_id"],
        "updated_at": row["updated_at"],
    }


def get_state(session_id: str) -> Optional[Dict[str, Any]]:
    """读取会话的期望可视化状态."""
    return decode_state(fetch_one("SELECT * FROM ui_states WHERE session_id = ?", (session_id,)))


def get_command(command_id: str) -> Optional[Dict[str, Any]]:
    """读取命令及其渲染结果."""
    row = fetch_one("SELECT * FROM ui_commands WHERE id = ?", (command_id,))
    return decode_command(row)


def get_command_by_request_id(request_id: str) -> Optional[Dict[str, Any]]:
    """按幂等请求标识读取命令."""
    row = fetch_one("SELECT * FROM ui_commands WHERE request_id = ?", (request_id,))
    return decode_command(row)


def decode_command(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """把命令数据库行转换为接口对象."""
    if not row:
        return None
    result = dict(row)
    result["operations"] = json.loads(result.pop("operations_json"))
    result_json = result.pop("result_json")
    result["result"] = json.loads(result_json) if result_json else None
    return result


def latest_waiting_command() -> Optional[Dict[str, Any]]:
    """读取最新一条等待浏览器接收的命令."""
    row = fetch_one(
        "SELECT * FROM ui_commands WHERE status = 'waiting_for_browser' ORDER BY created_at DESC LIMIT 1"
    )
    return decode_command(row)
