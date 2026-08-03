# Agent Plan Topology Tool

这是基于现有 `topo_visual_tool` 重构的工程化版本，第一版提供：

- FastAPI 轻量 Web 服务。
- SQLite 本地数据库。
- 网元表、链路表、环链表上传解析。
- 原始上传文件按解析时间戳保存。
- 统一过滤、高亮、定位查询接口。
- 500 网元以内统一由 Python/NetworkX 生成逻辑视图坐标，支持环链分组、固定骨架和自适应虚拟画布。
- 样式模板持久化保存。
- 声明式指标模板，看板可按用户需求灵活扩展。
- 前端工程入口，包含右侧指标抽屉和底部数据明细抽屉。
- 浏览器人工操作、REST API 和 MCP 工具共享同一套可视化命令状态。
- SSE 实时推送和浏览器渲染回执，可区分“接口已接收”与“画布已呈现”。

## 启动方式

```powershell
cd D:\vibe_coding_project\Agent_plan_tool\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8011
```

自动化测试或隔离环境可通过 `TOPO_DATABASE_PATH` 指定其他 SQLite 文件；未设置时仍使用 `backend/data/topo_visual.db`。

浏览器访问：

```text
http://127.0.0.1:8011/
```

## MCP Bridge

MCP Bridge 使用独立 Python 3.10 环境，业务规则仍由 FastAPI 服务统一提供：

```powershell
cd D:\vibe_coding_project\Agent_plan_tool
py -3.10 -m venv .venv-mcp
.\.venv-mcp\Scripts\python.exe -m pip install -r mcp_bridge\requirements.txt
.\scripts\start_mcp.ps1
```

默认 Streamable HTTP 地址：

```text
http://127.0.0.1:8013/mcp
```

详细启动、REST 请求和 MCP 配置见 [docs/UI_CONTROL_API.md](docs/UI_CONTROL_API.md)。

Postman 接口测试说明见：

```text
docs/POSTMAN_TEST.md
```

PyCharm 查看 SQLite 和常用 SQL 查询说明见：

```text
docs/PYCHARM_DATABASE.md
```

## 关键接口

- `POST /api/v1/uploads/topology`：上传网元表、链路表、环链表。
- `GET /api/v1/versions`：查询数据版本。
- `POST /api/v1/topology/query`：统一过滤、高亮、定位查询；传入 `apply_to_view: true` 时同步控制已打开网页。
- `GET /api/v1/topology/view-state/{version_id}`：查询网页共享控制状态及修订号。
- `DELETE /api/v1/topology/view-state/{version_id}`：清空共享过滤、高亮、定位动作。
- `POST /api/v1/ui/sessions/register`：注册浏览器控制会话。
- `POST /api/v1/ui/commands`：原子执行版本、视图、过滤、高亮、定位及网元/链路样式操作。
- `GET /api/v1/ui/state?target=active`：查询当前活跃页面及权威状态。
- `GET /api/v1/ui/commands/{command_id}`：查询命令是否已被浏览器实际渲染。
- `GET /api/v1/ui/capabilities`：查询可供大模型使用的操作、来源和条件运算符。
- `GET /api/v1/ui/data-schema/{version_id}`：查询版本字段结构。
- `GET /api/v1/ui/field-values/{version_id}`：查询字段候选值。
- `POST /api/v1/styles/templates/{template_id}/apply`：通过模板 ID 将网元和链路样式应用到浏览器。
- `POST /api/v1/layout/logic`：计算逻辑视图布局坐标。

逻辑视图不再执行浏览器端布局算法。数据库版本、Mock、本地历史版本和过滤结果都会将当前可见拓扑提交给该接口；接口失败时页面会明确提示，不会回退到旧 JavaScript 布局。
- `GET /api/v1/metrics/summary/{version_id}`：默认看板指标。
- `POST /api/v1/metrics/custom`：执行声明式自定义指标。
- `POST /api/v1/metrics/templates`：保存指标模板。
- `POST /api/v1/styles/templates`：保存样式模板。
- `POST /api/v1/tables/query`：查询网元、链路、环链表格。
