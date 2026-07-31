#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict, List

from app.schemas.condition_schema import TableQueryRequest
from app.services.condition_service import matches_group
from app.services.data_access import get_version_dataset


def query_table(request: TableQueryRequest) -> Dict[str, Any]:
    """查询表格数据，并复用统一条件组."""
    dataset = get_version_dataset(request.version_id)
    rows = dataset[request.table_type]
    if request.condition_group:
        rows = [row for row in rows if matches_group(row, request.condition_group)]

    total = len(rows)
    start = max(0, request.offset)
    end = start + max(1, min(request.limit, 2000))
    page_rows = rows[start:end]
    fields = collect_fields(rows)
    return {
        "table_type": request.table_type,
        "total": total,
        "offset": start,
        "limit": request.limit,
        "fields": fields,
        "rows": page_rows,
    }


def collect_fields(rows: List[Dict[str, Any]]) -> List[str]:
    """收集表格字段，保持首次出现顺序."""
    fields = []
    seen = set()
    for row in rows:
        for key in row.keys():
            if key.startswith("_"):
                continue
            if key not in seen:
                fields.append(key)
                seen.add(key)
    return fields

