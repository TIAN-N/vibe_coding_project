# 路网距离计算系统开发迭代日志

## 2026-07-05 Iteration 0：需求澄清与方案设计

### 已确认需求

- 路网边无方向，按无向图处理。
- CSV 只有一列，列名为 `WKT`。
- WKT 为 `LINESTRING`，表示路由几何。
- 距离输出单位为米，保留 1 位小数。
- 起点和终点不在路网节点上时，吸附到最近路网节点。
- 单次源宿最短路查询目标为 1 秒内完成。
- 需要测试几百米、几千米、几十千米三类查询。
- 后端采用 Python FastAPI。
- 前端采用开源且无需 API key 的地图组件。
- 允许使用 Leaflet + OpenStreetMap 在线底图。
- 远程仓库 URL 为 `https://github.com/TIAN-N/vibe_coding_project.git`。

### 仓库检查结果

- 工作区根目录：`D:\vibe_coding_project`
- 目标目录：`road_network_calculator`
- 远程仓库：

```text
origin https://github.com/TIAN-N/vibe_coding_project.git
```

- 普通 git 命令受 safe.directory 限制，后续 git 操作需使用：

```text
git -c safe.directory=D:/vibe_coding_project ...
```

- 当前存在一个与本任务无关的已修改文件：

```text
.claude/settings.local.json
```

后续提交时需要避免把该文件纳入本任务提交。

### 本轮产出

- 新增 `docs/design.md`
- 新增 `docs/iteration_log.md`

### 待用户确认

- 是否接受设计文档中的依赖、算法路线、前端方案和 mock 数据策略。
- 用户确认后进入 Iteration 1/2，开始工程骨架与算法核心实现。

## 2026-07-05 Iteration 1：工程骨架与核心能力实现

### 已完成

- 创建 Python 包 `road_network`。
- 实现 `RoadNetworkLoader`：
  - CSV 流式读取。
  - `WKT` 列校验。
  - `LINESTRING` 解析。
  - 节点坐标量化去重。
  - 无向边构建。
  - Haversine 边长计算。
  - CSR 邻接图构建。
  - `scipy.spatial.cKDTree` 最近节点索引。
- 实现 `RoadDistanceCalculator`：
  - 起点、终点最近路网节点吸附。
  - 双向 Dijkstra 最短路。
  - 路径坐标还原。
  - 查询耗时统计。
- 创建 FastAPI 服务：
  - `POST /api/network/upload`
  - `POST /api/route`
  - `GET /api/network/status`
- 创建 Leaflet + OpenStreetMap 前端页面：
  - CSV 上传。
  - 源宿经纬度输入。
  - 路径、吸附点和耗时展示。
- 创建 mock 数据生成脚本。
- 创建 benchmark 脚本。
- 创建轻量测试脚本 `scripts/run_tests.py`。

### 当前验证结果

轻量测试：

```text
PASS test_geometry
PASS test_loader_and_calculator
PASS total=2
```

小型 mock 数据：

```text
generated data\mock_small.csv nodes=900 edges=1740
load rows_edges=1740 nodes=900 edges=1740 time=0.137s invalid_rows=0
query short distance=197.6m snap=0.14ms search=0.05ms total=0.20ms path_nodes=3
query medium distance=1976.0m snap=0.04ms search=0.96ms total=1.01ms path_nodes=21
query long distance=5729.7m snap=0.04ms search=3.04ms total=3.10ms path_nodes=59
```

中型 mock 数据：

```text
generated data\mock_medium.csv nodes=90000 edges=179400
load rows_edges=179400 nodes=90000 edges=179400 time=1.845s invalid_rows=0
query short distance=197.6m snap=0.23ms search=0.87ms total=1.12ms path_nodes=3
query medium distance=2963.9m snap=0.07ms search=2.85ms total=2.94ms path_nodes=31
query long distance=58975.8m snap=0.08ms search=366.79ms total=367.20ms path_nodes=599
```

语法编译检查：

```text
python -m compileall road_network app scripts
```

结果：通过。

### 环境限制

- 当前环境已有：
  - `numpy 1.24.3`
  - `scipy 1.10.1`
- 当前环境缺失：
  - `pytest`
  - `fastapi`
- 执行 `python -m pip install -r requirements.txt` 时，pip 代理无法连接，依赖安装失败。
- 因此本轮已验证核心算法、脚本和语法编译；FastAPI 端到端服务需在依赖安装成功后运行验证。

### 下一步

- 修正发现的问题。
- 更新 README 和设计文档状态。
- 建立 git commit。
- 推送远程仓库。

## 2026-07-05 Iteration 2：路网展示、批量查询与交互增强设计

### 新增需求

- 上传路网后在 GIS 地图显示路网图层，默认青色线条。
- 支持用户控制路网图层颜色、线型、透明度、最大绘制数量和显隐。
- 避免百万路网在浏览器一次性全量渲染，采用后端抽样和前端分批绘制。
- 增加批量经纬度输入框，支持每行 4 个数字：

```text
100.491389 13.75 100.53485 13.7465
```

- 保存历史查询记录，点击历史记录可回放起终点和路径。
- 起点或终点距离路网最近节点超过 1km 时，吸附失败，不执行寻路。
- 增加中英文界面切换。
- 补充 README，让 Python 初学者可以按步骤使用工具或引用核心类。

### 设计决策

- 路网预览接口返回抽样边，不直接返回全量百万边。
- 历史查询存储在浏览器 `localStorage`，避免新增数据库依赖。
- 批量查询第一版按顺序串行调用后端，保证实现稳定；后续如有大量批处理需求可改为后端批量并发或后台任务。
- 吸附阈值放在后端统一校验，前端只负责提示。

### 已完成实现

- 新增 `GET /api/network/preview`：
  - 返回抽样路网线段。
  - 支持 `limit` 控制最大返回线段数。
- 新增 `POST /api/routes/batch`：
  - 支持批量源宿查询。
  - 单次最多 200 条。
- 扩展 `POST /api/route`：
  - 增加 1000m 最大吸附距离校验。
  - 起点或终点离路网超过 1km 时返回 400 错误。
- 扩展 `RoadDistanceCalculator.shortest_path`：
  - 支持 `max_snap_distance_m`。
  - 返回起点和终点吸附距离。
- 前端新增：
  - 路网图层抽样展示。
  - 路网颜色、线型、透明度、最大线段数、显隐控制。
  - 批量输入和结果列表。
  - 查询历史记录与点击回放。
  - 中英文切换。
- README 已重写为面向 Python 初学者的完整使用教程。

### 验证结果

```text
python scripts\run_tests.py
PASS test_geometry
PASS test_loader_and_calculator
PASS total=2
```

```text
python -m pytest
4 passed, 1 skipped
```

说明：`tests/test_api.py` 因当前环境缺少 `httpx` 被跳过。`httpx>=0.24` 已加入 `requirements.txt`，依赖完整环境会执行 FastAPI TestClient 测试。

```text
python -m compileall road_network app scripts
Result: passed
```
