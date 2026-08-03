# Python / NetworkX 逻辑布局

## 单一布局源

逻辑视图坐标统一由 `POST /api/v1/layout/logic` 生成。前端提交当前可见网元、链路和 Canvas 尺寸，只使用接口返回的 `x/y` 虚拟坐标渲染 SVG，不执行本地布局或失败回退。

## 布局策略

1. 节点集合为网元表节点与链路表端点的并集，边仅来自链路表。
2. 500 个网元以内统一调用原始 `logic_topo_visual.py` 使用的 `networkx.kamada_kawai_layout`。
3. 使用原始脚本的通用节点防重叠逻辑调整距离过近的坐标。
4. 将 NetworkX 归一化结果等比缩放并居中映射到浏览器实际 Canvas。
5. 环链表、环链类别、成员路径和汇聚归属均不参与布局计算。

## 返回字段

- `layout_available`：是否可以呈现逻辑视图。
- `algorithm`：本次采用的 NetworkX 布局算法。
- `node_count`：参与布局的节点数量。
- `edge_count`：参与布局的链路数量。
- `canvas`：布局对应的 Canvas 尺寸。
- `nodes`：全部节点的 `id/x/y/role`。

## PNG 预览

可以直接使用网元表、链路表生成与浏览器相同坐标的 PNG：

```powershell
python -m algo.layout.logic_layout_preview `
  --device-file "网元表.csv" `
  --link-file "链路表.csv" `
  --output-file "logic_topology.png"
```
