# -*- coding: utf-8 -*-
"""
孤点 CSG 组网优化 v2 —— 三种组网方式按成本自动择优 + 双归校验

组网方式(均保证新增CSG双归):
  A) fiber_extension : 新增(或成链的新增簇)两端各锚到一台现网在环设备(双锚绕接) -> 双归
       约束(可配置): 单链新增数 <= MAX_FIBER_CHAIN; 每台现网设备新增邻居 <= MAX_NEW_PER_DEVICE
  B) loop_insertion  : 将新增(或成链的簇) splice 进现网某条环边 -> 双归; 环节点上限不再强制
  C) new_loop        : 远端聚簇, 内部最少连边成链后, 两端连到最近的一对ASG -> 双归
对每个(聚簇成链后的)单元, 评估三种方式的"新增光缆成本", 选可行且最小者。
成本: 路网优先, 缺失用直线兜底; splice 断开的旧光缆不计。
环节点<=10 不再作硬约束(仅报告)。
"""
import csv, math, os, sys, json
from collections import defaultdict
import networkx as nx

# ---------- 路径(多用例) ----------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASE = sys.argv[1] if len(sys.argv) > 1 else "test_1"
INP = os.path.join(ROOT, "data", CASE, "input")
OUTP = os.path.join(ROOT, "data", CASE, "output")
os.makedirs(OUTP, exist_ok=True)

# ---------- 可配置参数 ----------
MAX_FIBER_CHAIN = 3       # fiber_extension: 单条延伸链最多新增CSG数
MAX_NEW_PER_DEVICE = 3    # 每台现网设备最多挂接的新增邻居数
D_CLUSTER = 1200.0        # 聚簇阈值(米): 互相<=此成本的新增归为一簇
D_FARNESS = 3000.0        # (规则B) 簇到最近"现网既有双归CSG" > 此距离 -> 视为远端, 走 new_loop
RING_SOFT_MAX = 10        # (规则C) 环节点软上限
LAMBDA_RING = 800.0       # (规则C) 每超出1个节点的成本惩罚(米当量, 边际)
RING_MAX = 10             # 报告用
EPS = 1e-6


# ---------- 成环规模动态跟踪(规则C用): 并查集, 节点数含锚ASG ----------
class RingTracker:
    def __init__(self, existing):
        self.parent = {}; self.size = {}; self.device_ring = {}
        for ri, R in enumerate(existing):
            self.parent[ri] = ri; self.size[ri] = R.size()
            for c in R.seq: self.device_ring[c] = ri
        self._next = len(existing)
    def find(self, i):
        while self.parent[i] != i:
            self.parent[i] = self.parent[self.parent[i]]; i = self.parent[i]
        return i
    def ring_of_device(self, d):
        return self.find(self.device_ring[d]) if d in self.device_ring else None
    def size_of(self, root):
        return self.size[root]
    def predict_loop(self, ri, clen):
        return self.size[self.find(ri)] + clen
    def predict_fiber(self, A, C, clen):
        ra, rc = self.ring_of_device(A), self.ring_of_device(C)
        if ra is None or rc is None: return clen + 2
        return self.size[ra] + clen if ra == rc else self.size[ra] + self.size[rc] + clen
    def apply_loop(self, ri, clen):
        r = self.find(ri); self.size[r] += clen
    def apply_fiber(self, A, C, clen):
        ra, rc = self.ring_of_device(A), self.ring_of_device(C)
        if ra is None or rc is None: return
        if ra == rc: self.size[ra] += clen
        else:
            lo, hi = min(ra, rc), max(ra, rc)
            self.parent[hi] = lo; self.size[lo] = self.size[ra] + self.size[rc] + clen
    def apply_new_loop(self, clen):
        nid = self._next; self._next += 1
        self.parent[nid] = nid; self.size[nid] = clen + 2
        return nid

def ring_penalty(pred_size):
    return LAMBDA_RING * max(0, pred_size - RING_SOFT_MAX)

# ========== 1. 输入加载(封装) ==========
class NetworkData:
    """现网输入数据的内存表示。"""
    def __init__(self, dev, links, road):
        self.dev = dev          # {name: {role, lon, lat}}
        self.links = links      # [(src, sink), ...]
        self.road = road        # {(a,b): dist} 对称
    @property
    def asgs(self): return {n for n, d in self.dev.items() if d["role"] == "asg"}
    @property
    def csgs(self): return {n for n, d in self.dev.items() if d["role"] == "csg"}

