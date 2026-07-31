#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import json
import sys
from datetime import datetime
from pathlib import Path
from uuid import uuid4
from typing import Any, Dict, List

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from algo.statistics.metric_engine import MetricEngine
from app.db.database import fetch_all, get_connection
from app.schemas.condition_schema import MetricAggregation, MetricSpecRequest, SaveMetricTemplateRequest
from app.services.data_access import get_version_dataset


DEFAULT_METRICS = [
    MetricAggregation(name="网元总数", dataset="devices", aggregation="count"),
    MetricAggregation(name="链路总数", dataset="links", aggregation="count"),
    MetricAggregation(name="环链记录数", dataset="ringChains", aggregation="count"),
    MetricAggregation(name="角色分布", dataset="devices", aggregation="group_count", group_by="Role"),
    MetricAggregation(name="链路状态分布", dataset="links", aggregation="group_count", group_by="Status"),
    MetricAggregation(name="环链类型分布", dataset="ringChains", aggregation="group_count", group_by="Label"),
]


def summary_metrics(version_id: str) -> Dict[str, Any]:
    """执行默认看板指标."""
    dataset = get_version_dataset(version_id)
    engine = MetricEngine(dataset)
    return {"version_id": version_id, "metrics": engine.run_metrics(DEFAULT_METRICS)}


def run_custom_metrics(request: MetricSpecRequest) -> Dict[str, Any]:
    """执行声明式自定义指标."""
    dataset = get_version_dataset(request.version_id)
    engine = MetricEngine(dataset)
    return {
        "version_id": request.version_id,
        "metrics": engine.run_metrics(request.metrics, request.condition_group),
    }


def save_metric_template(request: SaveMetricTemplateRequest) -> Dict[str, Any]:
    """保存指标模板，供后续启动服务后继续复用."""
    template_id = uuid4().hex
    now = datetime.now().isoformat(timespec="seconds")
    spec = {
        "name": request.name,
        "description": request.description,
        "metrics": [metric.dict() for metric in request.metrics],
    }
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO metric_templates
            (id, name, description, spec_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (template_id, request.name, request.description, json.dumps(spec, ensure_ascii=False), now, now),
        )
    return {"id": template_id, **spec}


def list_metric_templates() -> List[Dict[str, Any]]:
    """查询已保存的指标模板."""
    rows = fetch_all("SELECT * FROM metric_templates ORDER BY updated_at DESC")
    result = []
    for row in rows:
        spec = json.loads(row["spec_json"])
        result.append(
            {
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "spec": spec,
                "updated_at": row["updated_at"],
            }
        )
    return result
