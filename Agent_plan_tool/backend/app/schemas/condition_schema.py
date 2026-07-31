#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class Condition(BaseModel):
    """单条条件定义."""

    field: str
    op: str = "contains"
    value: Any = ""


class ConditionGroup(BaseModel):
    """统一条件组，支持网元、链路、环链三类来源."""

    source: Literal["nodes", "links", "ringChains"] = "nodes"
    mode: Literal["all", "any"] = "all"
    conditions: List[Condition] = Field(default_factory=list)


class TopologyAction(BaseModel):
    """统一拓扑动作，可表达过滤、高亮和定位."""

    type: Literal["filter", "highlight", "locate"]
    source: Literal["nodes", "links", "ringChains"] = "nodes"
    mode: Literal["all", "any"] = "all"
    conditions: List[Condition] = Field(default_factory=list)
    contrast: Optional[float] = 0.72


class TopologyQueryRequest(BaseModel):
    """拓扑统一查询请求."""

    version_id: str
    view: Literal["gis", "logic"] = "gis"
    actions: List[TopologyAction] = Field(default_factory=list)


class TableQueryRequest(BaseModel):
    """表格查询请求."""

    version_id: str
    table_type: Literal["devices", "links", "ringChains"] = "devices"
    condition_group: Optional[ConditionGroup] = None
    limit: int = 500
    offset: int = 0


class MetricAggregation(BaseModel):
    """声明式指标聚合定义，供大模型生成和用户保存复用."""

    name: str
    dataset: Literal["devices", "links", "ringChains"] = "devices"
    aggregation: Literal["count", "count_distinct", "group_count", "sum", "avg", "min", "max"] = "count"
    field: Optional[str] = None
    group_by: Optional[str] = None
    filters: List[Condition] = Field(default_factory=list)


class MetricSpecRequest(BaseModel):
    """自定义指标模板执行请求."""

    version_id: str
    condition_group: Optional[ConditionGroup] = None
    metrics: List[MetricAggregation] = Field(default_factory=list)


class SaveMetricTemplateRequest(BaseModel):
    """保存指标模板请求."""

    name: str
    description: str = ""
    metrics: List[MetricAggregation] = Field(default_factory=list)


class SaveStyleTemplateRequest(BaseModel):
    """保存样式模板请求."""

    name: str
    scope: Literal["global", "version"] = "global"
    version_id: Optional[str] = None
    template: Dict[str, Any] = Field(default_factory=dict)

