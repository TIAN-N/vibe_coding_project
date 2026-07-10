# 轻量级 Web 前端拓扑可视工具设计文档

## 1. 目标与交付形态

本工具面向本地 PC 直接打开使用，当前入口文件为 `topo_visual_tool.html`。页面样式与业务脚本分别拆分到 `assets/css/styles.css` 与 `assets/js/app.js`，便于后续增量开发。

核心目标：

- 上传网元表和链路表，前端自动解析 CSV/XLSX。
- 提供 GIS Topo 与 Logic Topo 两种拓扑呈现方式。
- 支持网元定位、高亮、过滤、数据管理、在线编辑和统计。
- 支持中文与英文 UI 切换，其中“网元”英文统一为 `Device`，“链路”英文统一为 `Link`。

## 2. 本轮优化设计

### 2.1 商务柔和 UI

界面视觉从基础工具风格调整为更商务、柔和的运维控制台风格：

- 使用低饱和背景、白色工作区、柔和蓝绿主色与暖色强调色。
- 控制区采用更清晰的信息层级，弱化边框，增加细腻阴影和留白。
- 表格、按钮、页签、统计卡片采用统一圆角与 hover/focus 状态。
- 保持功能密度，不做营销式页面。

### 2.2 数据管理编辑与统计

原 `contenteditable` 表格在不同浏览器和刷新逻辑下不够稳定，本轮改为表格单元格内嵌 `<input>`：

- 用户可以直接修改单元格输入框。
- 点击“应用编辑”后同步内存数据并刷新拓扑。
- 数据管理页顶部新增统计条：
  - 当前表类型。
  - 当前显示记录数。
  - 总记录数。
  - 字段数量。
  - 网元表显示角色分布。
  - 链路表显示端点缺失数量。

### 2.3 Logic Topo 节点大小与选中样式

Logic Topo 节点大小按节点自由度自适应：

- 自由度越高，节点半径越大。
- 半径控制在合理范围内，避免高连接节点过大影响布局。
- 选中节点不再使用黑色边框，改为柔和青蓝描边和外圈光晕。
- 高亮节点使用暖色外圈，未命中节点降低透明度。

### 2.4 GIS Topo 可视强化

GIS 底图信息较多时，网元和链路容易被淹没。本轮采用以下策略：

- 地图瓦片降低透明度，让业务对象更突出。
- 链路采用“浅色宽底线 + 彩色业务线”的双层绘制，形成道路背景上的描边效果。
- 网元采用外层光晕 + 内层角色色节点。
- 节点尺寸和描边增强，搜索选中和高亮时更明显。
- 小规模数据下保留悬浮名称提示，避免文字遮挡常态视图。

### 2.5 中英文 UI 切换

页面增加语言切换控件：

- `中文`
- `English`

设计原则：

- 静态按钮、标题、占位符、提示语、统计标签均通过统一字典切换。
- 业务数据字段名不翻译，保持上传数据原始字段。
- 动态消息使用统一 `t(key, params)` 函数生成。
- 英文术语：网元为 `Device`，链路为 `Link`。

## 3. 输入数据约束

### 3.1 网元表必选字段

- `NE Name`
- `Role`
- `Longitude`
- `Latitude`

字段名建议保持一致。页面会做 trim 处理，但不会猜测完全不同的字段名。

### 3.2 链路表必选字段

- `Src NE Name`
- `Sink NE Name`

每行代表一条双向逻辑连接。

### 3.3 角色配色

- `CSG`：蓝色
- `ASG`：橙色
- `PE`：红色
- 其他或空角色：灰色

## 4. 功能设计

### 4.1 数据上传

用户分别上传网元表和链路表。页面解析后进行基础校验：

- 检查必选字段是否存在。
- 统计网元数量、链路数量、角色分布、坐标缺失、链路端点缺失。
- 建立网元名称索引，用于链路匹配、搜索定位、高亮过滤。

页面提供“加载 Mock 数据”按钮，用于不准备文件时直接验证端到端功能。

Mock 数据不再只覆盖小规模功能验证，而是生成上百个网元和上百条链路，用于观察页面在中等规模拓扑下的渲染、过滤、高亮和数据管理响应表现。

## 2.6 本轮新增优化

### 2.6.1 Logic Topo 分层分组布局

当网元达到上百个时，通用力导向布局会出现可读性下降。本轮将 Logic Topo 改为确定性布局：

- 按角色分层：PE 位于上层，ASG 位于中层，CSG 位于下层，其他角色位于补充层。
- 按 `Region` 字段分组：同一区域的节点在同一横向分组内排列。
- 每个分组内部使用网格排列，避免节点互相挤压。
- 链路仍按源宿关系绘制，布局不再依赖随机力模拟，打开和刷新结果更稳定。

