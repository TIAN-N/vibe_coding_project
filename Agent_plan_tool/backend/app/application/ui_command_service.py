#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
import uuid
from typing import Any, Dict, List, Optional

from app.db.database import get_connection
from app.domain.ui_state import default_ui_state, reduce_ui_state
from app.infrastructure.ui_state_repository import (
    get_command,
    get_command_by_request_id,
    get_session,
    get_session_by_client,
    get_state,
    latest_waiting_command,
    list_sessions,
    resolve_active_session,
    utc_now,
)
from app.services.data_access import get_version_dataset
from app.services.version_service import get_version, list_versions


class UiCommandConflictError(Exception):
    """客户端期望修订号与服务端状态冲突."""


def register_session(
    client_id: str,
    is_focused: bool = True,
    active_version_id: Optional[str] = None,
) -> Dict[str, Any]:
    """注册或恢复一个浏览器页面会话.

    Args:
        client_id: 浏览器标签页保存在 sessionStorage 的稳定标识.
        is_focused: 页面当前是否拥有焦点.
        active_version_id: 页面当前加载的数据版本.

    Returns:
        会话和待投影的权威状态.
    """
    client_id = str(client_id or "").strip()
    if not client_id:
        raise ValueError("client_id 不能为空")
    existing = get_session_by_client(client_id)
    session_id = existing["id"] if existing else uuid.uuid4().hex
    now = utc_now()
    waiting = latest_waiting_command()
    initial_version = active_version_id or _latest_version_id()
    with get_connection() as conn:
        if is_focused:
            conn.execute("UPDATE ui_sessions SET is_focused = 0")
        conn.execute(
            """
            INSERT INTO ui_sessions
            (id, client_id, status, is_focused, active_version_id, created_at, updated_at, last_seen_at)
            VALUES (?, ?, 'online', ?, ?, ?, ?, ?)
            ON CONFLICT(client_id) DO UPDATE SET
                status = 'online',
                is_focused = excluded.is_focused,
                active_version_id = COALESCE(excluded.active_version_id, ui_sessions.active_version_id),
                updated_at = excluded.updated_at,
                last_seen_at = excluded.last_seen_at
            """,
            (session_id, client_id, int(is_focused), active_version_id, now, now, now),
        )
        current_row = conn.execute(
            "SELECT * FROM ui_states WHERE session_id = ?", (session_id,)
        ).fetchone()
        if current_row:
            state = json.loads(current_row["state_json"])
            revision = int(current_row["revision"])
        else:
            state = default_ui_state(initial_version)
            revision = 0

        command_id = current_row["last_command_id"] if current_row else None
        source = current_row["source"] if current_row else "browser"
        if waiting:
            desired = (waiting.get("result") or {}).get("desired_state")
            state = desired or reduce_ui_state(state, waiting["operations"])
            revision += 1
            command_id = waiting["id"]
            source = waiting["requested_by"]
            conn.execute(
                """
                UPDATE ui_commands
                SET status = 'superseded', error_message = '已由更新的等待命令取代'
                WHERE status = 'waiting_for_browser' AND id != ?
                """,
                (command_id,),
            )
            conn.execute(
                """
                UPDATE ui_commands
                SET session_id = ?, status = 'accepted', received_at = ?, result_json = ?
                WHERE id = ?
                """,
                (
                    session_id,
                    now,
                    _json({"desired_state": state, "revision": revision}),
                    command_id,
                ),
            )

        conn.execute(
            """
            INSERT INTO ui_states
            (session_id, revision, state_json, source, last_command_id, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                revision = excluded.revision,
                state_json = excluded.state_json,
                source = excluded.source,
                last_command_id = excluded.last_command_id,
                updated_at = excluded.updated_at
            """,
            (session_id, revision, _json(state), source, command_id, now),
        )
    return {"session": get_session(session_id), "ui_state": get_state(session_id)}


