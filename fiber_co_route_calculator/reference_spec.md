# 确定性参考规格（Reference Spec）

> 本文件把设计文档 + 用户确认项固化为**无歧义的参考语义**，作为"结果完全一致"的事实标准。
> 高性能实现（Fast）必须对同一输入产出与本规格逐点一致的路径。

## 0. 已锁定参数（用户确认）

| 项 | 取值 | 来源 |
|----|------|------|
| `max_detour_ratio` 默认 | **4.0** | 用户确认（algo_design） |
| 惩罚序列 | **[1000, 100, 10]** | 用户确认（algo_design） |
| `buffer_meter` 默认 | **1000** 米 | 两文档一致 |
| 坐标系 | 输入 EPSG:4326 → 计算 EPSG:3857（米） | 文档 |
| 端点吸附失败 | 返回基线解（不做惩罚优化） | 用户确认 #3 |

## 1. 规范最短路（canonical shortest path）—— 一致性基石

对给定加权图与 (src, dst)：
1. 用精确算法求 `dist[]`（src 到各点最短距离精确值；Fast 用 numba A\*，Reference 可用任意精确法）。
2. **确定性回溯**：从 dst 反向，每步在满足 `dist[p] + w(p,u) == dist[u]` 的前驱 p 中选**节点 id 最小**者，直到 src。
3. 节点 id 规范化：全体节点按 `(x, y)` 坐标字典序排序后编号。

⇒ 路径成为"加权图的纯函数"，与算法内部实现无关。所有实现共用本回溯 → 路径逐点一致。

## 2. 带惩罚最短路（route_with_penalty）—— 用户 #4 语义

```
canonical_shortest_penalized(src, dst, penalty_edges, factor):
    对边 e：w'(e) = w(e) * factor  若 e ∈ penalty_edges，否则 w(e)
    返回 §1 规范最短路（基于 w'）
```
- 惩罚作用于**对方光缆已选路由的边集**，把本条光缆推离之。

## 3. 单对求解 solve_pair(A, B)

输入：A=(src_a, sink_a)、B=(src_b, sink_b)（均已吸附为节点 id；直线距离 straightA/straightB）。

```
# --- Step 1: 吸附校验 ---
若 A 或 B 任一端点吸附失败:
    返回 基线解(记为失败/空路径行)          # 用户 #3

# --- Step 2: 基线（普通最短路）---
pA0 = canonical_shortest(src_a, sink_a)      # 无惩罚
pB0 = canonical_shortest(src_b, sink_b)
shared0 = edges(pA0) ∩ edges(pB0)
baseline = 组装解(pA0, pB0, shared0)

# --- Step 3: 绕行约束校验 ---
若 len(pA0) > straightA*4.0  或  len(pB0) > straightB*4.0:
    返回 baseline                            # detour 违约 → 直接返回基线，不做惩罚

# --- Step 4: 惩罚优化（6 候选）---
valid = []
for is_A_first in [True, False]:
    first, second = (A,B) if is_A_first else (B,A)
    p_first = pA0 if is_A_first else pB0     # first 的普通最短路（复用 Step2，缓存）
    for penalty in [1000, 100, 10]:
        p_second = canonical_shortest_penalized(second.src, second.sink,
                                                penalty_edges = edges(p_first),
                                                factor = penalty)   # second 避开 first
        shared = edges(p_first) ∩ edges(p_second)
        sol = 组装解(按 A/B 归位, shared)
        if is_solution_valid(sol):           # 两条路径均满足 len ≤ straight*4.0
            valid.append(sol)

# --- Step 5: 选优 ---
若 valid 非空:
    返回 sorted(valid, key=lambda s: (s.shared_len, s.total_len))[0]   # 见 §待确认-1
否则:
    返回 baseline
```

### is_solution_valid
两条路径长度均满足 `len(P_X) ≤ straight(X) * max_detour_ratio`。

## 4. 输出组装（每条光缆一行）
按 Skill.md/algo_design 输出字段：`Fiber_distance`(路径总长)、`Fiber_path`(路径 WKT, 3857→4326)、
`Shared_path_distance`(shared_len)、`Shared_wkt`(共用段 WKT)、`Solution-ID` 等。

## 5. 缓存
- `route_cache`：相同 (src,sink,penalty_edges) 直接返回。
- `(src,sink)` 普通最短路 dist/path 缓存，消除惩罚循环内对 first 路径的重复计算。

---

## 待确认项（仅剩，影响正确性方向）

- **待确认-1【核心】选优方向 = 最小化共路由**：Step 5 取 `(shared_len, total_len)` **升序第一个**（= 最小 shared_len）。
  依据：标题"最小共路由" + 惩罚语义（推离对方）+ 文档排序规则 + 风险分析场景，四者一致。
  （注：§1/§4.1 正文"最大化"判定为笔误。）**请确认目标=最小化。**
- **待确认-2 baseline 是否进入候选池**：现规格中 baseline 仅作 detour 违约/valid 空时的 fallback，不与 6 个惩罚候选一起参与 Step5 排序（按文档 valid_solutions 仅含惩罚候选）。若需将 baseline 也纳入排序，请告知。
- **待确认-3 吸附失败的输出形态**：是"仍输出一行但路径为空(失败标记)"还是"整行跳过不输出"？（Skill 说跳过；用户说返回基线解 → 倾向输出空路径失败行）
