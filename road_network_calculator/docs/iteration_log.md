# 路网距离计算系统开发迭代日志

## 2026-07-05 Iteration 0：需求澄清与方案设计

### 已确认需求

- 路网边无方向，按无向图处理。
- CSV 只有一列，列名为 `WKT`。
- WKT 为 `LINESTRING`，表示路由几何。
- 距离输出单位为米，保留 1 位小数。
- 起点和终点不在路网节点上时，吸附到最近路网节点。
- 单次源宿最短路查询目标为 1 秒内完成。
- 需要测试几百米、几千米、几十千米三类查询。
- 后端采用 Python FastAPI。
- 前端采用开源且无需 API key 的地图组件。
- 允许使用 Leaflet + OpenStreetMap 在线底图。
- 远程仓库 URL 为 `https://github.com/TIAN-N/vibe_coding_project.git`。

### 仓库检查结果

- 工作区根目录：`D:\vibe_coding_project`
- 目标目录：`road_network_calculator`
- 远程仓库：

```text
origin https://github.com/TIAN-N/vibe_coding_project.git
```

- 普通 git 命令受 safe.directory 限制，后续 git 操作需使用：

```text
git -c safe.directory=D:/vibe_coding_project ...
```

- 当前存在一个与本任务无关的已修改文件：

```text
.claude/settings.local.json
```

后续提交时需要避免把该文件纳入本任务提交。

### 本轮产出

- 新增 `docs/design.md`
- 新增 `docs/iteration_log.md`

### 待用户确认

- 是否接受设计文档中的依赖、算法路线、前端方案和 mock 数据策略。
- 用户确认后进入 Iteration 1/2，开始工程骨架与算法核心实现。

## 2026-07-05 Iteration 1：工程骨架与核心能力实现

### 已完成

- 创建 Python 包 `road_network`。
- 实现 `RoadNetworkLoader`：
  - CSV 流式读取。
  - `WKT` 列校验。
  - `LINESTRING` 解析。
  - 节点坐标量化去重。
  - 无向边构建。
  - Haversine 边长计算。
  - CSR 邻接图构建。
  - `scipy.spatial.cKDTree` 最近节点索引。
- 实现 `RoadDistanceCalculator`：
  - 起点、终点最近路网节点吸附。
  - 双向 Dijkstra 最短路。
  - 路径坐标还原。
  - 查询耗时统计。
- 创建 FastAPI 服务：
  - `POST /api/network/upload`
  - `POST /api/route`
  - `GET /api/network/status`
- 创建 Leaflet + OpenStreetMap 前端页面：
  - CSV 上传。
  - 源宿经纬度输入。
  - 路径、吸附点和耗时展示。
- 创建 mock 数据生成脚本。
- 创建 benchmark 脚本。
- 创建轻量测试脚本 `scripts/run_tests.py`。

### 当前验证结果

轻量测试：

```text
PASS test_geometry
PASS test_loader_and_calculator
PASS total=2
```

小型 mock 数据：

```text
generated data\mock_small.csv nodes=900 edges=1740
load rows_edges=1740 nodes=900 edges=1740 time=0.137s invalid_rows=0
query short distance=197.6m snap=0.14ms search=0.05ms total=0.20ms path_nodes=3
query medium distance=1976.0m snap=0.04ms search=0.96ms total=1.01ms path_nodes=21
query long distance=5729.7m snap=0.04ms search=3.04ms total=3.10ms path_nodes=59
```

中型 mock 数据：

```text
generated data\mock_medium.csv nodes=90000 edges=179400
load rows_edges=179400 nodes=90000 edges=179400 time=1.845s invalid_rows=0
query short distance=197.6m snap=0.23ms search=0.87ms total=1.12ms path_nodes=3
query medium distance=2963.9m snap=0.07ms search=2.85ms total=2.94ms path_nodes=31
query long distance=58975.8m snap=0.08ms search=366.79ms total=367.20ms path_nodes=599
```

语法编译检查：

```text
python -m compileall road_network app scripts
```

结果：通过。

### 环境限制

- 当前环境已有：
  - `numpy 1.24.3`
  - `scipy 1.10.1`
- 当前环境缺失：
  - `pytest`
  - `fastapi`
- 执行 `python -m pip install -r requirements.txt` 时，pip 代理无法连接，依赖安装失败。
- 因此本轮已验证核心算法、脚本和语法编译；FastAPI 端到端服务需在依赖安装成功后运行验证。

