#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import sys
from pathlib import Path
from typing import Any, Dict, List

from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from algo.layout.logic_layout import LogicLayoutEngine
from app.core.config import settings
from app.schemas.condition_schema import TopologyAction
from app.services.condition_service import apply_topology_actions
from app.services.data_access import get_version_dataset


class LogicLayoutRequest(BaseModel):
    """逻辑视图布局请求."""

    version_id: str
    canvas_width: float = 1400.0
    canvas_height: float = 900.0
    actions: List[TopologyAction] = Field(default_factory=list)


def compute_logic_layout(request: LogicLayoutRequest) -> Dict[str, Any]:
    """按当前过滤条件计算逻辑视图坐标."""
    dataset = get_version_dataset(request.version_id)
    queried = apply_topology_actions(
        request.actions,
        dataset["devices"],
        dataset["links"],
        dataset["ringChains"],
    )
    engine = LogicLayoutEngine(
        queried["devices"],
        queried["links"],
        dataset["ringChains"],
        request.canvas_width,
        request.canvas_height,
        settings.logic_node_limit,
    )
    return engine.compute()
