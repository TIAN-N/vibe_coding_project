#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Dict

from fastapi import APIRouter

from app.core.response import ok
from app.schemas.condition_schema import TableQueryRequest
from app.services.table_service import query_table


router = APIRouter()


@router.post("/query")
def query(request: TableQueryRequest) -> Dict[str, object]:
    """查询网元、链路、环链表格."""
    return ok(query_table(request))

