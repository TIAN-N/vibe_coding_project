#!/usr/bin/env python
# -*- coding: utf-8 -*-
#  Copyright (c) Huawei Technologies Co., Ltd. 2025-2026. All rights reserved.

from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd


REQUIRED_DEVICE_COLUMNS = ["NE Name", "Role", "Longitude", "Latitude"]
REQUIRED_LINK_COLUMNS = ["Src NE Name", "Sink NE Name"]
REQUIRED_RING_CHAIN_COLUMNS = [
    "Category",
    "Name",
    "Root1",
    "Root2",
    "Label",
    "Member_num",
    "Member_path",
    "Uplink_pair",
    "Belong_agg",
]


def parse_table(content: bytes, file_name: str) -> pd.DataFrame:
    """按文件后缀解析 CSV/XLSX/XLS 表格."""
    suffix = Path(file_name).suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(BytesIO(content), dtype=object).fillna("")
    if suffix in [".xlsx", ".xls"]:
        return pd.read_excel(BytesIO(content), dtype=object).fillna("")
    raise ValueError(f"不支持的文件格式：{suffix}")


def validate_columns(df: pd.DataFrame, required_columns: List[str], table_name: str) -> None:
    """校验表格必选字段."""
    missing = [column for column in required_columns if column not in df.columns]
    if missing:
        raise ValueError(f"{table_name} 缺少必选字段：{', '.join(missing)}")


def normalize_records(df: pd.DataFrame) -> List[Dict[str, object]]:
    """将 DataFrame 转为可 JSON 序列化的记录列表."""
    clean_df = df.copy()
    clean_df.columns = [str(column).strip() for column in clean_df.columns]
    clean_df = clean_df.fillna("")
    return clean_df.astype(object).to_dict("records")


def parse_upload_tables(
    device_content: bytes,
    device_name: str,
    link_content: bytes,
    link_name: str,
    ring_chain_content: Optional[bytes],
    ring_chain_name: Optional[str],
) -> Tuple[List[Dict[str, object]], List[Dict[str, object]], List[Dict[str, object]]]:
    """解析并校验网元、链路、环链三类上传表."""
    device_df = parse_table(device_content, device_name)
    link_df = parse_table(link_content, link_name)
    validate_columns(device_df, REQUIRED_DEVICE_COLUMNS, "网元表")
    validate_columns(link_df, REQUIRED_LINK_COLUMNS, "链路表")

    ring_chain_records: List[Dict[str, object]] = []
    if ring_chain_content and ring_chain_name:
        ring_chain_df = parse_table(ring_chain_content, ring_chain_name)
        validate_columns(ring_chain_df, REQUIRED_RING_CHAIN_COLUMNS, "环链表")
        ring_chain_records = normalize_records(ring_chain_df)

    return normalize_records(device_df), normalize_records(link_df), ring_chain_records