def load_input(input_dir=INP):
    """从指定 input 目录读取 device/link/road_distance 到内存, 返回 NetworkData。"""
    dev = {}
    with open(os.path.join(input_dir, "device.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            dev[r["NE Name"]] = {"role": r["Role"].lower(),
                                 "lon": float(r["Longitude"]), "lat": float(r["Latitude"])}
    links = []
    with open(os.path.join(input_dir, "link.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            links.append((r["Src NE Name"], r["Sink NE Name"]))
    road = {}
    with open(os.path.join(input_dir, "road_distance.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            d = float(r["Distance"]); a, b = r["Src NE Name"], r["Sink NE Name"]
            road[(a, b)] = d; road[(b, a)] = d
    return NetworkData(dev, links, road)

# ========== 2. 成本 ==========
def haversine_m(a, b, dev):
    R = 6371000.0
    la1, la2 = math.radians(dev[a]["lat"]), math.radians(dev[b]["lat"])
    dphi = math.radians(dev[b]["lat"] - dev[a]["lat"]); dl = math.radians(dev[b]["lon"] - dev[a]["lon"])
    h = math.sin(dphi/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(h))

class Cost:
    """路网优先, 缺失用直线兜底; 带缓存。"""
    def __init__(self, dev, road):
        self.dev, self.road, self.cache = dev, road, {}
    def __call__(self, a, b):
        if a == b: return 0.0
        key = (a, b) if a < b else (b, a)
        if key in self.cache: return self.cache[key]
        v = self.road[key] if key in self.road else haversine_m(a, b, self.dev)
        self.cache[key] = v; return v
    def is_road(self, a, b):
        key = (a, b) if a < b else (b, a)
        return key in self.road

# ========== 3. 现网盘点(规整环 + 不规整冻结) ==========
class Ring:
    __slots__ = ("seq", "head", "tail")
    def __init__(self, seq, head, tail):
        self.seq = list(seq); self.head = head; self.tail = tail
    def size(self):
        return len(self.seq) + (1 if self.head == self.tail else 2)
    def edges(self):
        chain = [self.head] + self.seq + [self.tail]
        return list(zip(chain[:-1], chain[1:]))

def analyze(data):
    dev, links = data.dev, data.links
    G = nx.Graph(); G.add_nodes_from(dev.keys()); G.add_edges_from(links)
    asgs, csgs = data.asgs, data.csgs
    isolated = sorted(n for n in csgs if G.degree(n) == 0)
    csg_sub = G.subgraph([n for n in csgs if G.degree(n) > 0])
    rings, frozen_edges = [], []
    comps = sorted((sorted(c) for c in nx.connected_components(csg_sub)), key=lambda c: c[0])

    def freeze(comp, sub):
        for (u, v) in sub.edges(): frozen_edges.append((u, v))
        for n in comp:
            for a in sorted(G.neighbors(n)):
                if a in asgs: frozen_edges.append((a, n))

    for comp in comps:
        sub = csg_sub.subgraph(comp)
        maxdeg = max((sub.degree(n) for n in comp), default=0)
        ends = sorted(n for n in comp if sub.degree(n) == 1)
        if not (maxdeg <= 2 and (len(ends) == 2 or len(comp) == 1)):
            freeze(comp, sub); continue
        start = ends[0] if ends else comp[0]
        order, prev, cur = [start], None, start
        while True:
            nbrs = sorted(x for x in sub.neighbors(cur) if x != prev)
            if not nbrs: break
            prev, cur = cur, nbrs[0]; order.append(cur)
            if cur == start: break
        head = next((a for a in sorted(G.neighbors(order[0])) if a in asgs), None)
        tail = next((a for a in sorted(G.neighbors(order[-1])) if a in asgs), None)
        if head is None or tail is None:
            freeze(comp, sub); continue
        rings.append(Ring(order, head, tail))
    return G, asgs, csgs, isolated, rings, frozen_edges

# ========== 4. 聚簇 + 成链 ==========
def cluster_isolated(isolated, cost, d):
    """互相成本<=d 的新增CSG并入一簇(并查集)。"""
    iso = sorted(isolated); parent = {x: x for x in iso}
    def find(a):
        while parent[a] != a: parent[a] = parent[parent[a]]; a = parent[a]
        return a
    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb: parent[max(ra, rb)] = min(ra, rb)
    for i in range(len(iso)):
        for j in range(i+1, len(iso)):
            if cost(iso[i], iso[j]) <= d: union(iso[i], iso[j])
    groups = {}
    for x in iso: groups.setdefault(find(x), []).append(x)
    return [sorted(v) for v in groups.values()]

def two_opt_free(seq, cost):
    def plen(s): return sum(cost(s[i], s[i+1]) for i in range(len(s)-1))
    best = seq[:]; improved = True
    while improved:
        improved = False
        for i in range(len(best)-1):
            for j in range(i+1, len(best)):
                cand = best[:i] + best[i:j+1][::-1] + best[j+1:]
                if plen(cand) < plen(best) - EPS: best = cand; improved = True
    return best

def chain_order(nodes, cost):
    """簇内最近邻成链 + 2-opt, 返回有序链(最少连边=链)。"""
    nodes = sorted(nodes)
    if len(nodes) <= 2: return nodes
    start = nodes[0]; path = [start]; pool = set(nodes); pool.discard(start)
    while pool:
        last = path[-1]; nxt = min(pool, key=lambda x: (cost(last, x), x))
        path.append(nxt); pool.discard(nxt)
    return two_opt_free(path, cost)

# ========== 5. 三种组网方式的最优锚接 ==========
def _best_pair(ends, cand_for_e1, cand_for_e2, cost, topk=6):
    """在两端各自候选集中, 选 P!=Q 使 cost(P,e1)+cost(Q,e2) 最小。"""
    e1, e2 = ends
    Hc = sorted(cand_for_e1, key=lambda d: (cost(e1, d), d))[:topk]
    Tc = sorted(cand_for_e2, key=lambda d: (cost(e2, d), d))[:topk]
    best = None
    for P in Hc:
        for Q in Tc:
            if P == Q: continue
            c = cost(e1, P) + cost(e2, Q)
            if best is None or c < best[0]: best = (c, P, Q)
    return best   # (cost, P, Q) or None

# ---------- 空间网格(加速最近锚点查找) ----------
def _build_grid(nodes, dev, cell=2000.0):
    if not nodes:
        return {"cell": cell, "buckets": {}, "kx": 111320.0, "ky": 111320.0}
    lat0 = sum(dev[n]["lat"] for n in nodes) / len(nodes)
    kx = math.cos(math.radians(lat0)) * 111320.0; ky = 111320.0
    buckets = {}
    for n in nodes:
        key = (int(dev[n]["lon"]*kx // cell), int(dev[n]["lat"]*ky // cell))
        buckets.setdefault(key, []).append(n)
    return {"cell": cell, "buckets": buckets, "kx": kx, "ky": ky}

def _grid_candidates(grid, dev, node, k=16, rmax=8):
    cell, kx, ky, buckets = grid["cell"], grid["kx"], grid["ky"], grid["buckets"]
    cx = int(dev[node]["lon"]*kx // cell); cy = int(dev[node]["lat"]*ky // cell)
    out = []
    for r in range(0, rmax+1):
        out = []
        for ix in range(cx-r, cx+r+1):
            for iy in range(cy-r, cy+r+1):
                out.extend(buckets.get((ix, iy), ()))
        if len(out) >= k: break
    return out

def _grid_nearest_cost(grid, dev, node, cost):
    cand = _grid_candidates(grid, dev, node, k=1)
    return min((cost(node, c) for c in cand), default=float("inf"))

def best_fiber_extension(h, t, anchors, cost, new_neighbor, clen, grid=None, dev=None):
    if clen > MAX_FIBER_CHAIN: return None
    def pool_for(end):
        pool = _grid_candidates(grid, dev, end, k=16) if grid is not None else anchors
        return [d for d in pool if new_neighbor[d] < MAX_NEW_PER_DEVICE]
    Hp, Tp = pool_for(h), pool_for(t)
    if not Hp or not Tp: return None
    bp = _best_pair((h, t), Hp, Tp, cost)
    if bp is None: return None
    c, A, C = bp
    return dict(method="fiber_extension", anchor_cost=c, conns=[(A, h), (C, t)],
                broken=None, anchors=[A, C])

def best_loop_insertion(h, t, existing, cost):
    best = None
    for ri, R in enumerate(existing):
        for (a, b) in R.edges():
            for (p, q) in ((a, b), (b, a)):
                c = cost(p, h) + cost(q, t)
                if best is None or c < best[0]: best = (c, p, q, (a, b), ri)
    if best is None: return None
    c, p, q, edge, ri = best
    return dict(method="loop_insertion", anchor_cost=c, conns=[(p, h), (q, t)],
                broken=edge, ring=ri)

def best_new_loop(h, t, asgs, cost):
    al = sorted(asgs)
    if len(al) < 2:
        a = al[0]
        return dict(method="new_loop", anchor_cost=cost(a, h)+cost(a, t),
                    conns=[(a, h), (a, t)], broken=None, anchors=[a])
    bp = _best_pair((h, t), al, al, cost)
    c, A, C = bp
    return dict(method="new_loop", anchor_cost=c, conns=[(A, h), (C, t)],
                broken=None, anchors=[A, C])

# ========== 6. 校验 ==========
def build_final_graph(dev, links, new_edges, broken):
    H = nx.Graph(); H.add_nodes_from(dev.keys())
    bset = {frozenset(e) for e in broken}
    for (u, v) in links:
        if frozenset((u, v)) not in bset: H.add_edge(u, v)
    for (u, v) in new_edges: H.add_edge(u, v)
    return H

def single_homed_set(H, asgs, csgs):
    """O(V+E): CSG 双归(到ASG集有2条边不相交路径) <=> 与ASG集处于同一2-边连通分量。
       做法: 把所有ASG与超汇t 串成一个环(使ASG侧成2-边连通核), 去掉桥后, 不在t分量里的CSG即单归。"""
    G2 = nx.Graph(); G2.add_edges_from(H.edges()); G2.add_nodes_from(csgs)
    T = "__SINK__"
    al = sorted(asgs)
    if not al:
        return set(csgs)
    prev = T
    for a in al:
        G2.add_edge(prev, a); prev = a
    G2.add_edge(prev, T)                      # 闭合: {t}∪ASG 成2-边连通核
    bridges = {frozenset(e) for e in nx.bridges(G2)}
    G3 = nx.Graph(); G3.add_nodes_from(G2.nodes())
    for (u, v) in G2.edges():
        if frozenset((u, v)) not in bridges: G3.add_edge(u, v)
    comp_t = nx.node_connected_component(G3, T) if T in G3 else set()
    return {v for v in csgs if v not in comp_t}

def validate(H, asgs, csgs, isolated):
    single = single_homed_set(H, asgs, csgs)
    isoset = set(isolated)
    dual_iso = [v for v in csgs if v in single and v in isoset]
    dual_exist = sorted(v for v in single if v not in isoset)
    deg_bad = [(n, H.degree(n)) for n in isolated if H.degree(n) != 2]
    return dual_iso, dual_exist, deg_bad

def ring_sizes_report(H, asgs, csgs):
    csg_only = H.subgraph([n for n in csgs if H.degree(n) > 0])
    sizes = []
    for comp in nx.connected_components(csg_only):
        att = set()
        for n in comp: att |= {a for a in H.neighbors(n) if a in asgs}
        sizes.append(len(comp) + len(att))
    return sizes

def marginal_ring_penalty(c, clen, tracker):
    """规则C(边际版): 只惩罚把环推到 max(软上限, 当前环大小) 之上的"新增节点"部分,
       避免对本就>10的现网大环一刀切重罚(否则恒倒逼 new_loop)。锚在未跟踪结构(如冻结环)时按全新计。"""
    m = c["method"]
    if m == "fiber_extension":
        A, C = c["anchors"]; ra = tracker.ring_of_device(A); rc = tracker.ring_of_device(C)
        if ra is None or rc is None: base = 0
        elif ra == rc: base = tracker.size[ra]
        else: base = tracker.size[ra] + tracker.size[rc]
    elif m == "loop_insertion":
        base = tracker.size[tracker.find(c["ring"])]
    else:
        base = 0   # new_loop: 全新环
    pred = base + clen
    return LAMBDA_RING * max(0, pred - max(RING_SOFT_MAX, base))

# ---------- 现网既有单归整改: 给自由端补一条到最近双归锚点的链路, 闭合成环 ----------
def remediate(H, asgs, csgs, cost, new_edges, method_of, exclude=(), max_rounds=30):
    """exclude: 不可作锚点的节点(如新增孤点, 须保持度=2)。"""
    excl = set(exclude)
    added = []
    for _ in range(max_rounds):
        single = single_homed_set(H, asgs, csgs)
        if not single: break
        # 锚点 = 现网既有双归CSG(排除新增) + ASG
        anchors_base = sorted(((set(csgs) - single) - excl) | set(asgs))
        comps = sorted((sorted(c) for c in nx.connected_components(H.subgraph(sorted(single)))),
                       key=lambda c: c[0])
        progress = False
        for comp in comps:
            ends = sorted(comp, key=lambda n: (H.degree(n), n))   # 叶子(自由端)优先
            done = False
            for e in ends:
                cand = sorted((a for a in anchors_base if a not in comp and not H.has_edge(e, a)),
                              key=lambda a: (cost(e, a), a))
                for C in cand[:8]:
                    H.add_edge(e, C)   # 已保证 e-C 非现有边, 回滚安全
                    if not single_homed_set(H, asgs, {e}):   # e 已双归?
                        new_edges.append((e, C)); method_of[frozenset((e, C))] = "remediation"
                        added.append((e, C)); progress = True; done = True; break
                    H.remove_edge(e, C)
                if done: break
        if not progress: break
    return added

# ========== 7. 可视化数据 ==========
def build_viz(dev, asgs, csgs, isolated, existing, frozen_edges, placements,
              method_of, orig_edges, broken, cost, stats, single_homed, remediation_edges=()):
    isoset, single = set(isolated), set(single_homed)
    node_ring = {}
    for ri, R in enumerate(existing):
        for c in R.seq: node_ring[c] = ri
    # 新增节点 -> 簇组ID(在现有环之后编号)
    for p in placements:
        for c in p["members"]: node_ring[c] = p["group"]
    nodes = [{"id": name, "role": d["role"], "lon": d["lon"], "lat": d["lat"],
              "isNew": name in isoset, "ring": node_ring.get(name),
              "dual": (d["role"] != "csg") or (name not in single)}
             for name, d in dev.items()]
    seen, edges = set(), []
    bset = {frozenset(e) for e in broken}      # 被splice断开的旧边: 不再画成实线(仅以虚线"断开"表示)
    for ri, R in enumerate(existing):
        for (u, v) in R.edges():
            fs = frozenset((u, v))
            if fs in bset or fs in seen: continue
            seen.add(fs)
            edges.append({"u": u, "v": v, "ring": ri, "ringType": "existing",
                          "isNew": False, "method": "existing", "cost": round(cost(u, v), 1)})
    for (u, v) in frozen_edges:
        fs = frozenset((u, v))
        if fs in bset or fs in seen: continue
        seen.add(fs)
        edges.append({"u": u, "v": v, "ring": None, "ringType": "existing",
                      "isNew": False, "method": "existing", "cost": round(cost(u, v), 1)})
    for p in placements:
        for (u, v) in p["edges"]:
            fs = frozenset((u, v))
            if fs in seen: continue
            seen.add(fs)
            edges.append({"u": u, "v": v, "ring": p["group"], "ringType": "new",
                          "isNew": True, "method": p["method"], "cost": round(cost(u, v), 1)})
    for (u, v) in remediation_edges:
        fs = frozenset((u, v))
        if fs in seen: continue
        seen.add(fs)
        edges.append({"u": u, "v": v, "ring": None, "ringType": "new",
                      "isNew": True, "method": "remediation", "cost": round(cost(u, v), 1)})
    broken_list = [sorted(e) for e in broken]
    ring_meta = [{"id": ri, "type": "existing", "anchors": sorted({R.head, R.tail}),
                  "csg": len(R.seq), "size": R.size()} for ri, R in enumerate(existing)]
    ring_meta += [{"id": p["group"], "type": "new", "method": p["method"],
                   "csg": len(p["members"]), "size": len(p["members"])} for p in placements]
    return {"case": CASE, "nodes": nodes, "edges": edges, "broken": broken_list,
            "rings": ring_meta, "stats": stats}

# ========== 8. 主流程 ==========
def main():
    print(f"== 测试用例: {CASE} ==")
    data = load_input()
    dev, links, road = data.dev, data.links, data.road
    cost = Cost(dev, road)
    G, asgs, csgs, isolated, existing, frozen_edges = analyze(data)
    orig_edges = {frozenset(l) for l in links}
    n_frozen_csg = len({n for e in frozen_edges for n in e if n in csgs})
    # 可锚的"现网既有双归CSG" = 规整环 + 环带链的环上CSG(排除单归spur与孤点); 供 fiber/远近判定
    H0 = build_final_graph(dev, links, [], [])
    existing_single = single_homed_set(H0, asgs, csgs)
    dual_existing = sorted((csgs - existing_single) - set(isolated))
    dual_grid = _build_grid(dual_existing, dev)   # 空间网格, 加速最近锚查找

    print("== 现网盘点 ==")
    print(f"ASG={len(asgs)} CSG={len(csgs)} 孤点={len(isolated)} 规整环={len(existing)} "
          f"冻结CSG≈{n_frozen_csg} 可锚现网双归CSG={len(dual_existing)}")

    # 聚簇 -> 成链
    clusters = cluster_isolated(isolated, cost, D_CLUSTER)
    clusters.sort(key=lambda c: (-len(c), c[0]))
    print(f"聚簇: {len(clusters)} 簇 (size分布 {sorted((len(c) for c in clusters), reverse=True)[:12]}...)")

    new_edges = []; method_of = {}; broken = []
    new_neighbor = defaultdict(int)
    placements = []; method_count = defaultdict(int)
    tracker = RingTracker(existing)
    gid = len(existing)
    FAR_CAP = max(2, RING_SOFT_MAX - 2)      # 远端簇成新环, 控制环规模

    for cl in clusters:
        chain = chain_order(cl, cost)
        # 该簇是否"贴近现网"(到最近现网既有双归CSG); 贴近 -> 拆成<=3的链就近 fiber/插环; 远端 -> 成新环
        nearest = min((_grid_nearest_cost(dual_grid, dev, m, cost) for m in cl), default=float("inf"))
        near = nearest <= D_FARNESS
        cap = MAX_FIBER_CHAIN if near else FAR_CAP
        for s in range(0, len(chain), cap):
            chunk = chain[s:s+cap]
            h, t = chunk[0], chunk[-1]
            internal = list(zip(chunk[:-1], chunk[1:]))
            internal_cost = sum(cost(u, v) for u, v in internal)
            clen = len(chunk)
            if near:                          # 贴近: 优先 fiber_extension / loop_insertion 就近入网
                opts = (best_fiber_extension(h, t, dual_existing, cost, new_neighbor, clen, dual_grid, dev),
                        best_loop_insertion(h, t, existing, cost),
                        best_new_loop(h, t, asgs, cost))
            else:                             # 远端: 成自有新环
                opts = (best_new_loop(h, t, asgs, cost),)
            cands = []
            for c in opts:
                if c is None: continue
                pen = marginal_ring_penalty(c, clen, tracker)
                cands.append((internal_cost + c["anchor_cost"] + pen, c["method"], c))
            cands.sort(key=lambda x: (x[0], x[1]))
            score, _, chosen = cands[0]
            edges_here = list(internal) + list(chosen["conns"])
            for (u, v) in edges_here:
                fs = frozenset((u, v))
                if fs in method_of: continue
                new_edges.append((u, v)); method_of[fs] = chosen["method"]
            if chosen["broken"] is not None: broken.append(chosen["broken"])
            if chosen["method"] == "fiber_extension":
                for a in chosen["anchors"]: new_neighbor[a] += 1
                tracker.apply_fiber(chosen["anchors"][0], chosen["anchors"][1], clen)
            elif chosen["method"] == "loop_insertion":
                tracker.apply_loop(chosen["ring"], clen)
            else:
                tracker.apply_new_loop(clen)
            method_count[chosen["method"]] += 1
            placements.append({"group": gid, "members": set(chunk),
                               "method": chosen["method"], "edges": edges_here, "cost": round(score, 1)})
            gid += 1

    # 现网既有单归整改
    H = build_final_graph(dev, links, new_edges, broken)
    pre_single = sorted(single_homed_set(H, asgs, csgs))
    remed = remediate(H, asgs, csgs, cost, new_edges, method_of, exclude=isolated)
    method_count["remediation"] = len(remed)
    remediation_edges = list(remed)

    dual_iso, dual_exist, deg_bad = validate(H, asgs, csgs, isolated)
    sizes = ring_sizes_report(H, asgs, csgs)
    total_new = sum(cost(u, v) for (u, v) in new_edges)
    ok = (not dual_iso) and (not deg_bad) and (not dual_exist)

    print(f"\n== 结果 ==")
    print(f"新增光缆 {len(new_edges)} 条, 总成本 {total_new/1000:.2f} km; splice断开旧边 {len(broken)} 条")
    print(f"组网方式分布: " + ", ".join(f"{k}={v}" for k, v in sorted(method_count.items())))
    print(f"现网既有单归整改: {len(pre_single)} 个待整改 -> 新增 {len(remed)} 条整改链路")
    print(f"环规模(软约束λ={LAMBDA_RING:.0f},软上限{RING_SOFT_MAX}): min={min(sizes)} max={max(sizes)} "
          f"(>10的有 {sum(1 for s in sizes if s>10)} 个)")
    print(f"\n== 校验 ==")
    print(f"[新增孤点双归] {'全部通过' if not dual_iso else '违反 '+str(len(dual_iso))+': '+str(dual_iso[:8])}")
    print(f"[新增孤点度=2] {'通过' if not deg_bad else '违反:'+str(deg_bad[:8])}")
    print(f"[现网整改后全员双归] {'全部通过' if not dual_exist else '仍有 '+str(len(dual_exist))+': '+str(dual_exist[:8])}")

    # 输出: 全量最终链路 + 标注
    final = [(u, v) for (u, v) in links if frozenset((u, v)) not in {frozenset(e) for e in broken}]
    final_fs = {frozenset(e) for e in final}
    with open(os.path.join(OUTP, "new_links.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Src NE Name", "Sink NE Name", "Link Type", "Method", "Cost(m)", "Source"])
        for (u, v) in sorted(final):
            src = "road" if cost.is_road(u, v) else "gis"
            w.writerow([u, v, "原有", "existing", round(cost(u, v), 1), src])
        for (u, v) in sorted(new_edges):
            src = "road" if cost.is_road(u, v) else "gis"
            w.writerow([u, v, "新增", method_of[frozenset((u, v))], round(cost(u, v), 1), src])
        for (u, v) in sorted(frozenset(e) for e in broken):
            w.writerow([sorted((u, v))[0], sorted((u, v))[1], "原有-已splice断开", "removed", "-", "-"])

    summary = {"case": CASE, "asg": len(asgs), "csg": len(csgs), "isolated": len(isolated),
               "existing_rings": len(existing), "clusters": len(clusters),
               "method_count": dict(method_count), "new_links": len(new_edges),
               "spliced_removed": len(broken), "total_cost_km": round(total_new/1000, 3),
               "ring_size_max": max(sizes), "ring_over_10": sum(1 for s in sizes if s > 10),
               "preexisting_single_homed_before": len(pre_single),
               "remediation_links": len(remed),
               "valid_new_dualhome": not dual_iso, "valid_new_degree": not deg_bad,
               "valid_all_dualhome": not dual_exist, "all_pass": ok,
               "still_single_homed": dual_exist,
               "params": {"MAX_FIBER_CHAIN": MAX_FIBER_CHAIN, "MAX_NEW_PER_DEVICE": MAX_NEW_PER_DEVICE,
                          "D_CLUSTER": D_CLUSTER, "D_FARNESS": D_FARNESS,
                          "RING_SOFT_MAX": RING_SOFT_MAX, "LAMBDA_RING": LAMBDA_RING}}
    with open(os.path.join(OUTP, "result_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    viz_stats = {"case": CASE, "asg": len(asgs), "csg": len(csgs), "isolated": len(isolated),
                 "existing_rings": len(existing), "new_rings": len(placements),
                 "inserted": method_count.get("loop_insertion", 0),
                 "into_new": method_count.get("new_loop", 0),
                 "fiber_ext": method_count.get("fiber_extension", 0),
                 "remediation": len(remed),
                 "new_links": len(new_edges), "total_km": round(total_new/1000, 2),
                 "ring_max": max(sizes), "preexisting_single_homed": len(dual_exist)}
    viz = build_viz(dev, asgs, csgs, isolated, existing, frozen_edges, placements,
                    method_of, orig_edges, broken, cost, viz_stats, dual_iso + dual_exist,
                    remediation_edges=remediation_edges)
    with open(os.path.join(OUTP, "viz_data.json"), "w", encoding="utf-8") as f:
        json.dump(viz, f, ensure_ascii=False)
    print(f"\n输出({CASE}/output): new_links.csv, result_summary.json, viz_data.json")

if __name__ == "__main__":
    main()