### 2.7 Logic Topo 网络结构化布局

在进一步评估百级节点可读性后，Logic Topo 从“角色分层 + 区域分组网格”升级为更贴近网络拓扑结构的布局：

- PE 位于顶部核心区，按圆形或椭圆均匀分布，适合 full-mesh 连接。
- ASG 按 `Ring ID` 形成汇聚环，分布在中上层，每个 ASG 环靠近其上联 PE 对。
- CSG 按 `Ring ID` 形成接入环或路径，分布在下层，每个 CSG 环靠近其上联 ASG 对。
- 节点名称统一放在节点右侧，节点半径和标签间距固定，避免名称和节点重叠。
- 同一环内节点顺序排列，环内链路相邻连接，减少长距离交叉。
- 对于没有 `Ring ID` 的用户上传数据，回退到角色分层与区域分组布局。
- 点击某个节点时，高亮该节点的一跳直连链路和邻居节点，用于快速判断该节点具体连接了哪些网元。

该布局目标是：

- 节点之间的连线尽可能沿层级和环路径展开，减少交叉。
- 节点分散排列，标签不压住节点。
- 用户点击或高亮某个网元时，可以通过邻近路径清楚看到其连接对象。

### 2.8 Spring Layout 布局算法

根据用户反馈，Logic Topo 进一步借鉴 NetworkX `spring_layout` / Fruchterman-Reingold 的布局思想：

- 使用确定性初始坐标，优先从网络结构化布局生成初始位置。
- 链路两端使用弹簧吸引力，保持相连节点距离适中。
- 所有节点之间使用斥力，让节点分散。
- 对 PE / ASG / CSG 保留弱层级引力，避免核心、汇聚、接入完全混杂。
- 对同一 `Ring ID` 增加轻微聚类力，让接入环和汇聚环仍保持业务聚合。
- 使用固定迭代次数和确定性排序，避免同一数据每次刷新布局大幅变化。
- 节点标签放在节点右侧，布局计算中预留横向标签空间，降低名称与节点或其他名称重叠概率。

该算法不是直接运行 Python NetworkX，而是在浏览器端实现同类 spring layout 思路，以保持本地 HTML 直接打开的交付形态。

### 2.9 批量网元/链路查询过滤

页面新增自适应批量查询框，支持用户从 Word、Excel、CSV 或其他三方软件复制内容后直接粘贴：

- 支持多行文本。
- 支持逗号、中文逗号、分号、空格、制表符、换行分隔。
- 支持粘贴完整链路行，例如 `A,B`、`A -> B`、`A	B`。
- 查询逻辑会自动从文本中提取 token，与网元表 `NE Name` 以及链路表 `Src NE Name` / `Sink NE Name` 匹配。
- 点击“查询”后，拓扑视图只显示：
  - 直接命中的网元。
  - 源端或宿端命中的链路。
  - 这些链路两端的上下文网元。
- 点击“清除查询”后恢复普通过滤/高亮视图。

该功能独立于高亮和条件过滤，但会与条件过滤共同作用；如果两者同时存在，则最终呈现两类过滤条件的交集。

### 2.10 大规模数据性能策略

针对 2w+ 网元和万级链路的数据规模，页面采用“先索引、后按需渲染”的性能策略：

- 上传解析后建立网元名称索引、大小写索引和按网元聚合的链路索引。
- 大规模数据加载后不立即计算 Logic Topo spring layout，避免 O(n²) 计算卡死主线程。
- Logic Topo 仅在当前过滤/查询结果不超过 600 个网元、1000 条链路时执行 spring layout；超过阈值时提示用户先缩小范围。
- GIS Topo 使用 Leaflet canvas renderer，并只渲染当前地图视窗内的对象，节点和链路各有渲染上限。
- 数据管理表格只渲染前 500 行，统计仍基于完整数据，避免一次性创建数十万个输入框。
- 批量查询、定位和一跳链路查询使用索引，不再全表反复扫描链路。
- 坐标缺失和断链统计在数据加载时缓存，避免地图移动时重复统计。

本工具在大数据场景下的目标是保持上传后页面快速恢复交互，并引导用户通过定位、过滤、批量查询查看局部拓扑，而不是一次性全量绘制所有节点和链路。

### 2.10.1 GIS 瓦片稳定性与缩放优化

大数据规模下，GIS 放大或连续拖动时可能同时触发在线地图瓦片请求和大量业务图层重绘。如果瓦片服务响应慢、浏览器请求被限流，或本地网络不稳定，Leaflet 可能短时间显示灰色色块。为降低该问题影响，本轮增加以下策略：

