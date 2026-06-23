# 接入层孤点 CSG 组网优化

为运营商接入层（IP RAN / 移动回传）新增的**孤点 CSG**（无链接的基站侧网元）规划 IP 连接，
使其就近接入现网拓扑并具备**双归可靠性**，同时结合 **GIS 经纬度**与**路网距离**尽量用短光缆、降低成本。

- **可靠性**：每个新增 CSG 到 ASG 存在两条**边不相交**路径（双归，可同 ASG）。
- **就近入网**：贴近现网的新增点用短光缆 fiber_extension / loop_insertion 接入；只有远离现网的局部簇才自成新环（new_loop）。
- **顺带整改**：现网既有的单归节点（如环上分支 spur）也一并补链改造为双归。
- **成本**：路网距离优先、GIS 直线兜底；只计新增光缆，splice 断开的旧光缆不计。

---

## 目录结构

```
拓扑组网优化/
├─ README.md                 本文件
├─ code/
│  ├─ gen_data.py            参数化合成数据生成器(可指定规模/场景)
│  ├─ optimize.py            组网优化算法(核心) + 校验 + 产物导出
│  └─ visualize.py           生成通用上传式 Canvas 查看器
├─ docs/
│  ├─ 算法设计方案.md         建模与算法设计(§0 为现行算法)
│  ├─ WORKLOG.md             迭代与思考记录(复盘)
│  └─ viewer.html            可视化查看器(上传 viz_data.json 渲染)
└─ data/
   └─ test_<N>/
      ├─ input/   device.csv · link.csv · road_distance.csv     (算法输入)
      └─ output/  new_links.csv · result_summary.json · viz_data.json  (算法产出)
```

测试用例：`test_1`(baseline) · `test_2`(branched 环带链) · `test_3`(all_near 全贴近) · `test_4`(large 大规模)。

---

## 快速开始

环境：Python 3.8+，依赖 `numpy`、`networkx`。

```bash
# 1) 生成数据(用例名/场景可选; 也可 key=value 覆盖任意参数)
python code/gen_data.py test_4 large
python code/gen_data.py test_5 large n_new=2000 near_frac=0.6 n_asg=150

# 2) 运行优化(读 input/, 写 output/)
python code/optimize.py test_4

# 3) 生成查看器(一次即可), 浏览器打开后上传对应用例的 viz_data.json
python code/visualize.py
# 打开 docs/viewer.html → 上传 data/test_4/output/viz_data.json
```

---

## 输入数据结构（`data/<用例>/input/`）

### `device.csv` — 网元表
| 列 | 含义 |
|---|---|
| `NE Name` | 网元名称（唯一） |
| `Role` | 角色：`asg`（汇聚/上联点）或 `csg`（基站侧） |
| `Longitude` | 经度 |
| `Latitude` | 纬度 |
| `Is_new_ne` | `1`=新增孤点 CSG（待接入）；`0`=现网既有网元（ASG / 现有 CSG / 分支 CSG） |

### `link.csv` — 现网既有 IP 链路
| 列 | 含义 |
|---|---|
| `Src NE Name` | 链路一端网元 |
| `Sink NE Name` | 链路另一端网元 |

> 新增孤点 CSG 在 `link.csv` 中**不出现**（无链接），与 `Is_new_ne=1` 对应。

### `road_distance.csv` — 设备间路网距离
| 列 | 含义 |
|---|---|
| `Src NE Name` | 起点网元 |
| `Sink NE Name` | 终点网元 |
| `Distance` | 路网距离（米） |

> 仅包含 **CSG–CSG 且直线 ≤ 3km** 的点对；其余点对的成本由 GIS 直线（Haversine）距离兜底。

---

## 输出数据结构（`data/<用例>/output/`）

### `new_links.csv` — 全量最终链路（含标注）
| 列 | 含义 |
|---|---|
| `Src NE Name` / `Sink NE Name` | 链路两端 |
| `Link Type` | `原有` / `新增` / `原有-已splice断开` |
| `Method` | `existing`（原有）、`fiber_extension`、`loop_insertion`、`new_loop`、`remediation`、`removed`（断开的旧边） |
| `Cost(m)` | 链路成本（米）；断开行为 `-` |
| `Source` | `road`（命中路网）/ `gis`（直线兜底）/ `-` |

