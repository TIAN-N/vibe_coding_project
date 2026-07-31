#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Dict

from fastapi import APIRouter

from app.core.response import ok
from app.schemas.condition_schema import TopologyQueryRequest
from app.services.topology_service import query_topology


router = APIRouter()


@router.post("/query")
def query(request: TopologyQueryRequest) -> Dict[str, object]:
    """统一拓扑查询接口，覆盖过滤、高亮、定位."""
    return ok(query_topology(request))