### 下一步

- 修正发现的问题。
- 更新 README 和设计文档状态。
- 建立 git commit。
- 推送远程仓库。

## 2026-07-05 Iteration 2：路网展示、批量查询与交互增强设计

### 新增需求

- 上传路网后在 GIS 地图显示路网图层，默认青色线条。
- 支持用户控制路网图层颜色、线型、透明度、最大绘制数量和显隐。
- 避免百万路网在浏览器一次性全量渲染，采用后端抽样和前端分批绘制。
- 增加批量经纬度输入框，支持每行 4 个数字：

```text
100.491389 13.75 100.53485 13.7465
```

- 保存历史查询记录，点击历史记录可回放起终点和路径。
- 起点或终点距离路网最近节点超过 1km 时，吸附失败，不执行寻路。
- 增加中英文界面切换。
- 补充 README，让 Python 初学者可以按步骤使用工具或引用核心类。

### 设计决策

- 路网预览接口返回抽样边，不直接返回全量百万边。
- 历史查询存储在浏览器 `localStorage`，避免新增数据库依赖。
- 批量查询第一版按顺序串行调用后端，保证实现稳定；后续如有大量批处理需求可改为后端批量并发或后台任务。
- 吸附阈值放在后端统一校验，前端只负责提示。

### 已完成实现

- 新增 `GET /api/network/preview`：
  - 返回抽样路网线段。
  - 支持 `limit` 控制最大返回线段数。
- 新增 `POST /api/routes/batch`：
  - 支持批量源宿查询。
  - 单次最多 200 条。
- 扩展 `POST /api/route`：
  - 增加 1000m 最大吸附距离校验。
  - 起点或终点离路网超过 1km 时返回 400 错误。
- 扩展 `RoadDistanceCalculator.shortest_path`：
  - 支持 `max_snap_distance_m`。
  - 返回起点和终点吸附距离。
- 前端新增：
  - 路网图层抽样展示。
  - 路网颜色、线型、透明度、最大线段数、显隐控制。
  - 批量输入和结果列表。
  - 查询历史记录与点击回放。
  - 中英文切换。
- README 已重写为面向 Python 初学者的完整使用教程。

### 验证结果

```text
python scripts\run_tests.py
PASS test_geometry
PASS test_loader_and_calculator
PASS total=2
```

```text
python -m pytest
4 passed, 1 skipped
```

说明：`tests/test_api.py` 因当前环境缺少 `httpx` 被跳过。`httpx>=0.24` 已加入 `requirements.txt`，依赖完整环境会执行 FastAPI TestClient 测试。

```text
python -m compileall road_network app scripts
Result: passed
```

## 2026-07-05 Iteration 3：大规模路网局部连续渲染优化

### 问题分析

用户上传 Bangkok CSV 后，路网图层显示为不连续的片段，但算路结果连续。排查发现：

- Bangkok 路网共有 97,016 个节点、103,865 条无向边。
- 默认图层预览只返回 5,000 条边。
- 旧接口按全图边序列做间隔抽样，约每 20 条边显示 1 条。
- 算路使用完整 CSR 图，路网主连通分量占比约 97.81%，所以路径可以连续。

结论：不连续主要是全图抽样预览造成的 UI 视觉假象，不是原始路网或算法图断裂。

### 本轮实现

- `RoadNetwork` 增加无向边端点数组：
  - `edge_u`
  - `edge_v`
- `RoadNetworkLoader` 在构建 CSR 时同步输出无向边数组。
- 路网 metadata 增加边界：
  - `min_lon`
  - `min_lat`
  - `max_lon`
  - `max_lat`
- 新增接口：

```http
GET /api/network/viewport?west=...&south=...&east=...&north=...&limit=12000
```

- `viewport` 接口按当前地图 bbox 对边做向量化过滤。
- 若局部边数超过 `limit`，只在当前视野内抽样，而不是全图抽样。
- 前端上传路网后自动缩放到路网边界。
- 前端监听地图 `moveend` 和 `zoomend`，防抖加载当前视野路网。
- 前端继续使用分批绘制，避免大量 polyline 一次性阻塞 UI。

### 验证结果

Bangkok 全图：

```text
nodes=97016
edges=103865
```

曼谷中心 bbox：

```text
matched_edges=26028
returned_edges=12000
total_edges=103865
```

