# 逻辑拓扑布局算法设计文档

## 1. 概述

`SubTopoVisualize` 类实现了一套网络拓扑可视化布局算法，用于将网络设备及其连接关系绘制为可视化图形。算法支持两种布局模式：**GIS地理布局**（基于真实经纬度）和**逻辑布局**（基于图论算法自动排列）。

---

## 2. 接口调用方式

### 2.1 类初始化

```python
SubTopoVisualize(
    ip_link_path: str,      # IP链路CSV文件路径
    device_path: str,       # 设备CSV文件路径
    result_path: str,       # 环链识别结果JSON/CSV路径
    root_list: list = None  # 根节点列表（可选）
)
```

### 2.2 核心接口

| 方法                        | 说明                     |
| --------------------------- | ------------------------ |
| `compute_layout_base_gis()` | 基于GIS经纬度计算布局    |
| `_compute_layout()`         | 基于图论算法计算逻辑布局 |
| `draw_base_graph()`         | 绘制基础网络拓扑图       |
| `ring_link_visualize()`     | 可视化环和链的组合图     |
| `export_topology_json()`    | 导出拓扑数据为JSON       |
| `mark_edges()`              | 高亮标记指定边           |

### 2.3 调用示例

```python
visualizer = SubTopoVisualize(
    ip_link_path="ip_link.csv",
    device_path="device.csv",
    result_path="ring_link_result.json"
)

# 绘制基础拓扑图
visualizer.draw_base_graph(save_path="topology.png", use_gis_layout=True)

# 可视化环链
visualizer.ring_link_visualize(
    ring_type_list=["所有环"],
    link_type_list=["所有链"],
    save_path="ring_link.png"
)

# 导出JSON供前端使用
topology_data = visualizer.export_topology_json(save_path="topology.json")
```

---

## 3. 数据输入输出

### 3.1 输入数据

#### ip_link.csv
| 列名         | 类型   | 说明       |
| ------------ | ------ | ---------- |
| Src NE Name  | string | 源设备名称 |
| Sink NE Name | string | 宿设备名称 |

#### device.csv
| 列名      | 类型   | 说明                    |
| --------- | ------ | ----------------------- |
| NE Name   | string | 设备名称                |
| Role      | string | 设备角色 (asg/csg/core) |
| Longitude | float  | 经度（可选）            |
| Latitude  | float  | 纬度（可选）            |

#### result.json
```json
{
    "rings": [
        {
            "Ring Label": "环1",
            "Ring Member": ["A", "B", "C"],
            "Name": "环名称",
            "Index": 1
        }
    ],
    "links": [
        {
            "Link Label": "链1",
            "Link Member": ["X", "Y", "Z"],
            "Name": "链名称",
            "Index": 1
        }
    ]
}
```

### 3.2 输出数据

#### 图像输出
- PNG格式拓扑图，支持高dpi（300/500）
- 支持SVG坐标系统

#### JSON输出
```json
{
    "nodes": [
        {
            "id": "NE_NAME",
            "name": "NE_NAME",
            "type": "asg|csg|core",
            "color": "#FF6B6B",
            "shape": "square|triangle|circle",
            "logic": {"x": 100, "y": 200},
            "gis": {"x": 300, "y": 400},
            "latitude": 39.9,
            "longitude": 116.4
        }
    ],
    "edges": [...],
    "rings": [...],
    "links": [...],
    "statistics": {...},
    "layout": {"canvas_width": 4000, "canvas_height": 4000}
}
```

---

## 4. 核心算法设计

### 4.1 布局算法分类

| 布局模式 | 方法                                    | 适用场景             |
| -------- | --------------------------------------- | -------------------- |
| GIS布局  | `_map_gis_to_canvas_coords`             | 有真实经纬度数据     |
| 逻辑布局 | `kamada_kawai_layout` / `spring_layout` | 无地理信息或追求美观 |

### 4.2 GIS布局算法

#### 4.2.1 经纬度获取 `_get_device_gis_info`
从device表提取每个网元的 `(Longitude, Latitude)` 对。

#### 4.2.2 缺失经纬度填充 `_fill_missing_gis_by_neighbors`
对于缺失经纬度的节点，采用邻居节点坐标的平均值作为估计：
```
missing_node_coord = average(neighbor_coords)
```
若无邻居有经纬度，则使用全局重心。

#### 4.2.3 坐标重叠解决 `_resolve_overlapping_coords`
同一位置多个节点时，采用圆周分布避免重叠：
```
angle_i = 2π × i / num_nodes
offset_i = offset_scale × (i + 1) / num_nodes
```

#### 4.2.4 经纬度→画布坐标映射 `_map_gis_to_canvas_coords`
```
scale = min((width - 2×padding) / lon_range, (height - 2×padding) / lat_range)
x = padding + (lon - min_lon) × scale
y = height - padding - (lat - min_lat) × scale  # Y轴翻转
```

