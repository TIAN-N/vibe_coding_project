#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
from datetime import datetime
from typing import Any, Dict, List, Literal

from app.db.database import fetch_one, get_connection
from app.schemas.condition_schema import TopologyAction


def publish_view_state(
    version_id: str,
    view: Literal["gis", "logic"],
    actions: List[TopologyAction],
) -> Dict[str, Any]:
    """发布指定数据版本的共享网页控制状态.

    Args:
        version_id: 数据版本标识.
        view: 需要切换到的拓扑视图.
        actions: 过滤、高亮和定位动作列表.

    Returns:
        已持久化的共享视图状态及递增修订号.
    """
    serialized_actions = [_model_to_dict(action) for action in actions]
    now = datetime.now().isoformat(timespec="milliseconds")
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO topology_view_states
            (version_id, revision, view, actions_json, updated_at)
            VALUES (?, 1, ?, ?, ?)
            ON CONFLICT(version_id) DO UPDATE SET
                revision = topology_view_states.revision + 1,
                view = excluded.view,
                actions_json = excluded.actions_json,
                updated_at = excluded.updated_at
            """,
            (
                version_id,
                view,
                json.dumps(serialized_actions, ensure_ascii=False),
                now,
            ),
        )
        row = conn.execute(
            "SELECT revision FROM topology_view_states WHERE version_id = ?",
            (version_id,),
        ).fetchone()
        revision = int(row["revision"])
    return {
        "version_id": version_id,
        "revision": revision,
        "view": view,
        "actions": serialized_actions,
        "updated_at": now,
    }


def get_view_state(version_id: str) -> Dict[str, Any]:
    """读取指定数据版本当前发布的网页控制状态.

    Args:
        version_id: 数据版本标识.

    Returns:
        共享视图状态；尚未发布时返回修订号 0 的空状态.
    """
    row = fetch_one(
        "SELECT * FROM topology_view_states WHERE version_id = ?",
        (version_id,),
    )
    if not row:
        return {
            "version_id": version_id,
            "revision": 0,
            "view": "gis",
            "actions": [],
            "updated_at": None,
        }
    return {
        "version_id": row["version_id"],
        "revision": int(row["revision"]),
        "view": row["view"],
        "actions": json.loads(row["actions_json"]),
        "updated_at": row["updated_at"],
    }


def clear_view_state(version_id: str) -> Dict[str, Any]:
    """清空指定版本已发布的动作并通知所有网页.

    Args:
        version_id: 数据版本标识.

    Returns:
        清空后的共享视图状态和新修订号.
    """
    current = get_view_state(version_id)
    return publish_view_state(version_id, current["view"], [])


def _model_to_dict(model: TopologyAction) -> Dict[str, Any]:
    """兼容 Pydantic 1.x 与 2.x 的模型序列化接口."""
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()
