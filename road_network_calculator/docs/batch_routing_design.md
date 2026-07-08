# 批量高性能路由计算功能设计

## 1. 目标

在路网 CSV 已经加载完成后，支持用户上传源宿对 CSV，后台异步计算每一对源宿之间的路网距离和完整路由，并生成可下载结果 CSV。

输入 CSV 必须包含 6 列：

```text
Src NE Name
Sink NE Name
Src Lon
Src Lat
Sink Lon
Sink Lat
```

输出 CSV 保留原始 6 列，并追加：

```text
Straight Distance
Distance
Route
Error Detail
```

说明：

- `Straight Distance`：输入两点的球面直线距离，单位米，保留 1 位小数。
- `Distance`：路网最短距离，单位米，保留 1 位小数。
- `Route`：成功时输出 `LINESTRING(lon lat,lon lat,...)`。
- `Error Detail`：成功时为空；失败时写入原因。
- 不再输出 `Status` 列，避免“成功/失败状态”和错误原因重复表达。

## 2. 失败原因

当前实现支持以下失败原因：

```text
road network unavailable
invalid coordinate
straight distance is longer than threshold
start_node can't snap to network
end_node can't snap to network
unreachable
```

规则顺序：

1. 未加载路网时，接口直接返回 `road network unavailable`。
2. 经纬度无法解析时，结果行写入 `invalid coordinate`。
3. 两点直线距离超过阈值时，跳过路网寻路，写入 `straight distance is longer than threshold`。
4. 起点无法吸附到 1km 内路网节点时，写入 `start_node can't snap to network`。
5. 终点无法吸附到 1km 内路网节点时，写入 `end_node can't snap to network`。
6. 起终点都能吸附但图上不可达时，写入 `unreachable`。

## 3. 后端架构

```mermaid
flowchart TD
  UI[Web UI] --> Start[POST /api/batch-routes/upload/start]
  UI --> Poll[GET /api/batch-routes/status/{job_id}]
  UI --> Download[GET /api/batch-routes/download/{job_id}]
  UI --> Preview[GET /api/batch-routes/preview/{job_id}]

  Start --> Save[保存源宿对 CSV]
  Save --> Job[后台批量任务]
  Job --> Reader[流式读取 CSV]
  Reader --> Filter[直线距离阈值过滤]
  Filter --> Router[RoadDistanceCalculator.shortest_path]
  Router --> Writer[按输入行顺序流式写结果 CSV]
  Writer --> File[batch_route_result_{job_id}.csv]

  Poll --> State[内存任务状态]
  Download --> File
  Preview --> PreviewRows[内存预览结果]
```

核心类：

- `road_network.batch_router.BatchRouteCalculator`
- `app.main` 中的批量任务 API 和 job 状态管理

## 4. API 设计

### 启动批量计算

```http
POST /api/batch-routes/upload/start
Content-Type: multipart/form-data
```

表单字段：

```text
file: 源宿对 CSV
straight_distance_threshold_km: 直线距离阈值，单位 km，默认 30
workers: 并发 worker 数，默认 4
```

响应：

```json
{
  "job_id": "abc123"
}
```

### 查询进度

```http
GET /api/batch-routes/status/{job_id}
```

响应：

```json
{
  "job_id": "abc123",
  "state": "running",
  "progress": 52.3,
  "completed": 52300,
  "total": 100000,
  "success": 48000,
  "failed": 4300,
  "skipped_by_threshold": 1200,
  "message": "Calculating routes",
  "error": "",
  "download_ready": false
}
```

### 下载结果

```http
GET /api/batch-routes/download/{job_id}
```

返回 `text/csv` 文件：

```text
batch_route_result_{job_id}.csv
```

### 预览可视化结果

```http
GET /api/batch-routes/preview/{job_id}?src=SRC&sink=SINK&limit=50
```

第一版为了控制内存，只保存前 1000 条成功路由作为内存预览样本。用户可以按 `Src NE Name` 和 `Sink NE Name` 搜索这些样本，点击后解析 `Route` 的 `LINESTRING` 并显示到 GIS 地图，同时写入历史路由清单。

后续如果需要任意行检索，建议把结果同时写入 SQLite 或 Parquet 索引文件。

## 5. 性能实现

### 流式处理

源宿对可能达到几十万行，结果 CSV 可能达到几百 MB，因此实现不把输入和输出整体加载到内存：

- `csv.DictReader` 逐行读取源宿对。
- `csv.DictWriter` 逐行写出结果。
- 并发完成的结果按 `row_index` 缓冲，并按输入行顺序写出。
- 只在内存保留少量 pending future 和前 1000 条成功预览结果。

### 阈值过滤

默认直线距离阈值是 `30km`。如果两点球面距离已经超过阈值，直接跳过 Dijkstra，写入错误原因。

这一步可以显著减少大批量任务中的无效寻路。

### 并发策略

当前实现采用 `ThreadPoolExecutor`，默认 `workers=4`。

原因：

- 当前项目运行环境以 Windows + FastAPI 为主。
- Windows 多进程会复制或重新加载大对象，直接把 `RoadNetwork` 传给多个进程会导致内存成倍增长。
- 线程 worker 可以共享同一份已加载 CSR 图、NumPy 数组和 KDTree 空间索引，避免复制百万级路网。

注意：

- Python Dijkstra 主体仍受 GIL 影响，线程并发的 CPU 加速有限。
- 当前版本优先保证内存稳定和工程可用性。
- 后续真正需要多进程加速时，建议先把 CSR 数组和节点坐标改为 mmap/shared memory，再让 worker 进程只打开共享数组。

## 6. 前端交互

路网加载完成后，侧边栏显示 `Batch Route File` 卡片：

- 上传源宿对 CSV。
- 设置直线距离阈值，默认 30km。
- 设置 workers，默认 4。
- 点击开始后显示线性进度条。
- 进度详情显示 `completed / total`、成功数、失败数、阈值跳过数。
- 任务完成后显示结果下载按钮。
- 支持按源网元名和宿网元名搜索预览路由。
- 点击预览结果后，在 GIS 地图显示路线，并加入历史路由清单。

## 7. 已实现文件

后端：

```text
road_network/batch_router.py
app/main.py
app/schemas.py
```

前端：

```text
web/index.html
web/app.js
web/styles.css
```

测试：

```text
DT_test/test_batch_route_functional.py
DT_test/performance_dt.py
DT_test/README.md
```

报告：

```text
docs/batch_route_performance_dt_report.md
```