这说明新接口已经从“全图抽样”切换为“当前视野局部加载”。用户进一步放大后，`matched_edges` 会降低，显示会更接近局部完整路网。

## 2026-07-06 Iteration 4：异步上传加载与进度条

### 需求

- 未加载路网数据时，只保留上传路网数据区域。
- 路网加载完成后，再显示图层设置、寻路查询、批量查询、结果和历史记录等功能。
- 百万级或千万级 CSV 加载期间，前端需要显示动态进度条。

### 实现

- `RoadNetworkLoader.load_csv` 增加 `progress_callback`。
- CSV 解析阶段按文件字节读取位置估算 10%-70% 的进度。
- CSR 构建阶段报告 72%。
- KDTree 空间索引构建阶段报告 88%。
- 完成后报告 100%。
- 后端新增异步上传接口：

```text
POST /api/network/upload/start
GET /api/network/upload/status/{job_id}
```

- FastAPI 后端使用后台线程执行路网加载任务。
- 前端上传按钮下方新增线性进度条。
- 前端通过轮询 job status 更新进度条。
- 前端新增 `.requires-network` 区域控制，未加载时隐藏核心功能区。

### 验证

```text
node --check web\app.js
passed

python scripts\run_tests.py
PASS total=2

python -m pytest
6 passed, 1 skipped

python -m compileall road_network app scripts
passed
```

异步上传接口验证：

```text
POST /api/network/upload/start -> job_id
GET /api/network/upload/status/{job_id}
state=running stage=building_index progress=88.0 nodes=900 edges=1740
state=done stage=done progress=100.0 nodes=900 edges=1740
```

## 2026-07-06 Iteration 5：多光缆路径叠加与 CoNET 标识

### 需求

- 批量查询的多组起终点计算后，所有成功光缆路径默认同时显示到 GIS 地图。
- 每条路径默认随机或轮换使用不同颜色。
- 单条 `Calculate Route` 查询不再清除旧路径，而是作为可管理图层保留。
- 历史记录支持显示/取消显示某条或多条路径。
- 历史路径支持自定义颜色、粗细、线段样式。
- 重复源宿路由不重复记录。
- 页面左侧栏顶部增加 CoNET 产品 Logo 和 favicon。

### 实现

- 新增统一前端路径图层容器：

```text
routeOverlayLayer
routeOverlays
```

- 新增路径管理函数：
  - `addOrUpdateRouteOverlay`
  - `removeRouteOverlay`
  - `setRouteOverlayVisible`
  - `updateRouteOverlayStyle`
  - `focusRouteOverlay`
- 历史记录使用 `routeKey()` 按源宿坐标去重。
- 批量查询成功结果默认写入历史并显示到地图。
- 历史列表每条记录增加显示开关、颜色、粗细、线型和定位按钮。
- 新增 `web/favicon.svg`。
- 左侧栏顶部新增 CoNET 品牌区。

### 验证

```text
node --check web\app.js
passed

python scripts\run_tests.py
PASS total=2
```
## 2026-07-08 Iteration 6：批量源宿文件路由计算

### 需求

- 路网加载完成后，支持上传源宿对 CSV。
- 输入列为 `Src NE Name`、`Sink NE Name`、`Src Lon`、`Src Lat`、`Sink Lon`、`Sink Lat`。
- 后端批量计算每一对源宿的路网距离和完整路由。
- 输出 CSV 追加 `Straight Distance`、`Distance`、`Route`、`Error Detail`。
- 成功时 `Error Detail` 为空；失败时直接写入原因，不再输出 `Status` 列。
- 直线距离阈值默认 30km，单位 km。
- 默认 `workers=4`。
- 大路网下并发计算共享当前内存中的 CSR 图和空间索引，避免复制路网。
- 前端显示异步任务进度条、完成数/总数、成功数、失败数、阈值跳过数。
- 计算完成后支持下载结果 CSV。
- 支持按源网元名称和宿网元名称搜索预览路由，并在 GIS 地图回放。

### 实现

- 新增 `road_network/batch_router.py`：
  - `BatchRouteCalculator`
  - 流式读取源宿对 CSV。
  - 直线距离阈值过滤。
  - 调用 `RoadDistanceCalculator.shortest_path()`。
  - 输出 `LINESTRING(...)` 路由。
  - 并发计算结果按输入行顺序写出。
  - 保留前 1000 条成功结果用于前端预览。