- 地图缩放和拖动过程中不立即重绘网元/链路，改为 `moveend` / `zoomend` 后防抖刷新，避免瓦片加载期间反复清空和重建业务图层。
- 在线瓦片使用 `updateWhenIdle`、`updateWhenZooming=false` 和更大的 `keepBuffer`，减少缩放过程中的无效瓦片请求。
- 连续瓦片加载失败达到阈值后，自动切换为本地浅色简洁底图，保留 GIS 坐标投影、网元和链路绘制能力，避免灰块长期影响业务拓扑判读。
- GIS 业务对象渲染上限进一步收敛，超大数据场景优先保证交互响应，再通过定位、过滤和批量查询查看局部拓扑。
- 地图容器提供浅色背景兜底，即使在线瓦片尚未加载完成，也不会出现突兀灰底。

该方案不改变用户上传数据格式，也不引入后端服务；在线地图可用时继续显示底图，在线地图不可用或失败较多时自动退化为简洁底图。

### 2.10.2 可配置节点样式与孤立网元布局

本轮新增面向用户的节点样式配置能力，目标是在不修改代码的情况下调整高亮表达和节点图例表达：

- 高亮样式开放节点颜色、节点大小、节点形状和相关链路颜色配置，命中高亮条件的节点及其相关链路在 GIS Topo 和 Logic Topo 中使用该配置进行覆盖显示。
- 节点图例与节点样式规则分层处理：节点图例默认按 `Role` 提供基础样式，节点样式规则作为用户显式应用后的覆盖层。
- 节点图例开放 CSG、ASG、PE、Other 的颜色、大小、形状配置。默认样式为 CSG 蓝色圆形、ASG 橙色圆形、PE 红色圆形、Other 灰色圆形。
- 用户可以新增任意 device 字段条件规则，例如 `字段A = 1` 使用紫色三角形、`字段A = 0` 使用绿色圆形。规则字段来自 device 表，条件值来自该字段的已有枚举值，也允许用户直接输入。
- 节点样式规则按列表从上到下执行，后匹配规则覆盖前匹配规则。规则列表使用“上移/下移”按钮调整顺序，只有点击“应用节点规则”后才覆盖命中节点。
- 删除节点规则会同步移除该规则带来的覆盖效果；重置样式会清空节点规则并恢复节点图例基础样式。
- 形状统一支持 `circle`、`square`、`diamond`、`triangle`。Logic Topo 使用 SVG 基础图形绘制；GIS Topo 保持 Leaflet 矢量图层实现，圆形使用 `circleMarker`，其他形状使用地图坐标转换后的 polygon，避免大量 DOM marker 影响性能。
- 节点大小仍保留自由度自适应能力：角色配置大小作为基础尺寸，Logic/GIS 再按节点连接自由度做小幅增益；高亮节点使用高亮配置大小作为视觉优先级。
- 选中节点和一跳邻居仅通过描边强调，不覆盖用户设置的填充色和形状，避免选中后样式突变。

Logic Topo 对无连接网元单独布局：

- 当前可视数据中自由度为 0 的网元不参与 spring layout 的斥力和引力计算，避免大量散点挤压有连接拓扑。
- 有连接节点保留在画布上部主布局区域，继续使用 spring layout 优化连线重叠和节点分散度。
- 无连接网元统一平铺在画布最下层的散点带，按名称稳定排序，方便查看但不干扰主拓扑。
- 大规模保护阈值保持不变；只有当前过滤/查询结果低于 Logic Topo 阈值时才进行布局和绘制。

### 2.10.3 搜索历史缓存

为提升重复查询效率，网元定位、高亮条件值、过滤条件值增加本地历史缓存：

- 历史记录保存在浏览器 `localStorage`，不依赖后端服务，也不会写入上传数据文件。
- 用户执行“定位网元”“应用高亮”“应用过滤”时，如果输入值非空，则记录到对应历史列表。
- 每类历史最多保留 12 条，最新记录排在最前，重复记录会自动去重并前移。
- 网元定位输入框继续保留网元名称联想能力，同时在候选列表前部展示历史定位记录。
- 高亮条件值和过滤条件值输入框增加候选列表，用户清空输入后再次聚焦输入框时，可从历史记录中快速选择。

### 2.10.4 链路样式规则与字段值联想

为支持不同业务状态的链路可视区分，新增基于 link 表字段的链路样式规则：

