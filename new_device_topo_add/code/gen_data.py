# -*- coding: utf-8 -*-
"""
合成数据生成器(参数化, 可伸缩)：接入层 IP RAN 拓扑
用法:  python gen_data.py [用例名] [profile] [key=value ...]
  用例名  : 输出到 data/<用例名>/input/ , 默认 test_1
  profile : baseline | branched | all_near | large , 缺省按用例名推断
            (test_1->baseline, test_2->branched, test_3->all_near, test_4->large)
  覆盖参数: 形如 n_new=2000 near_frac=0.6 n_asg=150 ... 可覆盖 profile 任意参数

可配置参数(见 PROFILES):
  n_asg            ASG 数量
  region_km        区域边长(km, 正方形)
  target_existing  现网CSG目标数量(由环铺满到此规模)
  ring_size_min/max 单环CSG数范围
  dual_asg_frac    双ASG开放链(环)占比, 其余为单ASG闭合环
  branch_frac      "环带链"(挂单归spur)的环占比
  branch_len_min/max  spur链长(新增分支CSG数)
  n_new            新增孤点CSG数量
  near_frac        新增中"贴近现网"占比, 其余为"远端成簇"
  near_dist_min/max  贴近距离范围(米)
  far_clusters     远端簇中心数量
  road_max_m       road_distance 仅计算 CSG-CSG 直线<=此距离(米)
"""
import csv, math, os, sys
import numpy as np

# ---------- 参数 ----------
CASE = sys.argv[1] if len(sys.argv) > 1 else "test_1"
_DEF = {"test_1": "baseline", "test_2": "branched", "test_3": "all_near", "test_4": "large"}
PROFILE = sys.argv[2] if len(sys.argv) > 2 and "=" not in sys.argv[2] else _DEF.get(CASE, "baseline")

PROFILES = {
    "baseline": dict(n_asg=5,  region_km=18,  target_existing=54,  ring_size_min=5, ring_size_max=9,
                     dual_asg_frac=0.5, branch_frac=0.0, branch_len_min=1, branch_len_max=2,
                     n_new=40,  near_frac=0.5, near_dist_min=150, near_dist_max=900,
                     far_clusters=4,  road_max_m=3000),
    "branched": dict(n_asg=5,  region_km=18,  target_existing=54,  ring_size_min=5, ring_size_max=9,
                     dual_asg_frac=0.5, branch_frac=0.5, branch_len_min=1, branch_len_max=2,
                     n_new=40,  near_frac=0.5, near_dist_min=150, near_dist_max=900,
                     far_clusters=4,  road_max_m=3000),
    "all_near": dict(n_asg=5,  region_km=18,  target_existing=54,  ring_size_min=5, ring_size_max=9,
                     dual_asg_frac=0.5, branch_frac=0.0, branch_len_min=1, branch_len_max=2,
                     n_new=40,  near_frac=1.0, near_dist_min=150, near_dist_max=900,
                     far_clusters=4,  road_max_m=3000),
    # 大规模: 120 ASG, ~3000 现网CSG(大部分双归环+环带链), 1200 新增(70%近/30%远)
    "large":    dict(n_asg=120, region_km=110, target_existing=3000, ring_size_min=6, ring_size_max=16,
                     dual_asg_frac=0.6, branch_frac=0.4, branch_len_min=1, branch_len_max=3,
                     n_new=1200, near_frac=0.7, near_dist_min=120, near_dist_max=1200,
                     far_clusters=30, road_max_m=3000),
}
P = dict(PROFILES[PROFILE])
# 命令行 key=value 覆盖
for a in sys.argv[2:]:
    if "=" in a:
        k, v = a.split("=", 1)
        if k in P: P[k] = type(P[k])(float(v)) if isinstance(P[k], (int, float)) else v

SEED = 42
rng = np.random.default_rng(SEED)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", CASE, "input")
os.makedirs(OUT, exist_ok=True)

# ---------- 地理工具(米 <-> 经纬度) ----------
CENTER = (116.40, 39.90)
M_PER_DEG_LAT = 111320.0
def m_per_deg_lon(lat): return 111320.0 * math.cos(math.radians(lat))
def offset(lon, lat, dx, dy):
    return lon + dx / m_per_deg_lon(lat), lat + dy / M_PER_DEG_LAT
def haversine_m(lo1, la1, lo2, la2):
    R = 6371000.0
    p1, p2 = math.radians(la1), math.radians(la2)
    dphi = math.radians(la2 - la1); dl = math.radians(lo2 - lo1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(a))

devices = []   # (name, role, lon, lat)
links = []
def add(name, role, lon, lat): devices.append((name, role, round(lon, 6), round(lat, 6)))

