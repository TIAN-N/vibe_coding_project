#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Dict

from fastapi import APIRouter

from app.core.response import fail, ok
from app.services.version_service import get_version, list_versions


router = APIRouter()


@router.get("")
def versions() -> Dict[str, object]:
    """查询全部数据版本."""
    return ok(list_versions())


@router.get("/{version_id}")
def version_detail(version_id: str) -> Dict[str, object]:
    """查询单个数据版本."""
    version = get_version(version_id)
    if not version:
        return fail("数据版本不存在")
    return ok(version)

