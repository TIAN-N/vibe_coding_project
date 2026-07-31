# 数据模型

## 数据版本

`data_versions` 保存一次上传解析的版本元信息。版本 ID 由解析时间戳生成，原始文件保存在：

```text
backend/data/versions/YYYY-MM-DD-HH-MM-SS
```

目录内包含：

- 原始网元表。
- 原始链路表。
- 原始环链表，可选。
- `parsed_snapshot.json`，保存解析后的三表 JSON 和摘要。

## 表数据

三类表均采用“核心字段列化 + 原始行 JSON”的方式保存：

- `device_rows`
- `link_rows`
- `ring_chain_rows`

这样可以稳定支持核心拓扑关系，同时保留用户上传的任意扩展字段，用于过滤、高亮、样式规则和指标模板。

