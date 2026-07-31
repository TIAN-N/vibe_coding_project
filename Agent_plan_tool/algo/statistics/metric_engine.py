#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict, List, Optional

from app.schemas.condition_schema import ConditionGroup, MetricAggregation
from app.services.condition_service import matches_condition


class MetricEngine:
    """声明式指标执行引擎，适合由大模型生成指标 JSON 后安全运行."""

    def __init__(self, dataset: Dict[str, List[Dict[str, Any]]]) -> None:
        self.dataset = dataset

    def run_metrics(
        self,
        metrics: List[MetricAggregation],
        condition_group: Optional[ConditionGroup] = None,
    ) -> List[Dict[str, Any]]:
        """执行一组指标定义."""
        results = []
        for metric in metrics:
            rows = list(self.dataset[metric.dataset])
            rows = self._apply_metric_filters(rows, metric)
            if condition_group and dataset_matches_condition_source(metric.dataset, condition_group.source):
                rows = [row for row in rows if all(matches_condition(row, item) for item in condition_group.conditions)]
            results.append(self._run_one(metric, rows))
        return results

    def _apply_metric_filters(
        self,
        rows: List[Dict[str, Any]],
        metric: MetricAggregation,
    ) -> List[Dict[str, Any]]:
        """执行指标自身过滤条件."""
        if not metric.filters:
            return rows
        return [row for row in rows if all(matches_condition(row, item) for item in metric.filters)]

    def _run_one(self, metric: MetricAggregation, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """执行单个指标."""
        if metric.aggregation == "count":
            value: Any = len(rows)
        elif metric.aggregation == "count_distinct":
            value = len({safe_text(row.get(metric.field or "")) for row in rows})
        elif metric.aggregation == "group_count":
            value = group_count(rows, metric.group_by or metric.field or "")
        else:
            values = [safe_float(row.get(metric.field or "")) for row in rows]
            values = [item for item in values if item is not None]
            value = aggregate_numbers(metric.aggregation, values)
        return {
            "name": metric.name,
            "dataset": metric.dataset,
            "aggregation": metric.aggregation,
            "field": metric.field,
            "group_by": metric.group_by,
            "value": value,
        }


def dataset_matches_condition_source(dataset: str, source: str) -> bool:
    """判断指标数据集是否与条件来源同类."""
    return (
        (dataset == "devices" and source == "nodes")
        or (dataset == "links" and source == "links")
        or (dataset == "ringChains" and source == "ringChains")
    )


def safe_text(value: Any) -> str:
    """转换为去空白字符串."""
    return "" if value is None else str(value).strip()


def safe_float(value: Any) -> Optional[float]:
    """转换浮点数，失败返回 None."""
    try:
        text = safe_text(value)
        return float(text) if text else None
    except ValueError:
        return None


def group_count(rows: List[Dict[str, Any]], field: str) -> Dict[str, int]:
    """按字段分组计数."""
    result: Dict[str, int] = {}
    for row in rows:
        key = safe_text(row.get(field)) or "(empty)"
        result[key] = result.get(key, 0) + 1
    return dict(sorted(result.items(), key=lambda item: (-item[1], item[0]))[:50])


def aggregate_numbers(aggregation: str, values: List[float]) -> Optional[float]:
    """执行数值聚合."""
    if not values:
        return None
    if aggregation == "sum":
        return sum(values)
    if aggregation == "avg":
        return sum(values) / len(values)
    if aggregation == "min":
        return min(values)
    if aggregation == "max":
        return max(values)
    return None