- link 表除必选字段 `Src NE Name`、`Sink NE Name` 外，其余字段自动进入链路样式配置字段下拉框。
- 用户可以配置多条链路样式规则，每条规则包含：字段、操作符、条件值、颜色、线型、线宽。
- 操作符先支持 `等于`、`包含`、`不等于`，满足枚举字段和简单文本字段的主流配置场景。
- 条件值输入框根据当前选择字段自动解析 link 表中的已有枚举值，并提供联想下拉；用户也可以直接输入未出现的新值。
- 多条规则同时生效时按列表顺序匹配，后匹配规则覆盖先匹配规则，便于用户用后置规则处理更特殊的链路。
- 线型支持实线、虚线、点线；线宽支持细线、中线、粗线。
- GIS Topo 和 Logic Topo 共用同一套链路样式规则。选中链路和高亮相关链路仍具备更高视觉优先级，但未选中/未高亮部分会使用用户配置的链路样式。

高亮条件值和过滤条件值的联想能力同步增强：

- 当用户切换高亮/过滤字段时，条件值输入框会自动联想该字段在网元表中的已有枚举值。
- 历史记录继续保留，并与字段枚举值一起作为候选来源；字段枚举值优先展示，历史记录作为补充。

### 2.11 大规模测试拓扑构造规则

大规模测试数据重新按更贴近接入/汇聚网络的方式构造：

- 网元分布覆盖泰国多个区域，包括曼谷、北部、东北部、中部、东部、西部和南部。
- 不构造 PE。
- 构造 2500 个 ASG 和 17500 个 CSG，总计 20000 个网元。
- 每个 ASG 连接附近 7 个 CSG，满足“每个 ASG 与附近 4-10 个 CSG 相连”的约束。
- 每个 CSG 只连接 1 个 ASG，满足“每个接入网元至多 2 条连接”的约束。
- ASG-CSG 链路距离控制在约 20km 以内。
- `large_device.csv` 和 `large_link.csv` 用于大规模上传、过滤、批量查询和视窗渲染测试。

### 2.6.2 节点视觉去阴影

为保持界面干净整洁，GIS 与 Logic 节点均取消外层阴影/光晕：

- GIS 节点取消外圈光晕，仅保留清晰描边和角色色填充。
- Logic 节点取消外圈环和 drop-shadow，仅保留纯净圆点、角色色和选中/高亮描边。

### 2.6.3 过滤与高亮链路规则

过滤规则调整为：

- 保留符合条件的网元。
- 保留源端或宿端任一端在符合条件网元清单内的链路。
- 为保证链路可见，链路另一端网元也会作为上下文网元显示。

高亮规则调整为：

- 高亮符合条件的网元。
- 高亮源端或宿端任一端在符合条件网元清单内的链路。
- 与这些链路相连的另一端网元作为上下文保留显示，但不作为命中网元高亮。

### 2.6.4 Mock 数据 CSV 导出与真实化拓扑

将内置 Mock 数据导出为：

- `device.csv`
- `link.csv`

用户可从空页面开始，手动上传这两个文件验证完整上传流程。

Mock 数据调整为更符合典型网络拓扑：

- CSG：每组接入层节点形成一个环型路径，路径起点和终点分别上联到一对 ASG。
- ASG：多个汇聚节点形成汇聚环，环上的 ASG 上联到一对 PE。
- PE：核心层节点之间 full-mesh 互联。
- Mock 网元表增加 `Ring ID`、`Ring Role`、`Uplink Pair` 字段，用于验证结构化布局和扩展筛选。

### 4.2 GIS Topo

GIS Topo 将网元节点绘制在地图经纬度位置上，节点颜色按角色区分。链路按两端网元坐标绘制为地图线段。

大数据模式下，GIS 直连链路的视窗裁剪采用链路经纬度包围盒与扩展视窗相交判断，而不是仅判断源宿端点是否落在视窗内。这样长跨度链路在放大后只要穿过当前视窗，仍会保持显示。

交互能力：

- 点击节点显示网元详情。
- 搜索定位后地图平移并缩放到目标网元。
- 高亮条件强调符合条件的节点及相关链路。
- 过滤条件只显示符合条件的节点，以及这些节点之间的链路。

### 4.3 Logic Topo

Logic Topo 在白色 SVG 画布上展示逻辑关系，布局依据链路表自动计算。

交互能力：

- 节点可拖拽调整位置。
- 滚轮缩放，背景拖拽平移。
- 搜索定位会切换视图中心到目标节点。
- 节点半径按自由度自适应。
- 高亮和过滤逻辑与 GIS Topo 保持一致。

### 4.4 网元定位

搜索框根据网元名称提供联想匹配。点击定位后：

- 如果在 GIS Topo，地图定位到网元经纬度。
- 如果在 Logic Topo，画布平移到网元所在位置。
- 目标网元会被临时选中并显示详情。

