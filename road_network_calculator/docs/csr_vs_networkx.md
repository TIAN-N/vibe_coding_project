# CSR 图结构 vs NetworkX Graph

本文解释为什么本项目在百万级路网计算中使用 CSR 压缩图结构，而不是直接使用 `networkx.Graph`。

## 1. 一句话区别

```text
NetworkX Graph：适合快速开发、教学、小规模图分析。
CSR 图结构：适合百万级路网、高性能加载、低内存寻路。
```

两者都可以表达“节点 + 边 + 权重”，也都可以运行 Dijkstra、A* 等最短路算法。

真正的区别不在算法名字，而在底层数据怎么存、怎么访问。

## 2. 示例路网

假设有一个很小的路网：

```text
A ---5--- B
|         |
2         3
|         |
C ---4--- D
```

节点：

```text
A, B, C, D
```

无向边：

```text
A-B 距离 5
A-C 距离 2
B-D 距离 3
C-D 距离 4
```

如果把节点编号：

```text
A = 0
B = 1
C = 2
D = 3
```

图可以写成：

```text
0 --5-- 1
0 --2-- 2
1 --3-- 3
2 --4-- 3
```

## 3. NetworkX 的存储方式

NetworkX 通常使用嵌套 Python 字典保存图。

示意结构：

```text
Graph
├── 0
│   ├── 1 : {"weight": 5}
│   └── 2 : {"weight": 2}
├── 1
│   ├── 0 : {"weight": 5}
│   └── 3 : {"weight": 3}
├── 2
│   ├── 0 : {"weight": 2}
│   └── 3 : {"weight": 4}
└── 3
    ├── 1 : {"weight": 3}
    └── 2 : {"weight": 4}
```

Python 代码示例：

```python
import networkx as nx

graph = nx.Graph()
graph.add_edge(0, 1, weight=5)
graph.add_edge(0, 2, weight=2)
graph.add_edge(1, 3, weight=3)
graph.add_edge(2, 3, weight=4)

distance = nx.shortest_path_length(graph, 0, 3, weight="weight")
path = nx.shortest_path(graph, 0, 3, weight="weight")

print(distance)  # 6
print(path)      # [0, 2, 3]
```

### 3.1 NetworkX 的优点

- API 简单，代码短。
- 内置图算法丰富。
- 适合快速验证算法思路。
- 适合小规模图、教学和分析任务。

### 3.2 NetworkX 的问题

NetworkX 的每条边会涉及很多 Python 对象：

```text
dict
dict item
edge attribute dict
字符串 key "weight"
Python int
Python float
```

小图没有问题，但百万级路网会出现明显问题：

- 内存开销大。
- Python 字典查找多。
- CPU cache 不友好。
- 在线查询时延较高。

## 4. CSR 图结构的存储方式

CSR 全称是 Compressed Sparse Row，中文可以理解为“压缩行存储”。

在图计算里，它是一种压缩邻接表。

CSR 通常使用三个数组：

```text
offsets
neighbors
weights
```

对上面的示例图，邻接关系是：

```text
0: 1(weight=5), 2(weight=2)
1: 0(weight=5), 3(weight=3)
2: 0(weight=2), 3(weight=4)
3: 1(weight=3), 2(weight=4)
```

可以压缩成：

```text
offsets  = [0, 2, 4, 6, 8]
neighbors= [1, 2, 0, 3, 0, 3, 1, 2]
weights  = [5, 2, 5, 3, 2, 4, 3, 4]
```

示意图：

```text
node 0 的邻居范围：
offsets[0] 到 offsets[1]
0 到 2

neighbors[0:2] = [1, 2]
weights[0:2]   = [5, 2]

node 1 的邻居范围：
offsets[1] 到 offsets[2]
2 到 4

neighbors[2:4] = [0, 3]
weights[2:4]   = [5, 3]
```

更直观地看：

```text
offsets
index:      0  1  2  3  4
value:      0  2  4  6  8
            |  |  |  |  |
            |  |  |  |  └─ node 3 结束位置
            |  |  |  └──── node 3 开始位置
            |  |  └─────── node 2 开始位置
            |  └────────── node 1 开始位置
            └───────────── node 0 开始位置

neighbors
index:      0  1  2  3  4  5  6  7
value:      1  2  0  3  0  3  1  2

weights
index:      0  1  2  3  4  5  6  7
value:      5  2  5  3  2  4  3  4
```

Python 访问方式：

```python
offsets = [0, 2, 4, 6, 8]
neighbors = [1, 2, 0, 3, 0, 3, 1, 2]
weights = [5, 2, 5, 3, 2, 4, 3, 4]

node = 0
start = offsets[node]
end = offsets[node + 1]

for pos in range(start, end):
    neighbor = neighbors[pos]
    weight = weights[pos]
    print(node, "->", neighbor, "weight=", weight)
```

