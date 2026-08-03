# 可视化控制 API 与 MCP

## 架构边界

```text
前端人工操作 ─┐
REST API ─────┼─> UiCommandService -> SQLite 期望状态/修订号
MCP 工具 ─────┘                         |
                                        v
                              SSE -> 浏览器投影 -> 渲染回执
```

- FastAPI REST 是唯一业务内核，MCP 只做工具参数到 REST 的适配。
- 网页默认每 10 秒上报心跳；`target=active` 选择 45 秒内存活且最近聚焦的页面。
- 一次命令中的多项操作只递增一次修订号，浏览器只做一次最终状态投影。
- 网元和链路样式规则与过滤、高亮状态使用相同的 SSE 和渲染回执链路。
- 没有打开网页时，命令返回 `waiting_for_browser`；后续打开的页面会领取最新等待状态。
- `accepted` 表示服务端已接受，`rendered` 才表示浏览器已完成画布呈现。

## 启动

终端 1 启动 Web 服务：

```powershell
cd D:\vibe_coding_project\Agent_plan_tool
.\scripts\start_web.ps1
```

终端 2 启动 MCP Bridge：

```powershell
cd D:\vibe_coding_project\Agent_plan_tool
.\scripts\start_mcp.ps1
```

Web 页面为 `http://127.0.0.1:8011/`，MCP Streamable HTTP 地址为 `http://127.0.0.1:8013/mcp`。

如 8011 被占用，可分别传入端口并保持 Bridge 指向一致：

```powershell
.\scripts\start_web.ps1 -Port 8020
.\scripts\start_mcp.ps1 -Port 8023 -ApiBaseUrl http://127.0.0.1:8020
```

## REST 调用顺序

1. 获取版本：`GET /api/v1/versions`
2. 获取字段：`GET /api/v1/ui/data-schema/{version_id}`
3. 核对字段值：`GET /api/v1/ui/field-values/{version_id}?source=nodes&field=Region`
4. 下发组合命令：`POST /api/v1/ui/commands`
5. 查询结果：`GET /api/v1/ui/commands/{command_id}`

Postman 请求地址：

```text
POST http://127.0.0.1:8011/api/v1/ui/commands
```

Body 选择 `raw` 和 `JSON`，示例：

```json
{
  "target": "active",
  "requested_by": "postman",
  "operations": [
    {
      "op": "switch_version",
      "version_id": "20260802162313917"
    },
    {
      "op": "switch_view",
      "view": "logic"
    },
    {
      "op": "clear_visualization"
    },
    {
      "op": "set_filter",
      "source": "nodes",
      "mode": "all",
      "conditions": [
        {
          "field": "Region",
          "op": "eq",
          "value": "Metro-North"
        }
      ]
    },
    {
      "op": "set_highlight",
      "source": "nodes",
      "mode": "all",
      "conditions": [
        {
          "field": "Role",
          "op": "eq",
          "value": "CSG"
        }
      ],
      "contrast": 0.72
    },
    {
      "op": "locate",
      "source": "nodes",
      "mode": "all",
      "conditions": [
        {
          "field": "NE Name",
          "op": "eq",
          "value": "NODE-A"
        }
      ]
    }
  ]
}
```

清空全部可视化条件：

```json
{
  "target": "active",
  "requested_by": "postman",
  "operations": [
    { "op": "clear_visualization" }
  ]
}
```

支持的操作为：`switch_version`、`switch_view`、`set_filter`、`clear_filter`、`set_highlight`、`clear_highlight`、`locate`、`clear_locate`、`clear_visualization`、`set_node_style_rules`、`clear_node_style_rules`、`set_link_style_rules`、`clear_link_style_rules`。

## 多页面控制

默认使用 `target=active`。需要固定控制某个页面时：

1. 调用 `GET /api/v1/ui/sessions` 获取 `session_id`。
2. 将命令中的 `target` 改为该 `session_id`。
3. 指定页面离线时接口返回错误，不会误控制其他页面。

并发调用可带 `expected_revision`。当页面状态已被其他调用更新时，服务端返回 HTTP 409，调用方应重新读取 `/api/v1/ui/state` 后再规划操作。

## MCP 工具

- `get_visualization_context`：读取活跃页面状态和能力契约。
- `list_topology_versions`：查询数据版本。
- `inspect_topology_field`：查询字段结构或候选值。
- `apply_visualization`：组合切换、过滤、高亮和定位，并可等待渲染。
- `clear_visualization`：清除全部或指定类型的视觉条件。
- `wait_for_visualization`：等待已有命令的浏览器回执。

通用 Streamable HTTP 客户端配置：

```json
{
  "mcpServers": {
    "topology-visualization": {
      "url": "http://127.0.0.1:8013/mcp"
    }
  }
}
```

通用 stdio 配置：

```json
{
  "mcpServers": {
    "topology-visualization": {
      "command": "D:\\vibe_coding_project\\Agent_plan_tool\\.venv-mcp\\Scripts\\python.exe",
      "args": [
        "D:\\vibe_coding_project\\Agent_plan_tool\\mcp_bridge\\server.py"
      ],
      "env": {
        "TOPO_API_BASE_URL": "http://127.0.0.1:8011",
        "TOPO_MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

推荐大模型调用流程：先用 `get_visualization_context` 判断页面和版本，再用 `inspect_topology_field` 核对字段和值，最后调用 `apply_visualization` 并等待 `rendered`。

## 兼容接口

原有 `POST /api/v1/topology/query` 保持不变。传 `apply_to_view=true` 时，会同时写入旧版共享状态和新 UI 命令，已有 Postman 脚本可继续使用；新集成建议直接调用 `/api/v1/ui/commands`。
