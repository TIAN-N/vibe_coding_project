#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
from datetime import datetime
from uuid import uuid4
from typing import Any, Dict, List, Optional

from app.db.database import fetch_all, get_connection
from app.schemas.condition_schema import SaveStyleTemplateRequest


def save_style_template(request: SaveStyleTemplateRequest) -> Dict[str, Any]:
    """保存样式模板，支持全局共享或版本定制."""
    template_id = uuid4().hex
    now = datetime.now().isoformat(timespec="seconds")
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO style_templates
            (id, name, scope, version_id, template_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                template_id,
                request.name,
                request.scope,
                request.version_id,
                json.dumps(request.template, ensure_ascii=False),
                now,
                now,
            ),
        )
    return {
        "id": template_id,
        "name": request.name,
        "scope": request.scope,
        "version_id": request.version_id,
        "template": request.template,
    }


def list_style_templates(version_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """查询样式模板，全局模板和当前版本模板同时返回."""
    if version_id:
        rows = fetch_all(
            """
            SELECT * FROM style_templates
            WHERE scope = 'global' OR version_id = ?
            ORDER BY updated_at DESC
            """,
            (version_id,),
        )
    else:
        rows = fetch_all("SELECT * FROM style_templates ORDER BY updated_at DESC")
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "scope": row["scope"],
            "version_id": row["version_id"],
            "template": json.loads(row["template_json"]),
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]
