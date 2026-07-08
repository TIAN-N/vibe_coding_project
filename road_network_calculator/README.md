# Road Network Calculator

这是一个用 Python 开发的路网距离计算工具。它可以读取 WKT CSV 路网文件，把路网加载成高性能图结构，然后计算起点和终点之间的最短路网距离，并在网页地图上可视化展示。

项目包含三部分：

- `road_network/`：核心算法，负责加载路网和计算最短路。
- `app/`：FastAPI 后端，负责上传 CSV、调用算法、返回结果。
- `web/`：HTML 前端，负责地图展示、批量查询、历史记录和中英文切换。

## 1. 准备 Python 环境

建议使用 Python 3.8 或更高版本。

在 Windows PowerShell 中进入项目目录：

```powershell
cd D:\vibe_coding_project\road_network_calculator
```

安装依赖：

```powershell
python -m pip install -r requirements.txt
```

如果提示 `pip` 网络连接失败，需要先修复本机网络或 pip 代理。

## 2. 启动网页工具

在项目目录执行：

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

看到服务启动后，不要关闭 PowerShell 窗口。

然后在浏览器打开：

```text
http://127.0.0.1:8000
```

FastAPI 接口文档地址：

```text
http://127.0.0.1:8000/docs
```

## 3. 路网 CSV 格式

CSV 文件必须只有一列，列名为 `WKT`。

示例：

```csv
WKT
LINESTRING(116 39,116.001 39)
LINESTRING(116.001 39,116.002 39.001)
```

说明：

- 坐标顺序是 `经度 纬度`。
- 每个 `LINESTRING` 可以有两个或多个点。
- 多点 `LINESTRING` 会被拆成相邻点之间的无向边。
- 距离单位输出为米，保留 1 位小数。

## 4. 使用网页计算路由

1. 点击 `Select WKT CSV` 选择路网 CSV。
2. 点击 `Upload and Load` 上传并加载路网。
3. 上传按钮下方会显示加载进度条。
4. 路网加载完成后，页面会显示图层设置、寻路查询、批量查询、结果和历史记录等功能。
5. 地图上会显示当前视野范围内的路网图层，默认是青色线。
6. 输入起点和终点经纬度。
7. 点击 `Calculate Route`。
8. 地图会显示吸附后的起点、终点和最短路径。

如果起点或终点距离已加载路网超过 1km，系统会提示无法寻路。这通常表示上传的路网数据没有覆盖输入坐标所在区域。

大规模 CSV 加载说明：

- 百万级或千万级 CSV 加载可能持续几十秒到数分钟。
- 页面会通过异步任务轮询显示进度。
- 进度主要包括：保存上传文件、解析 WKT、构建路网图、构建空间索引。
- 加载完成前，寻路相关功能会隐藏，避免误操作。

## 5. 路网图层显示设置

网页支持：

- 是否显示路网图层。
- 修改路网线颜色。
- 修改线型：实线、虚线、点线。
- 修改透明度。
- 修改最大展示线段数。

为了避免浏览器一次性渲染百万级线段导致卡顿，前端只请求后端抽样后的路网线段，并分批绘制。

当前版本采用“当前视野局部加载”：

- 上传路网后，地图会自动缩放到路网数据范围。
- 移动或缩放地图时，前端只请求当前视野范围内的路网线段。
- 如果当前视野内线段仍然太多，会按 `Max lines` 限制在局部范围内抽样。
- 放大地图后，局部线段数量下降，路网显示会更连续。

如果你看到路网仍然有断裂，可以尝试：

- 放大地图。
- 调高 `Max lines`，例如 30000 或 50000。
- 确认上传的 CSV 覆盖当前地图区域。

## 6. 批量查询

批量输入框支持每行 4 个数字：

```text
100.491389 13.75 100.53485 13.7465
100.5418 13.7306 100.5502 13.7999
```

也支持逗号分隔：

```text
100.491389,13.75,100.53485,13.7465
```

点击 `Run Batch` 后，结果会显示在列表中。点击某条结果，可以在地图上回放对应路线。

## 7. 历史查询

成功查询的路线会保存在浏览器本地 `localStorage` 中，最多保存最近 30 条。

历史记录支持：

- 勾选显示或取消显示某条路径。
- 多条历史路径同时显示在地图上。
- 单独修改每条路径的颜色、粗细和线型。
- 点击定位按钮，将地图聚焦到该路径。

重复的起终点路由不会重复写入历史记录。

## 8. 中英文切换

页面右上角可以切换：

- `EN`
- `中文`

语言偏好会保存在浏览器本地。

## 9. 生成测试路网

生成小型网格路网：

```powershell
python scripts\generate_mock_data.py --output data\mock_small.csv --grid-size 30 --step 0.001
```

生成中型网格路网：

```powershell
python scripts\generate_mock_data.py --output data\mock_medium.csv --grid-size 300 --step 0.001
```

## 10. 下载 OSM 真实路网数据

项目提供了 OpenStreetMap 路网下载脚本，会通过 Overpass API 下载城市道路并转换成项目需要的 WKT CSV。

```powershell
python scripts\fetch_osm_roads.py --city bangkok --city manila --output-dir data
python scripts\fetch_osm_roads.py --city chiang_mai --city cebu --output-dir data
```

支持城市：

```text
bangkok
chiang_mai
manila
cebu
```

已生成的示例文件：

```text
data/osm_bangkok_roads.csv
data/osm_chiang_mai_roads.csv
data/osm_manila_roads.csv
data/osm_cebu_roads.csv
data/sample_routes.csv
```

