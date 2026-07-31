# Postman 接口测试说明

## 0. 启动服务

```powershell
cd D:\vibe_coding_project\Agent_plan_tool\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8011
```

Postman 中建议设置环境变量：

```text
base_url = http://127.0.0.1:8011
version_id = 上传接口返回的 version_id
```

## 1. 健康检查

- Method: `GET`
- URL: `{{base_url}}/api/v1/health`

预期：

```json
{
  "success": true,
  "data": {
    "status": "running"
  }
}
```

## 2. 上传拓扑数据

- Method: `POST`
- URL: `{{base_url}}/api/v1/uploads/topology`
- Body: `form-data`

字段：

| Key | Type | Required | Value |
| --- | --- | --- | --- |
| `device_file` | File | Yes | 网元表 CSV/XLSX |
| `link_file` | File | Yes | 链路表 CSV/XLSX |
| `ring_chain_file` | File | No | 环链表 CSV/XLSX |
| `version_name` | Text | No | 测试版本名称 |

可用测试文件：

```text
D:\vibe_coding_project\topo_visual_tool\test_data\logic_layout_mid_device.csv
D:\vibe_coding_project\topo_visual_tool\test_data\logic_layout_mid_link.csv
D:\vibe_coding_project\topo_visual_tool\test_data\logic_layout_mid_ring_chain.csv
```

返回后，将 `data.version_id` 保存到 Postman 环境变量 `version_id`。

## 3. 查询版本列表

- Method: `GET`
- URL: `{{base_url}}/api/v1/versions`

## 4. 统一拓扑查询：过滤 ASG 网元

- Method: `POST`
- URL: `{{base_url}}/api/v1/topology/query`
- Body: `raw / JSON`

```json
{
  "version_id": "{{version_id}}",
  "view": "logic",
  "actions": [
    {
      "type": "filter",
      "source": "nodes",
      "mode": "all",
      "conditions": [
        {"field": "Role", "op": "contains", "value": "ASG"}
      ]
    }
  ]
}
```

## 5. 统一拓扑查询：高亮 Down 链路

```json
{
  "version_id": "{{version_id}}",
  "view": "gis",
  "actions": [
    {
      "type": "highlight",
      "source": "links",
      "mode": "all",
      "conditions": [
        {"field": "Status", "op": "eq", "value": "Down"}
      ],
      "contrast": 0.72
    }
  ]
}
```

## 6. 统一拓扑查询：按环链标签过滤

```json
{
  "version_id": "{{version_id}}",
  "view": "logic",
  "actions": [
    {
      "type": "filter",
      "source": "ringChains",
      "mode": "all",
      "conditions": [
        {"field": "Label", "op": "contains", "value": "Ring"}
      ]
    }
  ]
}
```

## 7. 逻辑布局计算

- Method: `POST`
- URL: `{{base_url}}/api/v1/layout/logic`

```json
{
  "version_id": "{{version_id}}",
  "canvas_width": 1400,
  "canvas_height": 900,
  "actions": [
    {
      "type": "filter",
      "source": "nodes",
      "mode": "all",
      "conditions": [
        {"field": "Role", "op": "contains", "value": "ASG"}
      ]
    }
  ]
}
```

预期：`data.layout_available=true`，`data.nodes` 中包含 `id/x/y/role`。

## 8. 默认看板指标

- Method: `GET`
- URL: `{{base_url}}/api/v1/metrics/summary/{{version_id}}`

## 9. 自定义指标模板

- Method: `POST`
- URL: `{{base_url}}/api/v1/metrics/custom`

```json
{
  "version_id": "{{version_id}}",
  "metrics": [
    {
      "name": "按角色统计网元",
      "dataset": "devices",
      "aggregation": "group_count",
      "group_by": "Role"
    },
    {
      "name": "Down 链路数",
      "dataset": "links",
      "aggregation": "count",
      "filters": [
        {"field": "Status", "op": "eq", "value": "Down"}
      ]
    }
  ]
}
```

## 10. 保存指标模板

- Method: `POST`
- URL: `{{base_url}}/api/v1/metrics/templates`

```json
{
  "name": "运维常用指标",
  "description": "按角色、链路状态和环链标签统计",
  "metrics": [
    {
      "name": "角色分布",
      "dataset": "devices",
      "aggregation": "group_count",
      "group_by": "Role"
    },
    {
      "name": "链路状态",
      "dataset": "links",
      "aggregation": "group_count",
      "group_by": "Status"
    },
    {
      "name": "环链标签",
      "dataset": "ringChains",
      "aggregation": "group_count",
      "group_by": "Label"
    }
  ]
}
```

## 11. 查询表格数据

- Method: `POST`
- URL: `{{base_url}}/api/v1/tables/query`

```json
{
  "version_id": "{{version_id}}",
  "table_type": "ringChains",
  "limit": 100,
  "offset": 0
}
```

`table_type` 支持：

- `devices`
- `links`
- `ringChains`

## 12. 保存样式模板

- Method: `POST`
- URL: `{{base_url}}/api/v1/styles/templates`

```json
{
  "name": "默认运维样式",
  "scope": "global",
  "template": {
    "roleStyles": {
      "PE": {"color": "#4c83b6", "shape": "circle"},
      "ASG": {"color": "#d9893d", "shape": "square"},
      "CSG": {"color": "#6a9c89", "shape": "triangle"}
    },
    "nodeStyleRules": [],
    "linkStyleRules": [],
    "ringChainStyleRules": []
  }
}
```

## 13. 查询样式模板

- Method: `GET`
- URL: `{{base_url}}/api/v1/styles/templates`

指定版本时：

```text
{{base_url}}/api/v1/styles/templates?version_id={{version_id}}
```

