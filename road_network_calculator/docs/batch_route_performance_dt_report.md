# 批量路由 DT 测试与性能报告

## 1. 测试范围

本报告覆盖批量源宿文件路由计算的功能正确性和性能表现：

- 批量源宿 CSV 读取。
- 成功/失败结果写出。
- 路由 `LINESTRING(...)` 输出。
- 直线距离阈值跳过。
- 预览搜索与结果 CSV 一致性。
- 中等/较大路网下 SciPy 批量 Dijkstra 加速。
- 超过阈值的大路网自动回退低内存流式寻路。

## 2. 功能测试

执行命令：

```powershell
python -m pytest DT_test tests -q
```

最近结果：

```text
11 passed, 2 skipped, 2 warnings
```

## 3. 曼谷真实路网 300 对源宿性能对比

测试文件：

```text
data/osm_bangkok_roads.csv
data/bangkok_source_sink_pairs.csv
```

路网规模：

```text
nodes=97016
edges=103865
source_sink_pairs=300
```

对比结果：

| Metric | Legacy Python Dijkstra | Optimized Adaptive Batch |
| --- | ---: | ---: |
| total seconds | 35.598 | 6.594 |
| avg ms per pair | 118.660 | 21.981 |
| success | 300 | 300 |
| failed | 0 | 0 |
| distance mismatches | 0 | 0 |
| speedup | - | 5.398x |

## 4. 合成大规模路网 DT

执行命令：

```powershell
python DT_test\performance_dt.py --grid-size 500 --pairs 200 --workers 4
```

结果：

| Metric | Value |
| --- | ---: |
| grid_size | 500 |
| WKT rows | 499000 |
| nodes | 250000 |
| undirected edges | 499000 |
| pairs | 200 |
| workers | 4 |
| threshold km | 30.0 |
| generation seconds | 1.159 |
| load seconds | 5.660 |
| batch seconds | 12.794 |
| avg ms per pair | 63.968 |
| success | 200 |
| failed | 0 |
| skipped by threshold | 0 |
| result csv MB | 0.32 |

说明：

- 该合成图节点数为 25 万，未超过当前 50 万节点阈值，因此使用 SciPy 批量 Dijkstra。
- 超过 50 万节点后，系统会自动回退到低内存流式 Python 双向 Dijkstra。

## 5. 当前自适应策略

```text
if total_rows <= 20000 and node_count <= 500000:
    use SciPy batch Dijkstra
else:
    use streaming Python bidirectional Dijkstra
```

策略说明：

- 用户确认将“大规模路网回退阈值”放宽到 50 万节点级。
- 50 万节点以内优先使用 SciPy 批量 Dijkstra，以减少 Python heapq 循环开销。
- 超过 50 万节点后，为避免生成过大的 `source_count x node_count` 距离矩阵和前驱矩阵，回退到低内存流式寻路。

## 6. 后续优化方向

- 增加 UI/接口层批量引擎参数：`auto / scipy / streaming`。
- 对超大路网引入 A* 或 ALT landmark，减少搜索节点扩展。
- 对高频相同源节点任务做分组单源多终点优化。
- 将 CSR 数组 mmap 化，再做真正多进程共享内存并行。