### `result_summary.json` — 结果与校验摘要
关键字段：
- 规模：`asg, csg, isolated, existing_rings, clusters`
- 方案：`method_count`（各组网方式条数）、`new_links`（新增光缆链路数）、`spliced_removed`（splice 断边数）、`total_cost_km`、`ring_size_max`、`ring_over_10`
- 整改：`preexisting_single_homed_before`（待整改既有单归数）、`remediation_links`（整改链路数）
- 校验：`valid_new_dualhome`（新增孤点双归）、`valid_new_degree`（新增孤点度=2）、`valid_all_dualhome`（整改后全员双归）、`all_pass`、`still_single_homed`
- `params`：本次运行的可配置参数取值

### `viz_data.json` — 可视化数据结构（供查看器上传渲染）
```jsonc
{
  "case": "test_4",
  "nodes": [{"id","role","lon","lat","isNew","ring","dual"}],        // dual=false 即单归
  "edges": [{"u","v","ring","ringType","isNew","method","cost"}],     // ringType: existing|new
  "broken": [["a","b"], ...],                                          // splice 断开的旧边
  "rings": [{"id","type","anchors|method","csg","size"}],
  "stats": { ... 与 result_summary 对应的展示统计 ... }
}
```
> 该结构由 `optimize.py` 直接导出，保证"所见即算法实际解"。

---

## 算法概览（详见 `docs/算法设计方案.md` §0）

三种组网方式（均保证双归，按"新增光缆成本"自动择优）：

| 方式 | 锚点 | 约束 |
|---|---|---|
| **fiber_extension** | 两台现网既有双归 CSG（双锚绕接，不断边） | 链长 ≤ `MAX_FIBER_CHAIN`；每设备新增邻居 ≤ `MAX_NEW_PER_DEVICE` |
| **loop_insertion** | 某条规整环边（splice 断边，断边不计成本） | — |
| **new_loop** | 最近一对 ASG（自成双 ASG 环） | — |

主流程：**盘点 → 聚簇成链 → 远近判定 → 拆链（贴近≤3就近 fiber/插环；远端≤8 成新环）→ 三方式按成本择优 → 既有单归整改 → 2-边连通校验**。

可配置参数（`code/optimize.py` 顶部）：
`MAX_FIBER_CHAIN=3, MAX_NEW_PER_DEVICE=3, D_CLUSTER=1200, D_FARNESS=3000, RING_SOFT_MAX=10, LAMBDA_RING=800`。

数据生成参数（`code/gen_data.py` 的 `PROFILES`，可命令行覆盖）：
`n_asg, region_km, target_existing, ring_size_min/max, dual_asg_frac, branch_frac, branch_len_min/max, n_new, near_frac, near_dist_min/max, far_clusters, road_max_m`。

---

## 校验与可视化

- **校验（O(V+E)）**：双归判定用 **2-边连通**（把 `{超汇}∪ASG` 串成 2-边连通核，去桥后不在该分量的 CSG 即单归）。
  三项硬校验：新增孤点双归 / 新增孤点度=2 / 整改后全员双归。
- **可视化**：`docs/viewer.html` 为自包含 **Canvas** 查看器（支持千级网元流畅平移缩放），上传 `viz_data.json` 渲染。
  按组网方式着色，标注新增孤点、现网单归 spur、splice 断边；悬停看详情、点击节点高亮其环。

---

## 规模与性能

`test_4`：120 ASG + 3000 现网 CSG + 207 分支 + 1200 新增（共 4407 CSG），端到端约 **27s**，全部校验通过。

---

## 已知权衡 / 后续

- "短纤就近入网"会让大量 fiber 绕接同一现网环、撑大其 2-边连通域（大环）。软惩罚不足以强行压制，
  **下一步**：按环容量分流（每环设上限，超限改接最近未满环或就近另起小环），硬控环规模。
- 其它待办见 `docs/WORKLOG.md` §7。
