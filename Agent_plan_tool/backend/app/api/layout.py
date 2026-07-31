#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Dict

from fastapi import APIRouter

from app.core.response import ok
from app.services.layout_service import LogicLayoutRequest, compute_logic_layout


router = APIRouter()


@router.post("/logic")
def logic_layout(request: LogicLayoutRequest) -> Dict[str, object]:
    """计算逻辑视图布局坐标."""
    return ok(compute_logic_layout(request))

