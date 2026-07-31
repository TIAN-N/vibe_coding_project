# API 设计

## 统一条件模型

所有过滤、高亮、定位、表格查询和指标统计都复用同一类条件：

```json
{
  "source": "nodes",
  "mode": "all",
  "conditions": [
    {"field": "Role", "op": "eq", "value": "ASG"}
  ]
}
```

`source` 支持：

- `nodes`：匹配网元表字段。
- `links`：匹配链路表字段，再投影到源宿网元。
- `ringChains`：匹配环链表字段，再从 `Member_path` 投影到网元和相邻路径段。

## 拓扑统一查询

```http
POST /api/v1/topology/query
```

```json
{
  "version_id": "20260731163001",
  "view": "logic",
  "actions": [
    {
      "type": "filter",
      "source": "nodes",
      "mode": "all",
      "conditions": [
        {"field": "Role", "op": "eq", "value": "ASG"}
      ]
    }
  ]
}
```

## 指标模板

指标模板采用声明式 JSON，而不是执行任意 Python 代码。大模型后续只需要根据用户语言需求生成如下规格：

```json
[
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
```

支持的聚合：

- `count`
- `count_distinct`
- `group_count`
- `sum`
- `avg`
- `min`
- `max`