### 4.5 高亮能力

页面自动读取网元表字段，用户可选择字段、操作符和值形成一个简单条件。

支持操作符：

- 包含
- 等于
- 不等于
- 开头是
- 结尾是
- 大于
- 小于
- 为空
- 非空

高亮行为：

- 匹配条件的网元高亮。
- 与匹配网元相关的链路高亮。
- 未匹配对象降低视觉权重但仍保留。

### 4.6 过滤能力

过滤条件使用同一套字段和操作符。

过滤行为：

- 只呈现符合条件的网元。
- 只呈现两端都在过滤结果内的链路。
- 清除过滤后恢复完整拓扑。

### 4.7 数据管理

数据管理页签提供：

- 网元表在线查看。
- 链路表在线查看。
- 表格字段筛选。
- 表格关键字过滤。
- 数据统计条。
- 单元格输入框编辑。
- 新增行、删除行。
- 应用编辑并刷新拓扑。

## 5. 扩展性设计

高亮、过滤和数据管理不绑定固定业务字段。除必选字段外，其余字段会自动进入字段选择器与表格展示。后续如果网元表增加 `Province`、`Vendor`、`Status`、`Ring ID` 等字段，页面无需改代码即可用于筛选、高亮与编辑。

语言字典与渲染逻辑分离，后续可继续增加其他语言或术语定制。

## 6. 边界与约束

- 本版本是纯前端本地工具，不做数据持久化；刷新页面后内存数据会丢失。
- XLSX 解析依赖 SheetJS CDN；GIS 在线底图依赖 Leaflet 与在线瓦片。无网络或瓦片失败较多时，GIS 会退化为浅色简洁底图，仍可查看网元和链路；Logic Topo 不依赖在线地图瓦片。
- GIS 链路按两端经纬度直接连线，不进行真实道路或光缆路由计算。
- 过滤链路采用“两端都在过滤后网元集合内”的规则，保证画面中只显示过滤结果网元。

## 7. 测试设计

内置 Mock 数据覆盖：

- CSG / ASG / PE 三类角色。
- 约 120 个网元。
- 约 180 条逻辑链路。
- 经纬度定位。
- 额外字段 `Region`、`Vendor`、`Status`、`Site Type`，用于验证动态字段筛选、高亮、过滤和数据管理。
- 适合验证 GIS 图层显著性、Logic Topo 自适应节点大小、表格编辑和筛选性能。

基础测试路径：

1. 打开 `topo_visual_tool.html`。
2. 点击“加载 Mock”。
3. 在 GIS Topo 查看节点和链路是否比底图更突出。
4. 切换 Logic Topo，验证节点大小随连接数变化，选中样式不再是黑色边框。
5. 搜索 `PE-BKK-01` 并定位。
6. 高亮 `Status 等于 Down`。
7. 过滤 `Role 等于 ASG`。
8. 切换数据管理，检查统计条、修改单元格输入框并点击“应用编辑”。
9. 切换 English，验证功能性提示和标识切换为英文。

## 8. 链路详情卡片设计

本轮新增链路点击详情能力，沿用右上角网元详情卡片的承载方式，避免引入新的浮层体系：

- GIS Topo 中点击链路业务线或其白色底线，右上角详情卡片展示该链路记录。
- Logic Topo 中点击 SVG 链路线段，右上角详情卡片展示该链路记录。
- 链路卡片标题使用 `Src NE Name - Sink NE Name`，字段区按当前 link 表字段动态渲染，除 `Src NE Name`、`Sink NE Name` 外的扩展字段也会自动展示。
- 链路选中态与网元选中态互斥：点击链路会清空当前选中网元，点击网元或定位网元会清空当前选中链路。
- 选中链路复用既有高优先级链路视觉样式，在 GIS / Logic 两类视图中保持一致。
- 该能力不假设固定业务字段，所有链路属性均来自上传的 link 表或内置 Mock 数据，便于后续扩展链路状态、容量、介质、保护方式、业务等级等字段。

当前测试 `link.csv` 已补充链路属性字段：

- `Link Type`
- `Status`
- `Capacity`
- `Media Type`
- `Protection`
- `Service Class`
- `Utilization`

这些字段用于验证链路详情卡片、链路样式规则字段识别、数据管理表格展示和字段值联想能力。

## 9. 条件过滤链路收敛规则

条件过滤面向“字段命中结果集”的精确查看，不再展示命中节点的一跳上下文：

- 用户按网元字段设置过滤条件后，只保留符合条件的网元。
- 链路只保留两端都在过滤后网元集合内的记录。
- 链路另一端如果不符合过滤条件，不会作为上下文节点被带入视图。
- 批量查询仍保留原有一跳上下文能力，用于从外部清单快速查看相关连接；当批量查询与条件过滤同时存在时，以过滤后的命中集合为边界，链路仍必须两端都在最终命中节点集合内。