def heartbeat_session(
    session_id: str,
    is_focused: bool = False,
    active_version_id: Optional[str] = None,
) -> Dict[str, Any]:
    """刷新浏览器会话心跳和焦点排序."""
    if not get_session(session_id):
        raise ValueError("浏览器会话不存在")
    now = utc_now()
    with get_connection() as conn:
        if is_focused:
            conn.execute("UPDATE ui_sessions SET is_focused = 0")
        conn.execute(
            """
            UPDATE ui_sessions
            SET status = 'online', is_focused = ?,
                active_version_id = COALESCE(?, active_version_id),
                updated_at = ?, last_seen_at = ?
            WHERE id = ?
            """,
            (int(is_focused), active_version_id, now, now, session_id),
        )
    return {"session": get_session(session_id), "ui_state": get_state(session_id)}


def submit_command(payload: Dict[str, Any]) -> Dict[str, Any]:
    """校验并提交一组原子可视化操作."""
    operations = payload.get("operations") or []
    if not operations:
        raise ValueError("operations 不能为空")
    _validate_versions(operations)
    request_id = str(payload.get("request_id") or uuid.uuid4().hex)
    existing = get_command_by_request_id(request_id)
    if existing:
        return existing
    target = str(payload.get("target") or "active")
    session = resolve_active_session(target)
    now = utc_now()
    command_id = uuid.uuid4().hex
    requested_by = str(payload.get("requested_by") or "api")

    if not session:
        if target != "active":
            raise ValueError("指定浏览器会话不存在或已离线: {}".format(target))
        waiting = latest_waiting_command()
        base = ((waiting or {}).get("result") or {}).get("desired_state") or default_ui_state(_latest_version_id())
        desired = reduce_ui_state(base, operations)
        with get_connection() as conn:
            conn.execute(
                """
                INSERT INTO ui_commands
                (id, request_id, session_id, expected_revision, operations_json, status,
                 requested_by, created_at, result_json)
                VALUES (?, ?, NULL, ?, ?, 'waiting_for_browser', ?, ?, ?)
                """,
                (
                    command_id,
                    request_id,
                    payload.get("expected_revision"),
                    _json(operations),
                    requested_by,
                    now,
                    _json({"desired_state": desired}),
                ),
            )
        return get_command(command_id) or {}

    session_id = session["id"]
    with get_connection() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute(
            "SELECT * FROM ui_states WHERE session_id = ?", (session_id,)
        ).fetchone()
        revision = int(row["revision"]) if row else 0
        expected = payload.get("expected_revision")
        if expected is not None and int(expected) != revision:
            raise UiCommandConflictError(
                "状态修订冲突：期望 {}，当前 {}".format(expected, revision)
            )
        current = json.loads(row["state_json"]) if row else default_ui_state(_latest_version_id())
        desired = reduce_ui_state(current, operations)
        next_revision = revision + 1
        conn.execute(
            """
            INSERT INTO ui_commands
            (id, request_id, session_id, expected_revision, operations_json, status,
             requested_by, created_at, received_at, result_json)
            VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?, ?, ?)
            """,
            (
                command_id,
                request_id,
                session_id,
                expected,
                _json(operations),
                requested_by,
                now,
                now,
                _json({"desired_state": desired, "revision": next_revision}),
            ),
        )
        conn.execute(
            """
            INSERT INTO ui_states
            (session_id, revision, state_json, source, last_command_id, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                revision = excluded.revision,
                state_json = excluded.state_json,
                source = excluded.source,
                last_command_id = excluded.last_command_id,
                updated_at = excluded.updated_at
            """,
            (session_id, next_revision, _json(desired), requested_by, command_id, now),
        )
        conn.execute(
            "UPDATE ui_sessions SET active_version_id = ?, updated_at = ? WHERE id = ?",
            (desired.get("version_id") or None, now, session_id),
        )
    command = get_command(command_id) or {}
    command["ui_state"] = get_state(session_id)
    command["session"] = get_session(session_id)
    return command


