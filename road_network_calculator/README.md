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
3. 地图上会显示抽样路网图层，默认是青色线。
4. 输入起点和终点经纬度。
5. 点击 `Calculate Route`。
6. 地图会显示吸附后的起点、终点和最短路径。

如果起点或终点距离已加载路网超过 1km，系统会提示无法寻路。这通常表示上传的路网数据没有覆盖输入坐标所在区域。

## 5. 路网图层显示设置

网页支持：

- 是否显示路网图层。
- 修改路网线颜色。
- 修改线型：实线、虚线、点线。
- 修改透明度。
- 修改最大展示线段数。

为了避免浏览器一次性渲染百万级线段导致卡顿，前端只请求后端抽样后的路网线段，并分批绘制。

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

点击历史记录，可以回填起点、终点，并重新展示当时的路径。

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

