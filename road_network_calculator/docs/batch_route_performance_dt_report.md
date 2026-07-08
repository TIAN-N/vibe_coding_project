# 批量路由 DT 测试与性能报告

## 1. 测试范围

本轮新增独立 `DT_test` 测试目录，覆盖：

- 批量源宿 CSV 读取。
- 输出 CSV 字段和行顺序。
- 成功路由距离与 `LINESTRING` 输出。
- 直线距离阈值跳过。
- 非法经纬度。
- 起点无法在 1km 内吸附到路网。
- 批量任务进度回调。
- 可复现合成大规模路网性能测试。

## 2. 功能测试结果

执行命令：

```powershell
python -m pytest DT_test tests -rs
```

结果：

```text
9 passed, 2 skipped, 2 warnings
```

说明：

- `DT_test/test_batch_route_functional.py` 中 3 个算法 DT 用例已通过。
- `tests/` 中原有 6 个基础测试已通过。
- 2 个 FastAPI `TestClient` 接口测试被跳过，原因是当前本地 Python 环境缺少可用的 `httpx` 包；`requirements.txt` 已声明 `httpx>=0.24`，依赖完整安装后会自动执行。

## 3. 大规模性能 DT

执行命令：

```powershell
python DT_test\performance_dt.py --grid-size 500 --pairs 200 --workers 4
```

测试数据是离线合成 WKT 网格路网，不依赖外网。

| Metric | Value |
| --- | ---: |
| grid_size | 500 |
| WKT rows | 499000 |
| nodes | 250000 |
| undirected edges | 499000 |
| pairs | 200 |
| workers | 4 |
| threshold km | 30.0 |
| generation seconds | 1.137 |
| load seconds | 5.883 |
| batch seconds | 3.854 |
| avg ms per pair | 19.269 |
| success | 200 |
| failed | 0 |
| skipped by threshold | 0 |
| result csv MB | 0.32 |

## 4. 中等规模回归性能 DT

执行命令：

```powershell
python DT_test\performance_dt.py --grid-size 180 --pairs 1000 --workers 4
```

| Metric | Value |
| --- | ---: |
| WKT rows | 64440 |
| nodes | 32400 |
| undirected edges | 64440 |
| pairs | 1000 |
| workers | 4 |
| threshold km | 30.0 |
| load seconds | 0.847 |
| batch seconds | 15.141 |
| avg ms per pair | 15.141 |
| success | 1000 |
| failed | 0 |
| skipped by threshold | 0 |

## 5. 结论

- 批量计算模块可以在不复制路网图的前提下，使用 4 个线程 worker 共享同一份 CSR 图和空间索引。
- 49.9 万 WKT 边的合成大路网加载耗时约 5.9 秒，批量 200 对源宿平均约 19.3 ms/对。
- 输出文件采用流式写入，适合几百 MB 结果文件。
- 当前线程并发主要优化吞吐和工程稳定性；如果未来要对几十万对长距离源宿进行极限加速，应进一步实现 mmap/shared-memory CSR 和多进程 worker。
