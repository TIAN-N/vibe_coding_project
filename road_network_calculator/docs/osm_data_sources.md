# OSM 路网数据来源与生成说明

## 数据来源

- 路网来源：OpenStreetMap。
- 获取方式：Overpass API。
- 数据筛选：提取 bbox 内带 `highway` 标签的 `way`，排除 `footway`、`cycleway`、`path`、`steps`、`track` 等非主要车行道路。
- 输出格式：项目算法要求的单列 `WKT` CSV。

## 生成命令

```bash
python scripts/fetch_osm_roads.py --city bangkok --city manila --output-dir data
```

也可以单独生成：

```bash
python scripts/fetch_osm_roads.py --city bangkok --output-dir data
python scripts/fetch_osm_roads.py --city manila --output-dir data
```

脚本会生成：

```text
data/osm_bangkok_roads.csv
data/osm_chiang_mai_roads.csv
data/osm_cebu_roads.csv
data/osm_manila_roads.csv
```

## 内置 bbox

- `bangkok`
- `chiang_mai`
- `manila`
- `cebu`

## 样例源宿点

样例点保存在：

```text
data/sample_routes.csv
```

这些点用于 UI 输入测试。路由计算时，算法会把输入点吸附到最近路网节点。

## 当前已生成文件

```text
data/osm_bangkok_roads.csv
data/osm_chiang_mai_roads.csv
data/osm_manila_roads.csv
data/osm_cebu_roads.csv
data/sample_routes.csv
```

## 验证结果

```text
Bangkok / Grand Palace to Siam Paragon:
reachable=True distance=5053.3m total=69.22ms

Bangkok / Lumphini Park to Chatuchak Market:
reachable=True distance=8348.5m total=161.96ms

Chiang Mai / Old City West-East:
reachable=True distance=466.0m total=0.99ms

Manila / Rizal Park to SM Mall of Asia:
reachable=True distance=4981.2m total=48.86ms

Manila / Intramuros to Makati Ayala Triangle:
reachable=True distance=7179.8m total=111.02ms

Cebu / Magellan's Cross to IT Park:
reachable=True distance=4727.5m total=48.36ms
```

## 许可说明

OpenStreetMap 数据按 ODbL 授权。使用和分发派生数据时，需要保留 OSM 署名并遵守 ODbL 要求。
