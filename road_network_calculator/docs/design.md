# 路网距离计算系统需求与开发方案设计

## 1. 需求确认

### 1.1 输入数据

- 输入为 CSV 文件。
- CSV 仅包含一列，列名固定为 `WKT`。
- 每行是一个 GIS WKT `LINESTRING`，示例：

```text
LINESTRING(116 39,117 40)
LINESTRING(116.001 39.001,116.002 39.002,116.003 39.003)
```

- 每条 `LINESTRING` 表示一条路由几何。
- 路网边无方向，所有边按双向图处理。
- 如果一个 `LINESTRING` 包含多个坐标点，则相邻坐标点之间构成多条无向边。

### 1.2 查询输入

- 用户输入起点经纬度和终点经纬度。
- 起终点不在路网节点上时，吸附到最近路网节点。
- 吸附后基于路网图计算最短路。

### 1.3 输出

- 输出最短路网距离，单位为米，保留 1 位小数。
- 输出路径节点序列，用于前端地图可视化。
- 输出性能指标，包括吸附耗时、寻路耗时、总耗时。

### 1.4 性能目标

- 百万级路网 CSV 加载控制在 1-2 分钟内，越快越好。
- 单次源宿最短路查询需要在 1 秒内完成。
- 需要测试几百米、几千米、几十千米三类查询距离场景。

## 2. 总体架构

系统拆分为三层：

1. Python 算法核心层
   - 负责 CSV 加载、WKT 解析、图构建、空间索引构建、最短路计算。
   - 对外提供两个核心类：
     - `RoadNetworkLoader`
     - `RoadDistanceCalculator`

2. FastAPI 服务层
   - 提供路网 CSV 上传接口。
   - 提供路由计算接口。
   - 提供路网摘要与状态查询接口。
   - 挂载前端静态页面。

3. HTML 可视化前端
   - 使用 Leaflet + OpenStreetMap 开源底图。
   - 支持 CSV 上传。
   - 支持输入起点、终点经纬度。
   - 展示吸附点、最短路径、距离和耗时。

## 3. 目录设计

```text
road_network_calculator/
  docs/
    design.md
    iteration_log.md
  road_network/
    __init__.py
    loader.py
    calculator.py
    graph.py
    geometry.py
    spatial_index.py
  app/
    main.py
    schemas.py
  web/
    index.html
    app.js
    styles.css
  tests/
    test_geometry.py
    test_loader.py
    test_calculator.py
    test_api.py
  data/
    mock_small.csv
    mock_medium.csv
  scripts/
    generate_mock_data.py
    benchmark.py
  requirements.txt
  README.md
```

## 4. 核心数据结构设计

### 4.1 节点去重

WKT 中相同经纬度坐标应合并为同一个图节点。

考虑浮点坐标存在文本精度差异，设计采用坐标量化 key：

```text
node_key = (round(lon * scale), round(lat * scale))
```

初始建议：

- `scale = 1e7`
- 约等于经纬度精度 1e-7 度
- 对应米级约厘米到十厘米量级，足够支撑路网节点合并

节点保存为紧凑数组：

- `node_lons: array('d')` 或 `numpy.ndarray(float64)`
- `node_lats: array('d')` 或 `numpy.ndarray(float64)`
- `coord_to_node_id: dict[tuple[int, int], int]`

### 4.2 边与邻接表

路网是无向加权图。

加载阶段先构建临时邻接：

```python
adj[node_id].append((neighbor_id, distance_m))
```

百万级数据下，Python tuple/list 会有明显内存开销。开发分两阶段：

1. 第一版采用 `list[list[tuple[int, float]]]`，优先保证正确性和可测试性。
2. 性能优化版改为 CSR 压缩邻接结构：
   - `offsets: array[int32/int64]`
   - `neighbors: array[int32]`
   - `weights: array[float32/float64]`

最终查询阶段优先使用 CSR，降低内存并提升遍历局部性。

### 4.3 空间索引

起终点吸附到最近路网节点需要高性能最近邻查询。

优先方案：

- 使用 `scipy.spatial.cKDTree`
- 输入为节点经纬度投影后的二维坐标
- 查询复杂度约 `O(log N)`

为减少依赖风险，备选方案：

- 如果 `scipy` 不可用，退化为网格索引。
- 网格索引按经纬度固定网格分桶，向周围格子扩展搜索最近节点。

首选实现将 `scipy` 放入 `requirements.txt`，因为百万节点最近邻查询性能和稳定性更好。

## 5. 距离计算设计

### 5.1 边长计算

输入为 WGS84 经纬度，输出米。

采用 Haversine 距离：

```text
distance = 2 * R * asin(sqrt(a))
R = 6371008.8 meter
```

对城市级、几十公里级路网，Haversine 精度与性能平衡较好。

### 5.2 最短路算法

目标是单次查询 1 秒内完成。

初始实现采用：

- 起终点最近节点吸附：`cKDTree.query`
- 双向 Dijkstra：从源点和终点同时扩展
- 小根堆：`heapq`
- 访问距离数组复用：避免每次分配百万长度 dict
- 路径前驱数组按需记录

