# 批量路由 DT 测试与性能报告

## 1. 测试范围

本报告覆盖批量源宿文件路由计算的功能正确性和性能表现：

- 批量源宿 CSV 读取。
- 成功/失败结果写出。
- 路由 `LINESTRING(...)` 输出。
- 直线距离阈值跳过。
- 预览搜索与结果 CSV 一致性。
- 中等路网下 SciPy 批量 Dijkstra 加速。
- 大路网下自动回退低内存流式寻路。

## 2. 功能测试

执行命令：

```powershell
python -m pytest DT_test tests -q
```

结果：

```text
11 passed, 2 skipped, 2 warnings
```

说明：

- 2 个 FastAPI `TestClient` 测试因当前环境缺少可用 `httpx` 被跳过。
- `requirements.txt` 已声明 `httpx>=0.24`，完整安装依赖后会自动执行接口测试。

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

结论：

- 曼谷 300 对源宿从约 35.6 秒优化到约 6.6 秒。
- 距离结果完全一致。
- 加速来自 SciPy C 实现的批量 Dijkstra，而不是 Python 线程并发。

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
| generation seconds | 1.109 |
| load seconds | 5.849 |
| batch seconds | 5.280 |
| avg ms per pair | 26.398 |
| success | 200 |
| failed | 0 |
| skipped by threshold | 0 |
| result csv MB | 0.32 |

说明：

- 25 万节点合成大图不启用 SciPy 批量矩阵方案。
- 系统自动回退到低内存流式寻路，避免一次生成过大的距离矩阵和前驱矩阵。

## 5. 自适应策略

当前批量计算策略：

```text
if total_rows <= 20000 and node_count <= 150000:
    use SciPy batch Dijkstra
else:
    use streaming Python bidirectional Dijkstra
```

原因：

- 中等路网下，SciPy 批量 Dijkstra 可以显著减少 Python heapq 循环开销。
- 超大路网下，SciPy 会生成 `source_count x node_count` 的距离矩阵和前驱矩阵，内存和耗时可能反而增加。
- 因此需要按任务规模和路网规模自适应选择引擎。

## 6. 后续优化方向

- 增加可配置批量引擎参数：`auto / scipy / streaming`。
- 对超大路网引入 A* 或 ALT landmark，减少搜索节点扩展。
- 对高频相同源节点任务做分组单源多终点优化。
- 将 CSR 数组 mmap 化，再做真正多进程共享内存并行。
