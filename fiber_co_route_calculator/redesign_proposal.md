# 光缆最小共路由算法 — 性能瓶颈分析与改造方案

> 目标：在**纯 Python + 开源三方库 + 无外部 API + 本地 PC 运行**的前提下，
> 解决三大痛点：①百万路网加载慢（数分钟）②内存高（~10G）③长距离（十几公里）寻路慢。
> 硬约束：**输出路径必须与"确定性参考实现"逐点完全一致**（详见 §2）。

---

## 1. 当前实现的瓶颈定位

处理链路（依据 `algo_design.md` / `Skill.md`）：
`WKT → GeoPandas 解析+投影(4326→3857) → 多进程拆边 → NetworkX 图 → cKDTree → 逐对 solve_pair`

| # | 瓶颈 | 根因 | 影响 |
|---|------|------|------|
| B1 | **内存 ~10G** | `networkx.Graph` 以**坐标元组为节点 key**、dict-of-dict 邻接表；每节点/每边是独立 Python 对象（数百字节开销）。百万级边 → GB 级；坐标元组在节点与边中重复存储 | 首要元凶 |
| B2 | **加载慢（分钟级）** | GeoPandas 逐行几何处理；`ProcessPool` 进程间序列化几何/数组开销大；`nx.compose_all` 合并子图是 O(N) 级 Python 对象拷贝；pickle 缓存反序列化 NetworkX 对象极慢 | 每次启动都痛 |
| B3 | **长距离寻路慢** | `nx.shortest_path` 是**纯 Python Dijkstra**；`weight=lambda u,v,d:...` 每条边一次 Python 函数调用；无方向性启发（向四周盲目扩散），十几公里 = 海量节点扩展；惩罚循环再 ×6 | 每对都痛 |
| B4 | 惩罚循环冗余 | `is_A_first∈{T,F} × penalty∈{1000,100,10}` 中，"另一条的普通最短路"被反复重算；缓存粒度粗 | 常数级放大 B3 |

**复杂度直觉**：单次 Dijkstra 纯 Python 在百万节点上是"每对秒级"；乘以惩罚 6 轮、再乘以成千上万对光缆对 → 整体不可接受。

---

## 2. 正确性基准：如何定义"路径完全一致"

没有原始源码 + 文档互相冲突（`max_detour_ratio` 4.0 vs 1.5、惩罚序列 `[1000,100,10]` vs `[1000,100,10,1]`），因此：

1. **确定性参考实现（Reference）**：按 `algo_design.md` 语义实现，把所有不确定处**固化为显式规则**（§5 列出待你确认的取值）。这就是事实标准。
2. **高性能实现（Fast）**：CSR + numba，**保证对同一输入产出与 Reference 逐点字节一致的路径**。
3. **回归夹具**：随机/真实 fiber_pair 跑两版，逐字段 diff（含 WKT 逐点、Shared 边集合、距离）。CI 级别每次改动都跑。

### 关键机制：算法无关的"规范最短路"（canonical shortest path）

普通 Dijkstra/A\* 在**等权并列**时返回哪条最短路，取决于优先队列 tie-break 和邻接遍历顺序 —— 换算法就会变。为让"路径一致"与"用什么算法"**解耦**，定义：

> **规范最短路 = 在所有最小权路径中，节点 id 序列字典序最小的那条。**

它是**加权图的纯函数**，与 Dijkstra/A\*/双向搜索的内部实现无关。实现方式：
1. 用任意精确算法（A\*）算出 `dist[]`（源到各点最短距离，精确值）；
2. **确定性回溯**：从 sink 反向走，每步在满足 `dist[p] + w(p,u) == dist[u]` 的前驱 `p` 中选 **id 最小**者。

这样 Reference（可用 NetworkX 或纯 Python 算 `dist` + 同一回溯）与 Fast（numba A\* 算 `dist` + 同一回溯）**必然产出同一条路径**。所有性能优化（A\*、双向、裁剪）只要保证 `dist[]` 精确，就不影响最终路径 —— 这是本方案敢于大改的前提。

> 节点 id 的分配也必须规范化：**按 (x, y) 坐标字典序排序后编号**，使 id 与加载顺序/并行度无关。

---

## 3. 目标架构

```
road_wkt.csv ──► [加载器: shapely2 向量化 + pyproj 批量投影 + np.unique 去重]
                        │
                        ▼
                 CSR 图 (numpy 数组)  ──►  .npz / mmap 缓存
                        │                    (秒级加载, 按需入内存)
                        ▼
         cKDTree(节点坐标)   +   numba nogil A* 内核
                        │
                        ▼
   fiber_pair ──► [批量吸附] ──► [线程池: 每对 solve_pair] ──► 结果 DataFrame
                              (共享同一份只读 CSR, 零拷贝)
```