为什么不直接用普通 Dijkstra：

- 百万边路网下，普通单向 Dijkstra 在长距离查询时扩展节点过多。
- 双向 Dijkstra 在无向正权图上实现复杂度可控，通常能显著减少搜索空间。

后续可选增强：

- A*：使用直线 Haversine 距离作为启发函数。
- ALT landmarks：预处理 landmark 到所有节点的距离，提升中长距离查询。
- Contraction Hierarchies：查询最快，但开发复杂度高，适合作为后续专项优化。

第一版将实现双向 Dijkstra，并通过 benchmark 验证三类距离场景是否满足 1 秒目标。

## 6. 两个核心类设计

### 6.1 RoadNetworkLoader

职责：

- 读取 CSV。
- 解析 `WKT`。
- 构建节点表。
- 构建无向边。
- 计算边长。
- 构建 CSR 图。
- 构建最近邻空间索引。

建议接口：

```python
class RoadNetworkLoader:
    def __init__(self, coord_scale: float = 1e7):
        ...

    def load_csv(self, csv_path: str) -> "RoadNetwork":
        ...
```

输出 `RoadNetwork`：

```python
@dataclass
class RoadNetwork:
    node_lons: np.ndarray
    node_lats: np.ndarray
    offsets: np.ndarray
    neighbors: np.ndarray
    weights: np.ndarray
    spatial_index: object
    metadata: dict
```

### 6.2 RoadDistanceCalculator

职责：

- 根据输入经纬度查找最近路网节点。
- 执行双向 Dijkstra。
- 返回距离、路径和耗时。

建议接口：

```python
class RoadDistanceCalculator:
    def __init__(self, network: RoadNetwork):
        ...

    def shortest_path(
        self,
        start_lon: float,
        start_lat: float,
        end_lon: float,
        end_lat: float,
    ) -> RouteResult:
        ...
```

输出 `RouteResult`：

```python
@dataclass
class RouteResult:
    distance_m: float
    path: list[tuple[float, float]]
    snapped_start: tuple[float, float]
    snapped_end: tuple[float, float]
    timings_ms: dict
```

## 7. FastAPI 接口设计

### 7.1 上传并加载路网

```http
POST /api/network/upload
Content-Type: multipart/form-data
```

请求：

- `file`: CSV 文件

响应：

```json
{
  "ok": true,
  "nodes": 123456,
  "edges": 234567,
  "load_time_ms": 12345.6
}
```

### 7.2 查询路由

```http
POST /api/route
Content-Type: application/json
```

请求：

```json
{
  "start_lon": 116.1,
  "start_lat": 39.1,
  "end_lon": 116.2,
  "end_lat": 39.2
}
```

响应：

```json
{
  "distance_m": 1234.5,
  "path": [[116.1, 39.1], [116.11, 39.11]],
  "snapped_start": [116.1, 39.1],
  "snapped_end": [116.2, 39.2],
  "timings_ms": {
    "snap": 0.3,
    "search": 18.4,
    "total": 19.2
  }
}
```

### 7.3 路网状态

```http
GET /api/network/status
```

## 8. 前端设计

### 8.1 技术选型

- 原生 HTML/CSS/JavaScript
- Leaflet
- OpenStreetMap 瓦片
- 不需要商业 API key

### 8.2 页面能力

- CSV 上传控件。
- 路网加载状态展示。
- 起点、终点经纬度输入。
- 一键计算路由。
- 地图展示：
  - 起点吸附节点 marker
  - 终点吸附节点 marker
  - 最短路径 polyline
  - 可选展示部分路网抽样线段
- 结果面板展示：
  - 最短路距离，单位米，保留 1 位小数
  - 吸附耗时
  - 寻路耗时
  - 总耗时

## 9. Mock 数据与测试设计

### 9.1 Mock 数据

提供脚本生成网格路网：

- `mock_small.csv`：用于单元测试和前端快速演示。
- `mock_medium.csv`：用于本地性能测试。
- 百万级数据通过 `scripts/generate_mock_data.py --size large` 生成，不默认提交大文件。

### 9.2 单元测试

- WKT 解析测试。
- Haversine 距离测试。
- 节点去重测试。
- 无向边构建测试。
- 最近节点吸附测试。
- 最短路路径正确性测试。

### 9.3 性能测试

`scripts/benchmark.py` 覆盖：

- 加载耗时。
- 内存峰值。
- 几百米路径查询耗时。
- 几千米路径查询耗时。
- 几十千米路径查询耗时。

输出示例：

```text
load rows=1000000 nodes=... edges=... time=...s
query short distance=...m total=...ms
query medium distance=...m total=...ms
query long distance=...m total=...ms
```

## 10. 性能风险与优化路线

### 10.1 主要风险

- Python 纯对象邻接表在百万级路网下内存占用较高。
- WKT 字符串解析可能成为加载瓶颈。
- 长距离查询即使使用双向 Dijkstra，也可能在稠密大图上接近 1 秒上限。
- 路网不连通时，需要快速返回不可达。

