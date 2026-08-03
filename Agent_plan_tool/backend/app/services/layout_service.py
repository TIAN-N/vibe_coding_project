#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

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

    version_id: Optional[str] = None
    canvas_width: float = 1400.0
    canvas_height: float = 900.0
    actions: List[TopologyAction] = Field(default_factory=list)
    devices: List[Dict[str, Any]] = Field(default_factory=list)
    links: List[Dict[str, Any]] = Field(default_factory=list)


def compute_logic_layout(request: LogicLayoutRequest) -> Dict[str, Any]:
    """按当前可见数据或数据库版本计算逻辑视图坐标.

    Args:
        request: 布局请求，可直接携带当前可见拓扑，也可指定数据库版本.

    Returns:
        Python/NetworkX 布局引擎计算的虚拟画布和节点坐标.
    """
    if request.devices or request.links:
        dataset = {
            "devices": request.devices,
            "links": request.links,
            "ringChains": [],
        }
    elif request.version_id:
        dataset = get_version_dataset(request.version_id)
    else:
        dataset = {"devices": [], "links": [], "ringChains": []}

    queried = apply_topology_actions(
        request.actions,
        dataset["devices"],
        dataset["links"],
        dataset["ringChains"],
    )
    engine = LogicLayoutEngine(
        queried["devices"],
        queried["links"],
        request.canvas_width,
        request.canvas_height,
        settings.logic_node_limit,
    )
    return engine.compute()
