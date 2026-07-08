# Road Network Calculator 历史工作总结

## 1. 高性能路网加载

已完成：

- 支持读取 WKT CSV 路网文件。
- 支持列名 `WKT` 和 `wkt`。
- 支持未加引号但内部含逗号的 `LINESTRING (...)`。
- 将多点 `LINESTRING` 拆分为相邻点之间的无向边。
- 使用坐标量化去重节点。
- 使用 CSR 图结构保存邻接关系。
- 使用 KDTree 空间索引支持最近路网节点吸附。

价值：

- 比 NetworkX 更节省内存。
- 百万级边数据可在本地机器上加载和查询。
- 适合后续批量最短路计算。

## 2. 单点路网距离计算

已完成：

- 输入起点、终点经纬度。
- 自动吸附到最近路网节点。
- 吸附距离超过 1km 时拒绝寻路。
- 使用双向 Dijkstra 计算最短路网距离。
- 返回距离、路径、吸附点和耗时统计。

价值：

- 提供核心寻路能力。
- 保持精确最短路，不使用近似算法。

## 3. FastAPI 后端服务

已完成：

- 路网上传接口。
- 异步路网加载接口。
- 路网加载进度轮询接口。
- 单点寻路接口。
- 小批量文本寻路接口。
- 批量文件寻路接口。
- 批量任务状态接口。
- 批量结果下载接口。
- 批量预览搜索接口。
- 批量源宿网元名称联想接口。

价值：

- 前后端职责清晰。
- 大文件加载和批量计算不阻塞浏览器。
- 用户可以通过进度条理解后台任务状态。

## 4. GIS 可视化前端

已完成：

- Leaflet GIS 地图页面。
- 开源 OSM/CARTO 底图。
- 路网加载前只显示上传区。
- 路网加载完成后显示查询、图层、结果、历史等功能。
- 当前视野局部加载路网线段，避免一次渲染百万级线段。
- 支持路网图层颜色、线型、透明度、最大线段数设置。
- 支持单条路径地图展示。
- 支持多条历史路径叠加展示。
- 支持历史路径显示/隐藏和样式调整。
- 支持中英文切换。
- 添加 CoNET 标识和 favicon。

价值：

- 用户可以直观看到路网覆盖范围和寻路结果。
- 大规模路网不会一次性压垮浏览器渲染。

## 5. 真实与模拟测试数据

已完成：

- 模拟小型/中型网格路网。
- 曼谷、马尼拉、清迈、宿务 OSM 路网数据采集脚本。
- 曼谷及周边区域大路网采集脚本。
- 曼谷真实路网节点源宿对：

```text
data/bangkok_source_sink_pairs.csv
```

该文件从 `data/osm_bangkok_roads.csv` 最大连通分量中抽样生成，300 对全部可达。

价值：

- 避免测试点不在路网覆盖区域。
- 可以稳定复现批量计算和预览功能。

## 6. 批量源宿文件寻路

已完成：

- 支持上传源宿对 CSV：

```text
Src NE Name
Sink NE Name
Src Lon
Src Lat
Sink Lon
Sink Lat
```

- 输出结果 CSV：

```text
Straight Distance
Distance
Route
Error Detail
```

- 成功时 `Error Detail` 为空。
- 失败时写入原因，例如：

```text
invalid coordinate
straight distance is longer than threshold
start_node can't snap to network
end_node can't snap to network
unreachable
```

- 默认直线距离阈值 30km。
- 默认 workers=4。
- 下载文件名改为分钟级时间戳：

```text
batch_route_result_YYYYMMDDHHMM.csv
```

价值：

- 支持从实际工程源宿清单批量生成距离和完整路由。
- 输出 CSV 可直接离线保存和复核。

## 7. 批量预览与网元名称联想

已完成：

- 批量计算完成后，可按源/宿网元名称搜索路由。
- 预览搜索直接扫描最终结果 CSV，保证与下载文件一致。
- 输入 `BKK` 可浮现相关源网元和宿网元候选。
- 搜索成功后自动将第一条结果显示到 GIS 地图并写入 History。
- 搜索源宿对不在任务清单中时，前端给出明确提示。

价值：

- 用户不需要打开几百 MB 结果文件就能回看某条路由。
- 避免“下载有结果但页面预览查不到”的不一致问题。

## 8. 前端缓存清理

已完成：

- 服务重启后，如果后端显示未加载路网，前端自动清理旧历史路径。
- 新路网加载完成后，自动清理旧路由叠加层和历史记录。

价值：

- 避免旧路网的路径残留在新会话或新路网中。
- 降低用户误判。

## 9. 批量寻路性能优化

已完成：

- 对 Python workspace 复用方案做实测，发现收益不稳定且在当前图规模下反而增加 Python 层开销。
- 引入 SciPy C 实现批量 Dijkstra。
- 增加自适应引擎选择：

```text
total_rows <= 20000 and node_count <= 150000 -> SciPy batch
otherwise -> streaming Python Dijkstra
```

曼谷 300 对实测：

```text
legacy=35.598s
optimized=6.594s
speedup=5.398x
distance_mismatches=0
```

价值：

- 常见城市级批量查询显著提速。
- 超大路网仍保留低内存流式兜底，避免距离矩阵过大。

## 10. DT 测试体系

已完成：

- 新增独立 `DT_test` 目录。
- 覆盖批量计算成功、阈值跳过、吸附失败、CSV 输出格式、下载文件名、预览搜索、名称联想。
- 新增性能 DT 脚本：

```text
DT_test/performance_dt.py
```

当前测试结果：

```text
11 passed, 2 skipped, 2 warnings
```

价值：

- 功能迭代后可以快速验证核心能力没有回退。
- 性能变化可复现、可记录。
