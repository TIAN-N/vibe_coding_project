# Bangkok 大规模路网数据采集与性能测试报告

## 1. 数据生成

本轮新增脚本：

```text
scripts/collect_bangkok_regional_roads.py
```

脚本通过 Overpass API 采集以下区域的 OpenStreetMap `highway` 路网：

- Bangkok core
- Bangkok east
- Bangkok west
- Bangkok north

输出文件：

```text
data/osm_bangkok_regions_edges.csv
```

文件未纳入 Git 提交，因为当前生成文件约 208MB，超过 GitHub 普通文件限制。需要重新生成时执行：

```powershell
python scripts\collect_bangkok_regional_roads.py --output data\osm_bangkok_regions_edges.csv --failures-output data\osm_bangkok_regions_failed_tiles.csv --tile-size 0.35 --sleep 0.2
```

## 2. 文件规模

```text
文件大小：198.76 MB
CSV 行数：3,430,022 行，包括表头
加载后节点数：3,052,731
加载后无向边数：3,176,733
原始边记录数：3,427,133
无效行数：1
经纬度范围：99.6710523,13.3842836 到 101.5223286,14.807199
```

## 3. 加载性能

直接 Python 加载：

```text
load_s=44.075s
metadata load_time_ms=43,564.86ms
```

Web 后端上传加载：

```text
HTTP_CODE=200
upload_elapsed_s=39.59s
nodes=3,052,731
edges=3,176,733
load_time_ms=37,637.50ms
```

结论：

- 当前 CSV 上传和解析百万级 WKT 文件可以正常完成。
- 约 208MB / 343 万行文件在本机加载耗时约 40 秒。
- 这个阶段暂未发现 Web 后端加载解析阻塞失败问题，但前端浏览器上传大文件时仍会受机器性能和浏览器网络栈影响。

## 4. 路由性能测试

测试接口：

```text
POST /api/route
```

测试数据均基于：

```text
data/osm_bangkok_regions_edges.csv
```

| 场景 | 起点 | 终点 | 路网距离 | API 总耗时 | 算法总耗时 | 寻路耗时 | 路径节点数 |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 约 10km | 100.5418,13.7306 | 100.5502,13.7999 | 9,149.1m | 364.13ms | 266.36ms | 263.56ms | 330 |
| 约 20km | 100.53485,13.7465 | 100.5968,13.5991 | 20,490.6m | 802.11ms | 796.44ms | 795.90ms | 472 |
| 约 30km | 100.53485,13.7465 | 100.4240,13.9170 | 27,953.3m | 1,706.08ms | 1,697.70ms | 1,696.93ms | 920 |
| 约 50km | 100.53485,13.7465 | 100.0621,13.8199 | 55,125.3m | 4,344.79ms | 4,338.10ms | 4,337.25ms | 1,180 |

样例点已追加到：

```text
data/sample_routes.csv
```

## 5. 性能结论

- 加载模块：当前实现对 300 万级边级 WKT CSV 可以在 1 分钟内完成加载，满足初始 1-2 分钟目标。
- 10km 和 20km 查询：当前双向 Dijkstra 可以做到 1 秒内。
- 约 30km 查询：当前耗时约 1.7 秒，已经超过 1 秒目标。
- 约 50km 查询：当前耗时约 4.3 秒，长距离查询存在明显性能瓶颈。

## 6. 后续优化建议

当前长距离瓶颈来自双向 Dijkstra 仍然需要扩展大量节点。建议下一轮专项优化：

- A*：用直线距离作为启发函数，减少搜索范围。
- ALT landmarks：预处理多个地标到所有节点的距离，提高中长距离查询速度。
- Contraction Hierarchies：预处理成本高，但查询性能最好，适合稳定大规模路网。

