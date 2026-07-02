---
name: fiber-co-route-calculation-skill
description: 本Skill用于计算光纤对的共路由距离和共路由段，基于路网数据为光纤对计算最优的共享路径，在满足绕行约束的前提下，最大化共路由距离。是光缆风险分析的核心能力。
---
---
# 光缆共路由计算 Skill

## 核心能力说明

基于路网数据，为光纤对计算最优的共享路径。采用惩罚因子迭代优化策略，在满足光纤距离限制的前提下，最大化两条光纤之间的共路由距离。

**核心算法流程：**
1. 从 WKT 数据构建 NetworkX 路网图（支持多进程并行构建）
2. 建立 KD-Tree 用于快速坐标匹配
3. 对每对光纤端点匹配到最近的路网节点
4. 使用带惩罚因子的最短路径算法计算共路由
5. 选择满足绕行约束且共路由距离最优的方案

## 输入文件要求

**必需文件：**
| 文件名           | 说明                         | 必需 |
| ---------------- | ---------------------------- | ---- |
| `road_wkt.csv`   | 路网数据（WKT格式，Tab分隔） | 是   |
| `fiber_pair.csv` | 光纤对信息表                 | 是   |
| `params.json`    | 算法参数配置                 | 否   |

**可选参数（params.json）：**
| 参数名                | 类型  | 说明                           | 默认值 |
| --------------------- | ----- | ------------------------------ | ------ |
| max_detour_ratio      | float | 最大绕行比例（相对于直线距离） | 1.5    |
| shared_distance_ratio | float | 期望共路由距离比例             | 0.3    |
| buffer_meter          | float | 路网匹配缓冲距离（米）         | 1000   |

**输出文件：**
| 文件名                        | 说明                           |
| ----------------------------- | ------------------------------ |
| `fiber_route_calculation.csv` | 光纤路由计算结果               |
| `road_network_cache.pkl`      | 路网缓存（如首次运行自动生成） |

## 执行流程

**严格按以下步骤执行：**

1. **路网图构建**
   - 检查是否存在 road_network_cache.pkl 缓存文件
   - 若有缓存，直接加载；若无，从 road_wkt.csv 构建
   - 多进程并行处理 WKT 数据，将几何线段解析为图节点和边
   - 使用 nx.compose_all 合并子图

2. **KD-Tree 构建**
   - 从路网图节点构建 cKDTree 空间索引
   - 用于快速坐标匹配

3. **坐标匹配**
   - 对每个光纤对端点查询最近的 k 个路网节点
   - 若最近距离在 buffer_meter 内，则匹配成功
   - 若在 1km 内无路网匹配，跳过该光纤对计算

4. **共路由路径计算**
   - 惩罚因子列表：[1000, 100, 10, 1]
   - 从高惩罚因子开始迭代，逐渐降低
   - 计算第一条光纤的最短路径
   - 对第二条光纤的路径，对共享边施加惩罚因子
   - 选择满足绕行约束且共路由距离最优的方案

5. **结果输出**
   - 生成包含路由几何和共路由信息的结果文件
   - 每条光纤单独一行记录

## 接口调用方式

```python
from interface.fiber_co_route_interface import FiberCoRouteInterface

interface = FiberCoRouteInterface(argv=[
    '--input_folder_path', './input',
    '--output_folder_path', './output'
])
# interface.run()
```

## 特殊边界情况处理

| 情况                       | 处理方式                            |
| -------------------------- | ----------------------------------- |
| 端点在 1km 内无路网匹配    | 跳过该光纤对，记录为失败            |
| 相同光纤对重复计算         | 使用 route_cache 缓存，直接返回结果 |
| 每个 Ring_Id 必须恰好两行  | 若不满足，跳过该 Ring_Id            |
| road_wkt.csv 使用 Tab 分隔 | 第一列为 WKT 数据                   |
| 路网图构建失败             | 抛出异常，终止执行                  |

## 输入字段说明

### road_wkt.csv 字段说明

| 字段名 | 类型   | 说明                | 示例                           |
| ------ | ------ | ------------------- | ------------------------------ |
| wkt    | string | WKT格式的道路几何线 | "LINESTRING(116 39,117 40...)" |

### fiber_pair.csv 字段说明

| 字段名       | 类型   | 说明       | 示例          |
| ------------ | ------ | ---------- | ------------- |
| Ring_Id      | string | 环ID       | "Ring_01"     |
| SubTopo_Id   | string | 子拓扑ID   | "SubTopo_001" |
| Src_ne_name  | string | 源网元名称 | "NE001"       |
| Sink_ne_name | string | 宿网元名称 | "NE002"       |
| Src_lon      | float  | 源网元经度 | 116.4074      |
| Src_lat      | float  | 源网元纬度 | 39.9042       |
| Sink_lon     | float  | 宿网元经度 | 116.5074      |
| Sink_lat     | float  | 宿网元纬度 | 39.9542       |
| Solution-ID  | string | 解方案ID   | "solution_0"  |

## 输出字段说明

| 字段名               | 类型   | 说明                     | 示例              |
| -------------------- | ------ | ------------------------ | ----------------- |
| Ring_Id              | string | 环ID                     | "Ring_01"         |
| SubTopo_Id           | string | 子拓扑ID                 | "SubTopo_001"     |
| Src_ne_name          | string | 源网元名称               | "NE001"           |
| Sink_ne_name         | string | 宿网元名称               | "NE002"           |
| Src_lat              | float  | 源网元纬度               | 39.9042           |
| Src_lon              | float  | 源网元经度               | 116.4074          |
| Sink_lat             | float  | 宿网元纬度               | 39.9542           |
| Sink_lon             | float  | 宿网元经度               | 116.5074          |
| Fiber_distance       | float  | 计算得到的纤芯距离（米） | 15230.5           |
| Fiber_path           | string | 光纤路由路径（WKT格式）  | "LINESTRING(...)" |
| Shared_path_distance | float  | 共路由段距离（米）       | 8500.2            |
| Shared_wkt           | string | 共路由段WKT几何          | "LINESTRING(...)" |
| Solution-ID          | string | 解方案ID                 | "solution_0"      |

## 成功标准

- 所有匹配成功的端点都计算出路由路径
- Fiber_path 和 Shared_wkt 都是有效的 WKT 格式
- Shared_path_distance 不大于 Fiber_distance
- 共路由距离比例符合 shared_distance_ratio 约束   请你帮我总结上述的skill