## 10. GIS 路网路径图层

当 link 表包含 `Route WKT` 字段且对应行存在非空值时，GIS Topo 会额外渲染路网路径图层：

- 支持 `LINESTRING(lng lat, lng lat, ...)`，也兼容全角括号 `LINESTRING（...）`、中文逗号和多空格。
- WKT 坐标按经度、纬度解析，并转换为 Leaflet 需要的纬度、经度坐标。
- 没有 `Route WKT` 字段，或字段存在但该行内容为空时，不绘制对应路网路径。
- 路网路径只在 GIS Topo 中绘制，不影响 Logic Topo 的逻辑布局。
- 路网路径图层位于现有链路直连线下方，便于同时观察真实路由形态和链路端点关系。
- 左侧“样式设置”新增路网路径样式，支持显示/隐藏、颜色、线宽和线型配置；默认勾选显示。
- 路网路径采用单 Canvas 图层合批绘制，并按设备像素比设置绘制尺寸，避免为每条路由创建独立 Leaflet 图层，从而降低大量路径场景下的 DOM/图层开销并减少线条发虚。
- Canvas 图层通过像素级线段距离进行点击命中测试；点击某条路网路径时，会同步选中对应 link 记录、高亮该路由、直连逻辑链路以及源宿网元。
- 当 Route WKT 的起终点与源宿网元经纬度不完全重合时，选中态会绘制起终点引导线，帮助识别路由端点与网元位置的对应关系。
- 点击 GIS 或 Logic Topo 空白区域会清除当前选中的网元、链路和路网路径，并关闭右上角详情卡片；拖动画布不会触发清除。

当前测试 `link.csv` 已新增 `Route WKT` 列，并根据每条链路的源宿网元经纬度生成带中间弯折点的 `LINESTRING`，用于验证路网图层渲染。

### 10.1 路网图层缩放与透明度

- 地图开始平移或缩放时，立即移除当前路网 Canvas 图层和命中缓存；地图停止后再按新视口重绘，避免缩放动画期间旧 Canvas 被 Leaflet pane transform 拉伸后产生残影。
- 路网路径透明度进入左侧“样式设置”，用户可在 0.1 到 1 之间调整；默认值为 0.86，避免默认路径过淡。
- 未选中路由时使用用户配置透明度；选中某条路由时，目标路由保持最高可见度，其他路由按配置透明度等比例降低，便于聚焦。

### 10.2 底图清晰度策略

- 在线 GIS 底图使用原始瓦片透明度，不再对 `.leaflet-tile-pane` 施加 CSS filter，避免浏览器对瓦片层二次栅格化造成模糊。
- Leaflet 瓦片开启 `detectRetina`，在高分屏设备上请求更高分辨率瓦片。
- 地图缩放过程中允许瓦片更新，减少缩放结束后长时间停留在拉伸旧瓦片状态的概率。

## 11. 复合条件筛选与高亮

- 高亮条件、过滤条件、节点样式规则和链路样式规则统一使用条件组模型：`mode` 为 `all` 或 `any`，`conditions` 为多条字段条件。
- 左侧仍保留单条件快捷入口，适合快速操作；点击“复合条件”后打开独立条件卡片，适合多字段组合筛选。
- 复合条件卡片支持“全部满足”和“任一满足”两种组合方式，条件行支持字段、操作符和值的组合。
- 复合条件历史保存在 `localStorage`，用户清除当前条件后，重新打开条件卡片可从历史条件一键恢复。
- 复合条件每一行的条件值输入框都会按当前字段自动合并数据中的枚举值和历史输入值，字段切换后即时刷新候选值。
- 高亮不再覆盖命中网元和链路的颜色、形状、大小和线型；命中对象保留节点/链路样式规则的原样式，仅通过降低未命中对象透明度形成视觉聚焦。
- 高亮链路必须满足源端和宿端都在高亮命中网元集合内；只有一端命中的链路会按未命中对象透明化。
- 节点样式规则和链路样式规则的匹配条件也复用复合条件卡片：规则卡片中展示条件摘要，点击“复合条件”编辑匹配条件。

### 11.1 样式规则应用与高亮对比度

