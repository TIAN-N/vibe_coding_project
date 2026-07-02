# 光缆最小共路由计算算法设计文档

## 1. 概述

本算法解决光纤光缆路由规划中的**最小共路由问题**：在道路网络中，为成对的光缆寻找最优路由，使两条光缆共享最大道路段落，同时满足最大绕行比例约束。

---

## 2. 接口调用方式

### 2.1 核心类

| 类名                     | 文件                         | 职责               |
| ------------------------ | ---------------------------- | ------------------ |
| `FiberCoRouteLoader`     | `fiber_co_route_loader.py`   | 路网图加载与构建   |
| `FiberCoRouteOperator`   | `fiber_co_route_operator.py` | 共路由计算核心逻辑 |
| `FiberCoRouteAlgoConfig` | `algo_params.py`             | 算法配置参数       |

### 2.2 调用流程

```python
# Step 1: 配置参数（可选，默认从 params.json 加载）
config = FiberCoRouteAlgoConfig(
    buffer_meter=1000,       # 坐标吸附阈值（米）
    max_detour_ratio=4.0,    # 最大绕行比例
    shared_distance_ratio=0.2
)

# Step 2: 加载路网图
loader = FiberCoRouteLoader(prob_config=config)
G = loader.load_graph()  # 返回 networkx.Graph

# Step 3: 创建算子
operator = FiberCoRouteOperator(G, config)

# Step 4: 执行计算
df_input = pd.read_excel("fiber_pairs.xlsx")
df_result = operator.main_func(df_input)

# Step 5: 输出结果
df_result.to_excel("result.xlsx", index=False)
```

### 2.3 主要接口签名

#### FiberCoRouteLoader
```python
def load_graph(self) -> nx.Graph
```
加载或构建路网图，支持从 pickle 缓存恢复。

#### FiberCoRouteOperator
```python
def main_func(self, df_pairs: pd.DataFrame) -> pd.DataFrame
```
主入口函数，接收光缆对 DataFrame，返回计算结果。

```python
def snap_to_graph(self, lon: float, lat: float) -> Tuple[Any, Point]
```
将经纬度坐标吸附到最近的路网节点。

```python
def solve_pair(self, G, demand_a, demand_b, skip_penalty=False) -> Dict
```
核心算法：对单对光缆计算最优共路由。

---

## 3. 数据输入输出

### 3.1 输入数据

#### 路网数据 (road_wkt.csv)
| 字段 | 类型   | 说明                            |
| ---- | ------ | ------------------------------- |
| wkt  | string | WKT 格式道路几何线（EPSG:4326） |

#### 光缆对数据 (Excel)
| 字段         | 类型   | 说明       |
| ------------ | ------ | ---------- |
| Ring_Id      | string | 环网编号   |
| SubTopo_Id   | string | 子拓扑编号 |
| Src_ne_name  | string | 源节点名称 |
| Sink_ne_name | string | 宿节点名称 |
| Src_lon      | float  | 源节点经度 |
| Src_lat      | float  | 源节点纬度 |
| Sink_lon     | float  | 宿节点经度 |
| Sink_lat     | float  | 宿节点纬度 |

#### 算法配置 (params.json)
```json
{
    "buffer_meter": 1000,
    "max_detour_ratio": 4.0,
    "shared_distance_ratio": 0.2
}
```

### 3.2 输出数据

| 字段                 | 类型   | 说明               |
| -------------------- | ------ | ------------------ |
| Ring_Id              | string | 环网编号           |
| SubTopo_Id           | string | 子拓扑编号         |
| Src_ne_name          | string | 源节点名称         |
| Sink_ne_name         | string | 宿节点名称         |
| Src_lat/Src_lon      | float  | 源坐标             |
| Sink_lat/Sink_lon    | float  | 宿坐标             |
| Fiber_distance       | float  | 路径总长度（米）   |
| Fiber_path           | string | 路由 WKT 几何      |
| Shared_path_distance | float  | 共路由段长度（米） |
| Shared_wkt           | string | 共路由段 WKT 几何  |
| Solution-ID          | string | 解编号             |

