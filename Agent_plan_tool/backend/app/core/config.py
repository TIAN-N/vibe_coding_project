#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import os
from pathlib import Path
from typing import Dict


class Settings:
    """应用配置，集中管理本地数据目录和服务限制."""

    def __init__(self) -> None:
        self.backend_root = Path(__file__).resolve().parents[2]
        self.project_root = self.backend_root.parent
        self.frontend_root = self.project_root / "frontend"
        self.data_root = self.backend_root / "data"
        self.version_root = self.data_root / "versions"
        self.style_template_root = self.data_root / "style_templates"
        self.metric_template_root = self.data_root / "metric_templates"
        self.database_path = Path(
            os.environ.get("TOPO_DATABASE_PATH", str(self.data_root / "topo_visual.db"))
        )
        self.logic_node_limit = 500

    def ensure_dirs(self) -> None:
        """确保应用运行所需目录存在."""
        dirs = [
            self.data_root,
            self.version_root,
            self.style_template_root,
            self.metric_template_root,
        ]
        for item in dirs:
            item.mkdir(parents=True, exist_ok=True)

    def as_dict(self) -> Dict[str, str]:
        """返回便于接口展示的配置摘要."""
        return {
            "project_root": str(self.project_root),
            "database_path": str(self.database_path),
            "version_root": str(self.version_root),
            "logic_node_limit": str(self.logic_node_limit),
        }


settings = Settings()