- 扩展 `app/main.py`：
  - `POST /api/batch-routes/upload/start`
  - `GET /api/batch-routes/status/{job_id}`
  - `GET /api/batch-routes/download/{job_id}`
  - `GET /api/batch-routes/preview/{job_id}`
  - 批量任务启动时捕获当前 `_network` 和 `_calculator` 引用，避免任务运行中被新上传路网影响。
- 扩展 `web/index.html`、`web/app.js`、`web/styles.css`：
  - 新增批量源宿文件上传卡片。
  - 新增阈值和 workers 输入。
  - 新增批量任务进度条。
  - 新增结果下载按钮。
  - 新增源宿网元名称搜索预览。
  - 点击预览路由后加入地图图层和历史清单。
- 新增 `DT_test`：
  - `test_batch_route_functional.py`
  - `performance_dt.py`
  - `README.md`

### 验证

```text
node --check web\app.js
passed

python -m compileall app road_network DT_test
passed

python -m pytest DT_test tests -rs
9 passed, 2 skipped, 2 warnings
```

说明：

- 2 个 FastAPI `TestClient` 测试因当前环境缺少可用 `httpx` 被跳过。
- `requirements.txt` 已包含 `httpx>=0.24`，完整安装依赖后会执行接口测试。

### 性能 DT

大规模合成路网：

```text
python DT_test\performance_dt.py --grid-size 500 --pairs 200 --workers 4
```

结果：

```text
WKT rows=499000
nodes=250000
undirected_edges=499000
pairs=200
load_seconds=5.883
batch_seconds=3.854
avg_ms_per_pair=19.269
success=200
failed=0
```

报告已保存：

```text
docs/batch_route_performance_dt_report.md
```

## 2026-07-08 Iteration 7：曼谷路网节点源宿对与前端历史缓存清理

### 问题

- 之前用于 HTML 端到端测试的合成源宿对不在曼谷真实路网附近，上传曼谷路网后无法有效验证批量路由计算。
- 服务重启后，前端 `localStorage` 中仍保留旧历史路由；即使后端当前未加载路网，地图仍可能显示之前的历史路径。

### 实现

- 新增脚本：

```text
scripts/generate_source_sink_pairs.py
```

- 脚本读取指定 WKT 路网 CSV，构建路网图后计算最大连通分量，并从真实路网节点中随机抽样源宿点。
- 生成的源宿点直接落在路网节点上，吸附距离为 0，并且来自同一连通分量。
- 默认控制直线距离在 0.5km 到 25km，避免被 30km 默认阈值过滤。
- 新增曼谷批量源宿测试文件：

```text
data/bangkok_source_sink_pairs.csv
```

- 前端新增 `clearRouteCache()`：
  - 清空地图上的历史 route overlay。
  - 清空 `localStorage` 中的历史路由。
  - 清空批量查询结果和批量文件预览结果。
- `GET /api/network/status` 返回未加载路网时，自动清理旧缓存。
- 新路网加载完成时，也自动清理旧路由，避免不同路网的历史结果混用。

### 验证

生成命令：

```text
python scripts\generate_source_sink_pairs.py --network-csv data\osm_bangkok_roads.csv --output data\bangkok_source_sink_pairs.csv --count 300 --min-distance-km 0.5 --max-distance-km 25 --seed 20260708
```

生成结果：

```text
network nodes=97016
edges=103865
largest component nodes=94891
wrote pairs=300
```

批量算法校验：

```text
total=300
success=300
failed=0
skipped_by_threshold=0
elapsed_s=30.81
```

## 2026-07-08 Iteration 8：批量预览自动上图与下载文件名优化

### 问题

- 用户点击 `Search Preview Routes` 后，页面只在左侧生成匹配结果列表；需要再点击列表项才会在 GIS 地图显示路线。
- 这个交互不够直接，容易误判为预览查询没有返回路由。
- 批量结果下载文件名使用 job uuid，不方便人工识别生成时间。

### 实现

- `Search Preview Routes` 查询成功后，如果返回至少一条预览结果，前端自动将第一条匹配路由显示到 GIS 地图。
- 列表仍然保留，用户可以点击其他预览结果切换地图显示。
- 自动显示时同步写入 History，并显示源宿网元名称标签。
- 下载文件名改为分钟级时间戳：

```text
batch_route_result_YYYYMMDDHHMM.csv
```

示例：

```text
batch_route_result_202607081240.csv
```

### 验证