### 10.2 优化策略

- WKT 解析采用轻量字符串扫描，避免引入重型 GIS 解析库。
- 加载时尽量流式读取 CSV，不一次性读入全部数据。
- 图最终转为 CSR 数组，减少 Python 对象开销。
- 查询时复用数组，减少重复分配。
- 优先实现双向 Dijkstra。
- benchmark 后再决定是否加入 A* 或 ALT landmarks。

## 11. 开发迭代计划

### Iteration 1：文档与工程骨架

- 建立 `road_network_calculator` 目录结构。
- 完成设计文档和迭代日志。
- 明确依赖与运行方式。

### Iteration 2：算法核心 MVP

- 实现 WKT 解析。
- 实现 CSV 加载。
- 实现节点去重。
- 实现图构建。
- 实现最近节点吸附。
- 实现双向 Dijkstra。
- 完成单元测试。

### Iteration 3：API 与前端

- 实现 FastAPI 服务。
- 实现 CSV 上传和路由接口。
- 实现 Leaflet 可视化页面。
- 完成端到端联调。

### Iteration 4：性能测试与优化

- 生成 mock 数据。
- 运行短、中、长距离 benchmark。
- 根据结果优化 CSR、解析、查询数组复用。
- 输出测试报告。

### Iteration 5：Git 提交与远程推送

- 检查工作区，避免覆盖无关改动。
- 建立 git commit。
- 推送到 `origin`。

## 12. 当前需要用户确认的设计点

用户已确认：

1. 第一版使用 `numpy`、`scipy`、`fastapi`、`uvicorn`、`python-multipart` 作为依赖。
2. 第一版最短路算法采用“双向 Dijkstra”，benchmark 后再决定是否追加 A*/ALT。
3. 大规模百万级 mock 数据由脚本生成，不直接提交到 git。
4. 前端只展示计算路径和吸附点，路网全量线段不默认绘制，避免浏览器渲染百万线段卡死。

## 13. 已实现状态

当前已完成第一版端到端源码：

- `RoadNetworkLoader`
- `RoadDistanceCalculator`
- FastAPI 接口
- Leaflet 前端
- mock 数据生成
- benchmark 脚本
- 核心算法测试脚本

当前环境由于 pip 代理无法连接，未能安装缺失的 `fastapi` 和 `pytest`，因此 FastAPI 端到端启动验证需在依赖安装成功后执行。核心算法已通过本地测试与 benchmark。

## 14. 交互增强设计

### 14.1 路网图层显示

上传 CSV 并加载完成后，后端提供两个路网可视化接口。

兼容的全图抽样预览接口：

```http
GET /api/network/preview?limit=5000
```

大规模路网推荐使用当前视野局部加载接口：

```http
GET /api/network/viewport?west=...&south=...&east=...&north=...&limit=12000
```

`viewport` 接口按地图当前 bbox 过滤路网边，只返回当前视野范围内的线段。如果局部线段数仍超过 `limit`，只在当前视野内均匀抽样。这样比全图抽样更容易保持视觉连续性。

前端默认以青色直线绘制，并提供：

- 是否显示路网图层。
- 路网线颜色。
- 路网线型：实线、虚线、点线。
- 路网透明度。
- 最大绘制线段数。

百万级路网不在浏览器一次性全量绘制。前端在地图移动、缩放、上传路网和刷新图层时，按当前视野请求局部路网，并分批渲染，减少主线程阻塞。

加载器会额外保存无向边端点数组：

```text
edge_u: np.ndarray
edge_v: np.ndarray
```

后端利用这些数组进行向量化 bbox 过滤，避免每次请求遍历 CSR 邻接结构。

### 14.2 批量经纬度查询

前端新增批量输入框，支持用户从 CSV 或文本中直接粘贴坐标。第一版支持每行 4 个数字：

```text
start_lon start_lat end_lon end_lat
100.491389 13.75 100.53485 13.7465
```

也兼容逗号分隔：

```text
100.491389,13.75,100.53485,13.7465
```

批量计算结果以列表展示。点击某条结果后，地图回放该条路由并回填单条查询输入框。

### 14.3 历史查询记忆

历史查询保存在浏览器 `localStorage`，默认保存最近 30 条成功查询。每条历史包含：

- 起点经纬度。
- 终点经纬度。
- 距离。
- 耗时。
- 路由路径。
- 查询时间。

用户点击历史记录时，前端回填起终点并重新展示对应路径。

### 14.4 吸附距离阈值

起点或终点距离最近路网节点超过 1000m 时，后端直接返回 400 错误，不执行最短路计算。

错误信息示例：

```text
Start or end point is more than 1000m from the loaded road network. Routing cannot continue.
```

前端根据当前语言显示中文或英文提示。

### 14.5 中英文切换

前端提供语言切换控件：

- English
- 中文

语言偏好保存在 `localStorage`。界面静态文案、状态提示、错误提示、结果标题同步切换。