### 3.1 图的数据结构（CSR，取代 NetworkX）

```python
class Graph:
    coords:  np.ndarray  # float64 [N, 2]  EPSG:3857 米
    indptr:  np.ndarray  # int64   [N+1]   CSR 行指针
    indices: np.ndarray  # int32   [2M]    邻居节点 id（无向图存双向）
    weight:  np.ndarray  # float64 [2M]    边长度（米）
    edge_id: np.ndarray  # int32   [2M]    指向无向边编号（0..M-1），用于共用边集合与惩罚
```

**内存估算（全省级，取 N≈7M 节点 / M≈10M 无向边 = 20M 有向项）：**

| 数组 | 大小 |
|------|------|
| coords float64 | 7M×2×8 = **112 MB** |
| indptr int64 | 7M×8 = 56 MB |
| indices int32 | 20M×4 = 80 MB |
| weight float64 | 20M×8 = 160 MB |
| edge_id int32 | 20M×4 = 80 MB |
| **合计** | **≈ 0.5 GB**（对比原 ~10G，降 ~20×） |

> 若内存更紧：weight 可用 float32（80MB）；coords 可存"相对原点的 int32 厘米"进一步压缩。默认 float64 保精度。

### 3.2 加载器（解决 B1 + B2）

```python
import shapely, numpy as np, pyproj
from shapely import get_coordinates, get_parts

# 1) 向量化解析 WKT（shapely 2.x，C 实现，无逐行 Python 循环）
geoms = shapely.from_wkt(df["wkt"].to_numpy())          # 一次性
geoms = get_parts(geoms)                                 # MultiLineString 拆单线
# 2) 批量取坐标 + 每条线的顶点数（用于切分相邻点对成"边"）
coords_ll, counts = get_coordinates(geoms, return_index=False), shapely.get_num_coordinates(geoms)
# 3) 批量投影 4326→3857（pyproj Transformer 一次算完，不用 GeoPandas 逐行）
tf = pyproj.Transformer.from_crs(4326, 3857, always_xy=True)
X, Y = tf.transform(coords_ll[:,0], coords_ll[:,1])
# 4) 相邻顶点对 → 边；np.unique 对 (x,y) 去重得整数节点 id（规范排序编号）
#    → 直接拼装 indptr/indices/weight，无 Python 对象、无 compose_all
```

要点：
- **零 Python 逐边循环**：解析、投影、去重、建 CSR 全部 numpy/shapely 向量化；
- **去重语义等价原实现**：原实现"节点=不同坐标元组"，投影是确定性的（同一 lon/lat→同一 x/y），`np.unique` 精确复现；
- **缓存 = `np.savez` / 内存映射**：`np.load(cache, mmap_mode='r')` 秒级、按需分页入内存，取代慢且大的 NetworkX pickle；
- 预期：**加载分钟级 → 秒级**（首次建图后走缓存）。

### 3.3 寻路内核（解决 B3 + B4）

**numba `nogil` A\***，欧氏距离作可采纳启发式（投影坐标下即真实米距，且 `≤` 实际路网距离 → 一致性/可采纳性成立 → A\* 返回精确 `dist`）：

```python
@numba.njit(nogil=True, cache=True)
def astar_dist(indptr, indices, weight, coords, src, dst,
               pen_stamp, pen_factor, tok):
    # 标准 A*：g(n) 精确；h(n)=euclid(n,dst)
    # 惩罚边权 = weight[e] * (pen_factor[e] if pen_stamp[e]==tok else 1.0)
    # 返回 dist[] （至少覆盖最优路径回溯所需邻域）
    ...
```

- **惩罚零拷贝**：不重建图。用 **stamp-token 技巧**：`pen_stamp[e]==tok` 表示该有向边被惩罚，复位只需 `tok += 1`（O(1)，不清数组）。每线程一份 `pen_stamp/pen_factor`（int32/float32 各 20M ≈ 160MB/线程），彻底消除"每次惩罚重建 CSR"。
- **长距离提速**：A\* 的启发式把搜索从"全向盲扩"收敛到"朝目标的窄带"，十几公里查询扩展节点数量级下降；`nogil` + 编译消除 Python 逐边回调（原 lambda 的最大开销）。
- **路径一致**：A\* 只负责精确 `dist`，路径由 §2 的**确定性回溯**产出 → 与 Reference 逐点一致。
- **可选双向 A\***：进一步减半扩展量（仍返回精确 dist，不影响一致性）。

