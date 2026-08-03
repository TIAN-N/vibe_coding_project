#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

import shutil
from pathlib import Path
from tempfile import mkdtemp
from typing import Dict, Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.application.ui_command_service import submit_command
from app.core.response import fail, ok
from app.services.parser_service import parse_upload_tables
from app.services.version_service import create_version


router = APIRouter()


@router.post("/topology")
async def upload_topology(
    device_file: UploadFile = File(...),
    link_file: UploadFile = File(...),
    ring_chain_file: Optional[UploadFile] = File(None),
    version_name: Optional[str] = Form(None),
    apply_to_view: bool = Form(False),
    target: str = Form("active"),
    view: str = Form("gis"),
) -> Dict[str, object]:
    """上传网元表、链路表和可选环链表，保存原始文件并入库."""
    source_files: Dict[str, Path] = {}
    try:
        if view not in {"gis", "logic"}:
            return fail("view 仅支持 gis 或 logic")
        device_content = await device_file.read()
        link_content = await link_file.read()
        ring_chain_content = await ring_chain_file.read() if ring_chain_file else None
        ring_chain_name = ring_chain_file.filename if ring_chain_file else None

        device_rows, link_rows, ring_chain_rows = parse_upload_tables(
            device_content,
            device_file.filename,
            link_content,
            link_file.filename,
            ring_chain_content,
            ring_chain_name,
        )
        source_files = {
            "device": write_temp_file(device_content, device_file.filename),
            "link": write_temp_file(link_content, link_file.filename),
        }
        if ring_chain_content and ring_chain_name:
            source_files["ring_chain"] = write_temp_file(ring_chain_content, ring_chain_name)
        result = create_version(device_rows, link_rows, ring_chain_rows, source_files, version_name)
        if apply_to_view:
            result["ui_command"] = submit_command({
                "target": target,
                "requested_by": "upload-api",
                "operations": [
                    {"op": "switch_version", "version_id": result["version_id"]},
                    {"op": "switch_view", "view": view},
                    {"op": "clear_visualization"},
                ],
            })
        return ok(result, "上传解析完成")
    except Exception as exc:
        return fail(str(exc))
    finally:
        cleanup_temp_files(source_files)


def write_temp_file(content: bytes, file_name: str) -> Path:
    """将上传内容写入临时文件，供版本服务复制原始文件."""
    safe_name = Path(file_name).name
    temp_dir = Path(mkdtemp(prefix="topo_upload_"))
    temp_path = temp_dir / safe_name
    temp_path.write_bytes(content)
    return temp_path


def cleanup_temp_files(source_files: Dict[str, Path]) -> None:
    """清理上传接口生成的临时目录."""
    temp_dirs = {path.parent for path in source_files.values() if path}
    for temp_dir in temp_dirs:
        shutil.rmtree(temp_dir, ignore_errors=True)
