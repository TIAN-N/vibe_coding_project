#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from typing import Any, Dict

from app.schemas.condition_schema import TopologyQueryRequest
from app.services.condition_service import apply_topology_actions
from app.services.data_access import get_version_dataset


def query_topology(request: TopologyQueryRequest) -> Dict[str, Any]:
    """执行统一拓扑查询."""
    dataset = get_version_dataset(request.version_id)
    result = apply_topology_actions(
        request.actions,
        dataset["devices"],
        dataset["links"],
        dataset["ringChains"],
    )
    return {
        "version_id": request.version_id,
        "view": request.view,
        "state": {
            "visibleNodeIds": result["visibleNodeIds"],
            "visibleLinkIds": result["visibleLinkIds"],
            "highlightNodeIds": result["highlightNodeIds"],
            "highlightLinkIds": result["highlightLinkIds"],
            "locateNodeIds": result["locateNodeIds"],
            "locateLinkIds": result["locateLinkIds"],
            "visibleRingChainRowIds": result["visibleRingChainRowIds"],
            "highlightContrast": result["highlightContrast"],
        },
        "devices": result["devices"],
        "links": result["links"],
        "ringChains": result["ringChains"],
    }