> **空间裁剪说明（全省级重要）**：A\* 本身即"精确且只扩展必要节点"，天然起到裁剪作用，**无需**额外包围盒且不损失正确性。显式椭圆裁剪仅作为可选的内存局部性优化，且必须保证半径 ≥ 最短路长度才安全，故默认不启用、由 A\* 保证正确性。

### 3.4 solve_pair 编排（复现文档语义 + 去冗余）

- 结构 100% 对齐 `algo_design.md` §4.3：基线（A、B 独立最短路 → 交集）→ 绕行校验 → `is_A_first×penalty` 惩罚循环 → 按 `(shared_len, total_len)` 排序取优。
- **去 B4 冗余**：`(src,sink)` 粒度缓存"普通最短路 dist/path"；`route_cache` 保留（相同对直接返回）。
- **并行**：光缆对彼此独立 → `ThreadPoolExecutor`。因内核是 numba `nogil`，**多线程真并行且共享同一份只读 CSR（零内存复制）** —— 这是相比"多进程需复制大图"的关键优势。

---

## 4. 预期收益

| 指标 | 现状 | 改造后（目标） | 手段 |
|------|------|----------------|------|
| 加载耗时 | 分钟级 | 首次数十秒 / 缓存秒级 | shapely2 向量化 + npz/mmap |
| 常驻内存 | ~10 G | ~0.5–1 G | CSR + 整数 id + 只读共享 |
| 单对长距离寻路 | 秒级 | 数十毫秒级 | numba A\* + nogil + 去 lambda |
| 整体吞吐 | 串行 | ×核数 | nogil 线程池并行 |
| 结果一致性 | — | **逐点字节一致** | 规范最短路 + 回归夹具 |

---

## 5. 待你确认的取值（影响"结果一致"，需锁定为 Reference 规则）

文档冲突项，请指定权威值（用于固化 Reference）：

1. `max_detour_ratio`：**4.0**（algo_design）还是 **1.5**（Skill）？默认取哪个？
2. 惩罚序列：**[1000, 100, 10]** 还是 **[1000, 100, 10, 1]**？
3. `buffer_meter` 默认 1000（两文档一致，确认）。
4. 无解/无法吸附时的行为：`algo_design` 返回基线解；`Skill` 说"1km 内无匹配则跳过并记为失败" —— 以哪个为准？
5. `route_with_penalty` 的精确语义（文档中该函数对 `pair_second` 加惩罚，参数命名有歧义）：请确认"被惩罚的是谁的最短路边集、重算的是谁的路径"。这是复现惩罚结果的关键。
6. 多个并列最优解的最终 tie-break：采用 §2 的"节点 id 字典序最小"作为规范，可否？

---

## 6. 依赖清单（均可 pip 安装、开源）

| 库 | 用途 | 备注 |
|----|------|------|
| `numpy`(已装) `scipy`(已装,cKDTree) `pandas`(已装) | 核心/索引/IO | — |
| `shapely>=2.0` | 向量化 WKT 解析/取坐标 | Py3.8 兼容 |
| `pyproj` | 批量坐标投影 4326→3857 | 替代 GeoPandas 逐行 |
| `numba` | A\* 内核 JIT + nogil 并行 | Py3.8 用 numba 0.58.x |
| （可弃）`networkx` | 仅 Reference 校验用 | Fast 版不依赖 |

> 备选：若禁用 numba，可退化为 `scipy.sparse.csgraph`（C 实现的 Dijkstra，但无 A\* 早停、惩罚需重建 CSR）或 `python-igraph`（C 实现，get_shortest_paths）。两者性能不及 numba A\*，但仍远胜纯 Python NetworkX。

---

## 7. 落地步骤（分阶段、每步可验证）

1. **Reference 固化**：按 §5 锁定的规则实现确定性参考版（可基于 NetworkX 复用现有语义），产出回归 golden。
2. **加载器重写**：shapely2+pyproj+np.unique 建 CSR + npz 缓存；用节点/边计数与坐标集合和 Reference 对拍。
3. **A\* 内核**：numba A\* + 确定性回溯；单源查询与 Reference 逐点对拍。
4. **solve_pair 编排**：接内核，复现惩罚循环；全流程回归对拍（逐字段 diff = 0）。
5. **并行 + 缓存**：nogil 线程池、route_cache；压测加载/内存/吞吐三指标。
6. **基准复用**：接回 `fiber_co_route_benchmark.py` 的口径出报告。

---

*本方案不参考原实现的内部代码，仅依赖文档给定的输入/输出契约，通过"规范最短路 + 回归夹具"保证结果一致。*
