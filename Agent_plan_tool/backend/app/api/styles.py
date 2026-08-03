#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Dict, Optional

from fastapi import APIRouter

from app.application.ui_command_service import submit_command
from app.core.response import fail, ok
from app.schemas.condition_schema import ApplyStyleTemplateRequest, SaveStyleTemplateRequest
from app.services.style_service import get_style_template, list_style_templates, save_style_template


router = APIRouter()


@router.post("/templates")
def save_template(request: SaveStyleTemplateRequest) -> Dict[str, object]:
    """保存样式模板."""
    return ok(save_style_template(request))


@router.get("/templates")
def templates(version_id: Optional[str] = None) -> Dict[str, object]:
    """查询样式模板."""
    return ok(list_style_templates(version_id))


@router.post("/templates/{template_id}/apply")
def apply_template(
    template_id: str,
    request: ApplyStyleTemplateRequest,
) -> Dict[str, object]:
    """将模板中的网元和链路规则发布到目标浏览器."""
    template = get_style_template(template_id)
    if not template:
        return fail("样式模板不存在")
    raw_template = template.get("template") or {}
    styles = raw_template.get("styles", raw_template)
    node_rules = styles.get("appliedNodeStyleRules") or styles.get("nodeStyleRules") or []
    link_rules = styles.get("appliedLinkStyleRules") or styles.get("linkStyleRules") or []
    command = submit_command({
        "target": request.target,
        "requested_by": request.requested_by,
        "operations": [
            {"op": "set_node_style_rules", "rules": node_rules},
            {"op": "set_link_style_rules", "rules": link_rules},
        ],
    })
    return ok({"template": template, "ui_command": command})
