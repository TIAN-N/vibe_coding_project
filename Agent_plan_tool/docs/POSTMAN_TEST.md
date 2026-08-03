# Postman 全流程 API 测试说明

本文用于验证以下完整链路：

```text
Postman -> FastAPI -> SQLite 权威状态 -> SSE -> 浏览器 -> 实际画布渲染 -> rendered 回执
```

覆盖功能：

- 上传网元表、链路表和环链表，并让浏览器自动切换到新版本。
- 按网元条件过滤，并联动过滤链路、图例、看板和底部明细。
- 按条件高亮网元或链路。
- 设置网元颜色、大小和形状。
- 设置链路颜色、线型和线宽。
- 保存样式模板，并通过模板 ID 再次应用到浏览器。

## 0. 启动服务和浏览器

在 PyCharm Terminal 中启动 Web 服务：

```powershell
cd D:\vibe_coding_project\Agent_plan_tool
.\scripts\start_web.ps1
```

浏览器打开：

```text
http://127.0.0.1:8011/
```

必须先打开浏览器页面。页面会注册控制会话，Postman 使用 `target=active` 控制最近聚焦的在线页面。

如果服务使用其他端口，请同步修改 Postman 的 `base_url`。URL 必须以 `http://` 开头，不能写成 `post http://...`。

## 1. 创建 Postman Environment

创建环境，例如 `Topology Local`，添加变量：

| Variable | Initial value | Current value |
| --- | --- | --- |
| `base_url` | `http://127.0.0.1:8011` | `http://127.0.0.1:8011` |
| `version_id` | 留空 | 留空 |
| `command_id` | 留空 | 留空 |
| `style_template_id` | 留空 | 留空 |
| `region_value` | `Bangkok` | `Bangkok` |
| `node_role` | `ASG` | `ASG` |
| `link_type` | `Access-Ring` | `Access-Ring` |

选择该 Environment 后再发送请求。

## 2. 健康检查

- Method：`GET`
- URL：`{{base_url}}/api/v1/health`

预期响应：

```json
{
  "success": true,
  "message": "success",
  "data": {
    "status": "running"
  }
}
```

## 3. 确认浏览器控制会话

- Method：`GET`
- URL：`{{base_url}}/api/v1/ui/sessions`

预期 `data` 至少包含一个会话，并且：

```json
{
  "status": "online",
  "is_focused": 1
}
```

如果没有会话，请刷新浏览器页面。页面超过约 45 秒没有心跳会被视为离线。

## 4. 上传三张拓扑表并自动切换浏览器

- Method：`POST`
- URL：`{{base_url}}/api/v1/uploads/topology`
- Body：选择 `form-data`

逐行添加：

| Key | Type | Value |
| --- | --- | --- |
| `device_file` | File | `D:\vibe_coding_project\topo_visual_tool\test_data\logic_layout_mid_device.csv` |
| `link_file` | File | `D:\vibe_coding_project\topo_visual_tool\test_data\logic_layout_mid_link.csv` |
| `ring_chain_file` | File | `D:\vibe_coding_project\topo_visual_tool\test_data\logic_layout_mid_ring_chain.csv` |
| `version_name` | Text | `Postman API 全流程测试` |
| `apply_to_view` | Text | `true` |
| `target` | Text | `active` |
| `view` | Text | `gis` |

不要手工设置 `Content-Type`。Postman 会自动生成带 boundary 的 `multipart/form-data`。

在请求的 `Scripts -> Post-response` 或旧版 `Tests` 中填写：

```javascript
pm.test("上传成功", function () {
  pm.response.to.have.status(200);
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data.version_id).to.be.a("string");
  pm.expect(body.data.ui_command.id).to.be.a("string");
  pm.environment.set("version_id", body.data.version_id);
  pm.environment.set("command_id", body.data.ui_command.id);
});
```

浏览器验收：

- 数据版本切换为新上传的版本。
- 默认显示 GIS 视图。
- 网元、链路、环链、指标看板和数据明细均来自新版本。
- 原始文件保存到 `backend/data/versions/<时间戳>_<版本名>/`。