- 节点样式规则和链路样式规则保持一致的交互：新增或编辑规则只修改规则草稿，点击“应用节点规则”或“应用链路规则”后才刷新拓扑样式。
- 链路样式渲染读取 `appliedLinkStyleRules`，避免用户编辑未确认的链路规则时立即改变地图或逻辑拓扑。
- 高亮条件区新增“对比度”配置，取值 0 到 1；对比度越高，未命中网元和链路越淡，对比度为 1 时未命中对象透明度为 0。
- 高亮对比度同时作用于 GIS 和 Logic Topo；命中对象继续保留自身原样式。

### 11.2 Style Template Import and Export

The style settings card provides two template actions above the style rule editors:

- Save current style settings: download a JSON template.
- Upload style config: import a JSON template and immediately apply it.

The template uses `schema=topo_visual_tool_style_template` and `version=1`. It stores role styles, node style rules, link style rules, ring/chain style rules, and route path style. The exported file also keeps `applied*` rule lists for forward compatibility, but importing treats the editable rule lists as the source of truth and applies them immediately.

Import validation behavior:

- Invalid JSON, missing schema, or mismatched schema blocks import.
- A template version newer than the current supported version blocks import.
- Missing sections fall back to default values.
- Invalid colors, shapes, line widths, line styles, and opacity values fall back to valid defaults.
- Rule fields that do not exist in the current uploaded data are adjusted to the current fallback field and have their condition value cleared.
- Empty or malformed rules are skipped and reported in the style template message.

This feature is intentionally file based rather than browser storage based so users can reuse a style template after refreshing the HTML, replacing the HTML file, or moving the tool to another PC.

## 12. Ring/Chain Recognition Table

The ring/chain recognition table is an optional upload. The upload card adds a Ring/Chain Table input. When users click Parse Upload, the tool parses and caches the table only when a file is provided. If no ring/chain file is provided, existing topology, highlight, filter, and style behavior remains unchanged.

Required fields are `Category`, `Name`, `Root1`, `Root2`, `Label`, `Member_num`, `Member_path`, `Uplink_pair`, and `Belong_agg`. `Category=Ring` contributes to the ring count, and `Category=Link` contributes to the chain count. `Member_path` is split by `->` and trimmed into a member device sequence.

After a ring/chain table is uploaded:

- The statistics card shows ring count and chain count.
- When the active filter condition source is ring/chain fields, the statistics card also shows visible ring count and visible chain count based on matched ring/chain rows.
- Missing `Member_path` devices are reported as a warning and ignored in visualization logic.
- The warning does not block device/link rendering or ring/chain cache creation.

Highlight and filter rules now support a condition source per rule group:

- Device fields: match device rows directly, preserving previous behavior.
- Link fields: match link rows directly, then resolve matched links to their source and sink devices.
- Ring/chain fields: match ring/chain rows first, then union all valid devices from matched rows' `Member_path`.

The downstream behavior is shared:

- Filter keeps matched devices and links whose source and sink are both in the matched device set.
- Highlight preserves matched devices and links whose source and sink are both in the matched device set; unmatched elements are dimmed by user contrast.
- For link-field conditions, matched links are restricted to the link rows that satisfy the condition group. Their source and sink devices form the matched device set.

Ring/chain style rules are shown only after a ring/chain table exists. They reuse the compound condition card with the source fixed to ring/chain fields. A matched rule only styles adjacent `Member_path` segments, for example `A->B->C` affects `A-B` and `B-C`. If multiple ring/chain style rules match the same link, later applied rules override earlier ones.

Condition value suggestions continue to merge current data enumerations with cached history. Device rules read values from the device table, link-field highlight/filter rules and link style rules read values from the link table, and ring/chain rules read values from the ring/chain table.

## 13. Project Name Record

The top-right toolbar includes a project name field before the language switch. It is used to mark the current uploaded data version without changing topology data.

- After each successful data parse or mock load, the field defaults to the parse timestamp in `YYYY-MM-DD-HH-mm-ss` format.
- Users can edit the field directly to name the current data version.
- Language switching updates only labels and placeholders; the user-entered project name is preserved.

## 14. Current Interaction Contract

This section consolidates the current behavior after recent feature extensions.

### 14.1 Data Loading Contract

The tool has three upload inputs:

- Device table: required.
- Link table: required.
- Ring/chain recognition table: optional.

Parsing is triggered by the single Parse Upload action. Device and link tables are validated first. If a ring/chain table is provided, it is validated and cached after the core topology data is loaded. A missing ring/chain table is treated as a normal state and does not expose ring/chain style controls.

Successful parsing also refreshes the project name field with a timestamp. The project name is metadata for the current page state only; it does not alter device, link, ring/chain, or style records.

### 14.2 Condition Source Contract

Highlight and filter condition groups have exactly one source:

- `nodes`: match device rows.
- `links`: match link rows, then resolve matched rows to endpoint devices through `Src NE Name` and `Sink NE Name`.
- `ringChains`: match ring/chain rows, then resolve matched rows to devices through `Member_path`.