输出：

```text
0 -> 1 weight=5
0 -> 2 weight=2
```

## 5. 两者寻路时的访问区别

### 5.1 NetworkX 的邻居访问

NetworkX Dijkstra 遍历邻居时，大致类似：

```python
for neighbor, edge_data in graph[node].items():
    weight = edge_data["weight"]
```

这一步内部涉及：

```text
访问 graph[node]
遍历 dict
读取 edge_data
通过字符串 key "weight" 取权重
处理 Python 对象
```

### 5.2 CSR 的邻居访问

CSR Dijkstra 遍历邻居时，大致类似：

```python
for pos in range(offsets[node], offsets[node + 1]):
    neighbor = neighbors[pos]
    weight = weights[pos]
```

这一步只是在连续数组里按下标读取。

```text
数组索引
连续内存
整数 neighbor
浮点 weight
```

## 6. Dijkstra 算法本身有什么不同

算法思想没有本质区别。

Dijkstra 都是：

```text
1. 从起点开始，起点距离为 0。
2. 每次取当前距离最小的节点。
3. 遍历它的邻居。
4. 如果经过当前节点能让邻居距离更短，就更新邻居距离。
5. 直到找到终点或所有可达节点都处理完。
```

区别在于第 3 步：

```text
遍历邻居时，NetworkX 从 Python dict 里取；
CSR 从连续数组里取。
```

所以理论复杂度可能都是：

```text
O((V + E) log V)
```

但实际性能差异会很大。

## 7. 当前项目里的 CSR 寻路

当前项目使用的是双向 Dijkstra。

普通 Dijkstra：

```text
起点  --->  --->  --->  终点
```

双向 Dijkstra：

```text
起点  --->  --->  <---  <---  终点
```

它从起点和终点两边同时搜索，两个搜索区域相遇后得到最短路。

在 CSR 中扩展一个节点时：

```python
for pos in range(offsets[node], offsets[node + 1]):
    nb = neighbors[pos]
    nd = dist + weights[pos]
    if nd < dist_this[nb]:
        dist_this[nb] = nd
        prev_this[nb] = node
```

这段代码的关键优势是：邻居和权重都是数组读取。

## 8. 内存差异为什么明显

### 8.1 NetworkX

NetworkX 一条边可能涉及多层对象：

```text
node dict
adjacency dict
neighbor key
edge attr dict
"weight" 字符串 key
Python float 对象
```

百万级边时，这些对象的额外开销会被放大。

### 8.2 CSR

CSR 一条边主要是数组里的几个值：

```text
neighbor id: int32 或 int64
weight: float64
offset: int64
```

数据更紧凑。

## 9. 对比表

| 对比项 | CSR 图结构 | NetworkX Graph |
| --- | --- | --- |
| 设计目标 | 高性能计算 | 易用和通用图分析 |
| 底层结构 | 连续数组 | Python dict 和对象 |
| 内存占用 | 低 | 高 |
| 百万级路网 | 更适合 | 容易内存膨胀 |
| 邻居遍历 | 数组切片 | 字典遍历 |
| CPU cache | 友好 | 不友好 |
| 算法丰富度 | 需要自己实现 | 内置很多 |
| 开发便利性 | 一般 | 很高 |
| 适合场景 | 在线服务、大规模路网 | 原型、小图分析、教学 |

## 10. 简单选型建议

### 10.1 用 NetworkX 的情况

如果你的数据是：

```text
几千个节点
几万条边
主要为了验证算法或做分析
```

NetworkX 很合适。

### 10.2 用 CSR 的情况

如果你的数据是：

```text
几十万到几百万节点
百万级边
需要 Web 服务在线查询
需要控制内存
```

CSR 更合适。

## 11. 本项目为什么选择 CSR

本项目目标是：

```text
百万级 WKT 路网加载
低内存
较快寻路
Web API 在线查询
地图可视化
```

如果使用 NetworkX，开发会更快，但百万级数据下内存和查询性能风险较高。

因此本项目选择 CSR：

```text
用更底层的数据结构，换取更好的加载性能、内存表现和查询速度。
```

## 12. 总结

可以把两者理解成：

```text
NetworkX = 图算法工具箱，方便、灵活，但不适合特别大的在线计算。

CSR = 面向生产性能的图存储结构，不如 NetworkX 方便，但更适合百万级路网。
```

对于路网最短路计算，算法名字可能一样，真正决定性能的是：

```text
邻居和权重到底是从 Python 对象里取，还是从连续数组里取。
```