如果没有打开浏览器，上传仍然成功，但 `ui_command.status` 为 `waiting_for_browser`；之后打开页面会领取该状态。

## 5. 确认浏览器已经完成渲染

- Method：`GET`
- URL：`{{base_url}}/api/v1/ui/commands/{{command_id}}`

点击 Send，查看：

```json
{
  "data": {
    "status": "rendered",
    "result": {
      "render": {
        "version_id": "...",
        "view": "gis",
        "visible_nodes": 120,
        "visible_links": 160,
        "node_style_rule_count": 0,
        "link_style_rule_count": 0
      }
    }
  }
}
```

状态含义：

- `waiting_for_browser`：没有可用页面，等待页面注册。
- `accepted`：后端已保存命令，浏览器尚未返回完成回执。
- `rendered`：浏览器已经完成实际绘制。
- `failed`：浏览器执行或布局失败，查看 `error_message`。

## 6. 查询可用字段和值

先查询字段结构：

- Method：`GET`
- URL：`{{base_url}}/api/v1/ui/data-schema/{{version_id}}`

查询 Region 候选值：

- Method：`GET`
- URL：`{{base_url}}/api/v1/ui/field-values/{{version_id}}?source=nodes&field=Region`

查询链路类型候选值：

- Method：`GET`
- URL：`{{base_url}}/api/v1/ui/field-values/{{version_id}}?source=links&field=Link%20Type`

如果使用本文测试文件，可直接使用：

```text
Region = Bangkok
Role = ASG
Link Type = Access-Ring
```

实际文件字段不同，应使用接口返回的精确字段名和值，包括大小写、空格和连字符。

## 7. API 过滤网元和对应链路

- Method：`POST`
- URL：`{{base_url}}/api/v1/ui/commands`
- Body：`raw`
- 类型：`JSON`

```json
{
  "target": "active",
  "requested_by": "postman-filter",
  "operations": [
    {
      "op": "switch_version",
      "version_id": "{{version_id}}"
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
          "value": "{{region_value}}"
        }
      ]
    }
  ]
}
```

Tests：

```javascript
pm.test("过滤命令已接收", function () {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  pm.environment.set("command_id", body.data.id);
});
```

浏览器验收：

- 自动切换到 Logic Topo。
- 只保留 `Region = Bangkok` 的网元。
- 链路只保留源、宿端均属于当前过滤网元集合的链路。
- 左侧统计、节点图例、右侧指标看板和底部明细同步更新。

再次执行第 5 步，确认命令为 `rendered`。

## 8. API 高亮网元

该命令只更新高亮，不会清除第 7 步过滤条件。

- Method：`POST`
- URL：`{{base_url}}/api/v1/ui/commands`
- Body：`raw / JSON`

```json
{
  "target": "active",
  "requested_by": "postman-highlight",
  "operations": [
    {
      "op": "set_highlight",
      "source": "nodes",
      "mode": "all",
      "conditions": [
        {
          "field": "Role",
          "op": "eq",
          "value": "{{node_role}}"
        }
      ],
      "contrast": 0.72
    }
  ]
}
```

使用与第 7 步相同的 Tests 脚本保存 `command_id`。

浏览器验收：

- 当前过滤结果中的 ASG 网元被高亮。
- 其他网元降低对比度。
- 过滤结果、图例计数、看板和明细不被重置。

## 9. API 设置网元样式规则

- Method：`POST`
- URL：`{{base_url}}/api/v1/ui/commands`
- Body：`raw / JSON`

```json
{
  "target": "active",
  "requested_by": "postman-node-style",
  "operations": [
    {
      "op": "set_node_style_rules",
      "rules": [
        {
          "source": "nodes",
          "mode": "all",
          "conditions": [
            {
              "field": "Role",
              "op": "eq",
              "value": "{{node_role}}"
            }
          ],
          "color": "#ff0066",
          "size": 20,
          "shape": "diamond",
          "label": "ASG API style"
        }
      ]
    }
  ]
}
```