```text
node --check web\app.js
passed

python -m compileall app road_network DT_test scripts
passed

python -m pytest DT_test tests -q
10 passed, 2 skipped, 2 warnings
```

## 2026-07-08 Iteration 9：批量结果预览搜索可靠性与网元名称联想

### 问题

- 用户用 `BKK_SRC_00002` 和 `BKK_SINK_00002` 点击 `Search Preview Routes` 后，前端没有显示 GIS 路径，也没有写入 History。
- 下载的结果 CSV 中该源宿对已经成功计算，说明问题出在预览检索链路，而不是寻路算法。
- 旧实现的预览接口只查询后端内存中的 `preview_rows`，没有以最终结果 CSV 为准；一旦内存预览样本缺失或前端任务状态不完整，预览查询就可能查不到下载文件中已有的成功路由。

### 实现

- `GET /api/batch-routes/preview/{job_id}` 改为优先扫描已生成的结果 CSV。
- 预览查询现在与下载 CSV 保持一致：下载文件中存在的成功路由，搜索预览也能返回并在 GIS 地图显示。
- 预览响应新增：
  - `matched_tasks`
  - `message`
- 当源宿对不存在于任务清单中时，前端显示：

```text
输入的源宿对不在给定的任务清单中。
```

- 当源宿对存在但没有成功路线时，前端显示：

```text
该源宿对在任务清单中，但没有成功算出的路由。
```

- 新增名称联想接口：

```text
GET /api/batch-routes/names/{job_id}?src=...&sink=...
```

- 前端 `Search Src Name` 和 `Search Sink Name` 增加 `datalist`。
- 用户输入 `BKK` 时，会自动浮现源网元/宿网元候选名称。
- 名称候选从最终结果 CSV 中解析，避免只依赖前端缓存。

### 验证

新增 DT 用例验证 `BKK_SRC_00002 / BKK_SINK_00002` 这类记录可以从结果 CSV 被预览扫描命中，并且名称联想能返回对应候选。

```text
node --check web\app.js
passed

python -m compileall app road_network DT_test scripts
passed

python -m pytest DT_test tests -q
11 passed, 2 skipped, 2 warnings
```

## 2026-07-08 Iteration 10：批量寻路自适应性能优化

### 问题

曼谷 300 对源宿批量计算仍需要十几秒到三十秒，主要瓶颈在每一对源宿都独立执行 Python `heapq` 双向 Dijkstra。线程并发受 GIL 影响，无法充分利用多核。

### 过程

先尝试低风险优化：

- Dijkstra workspace 复用。
- 批量吸附缓存。

实测发现该方案没有带来收益，原因是当前图规模下 NumPy 全量初始化不是主瓶颈，Python 层 touched-node 重置和线程开销反而抵消收益。

随后改为引入 SciPy C 实现批量 Dijkstra：

- 将 CSR 图转换为 `scipy.sparse.csr_matrix`。
- 对同一批源节点使用 `scipy.sparse.csgraph.dijkstra` 批量计算。
- 使用返回的 predecessor 矩阵还原每条路径。
- 保持输出 `Distance` 和 `Route` 与原算法一致。

### 自适应策略

不是所有路网都适合 SciPy 批量矩阵方案。对于超大路网，`source_count x node_count` 距离矩阵和前驱矩阵可能过大。因此当前策略为：

```text
if total_rows <= 20000 and node_count <= 150000:
    use SciPy batch Dijkstra
else:
    use streaming Python bidirectional Dijkstra
```

### 曼谷 300 对验证

```text
network=data/osm_bangkok_roads.csv
pairs=data/bangkok_source_sink_pairs.csv
nodes=97016
edges=103865
pairs=300
```

结果：

```text
legacy_s=35.598
optimized_s=6.594
speedup=5.398x
avg_ms_per_pair=21.981
success=300
failed=0
distance_mismatches=0
```

### 大图 DT 验证

```text
python DT_test\performance_dt.py --grid-size 500 --pairs 200 --workers 4
```

结果：

```text
WKT rows=499000
nodes=250000
edges=499000
batch_seconds=5.280
avg_ms_per_pair=26.398
success=200
failed=0
```

该图超过 `SCIPY_BATCH_MAX_NODES=150000`，因此自动回退到低内存流式路径。

### 验证

```text
python -m pytest tests DT_test -q
11 passed, 2 skipped, 2 warnings

python -m compileall road_network app DT_test scripts
passed
```
