# Agent Plan Topology Tool

这是基于现有 `topo_visual_tool` 重构的工程化版本，第一版提供：

- FastAPI 轻量 Web 服务。
- SQLite 本地数据库。
- 网元表、链路表、环链表上传解析。
- 原始上传文件按解析时间戳保存。
- 统一过滤、高亮、定位查询接口。
- 500 网元以内逻辑视图自适应布局。
- 样式模板持久化保存。
- 声明式指标模板，看板可按用户需求灵活扩展。
- 前端工程入口，包含右侧指标抽屉和底部数据明细抽屉。

## 启动方式

```powershell
cd D:\vibe_coding_project\topo_visual_tool\Agent_plan_tool\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8011
```

浏览器访问：

```text
http://127.0.0.1:8011/
```

## 关键接口

- `POST /api/v1/uploads/topology`：上传网元表、链路表、环链表。
- `GET /api/v1/versions`：查询数据版本。
- `POST /api/v1/topology/query`：统一过滤、高亮、定位查询。
- `POST /api/v1/layout/logic`：计算逻辑视图布局坐标。
- `GET /api/v1/metrics/summary/{version_id}`：默认看板指标。
- `POST /api/v1/metrics/custom`：执行声明式自定义指标。
- `POST /api/v1/metrics/templates`：保存指标模板。
- `POST /api/v1/styles/templates`：保存样式模板。
- `POST /api/v1/tables/query`：查询网元、链路、环链表格。