浏览器验收：ASG 网元变为粉色、尺寸 20 的菱形节点。节点样式支持：

- `color`：`#RRGGBB`。
- `size`：4 到 40。
- `shape`：`circle`、`square`、`diamond`、`triangle`。

## 10. API 设置链路样式规则

- Method：`POST`
- URL：`{{base_url}}/api/v1/ui/commands`
- Body：`raw / JSON`

```json
{
  "target": "active",
  "requested_by": "postman-link-style",
  "operations": [
    {
      "op": "set_link_style_rules",
      "rules": [
        {
          "source": "links",
          "mode": "all",
          "conditions": [
            {
              "field": "Link Type",
              "op": "eq",
              "value": "{{link_type}}"
            }
          ],
          "color": "#00aa55",
          "line_style": "dash",
          "width": "thick"
        }
      ]
    }
  ]
}
```

浏览器验收：`Access-Ring` 链路变为绿色粗虚线。链路样式支持：

- `color`：`#RRGGBB`。
- `line_style`：`solid`、`dash`、`dot`。
- `width`：`thin`、`medium`、`thick`。

完成后查询命令，`result.render` 应包含：

```json
{
  "node_style_rule_count": 1,
  "link_style_rule_count": 1
}
```

## 11. 一次请求完成过滤、高亮和样式设置

大模型或自动化系统推荐一次提交组合命令。一次命令只增加一个修订号，浏览器完成一次最终投影。

```json
{
  "target": "active",
  "requested_by": "postman-combined",
  "operations": [
    {
      "op": "switch_version",
      "version_id": "{{version_id}}"
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
        {"field": "Region", "op": "eq", "value": "{{region_value}}"}
      ]
    },
    {
      "op": "set_highlight",
      "source": "nodes",
      "mode": "all",
      "conditions": [
        {"field": "Role", "op": "eq", "value": "{{node_role}}"}
      ],
      "contrast": 0.72
    },
    {
      "op": "set_node_style_rules",
      "rules": [
        {
          "source": "nodes",
          "mode": "all",
          "conditions": [
            {"field": "Role", "op": "eq", "value": "{{node_role}}"}
          ],
          "color": "#ff0066",
          "size": 20,
          "shape": "diamond"
        }
      ]
    },
    {
      "op": "set_link_style_rules",
      "rules": [
        {
          "source": "links",
          "mode": "all",
          "conditions": [
            {"field": "Link Type", "op": "eq", "value": "{{link_type}}"}
          ],
          "color": "#00aa55",
          "line_style": "dash",
          "width": "thick"
        }
      ]
    }
  ]
}
```

## 12. 保存网元和链路样式模板

保存模板负责持久化，不会单独改变浏览器；第 13 步负责按模板 ID 应用。

- Method：`POST`
- URL：`{{base_url}}/api/v1/styles/templates`
- Body：`raw / JSON`

```json
{
  "name": "Postman ASG 与接入环样式",
  "scope": "version",
  "version_id": "{{version_id}}",
  "template": {
    "schema": "topo_visual_tool_style_template",
    "version": 1,
    "styles": {
      "nodeStyleRules": [
        {
          "source": "nodes",
          "mode": "all",
          "conditions": [
            {"field": "Role", "op": "eq", "value": "{{node_role}}"}
          ],
          "color": "#ff0066",
          "size": 20,
          "shape": "diamond"
        }
      ],
      "linkStyleRules": [
        {
          "source": "links",
          "mode": "all",
          "conditions": [
            {"field": "Link Type", "op": "eq", "value": "{{link_type}}"}
          ],
          "color": "#00aa55",
          "lineStyle": "dash",
          "width": "thick"
        }
      ]
    }
  }
}
```

Tests：

```javascript
pm.test("样式模板保存成功", function () {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  pm.environment.set("style_template_id", body.data.id);
});
```

`scope=global` 表示全局共享；`scope=version` 时必须提供 `version_id`。

## 13. 通过模板 ID 应用样式

- Method：`POST`
- URL：`{{base_url}}/api/v1/styles/templates/{{style_template_id}}/apply`
- Body：`raw / JSON`

