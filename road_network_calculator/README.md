# Road Network Calculator

高性能路网 CSV 加载、最近节点吸附与无向最短路计算服务，包含 Python 算法核心、FastAPI 后端和 Leaflet 前端。

## 输入格式

CSV 只有一列，列名必须为 `WKT`：

```csv
WKT
LINESTRING(116 39,116.001 39)
```

`LINESTRING` 中相邻坐标点会被拆成无向路网边，距离单位为米。

## 安装依赖

```bash
python -m pip install -r requirements.txt
```

## 生成 mock 数据

```bash
python scripts/generate_mock_data.py --output data/mock_small.csv --grid-size 30 --step 0.001
python scripts/generate_mock_data.py --output data/mock_medium.csv --grid-size 300 --step 0.001
```

## 启动服务

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

浏览器打开：

```text
http://127.0.0.1:8000
```

## 运行测试

依赖完整时：

```bash
pytest
```

如果当前环境没有 `pytest`，可以运行轻量核心测试：

```bash
python scripts/run_tests.py
```

## 性能测试

```bash
python scripts/benchmark.py --csv data/mock_small.csv
python scripts/benchmark.py --csv data/mock_medium.csv
```

## 下载 OSM 真实路网数据

```bash
python scripts/fetch_osm_roads.py --city bangkok --city manila --output-dir data
python scripts/fetch_osm_roads.py --city chiang_mai --city cebu --output-dir data
```

支持城市：

```text
bangkok
chiang_mai
manila
cebu
```

运行样例点查询：

```bash
python scripts/query_samples.py --network-csv data/osm_bangkok_roads.csv --city Bangkok
python scripts/query_samples.py --network-csv data/osm_manila_roads.csv --city Manila
```
