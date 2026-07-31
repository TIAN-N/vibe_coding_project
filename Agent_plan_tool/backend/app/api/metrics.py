#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Dict

from fastapi import APIRouter

from app.core.response import ok
from app.schemas.condition_schema import MetricSpecRequest, SaveMetricTemplateRequest
from app.services.metric_service import list_metric_templates, run_custom_metrics, save_metric_template, summary_metrics


router = APIRouter()


@router.get("/summary/{version_id}")
def summary(version_id: str) -> Dict[str, object]:
    """查询默认看板指标."""
    return ok(summary_metrics(version_id))


@router.post("/custom")
def custom(request: MetricSpecRequest) -> Dict[str, object]:
    """执行声明式自定义指标."""
    return ok(run_custom_metrics(request))


@router.post("/templates")
def save_template(request: SaveMetricTemplateRequest) -> Dict[str, object]:
    """保存指标模板."""
    return ok(save_metric_template(request))


@router.get("/templates")
def templates() -> Dict[str, object]:
    """查询指标模板."""
    return ok(list_metric_templates())