# ---------- ASG: 区域内抖动网格均匀布置 ----------
REG = P["region_km"] * 1000.0
asg_xy = {}    # name -> (lon,lat)
g = int(math.ceil(math.sqrt(P["n_asg"])))
step = REG / g
idx = 0
cells = [(i, j) for i in range(g) for j in range(g)]
rng.shuffle(cells)
for (i, j) in cells:
    if idx >= P["n_asg"]: break
    idx += 1
    cx = -REG/2 + (i + 0.5) * step + rng.uniform(-0.3, 0.3) * step
    cy = -REG/2 + (j + 0.5) * step + rng.uniform(-0.3, 0.3) * step
    lon, lat = offset(CENTER[0], CENTER[1], cx, cy)
    name = f"ASG-{idx:03d}"; add(name, "asg", lon, lat); asg_xy[name] = (lon, lat)
asg_names = list(asg_xy.keys())
asg_arr = np.array([asg_xy[a] for a in asg_names])   # (n,2) lon,lat

def nearest_asgs(lon, lat, k=2):
    # 近似: 用经纬度差(小范围足够)挑最近k个ASG
    d = (asg_arr[:, 0]-lon)**2 + ((asg_arr[:, 1]-lat)*1.3)**2
    return [asg_names[i] for i in np.argsort(d)[:k]]

# ---------- 现网环: 铺到 target_existing ----------
eidx = 0; bidx = 0
existing_csgs = []   # (name, lon, lat)
branch_csgs = []
ring_specs = []      # 记录每个环的节点列表(挂分支用)
while eidx < P["target_existing"]:
    anchorA = asg_names[rng.integers(0, len(asg_names))]
    alon, alat = asg_xy[anchorA]
    # 环中心: 距锚ASG 1~5km
    ang0 = rng.uniform(0, 2*math.pi); rdist = rng.uniform(1000, 5000)
    clon, clat = offset(alon, alat, math.cos(ang0)*rdist, math.sin(ang0)*rdist)
    k = int(rng.integers(P["ring_size_min"], P["ring_size_max"]+1))
    k = min(k, P["target_existing"] - eidx)
    if k <= 0: break
    rad = rng.uniform(700, 1800)
    base = rng.uniform(0, 2*math.pi)
    nodes = []
    for jj in range(k):
        ang = base + math.pi * (jj+1)/(k+1)         # 半圈弧, 两端靠近锚
        jt = rng.uniform(0.85, 1.15)
        lon, lat = offset(clon, clat, math.cos(ang)*rad*jt, math.sin(ang)*rad*jt)
        eidx += 1; nm = f"CSG-E{eidx:05d}"; add(nm, "csg", lon, lat)
        existing_csgs.append((nm, lon, lat)); nodes.append(nm)
    for a, b in zip(nodes[:-1], nodes[1:]): links.append((a, b))
    links.append((anchorA, nodes[0]))
    if rng.random() < P["dual_asg_frac"]:
        a2 = next((x for x in nearest_asgs(clon, clat, 3) if x != anchorA), anchorA)
        links.append((a2, nodes[-1]))              # 双ASG开放链(环)
    else:
        links.append((anchorA, nodes[-1]))         # 单ASG闭合环
    ring_specs.append(nodes)