def acknowledge_command(command_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """记录浏览器对命令的实际渲染结果."""
    command = get_command(command_id)
    if not command:
        raise ValueError("可视化命令不存在")
    if command.get("session_id") != payload.get("session_id"):
        raise ValueError("回执会话与命令目标不一致")
    command_revision = int((command.get("result") or {}).get("revision", -1))
    if int(payload.get("revision", -1)) != command_revision:
        raise UiCommandConflictError("回执修订号已过期")
    now = utc_now()
    success = bool(payload.get("success", True))
    status = "rendered" if success else "failed"
    result = command.get("result") or {}
    result["render"] = payload.get("result") or {}
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE ui_commands
            SET status = ?, rendered_at = ?, error_message = ?, result_json = ?
            WHERE id = ?
            """,
            (status, now, payload.get("error_message"), _json(result), command_id),
        )
    return get_command(command_id) or {}


def get_target_state(target: str = "active") -> Dict[str, Any]:
    """读取目标浏览器会话的权威状态."""
    session = resolve_active_session(target)
    if not session:
        return {"session": None, "ui_state": None, "status": "waiting_for_browser"}
    return {"session": session, "ui_state": get_state(session["id"]), "status": "online"}


def get_capabilities() -> Dict[str, Any]:
    """返回供大模型规划工具调用的稳定能力描述."""
    return {
        "targeting": {
            "default": "active",
            "description": "active 表示最近聚焦且 45 秒内有心跳的浏览器页面，也可传 session_id",
        },
        "operations": [
            "switch_version", "switch_view", "set_filter", "clear_filter",
            "set_highlight", "clear_highlight", "locate", "clear_locate",
            "clear_visualization", "set_node_style_rules", "clear_node_style_rules",
            "set_link_style_rules", "clear_link_style_rules",
        ],
        "sources": ["nodes", "links", "ringChains"],
        "condition_operators": [
            "eq", "neq", "contains", "not_contains", "startswith", "endswith",
            "in", "empty", "not_empty", "gt", "gte", "lt", "lte",
        ],
        "views": ["gis", "logic"],
        "limits": {"logic_view_max_nodes": 500},
        "style_rules": {
            "node": {
                "color": "#RRGGBB",
                "size": {"min": 4, "max": 40},
                "shape": ["circle", "square", "diamond", "triangle"],
            },
            "link": {
                "color": "#RRGGBB",
                "line_style": ["solid", "dash", "dot"],
                "width": ["thin", "medium", "thick"],
            },
        },
        "versions": list_versions(),
    }


def get_data_schema(version_id: str) -> Dict[str, Any]:
    """读取版本三类数据源的字段和行数."""
    if not get_version(version_id):
        raise ValueError("数据版本不存在")
    dataset = get_version_dataset(version_id)
    return {
        "version_id": version_id,
        "sources": {
            "nodes": _dataset_description(dataset["devices"]),
            "links": _dataset_description(dataset["links"]),
            "ringChains": _dataset_description(dataset["ringChains"]),
        },
    }


def get_field_values(
    version_id: str,
    source: str,
    field: str,
    query: str = "",
    limit: int = 100,
) -> Dict[str, Any]:
    """返回指定字段的去重值，供大模型核对过滤参数."""
    if source not in {"nodes", "links", "ringChains"}:
        raise ValueError("source 不合法")
    if not field:
        raise ValueError("field 不能为空")
    dataset = get_version_dataset(version_id)
    source_key = {"nodes": "devices", "links": "links", "ringChains": "ringChains"}[source]
    rows = dataset[source_key]
    needle = str(query or "").lower()
    values = sorted({
        str(row.get(field, ""))
        for row in rows
        if row.get(field) is not None and str(row.get(field, "")) != ""
        and (not needle or needle in str(row.get(field, "")).lower())
    })[:max(1, min(int(limit), 500))]
    return {"version_id": version_id, "source": source, "field": field, "values": values}


def all_sessions() -> List[Dict[str, Any]]:
    """返回全部已注册浏览器会话."""
    return list_sessions()


def _validate_versions(operations: List[Dict[str, Any]]) -> None:
    """确认切换目标版本存在."""
    for operation in operations:
        if operation.get("op") == "switch_version" and not get_version(str(operation.get("version_id") or "")):
            raise ValueError("数据版本不存在: {}".format(operation.get("version_id")))


def _latest_version_id() -> str:
    """读取默认最新数据版本标识."""
    versions = list_versions()
    return str(versions[0]["id"]) if versions else ""


def _dataset_description(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """生成数据集字段摘要."""
    fields = sorted({key for row in rows for key in row.keys() if not key.startswith("_")})
    return {"row_count": len(rows), "fields": fields}


def _json(value: Any) -> str:
    """统一生成紧凑 UTF-8 JSON."""
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
