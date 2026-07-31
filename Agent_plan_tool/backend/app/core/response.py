#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict


def ok(data: Any = None, message: str = "success") -> Dict[str, Any]:
    """生成统一成功响应."""
    return {"success": True, "message": message, "data": data}


def fail(message: str, data: Any = None) -> Dict[str, Any]:
    """生成统一失败响应."""
    return {"success": False, "message": message, "data": data}

