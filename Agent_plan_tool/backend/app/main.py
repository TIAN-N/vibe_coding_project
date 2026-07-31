#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import layout, metrics, query, styles, tables, uploads, versions
from app.core.config import settings
from app.core.response import ok
from app.db.database import init_db


app = FastAPI(title="Agent Plan Topology Tool", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """服务启动时初始化目录和数据库."""
    init_db()


@app.get("/api/v1/health")
def health() -> dict:
    """健康检查接口."""
    return ok({"status": "running", "settings": settings.as_dict()})


app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["uploads"])
app.include_router(versions.router, prefix="/api/v1/versions", tags=["versions"])
app.include_router(query.router, prefix="/api/v1/topology", tags=["topology"])
app.include_router(layout.router, prefix="/api/v1/layout", tags=["layout"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
app.include_router(styles.router, prefix="/api/v1/styles", tags=["styles"])
app.include_router(tables.router, prefix="/api/v1/tables", tags=["tables"])

if settings.frontend_root.exists():
    app.mount("/", StaticFiles(directory=settings.frontend_root, html=True), name="frontend")

