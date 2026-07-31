#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Dict, Optional

from fastapi import APIRouter

from app.core.response import ok
from app.schemas.condition_schema import SaveStyleTemplateRequest
from app.services.style_service import list_style_templates, save_style_template


router = APIRouter()


@router.post("/templates")
def save_template(request: SaveStyleTemplateRequest) -> Dict[str, object]:
    """保存样式模板."""
    return ok(save_style_template(request))


@router.get("/templates")
def templates(version_id: Optional[str] = None) -> Dict[str, object]:
    """查询样式模板."""
    return ok(list_style_templates(version_id))

