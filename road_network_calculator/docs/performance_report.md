# 路网距离计算性能测试报告

## 测试环境

- 日期：2026-07-05
- Python：3.8.2
- NumPy：1.24.3
- SciPy：1.10.1

## 测试数据

### mock_small.csv

- 网格大小：30 x 30
- 节点数：900
- 无向边数：1,740

### mock_medium.csv

- 网格大小：300 x 300
- 节点数：90,000
- 无向边数：179,400

## 测试命令

```bash
python scripts\run_tests.py
python scripts\benchmark.py --csv data\mock_small.csv
python scripts\benchmark.py --csv data\mock_medium.csv
python -m compileall road_network app scripts
```

## 核心测试结果

```text
PASS test_geometry
PASS test_loader_and_calculator
PASS total=2
```

## benchmark 结果

### mock_small.csv

```text
load rows_edges=1740 nodes=900 edges=1740 time=0.137s invalid_rows=0
query short distance=197.6m snap=0.14ms search=0.05ms total=0.20ms path_nodes=3
query medium distance=1976.0m snap=0.04ms search=0.96ms total=1.01ms path_nodes=21
query long distance=5729.7m snap=0.04ms search=3.04ms total=3.10ms path_nodes=59
```

### mock_medium.csv

```text
load rows_edges=179400 nodes=90000 edges=179400 time=1.845s invalid_rows=0
query short distance=197.6m snap=0.23ms search=0.87ms total=1.12ms path_nodes=3
query medium distance=2963.9m snap=0.07ms search=2.85ms total=2.94ms path_nodes=31
query long distance=58975.8m snap=0.08ms search=366.79ms total=367.20ms path_nodes=599
```

## 结论

- 当前双向 Dijkstra + cKDTree 最近节点吸附方案在 9 万节点、17.9 万边 mock 数据上，几十千米查询可在 1 秒内完成。
- 百万级加载与查询仍需在真实或百万级生成数据上继续压测。
- 如真实路网长距离查询超过 1 秒，可继续加入 A* 或 ALT landmark 预处理。

## 已知限制

- 当前环境 pip 代理不可用，未能安装缺失的 `fastapi` 和 `pytest`。
- FastAPI 端到端服务需在依赖安装成功后补充启动验证。

## OSM 真实城市路网补充测试

### 生成文件

```text
data/osm_bangkok_roads.csv
data/osm_chiang_mai_roads.csv
data/osm_manila_roads.csv
data/osm_cebu_roads.csv
data/sample_routes.csv
```

### 文件规模

```text
osm_bangkok_roads.csv     3,259,859 bytes
osm_chiang_mai_roads.csv  1,304,144 bytes
osm_manila_roads.csv      2,676,052 bytes
osm_cebu_roads.csv        1,856,536 bytes
```

### 样例查询

```text
Bangkok: Grand Palace to Siam Paragon
reachable=True distance=5053.3m total=69.22ms

Bangkok: Lumphini Park to Chatuchak Market
reachable=True distance=8348.5m total=161.96ms

Chiang Mai: Old City West-East
reachable=True distance=466.0m total=0.99ms

Manila: Rizal Park to SM Mall of Asia
reachable=True distance=4981.2m total=48.86ms

Manila: Intramuros to Makati Ayala Triangle
reachable=True distance=7179.8m total=111.02ms

Cebu: Magellan's Cross to IT Park
reachable=True distance=4727.5m total=48.36ms
```