Mixed device, link, and ring/chain conditions in the same condition group are intentionally not supported. This keeps `all` and `any` semantics clear and avoids implicit joins between unrelated row models.

### 14.3 Highlight and Filter Contract

Device-field and ring/chain-field highlight/filter use the same two-step resolution:

1. Resolve a matched device set.
2. Resolve matched links as links whose `Src NE Name` and `Sink NE Name` are both in the matched device set.

Link-field highlight/filter resolves matched links first from the link table. The matched device set is the union of those links' endpoints. Filter renders those matched links and endpoint devices. Highlight preserves those matched links and endpoint devices while dimming the remaining rendered topology by contrast.

Filter removes non-matched devices and non-matched links from the rendered data. Highlight keeps the current rendered data but dims non-matched devices and links according to the configured contrast. Matched devices and links keep their existing node/link/ring-chain styles.

When the active filter source is `ringChains`, the matched ring/chain row list is also carried into the statistics layer. `Category=Ring` rows are counted as visible rings, and `Category=Link` rows are counted as visible chains. These visible ring/chain statistics are hidden for device-field filters and for non-filtered views.

### 14.3.1 Locate Rule Contract

Device locating supports the same condition group model as highlight and filter. The quick locate input is treated as `nodes / NE Name / contains`, while the advanced locate modal can choose device fields, link fields, or ring/chain fields.

Locate evaluation is scoped to the current visible topology result. If a filter or bulk query is active, locate rules only match devices and links that are still visible.

Locate source behavior:

- `nodes`: match device rows, then locate matched devices.
- `links`: match link rows, then locate the matched links' endpoint devices and emphasize those matched links.
- `ringChains`: match ring/chain rows, then locate valid devices parsed from `Member_path`.

GIS focus uses the matched devices' valid coordinates. One coordinate uses `setView`; multiple coordinates use a padded `fitBounds`. Logic Topo focus uses existing layout positions and adjusts pan/zoom around the matched device bounding box. If no device matches, the locate message shows an error and the topology is not refocused.

Matched locate devices and locate links are rendered as a temporary visual state. They are emphasized with stronger stroke/weight while preserving existing node and link colors. Locate state is independent from highlight and filter rules and can be cleared separately.

### 14.4 Style Priority Contract

Link visual style is resolved in this order:

1. Default link style.
2. Applied link style rules.
3. Applied ring/chain style rules for adjacent `Member_path` segments.
4. Selected link or selected route state.

Ring/chain style rules are compiled into a segment style map so link rendering performs direct lookup rather than scanning all ring/chain rows per link. Later applied ring/chain rules override earlier matched rules on the same segment.

### 14.5 Route Path Rendering Contract

`Route WKT` paths are rendered only in GIS view. They use a Canvas overlay rather than one Leaflet layer per route. Canvas paths support visibility, color, width, line style, and opacity configuration. During map movement or zooming, the existing route Canvas is removed and recreated after the map stabilizes to avoid stale transformed pixels and visible artifacts.

Route path hit testing is based on pixel distance to route segments. Selecting a route also selects the corresponding link and highlights the route endpoints' device nodes, even when the route geometry endpoints are not identical to device coordinates.

### 14.6 Colocated GIS Device Contract

GIS rendering groups visible devices by exact longitude and latitude. A coordinate with one visible device keeps the normal node marker. A coordinate with multiple visible devices renders as a colocated marker with a visible count.

Colocated marker style follows the current role rule:

- If all devices at the coordinate have the same role, use that role's node style.
- If roles differ, choose the highest-priority role style using `PE > ASG > CSG > OTHER`.

Filtering, highlighting, and locating work on device identity first, then GIS rendering regroups the resulting visible devices by coordinate. This keeps colocated behavior consistent with existing filter/highlight semantics.

Clicking a colocated marker opens the details card with the coordinate, role distribution, count, and all devices at that coordinate. Clicking a device in that list switches to the existing single-device details flow and highlights that device's related links. Searching for a colocated device pans to the coordinate and opens the colocated list with the target device emphasized.

### 14.7 Large Thailand Colocated Test Dataset

`thailand_colocated_large_device.csv` and `thailand_colocated_large_link.csv` provide a GIS stress dataset for colocated rendering. The dataset contains 60 ASG devices, 1100 CSG devices, 500 unique Thailand coordinate sites, and 1160 links.

Every coordinate site has multiple devices so the GIS view can consistently exercise colocated marker grouping. Links include synthetic `Route WKT` values to validate that route rendering remains compatible with colocated node rendering at larger scale.