### 3.3 内部数据结构

#### 路网图 (nx.Graph)
- **节点**：道路交叉点，坐标元组 `(x, y)`（EPSG:3857）
- **边**：道路段，属性含 `length`（米）

#### 需求字典 (Demand)
```python
{
    'src': (x, y) or None,      # 吸附后的源节点坐标
    'sink': (x, y) or None,     # 吸附后的宿节点坐标
    'straight': float           # 直 线距离
}
```

#### 解字典 (Solution)
```python
{
    'pA_nodes': [(x1,y1), (x2,y2), ...],    # 光缆A路径节点序列
    'pB_nodes': [(x1,y1), (x2,y2), ...],    # 光缆B路径节点序列
    'pA_len': float,                         # 光缆A总长度
    'pB_len': float,                         # 光缆B总长度
    'shared_edges': {(u1,v1), (u2,v2), ...}, # 共用边集合
    'shared_len': float                       # 共用段总长度
}
```

---

## 4. 核心算法设计与实现

### 4.1 问题定义

给定道路网络图 $G(V, E)$ 和一对光缆需求 $(A, B)$：
- $A$ 的起止点：$(a_{src}, a_{sink})$
- $B$ 的起止点：$(b_{src}, b_{sink})$

求最优路径对 $(P_A, P_B)$，使得：
1. $P_A$ 连接 $(a_{src}, a_{sink})$，$P_B$ 连接 $(b_{src}, b_{sink})$
2. 绕行约束：$len(P_X) \leq straight(X) \times max\_detour\_ratio$
3. 共路由长度最大化：$\max len(P_A \cap P_B)$

### 4.2 算法流程

```
输入：光缆对 (A, B) 的起止坐标
输出：最优路径对及共用段

Step 1: 坐标吸附
    ├─ 将 A_src, A_sink, B_src, B_sink 吸附到最近路网节点
    └─ 计算各直 线距离 straight(A), straight(B)

Step 2: 计算独立最短路
    ├─ 计算 A 的最短路 P_A^shortest
    └─ 计算 B 的最短路 P_B^shortest

Step 3: 计算基线共用段
    └─ shared_baseline = edges(P_A^shortest) ∩ edges(P_B^shortest)

Step 4: 绕行约束校验
    ├─ 检查 |P_A^shortest| ≤ straight(A) × ratio
    ├─ 检查 |P_B^shortest| ≤ straight(B) × ratio
    └─ 若任一不满足，返回基线解

Step 5: 惩罚法优化（共轭梯度下降思想）
    ├─ 对最短路中的边施加penalty，迫使绕行
    ├─ 尝试penalty值：[1000, 100, 10]
    ├─ 尝试顺序：A先算/B先算
    └─ 选择满足约束且共用最大的解

Step 6: 输出最优解
    └─ 按 (shared_len asc, total_len asc) 排序返回
```

### 4.3 关键函数实现

#### snap_to_graph - 坐标吸附
```python
def snap_to_graph(self, lon, lat):
    pt = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(epsg=3857).iloc[0]
    dist, idx = self.kd_tree.query((pt.x, pt.y))  # KD树最近邻查询
    if dist <= self.buffer_meter:  # 在阈值内则吸附
        return self.nodes_list[idx], pt
    return None, pt  # 无法吸附
```

#### route_with_penalty - 带惩罚的最短路
```python
def route_with_penalty(G, pair_first, pair_second, penalty_factor, penalty_path):
    def calc_weight(u, v, d, penalized_edges):
        if (u, v) in penalized_edges or (v, u) in penalized_edges:
            return d['length'] * penalty_factor  # 被惩罚的边加权重
        return d['length']
    
    # 对 pair_second 计算带惩罚的最短路
    path_nodes = nx.shortest_path(
        G, pair_second['src'], pair_second['sink'],
        weight=lambda u, v, d: calc_weight(u, v, d, penalty_path)
    )
    return {'path_nodes': path_nodes, ...}
```