### 4.3 逻辑布局算法

#### 4.3.1 布局选择策略
```python
if num_nodes > 1000:
    pos = nx.spring_layout(G, k=0.5, iterations=50, seed=42)  # 性能优先
else:
    pos = nx.kamada_kawai_layout(G)  # 美观优先
```

#### 4.3.2 Kamada-Kawai Layout
基于力学模拟的布局算法，将图视为弹簧系统，最小化总能量。

#### 4.3.3 Spring Layout
经典力导向布局，节点间斥力、边上引力迭代平衡。

### 4.4 节点重叠解决 `_resolve_node_overlap`
检测距离小于阈值的节点对，互相远离：
```
overlap_dir = (pos_i - pos_j) / distance
offset = (min_distance - distance) / 2 + 0.001
pos_i += overlap_dir × offset
pos_j -= overlap_dir × offset
```

### 4.5 自适应尺寸计算 `_calculate_adaptive_sizes`

根据节点数量动态调整绘图参数：

| 参数           | 计算公式                                 | 约束范围 |
| -------------- | ---------------------------------------- | -------- |
| canvas_size    | 分段：>500→80, >200→60, >100→50, else→40 | 英寸     |
| base_node_size | canvas² / √num_nodes                     | 30~500   |
| font_size      | 8 × (20 / √num_nodes) / density_factor   | 2~12     |
| line_width     | 0.8 / density_factor                     | 0.2~2.0  |

不同节点类型大小系数：`core×3.0`, `asg×2.0`, `csg×1.0`

### 4.6 SVG坐标转换

#### 边界计算 `_calculate_bounds`
```
min_x = min(x for all nodes)
max_x = max(x for all nodes)
min_y = min(y for all nodes)
max_y = max(y for all nodes)
```

#### 缩放偏移计算 `_calculate_scale_and_offset`
```
scale = min((width - 2×padding) / range_x, (height - 2×padding) / range_y)
offset_x = padding + (width - 2×padding - range_x×scale) / 2 - min_x×scale
offset_y = padding + (height - 2×padding - range_y×scale) / 2 - min_y×scale
```

#### 坐标转换
```
svg_x = x × scale + offset_x
svg_y = height - (y × scale + offset_y)  # Y轴翻转
```

---

## 5. 可视化样式

### 5.1 节点样式

| 角色 | 形状     | 颜色           | 相对大小 |
| ---- | -------- | -------------- | -------- |
| ASG  | 正方形 ■ | #FF6B6B (橙红) | ×2.0     |
| CSG  | 三角形 ▲ | #95A5A6 (灰)   | ×1.0     |
| Core | 圆形 ●   | #5DADE2 (蓝)   | ×3.0     |

### 5.2 边样式
- 默认：`width=0.8`, `alpha=0.7`, 灰色
- 标记边：高亮色，宽度3.0

### 5.3 标签位置
- 标注在节点**下方**：`label_y = node_y - label_offset`
- 字体大小随节点数量自适应

---

## 6. 图构建流程

```
ip_link.csv + device.csv
         │
         ▼
┌─────────────────────────────────┐
│ 1. 提取所有设备节点              │
│ 2. 根据Role分类到asg/csg/core    │
│ 3. 构建边列表                    │
│ 4. 创建NetworkX无向图            │
│ 5. 构建三个角色子图              │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 图对象                          │
│ - self.graph (完整图)           │
│ - self.asg_graph (ASG子图)      │
│ - self.csg_graph (CSG子图)      │
│ - self.core_graph (Core子图)    │
└─────────────────────────────────┘
```

---

## 7. 关键处理逻辑

### 7.1 边标记 `mark_edges`
将被标记的边关联节点单独构建子图，沿重心连线向外偏移：
```
dx, dy = node_pos - center
radius = sqrt(dx² + dy²)
new_radius = radius + dist
new_pos = center + (node_pos - center) × (new_radius / radius)
```

### 7.2 环绘制 `_draw_rings`
- 环成员两两组合，若存在边则标记
- 支持"开环"判断（首尾不相连）

### 7.3 链绘制 `_draw_links`
- 相邻成员两两组成边进行标记

---

## 8. 性能优化策略

| 策略         | 说明                                       |
| ------------ | ------------------------------------------ |
| 延迟布局计算 | 首次绘图时才计算布局                       |
| 大图切换算法 | 节点>1000时用spring_layout替代kamada_kawai |
| 降dpi策略    | 大画布(>50英寸)降为300dpi                  |
| 缓存pos      | 布局计算后缓存，避免重复计算               |

---

## 9. 文件清单

| 文件                       | 行数 | 说明             |
| -------------------------- | ---- | ---------------- |
| `sub_topo_visual.py`       | 1000 | 拓扑可视化核心类 |
| 请帮我总结上述布局算法设计 |      |                  |