```json
{
  "target": "active",
  "requested_by": "postman-style-template"
}
```

Tests：

```javascript
pm.test("模板应用命令已发布", function () {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  pm.environment.set("command_id", body.data.ui_command.id);
});
```

执行第 5 步确认 `rendered`。浏览器中的 ASG 节点和 Access-Ring 链路应恢复模板样式。

## 14. 清除过滤、高亮和样式

清除过滤、高亮和定位：

```json
{
  "target": "active",
  "requested_by": "postman-clear",
  "operations": [
    {"op": "clear_visualization"}
  ]
}
```

清除网元和链路样式：

```json
{
  "target": "active",
  "requested_by": "postman-clear-styles",
  "operations": [
    {"op": "clear_node_style_rules"},
    {"op": "clear_link_style_rules"}
  ]
}
```

注意：`clear_visualization` 只清除过滤、高亮和定位，不会清除样式规则。

## 15. 查询浏览器权威状态

- Method：`GET`
- URL：`{{base_url}}/api/v1/ui/state?target=active`

重点检查：

```json
{
  "data": {
    "status": "online",
    "ui_state": {
      "revision": 8,
      "state": {
        "version_id": "...",
        "view": "logic",
        "filter": {},
        "highlight": {},
        "node_style_rules": [],
        "link_style_rules": []
      }
    }
  }
}
```

该状态是浏览器下一次重连时需要恢复的权威状态。

## 16. 条件运算符

可通过 `GET {{base_url}}/api/v1/ui/capabilities` 查询完整能力。常用运算符：

| op | 含义 |
| --- | --- |
| `eq` | 精确等于 |
| `neq` | 不等于 |
| `contains` | 包含 |
| `not_contains` | 不包含 |
| `startswith` | 以指定内容开头 |
| `endswith` | 以指定内容结尾 |
| `in` | 属于逗号分隔列表 |
| `empty` | 为空 |
| `not_empty` | 非空 |
| `gt/gte/lt/lte` | 数值比较 |

`mode=all` 表示所有条件都满足，`mode=any` 表示任一条件满足。

## 17. 常见问题

### Postman 提示 Invalid protocol: post http

URL 栏只填写：

```text
{{base_url}}/api/v1/ui/commands
```

请求方法在左侧下拉框选择 `POST`，不要把 `POST` 写进 URL。

### 返回 Input should be a valid dictionary

Body 必须选择 `raw`，右侧格式选择 `JSON`，不要选择 `Text`。请求头应为：

```text
Content-Type: application/json
```

### 接口成功但网页没有变化

依次检查：

1. 浏览器访问的是同一个 `base_url`。
2. `GET /api/v1/ui/sessions` 存在在线页面。
3. 命令 `target` 使用 `active` 或正确的 `session_id`。
4. `GET /api/v1/ui/commands/{{command_id}}` 是否为 `rendered`。
5. 浏览器是否缓存旧 JavaScript；执行 `Ctrl+F5` 强制刷新。

### 样式保存成功但画布没有变化

`POST /api/v1/styles/templates` 只保存模板。必须继续调用：

```text
POST /api/v1/styles/templates/{{style_template_id}}/apply
```

或者直接调用 `set_node_style_rules`、`set_link_style_rules`。

### Logic Topo 没有呈现

逻辑视图最多支持 500 个当前可见网元。先调用 `set_filter` 缩小数据范围，再切换到 `logic`。

## 18. 其他查询接口

- `GET /api/v1/versions`：版本列表。
- `POST /api/v1/topology/query`：无状态拓扑查询，默认不改变浏览器。
- `POST /api/v1/layout/logic`：直接计算 NetworkX 逻辑布局。
- `GET /api/v1/metrics/summary/{{version_id}}`：默认指标。
- `POST /api/v1/metrics/custom`：自定义指标。
- `POST /api/v1/tables/query`：查询网元、链路或环链明细。
- `GET /api/v1/styles/templates?version_id={{version_id}}`：查询全局和版本样式模板。