#### solve_pair - 核心求解
```python
def solve_pair(self, G, demand_a, demand_b, skip_penalty=False):
    # 1. 计算两条光缆的最短路径
    sol_a = route_with_penalty(G, demand_a, demand_b, None, None)
    sol_b = route_with_penalty(G, demand_b, demand_a, None, None)
    
    # 2. 计算共用边
    shared_edges = sol_a['path_edges'].intersection(sol_b['path_edges'])
    
    # 3. 构建基线解
    baseline = {...}
    
    # 4. 若跳过惩罚或基线已最优，返回基线
    if skip_penalty:
        return baseline
    
    # 5. 惩罚优化循环
    valid_solutions = []
    for is_A_first in [True, False]:
        penalty_path = sol_a['path_edges'] if is_A_first else sol_b['path_edges']
        first_demand = demand_a if is_A_first else demand_b
        second_demand = demand_b if is_A_first else demand_a
        
        for penalty in [1000, 100, 10]:
            # 计算被惩罚后的最短路
            penalized_sol = route_with_penalty(G, first_demand, second_demand, 
                                               penalty, penalty_path)
            # 计算另一条的最短路
            other_sol = route_with_penalty(G, second_demand, first_demand, None, None)
            
            # 计算新的共用边
            new_shared = penalized_sol['path_edges'].intersection(other_sol['path_edges'])
            
            # 验证约束
            if is_solution_valid(config.max_detour_ratio, demand_a, demand_b, solution):
                valid_solutions.append(solution)
    
    # 6. 选择最优解
    return sorted(valid_solutions, key=lambda x: (x['shared_len'], x['total_len']))[0]
```

### 4.4 图构建流程

```
WKT几何数据
    │
    ▼
┌────────────────────────────────────┐
│ 1. 解析WKT → GeoDataFrame (4326)   │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ 2. 投影变换至 EPSG:3857（米）       │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ 3. MultiLineString拆分为单一线段    │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ 4. 多进程批量提取边 (ProcessPool)   │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ 5. NumPy数组合并 + Pandas去重       │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ 6. 构建NetworkX图                   │
└────────────────────────────────────┘
```

### 4.5 算法复杂度

| 操作           | 时间复杂度             |
| -------------- | ---------------------- |
| KD树最近邻查询 | $O(\log N)$            |
| 最短路计算     | $O(E \log V)$          |
| 共用边计算     | $O(\min(L_A, L_B))$    |
| 惩罚优化循环   | $O(6 \times E \log V)$ |

其中 $N$ 为节点数，$V$ 为节点数，$E$ 为边数，$L_A, L_B$ 为两条路径的边数。

---

## 5. 配置参数说明

| 参数                    | 默认值 | 说明                                                   |
| ----------------------- | ------ | ------------------------------------------------------ |
| `buffer_meter`          | 1000   | 坐标吸附到路网的最大距离阈值（米），超过则认为无法吸附 |
| `max_detour_ratio`      | 4.0    | 允许的最大绕行比例（路径长度 / 直线距离）              |
| `shared_distance_ratio` | 0.2    | 目标共路由比例（当前实现未使用）                       |

---

## 6. 文件清单

| 文件                          | 行数 | 说明                 |
| ----------------------------- | ---- | -------------------- |
| `algo_params.py`              | 26   | 算法配置数据类与单例 |
| `fiber_co_route_loader.py`    | 384  | 路网加载与图构建     |
| `fiber_co_route_operator.py`  | 286  | 共路由计算核心算法   |
| `fiber_co_route_benchmark.py` | 521  | 性能基准测试         |
| `寻路规避公共路由v3.py`       | 180  | 旧版演示脚本         |
| 请你总结上述设计文档          |      |                      |