# ---------- 环带链: branch_frac 的环挂单归spur ----------
n_branch_rings = int(P["branch_frac"] * len(ring_specs))
if n_branch_rings > 0:
    pick = rng.choice(len(ring_specs), size=n_branch_rings, replace=False)
    for ri in pick:
        nodes = ring_specs[ri]
        attach = nodes[len(nodes)//2]
        ax = next(d for d in devices if d[0] == attach)
        prev, plon, plat = attach, ax[2], ax[3]
        for _ in range(int(rng.integers(P["branch_len_min"], P["branch_len_max"]+1))):
            ang = rng.uniform(0, 2*math.pi); dist = rng.uniform(400, 1000)
            plon, plat = offset(plon, plat, math.cos(ang)*dist, math.sin(ang)*dist)
            bidx += 1; nm = f"CSG-B{bidx:04d}"; add(nm, "csg", plon, plat)
            branch_csgs.append((nm, plon, plat)); links.append((prev, nm)); prev = nm

# ---------- 新增孤点CSG ----------
nidx = 0; new_csgs = []
n_near = int(round(P["near_frac"] * P["n_new"]))
n_far = P["n_new"] - n_near
exist_arr = np.array([(c[1], c[2]) for c in existing_csgs])
for _ in range(n_near):
    base = existing_csgs[rng.integers(0, len(existing_csgs))]
    ang = rng.uniform(0, 2*math.pi); dist = rng.uniform(P["near_dist_min"], P["near_dist_max"])
    lon, lat = offset(base[1], base[2], math.cos(ang)*dist, math.sin(ang)*dist)
    nidx += 1; nm = f"CSG-N{nidx:05d}"; add(nm, "csg", lon, lat); new_csgs.append((nm, lon, lat))
# 远端簇: 在区域内挑远离现网密度的中心, 簇内撒点
far_centers = []
tries = 0
while len(far_centers) < P["far_clusters"] and tries < P["far_clusters"]*40:
    tries += 1
    cx, cy = rng.uniform(-REG/2, REG/2), rng.uniform(-REG/2, REG/2)
    lon, lat = offset(CENTER[0], CENTER[1], cx, cy)
    dmin = np.min((exist_arr[:, 0]-lon)**2 + ((exist_arr[:, 1]-lat)*1.3)**2) ** 0.5 * M_PER_DEG_LAT
    if dmin > 4000:    # 距最近现网CSG > ~4km 才算"远"
        far_centers.append((lon, lat))
if not far_centers:
    far_centers = [offset(CENTER[0], CENTER[1], rng.uniform(-REG/2, REG/2), rng.uniform(-REG/2, REG/2))
                   for _ in range(max(1, P["far_clusters"]))]
for i in range(n_far):
    cc = far_centers[i % len(far_centers)]
    ang = rng.uniform(0, 2*math.pi); dist = rng.uniform(150, 1400)
    lon, lat = offset(cc[0], cc[1], math.cos(ang)*dist, math.sin(ang)*dist)
    nidx += 1; nm = f"CSG-N{nidx:05d}"; add(nm, "csg", lon, lat); new_csgs.append((nm, lon, lat))

# ---------- road_distance: 空间网格找 CSG-CSG 直线<=road_max_m ----------
all_csgs = existing_csgs + branch_csgs + new_csgs
cell = P["road_max_m"]
lat0 = CENTER[1]; mlon = m_per_deg_lon(lat0)
def to_xy(lon, lat): return ((lon-CENTER[0])*mlon, (lat-CENTER[1])*M_PER_DEG_LAT)
grid = {}
pts = []
for i, (nm, lo, la) in enumerate(all_csgs):
    x, y = to_xy(lo, la); pts.append((nm, lo, la, x, y))
    grid.setdefault((int(x//cell), int(y//cell)), []).append(i)
road_rows = []
for i, (nm, lo, la, x, y) in enumerate(pts):
    cx, cy = int(x//cell), int(y//cell)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for j in grid.get((cx+dx, cy+dy), ()):
                if j <= i: continue
                nm2, lo2, la2, x2, y2 = pts[j]
                d = haversine_m(lo, la, lo2, la2)
                if d <= cell:
                    road_rows.append((nm, nm2, round(d*rng.uniform(1.2, 1.6), 1)))

# ---------- 写文件 ----------
def write(fn, header, rows):
    with open(os.path.join(OUT, fn), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(header); w.writerows(rows)

# Is_new_ne: 新增孤点CSG标 1, 现网既有网元(ASG/现有CSG/分支CSG)标 0。
# 注: 等价于"现网有链接者标0,否则标1", 但对极少数未挂环的现网ASG(无链接)仍判0(其为现网设施, 非新增)。
new_names = {c[0] for c in new_csgs}
device_rows = [(n, role, lon, lat, 1 if n in new_names else 0) for (n, role, lon, lat) in devices]
write("device.csv", ["NE Name", "Role", "Longitude", "Latitude", "Is_new_ne"], device_rows)
write("link.csv", ["Src NE Name", "Sink NE Name"], links)
write("road_distance.csv", ["Src NE Name", "Sink NE Name", "Distance"], road_rows)

print(f"[用例 {CASE} | profile {PROFILE}]")
print(f"参数: " + ", ".join(f"{k}={P[k]}" for k in
      ("n_asg","target_existing","branch_frac","n_new","near_frac","region_km")))
print(f"设备 {len(devices)} (ASG={len(asg_names)}, 现网CSG={len(existing_csgs)}, "
      f"分支CSG={len(branch_csgs)}, 新增CSG={len(new_csgs)})")
print(f"现网链路 {len(links)}  现有环 {len(ring_specs)}  环带链 {n_branch_rings}")
print(f"新增: 贴近 {n_near} / 远端 {n_far}(簇中心 {len(far_centers)})")
print(f"road_distance 记录(<= {cell}m) {len(road_rows)}")