OpenStreetMap 数据需要遵守 ODbL 授权和署名要求。

## 11. 运行测试

如果安装了 `pytest`：

```powershell
python -m pytest
```

如果没有安装 `pytest`，可以运行轻量核心测试：

```powershell
python scripts\run_tests.py
```

## 12. 性能测试

```powershell
python scripts\benchmark.py --csv data\mock_small.csv
python scripts\benchmark.py --csv data\mock_medium.csv
```

查询真实城市样例点：

```powershell
python scripts\query_samples.py --network-csv data\osm_bangkok_roads.csv --city Bangkok
python scripts\query_samples.py --network-csv data\osm_manila_roads.csv --city Manila
```

## 13. 在自己的 Python 代码中引用核心类

如果你只想使用算法能力，不需要网页，可以直接引用 `RoadNetworkLoader` 和 `RoadDistanceCalculator`。

示例：

```python
from road_network import RoadDistanceCalculator, RoadNetworkLoader

loader = RoadNetworkLoader()
network = loader.load_csv("data/osm_bangkok_roads.csv")

calculator = RoadDistanceCalculator(network)
result = calculator.shortest_path(
    start_lon=100.491389,
    start_lat=13.75,
    end_lon=100.53485,
    end_lat=13.7465,
    max_snap_distance_m=1000.0,
)

if result.reachable:
    print("distance:", result.distance_m, "m")
    print("path:", result.path)
else:
    print("No route found")
```

常用返回字段：

- `result.distance_m`：最短路距离，单位米。
- `result.path`：路径坐标列表，格式为 `[(lon, lat), ...]`。
- `result.snapped_start`：吸附后的起点。
- `result.snapped_end`：吸附后的终点。
- `result.snap_start_distance_m`：原始起点到最近路网节点距离。
- `result.snap_end_distance_m`：原始终点到最近路网节点距离。
- `result.timings_ms`：耗时统计。

## 14. 常见问题

### 页面地图是灰色

可能是浏览器无法访问当前底图瓦片。页面已经内置多个开源底图源，会自动尝试切换。也可以在地图右上角手动切换底图。

### 提示找不到 `uvicorn`

使用下面命令启动：

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

如果仍失败，说明依赖没有安装成功，重新执行：

```powershell
python -m pip install -r requirements.txt
```

### 提示起点或终点不在路网 1km 内

说明输入坐标附近没有被加载的路网节点。请确认：

- 上传的 CSV 是否覆盖该城市或区域。
- 输入经纬度是否写反。
- 坐标格式是否为 `经度 纬度`，不是 `纬度 经度`。
## 15. 批量源宿文件路由计算

路网加载完成后，侧边栏会显示 `Batch Route File` 功能区。

源宿对 CSV 需要包含以下 6 列：

```csv
Src NE Name,Sink NE Name,Src Lon,Src Lat,Sink Lon,Sink Lat
SiteA,SiteB,100.000000,13.000000,100.002000,13.000000
```

使用步骤：

1. 先上传并加载路网 WKT CSV。
2. 在 `Batch Route File` 中选择源宿对 CSV。
3. 设置直线距离阈值，默认 `30`，单位是 km。
4. 设置 workers，默认 `4`。
5. 点击 `Start Batch Routing`。
6. 等待进度条完成后，点击 `Download Result CSV` 下载结果。
7. 可输入源网元或宿网元名称，点击预览查询，并在 GIS 地图上回放对应路由。

结果 CSV 会追加：

```text
Straight Distance
Distance
Route WKT
Error Detail
```

成功时 `Error Detail` 为空；失败时会写入 `invalid coordinate`、`start_node can't snap to network`、`end_node can't snap to network`、`straight distance is longer than threshold` 或 `unreachable`。

## 16. DT 测试与性能测试

新增独立 DT 测试目录：

```text
DT_test/
```

运行功能 DT：

```powershell
python -m pytest DT_test
```

运行批量路由性能 DT：

```powershell
python DT_test\performance_dt.py --grid-size 500 --pairs 200 --workers 4
```

性能报告输出到：

```text
docs/batch_route_performance_dt_report.md
```

## 17. 曼谷真实路网批量验证数据

为了避免源宿点不在曼谷路网覆盖范围内，项目新增一份从曼谷路网真实节点随机抽样生成的批量源宿对文件：

```text
data/bangkok_source_sink_pairs.csv
```

推荐端到端测试方式：

1. 在 `Road Data` 上传并加载：

```text
data/osm_bangkok_roads.csv
```

2. 路网加载完成后，在 `Batch Route File` 上传：

```text
data/bangkok_source_sink_pairs.csv
```

3. 参数保持默认：

```text
Threshold km = 30
Workers = 4
```

这份文件包含 300 对源宿点，全部来自 `data/osm_bangkok_roads.csv` 的最大连通分量路网节点，直线距离控制在 0.5km 到 25km。后端算法校验结果为：

```text
total=300
success=300
failed=0
skipped_by_threshold=0
```

如果需要重新生成，可执行：

```powershell
python scripts\generate_source_sink_pairs.py --network-csv data\osm_bangkok_roads.csv --output data\bangkok_source_sink_pairs.csv --count 300 --min-distance-km 0.5 --max-distance-km 25 --seed 20260708
```

页面缓存说明：当后端显示当前没有加载路网，或新路网加载完成时，前端会自动清空历史路线和地图上的旧路线，避免服务重启后残留旧路由。
