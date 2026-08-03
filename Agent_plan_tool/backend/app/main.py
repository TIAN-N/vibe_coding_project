#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from app.api import layout, metrics, query, styles, tables, ui, uploads, versions
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


@app.middleware("http")
async def add_static_charset_headers(request: Request, call_next) -> Response:
    """为前端静态资源补充 UTF-8 和 no-cache，避免浏览器缓存旧乱码资源."""
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path.endswith((".html", ".js", ".css")):
        content_type = response.headers.get("content-type", "")
        if "text/html" in content_type:
            response.headers["content-type"] = "text/html; charset=utf-8"
        elif "javascript" in content_type:
            response.headers["content-type"] = "application/javascript; charset=utf-8"
        elif "text/css" in content_type:
            response.headers["content-type"] = "text/css; charset=utf-8"
        response.headers["cache-control"] = "no-store"
    return response


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
app.include_router(ui.router, prefix="/api/v1/ui", tags=["ui-control"])

if settings.frontend_root.exists():
    app.mount("/", StaticFiles(directory=settings.frontend_root, html=True), name="frontend")
