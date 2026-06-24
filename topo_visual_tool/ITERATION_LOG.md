# 开发迭代日志

## 2026-06-20 迭代 1

### 目标

完成轻量级本地 Web 前端拓扑可视工具的端到端首版交付。

### 设计决策

- 采用本地静态网页交付，满足本地 PC 直接打开的要求。
- CSV 解析使用内置逻辑，降低基础场景依赖。
- XLSX、GIS 地图分别接入 SheetJS 与 Leaflet CDN，避免构建工程和本地安装依赖。
- Logic Topo 使用原生 SVG 与轻量 force layout，避免引入过重图形库。
- 高亮、过滤、数据管理字段均从网元表动态生成，满足后续字段扩展。

### 实现内容

- 实现上传解析、GIS Topo、Logic Topo、搜索定位、高亮、过滤、数据管理、Mock 数据。
- 拆分为 `topo_visual_tool.html`、`assets/css/styles.css`、`assets/js/app.js`。
- 补充 `README.md` 和 `DESIGN.md`。

### 测试记录

- 执行 `node --check assets/js/app.js`，业务脚本语法检查通过。

## 2026-06-20 迭代 2

### 目标

根据反馈优化项目结构说明，并明确后续面向需求变更和能力演进的维护方式。

### 实现内容

- 保持 `topo_visual_tool.html` 可直接打开，承载页面结构与 CDN 依赖入口。
- `assets/css/styles.css` 承载视觉样式。
- `assets/js/app.js` 承载业务逻辑。
- README 增加启动方式、目录结构、数据契约、扩展点和测试路径。

## 2026-06-20 迭代 3

### 目标

按用户优化意见提升界面质感、数据管理可用性、GIS/Logic 可视效果、双语能力，并扩展 Mock 数据规模用于性能观察。

### 实现内容

- UI 视觉调整为商务、柔和的运维控制台风格：
  - 低饱和背景。
  - 柔和蓝绿色主色。
  - 更细腻的卡片阴影、按钮状态、输入框焦点状态。
- 数据管理增强：
  - 表格单元格由 `contenteditable` 改为输入框，提升编辑稳定性。
  - 新增数据统计条，显示当前表、显示记录、总记录、字段数、数据概况。
  - 网元表统计角色分布，链路表统计端点缺失情况。
- Logic Topo 增强：
  - 节点半径按自由度自适应。
  - 选中样式由黑色边框改为柔和青蓝描边和外圈光晕。
  - 高亮样式使用暖金色外圈，降低未命中对象透明度。
- GIS Topo 增强：
  - 地图瓦片降低透明度并降低饱和度。
  - 链路采用浅色底线加业务色线的双层绘制。
  - 网元采用外圈光晕加角色色节点，搜索选中和高亮状态更显著。
- 双语能力：
  - 增加中文 / English 切换。
  - 静态文本、占位符、动态提示、统计标签统一通过 `I18N` 字典管理。
  - 英文术语中“网元”使用 `Device`，“链路”使用 `Link`。
- Mock 数据增强：
  - 当时版本从小规模样例扩展为约 120 个网元和 188 条链路。
  - 覆盖多区域、多厂商、多状态、多服务等级。
  - 用于观察 GIS、Logic、过滤、高亮、数据管理在中等规模数据下的响应。
- 文档同步：
  - `DESIGN.md` 已同步最新设计。
  - `README.md` 已同步最新入口、能力、扩展点和测试路径。

### 测试记录

- 执行 `node --check assets/js/app.js`，业务脚本语法检查通过。
- 验证 `topo_visual_tool.html` 包含语言切换、数据统计条和脚本引用。
- 验证 `assets/js/app.js` 包含大规模 Mock、数据统计、语言切换、节点半径计算等关键实现。

## 2026-06-20 迭代 4

### 目标

优化百级网元下 Logic Topo 的可读性，清理节点外层阴影，修正过滤和高亮链路规则，并导出 Mock CSV 文件供用户从上传流程开始测试。

### 实现内容

- Logic Topo 布局从力导向改为确定性分层分组布局：
  - PE 位于上层。
  - ASG 位于中层。
  - CSG 位于下层。
  - 同一 `Region` 内节点按网格排列。
- 移除节点外层视觉负担：
  - GIS 节点删除外圈光晕，仅保留角色色填充和描边。
  - Logic 节点删除外圈环和 drop-shadow。
- 调整过滤规则：
  - 保留符合条件的网元。
  - 保留源端或宿端任一端在符合条件网元清单内的链路。
  - 链路另一端网元作为上下文节点显示。
- 调整高亮规则：
  - 高亮符合条件的网元。
  - 高亮源端或宿端任一端在符合条件网元清单内的链路。
- 导出当时版本 Mock 数据文件：
  - `device.csv`：120 条网元。
  - `link.csv`：188 条链路。
- 同步更新 `DESIGN.md` 和 `README.md`。

### 测试记录

- 执行 `node --check assets/js/app.js`，业务脚本语法检查通过。
- 当时生成 `device.csv` 和 `link.csv`，确认数量为 120 devices / 188 links；当前版本已在迭代 5 更新为 120 devices / 177 links。

## 2026-06-20 迭代 5

### 目标

进一步提升百级网元 Logic Topo 的可读性，并将 Mock 数据改造成更贴近真实网络的接入环、汇聚环、核心 full-mesh 结构。

### 实现内容

- Logic Topo 新增网络结构化布局：
  - PE 位于顶部核心区，按椭圆分布，适配 full-mesh。
  - ASG 按 `Ring ID` 形成汇聚环，位于中上层。
  - CSG 按 `Ring ID` 形成接入环路径，位于下层。
  - 节点名称固定放在节点右侧，减少名称与节点重叠。
  - 同一环内节点按顺序排列，减少长距离交叉。
- 点击节点后，GIS 和 Logic 视图都会强调该节点的一跳直连链路和邻居节点。
- 对没有 `Ring ID` 的上传数据，保留通用分层分组布局作为回退。
- Mock 数据真实化：
  - 6 个 PE，PE 之间 full-mesh。
  - 6 个 ASG 汇聚环，每环 4 个 ASG，并双上联到一对 PE。
  - 18 个 CSG 接入环，每环 5 个 CSG，并由环起点和终点双上联到一对 ASG。
  - 网元表新增 `Ring ID`、`Ring Role`、`Uplink Pair` 字段。
- 重新导出 Mock CSV：
  - `device.csv`：120 条网元。
  - `link.csv`：177 条链路。
- 同步更新 `DESIGN.md` 和 `README.md`。

### 测试记录

- 执行 `node --check assets/js/app.js`，业务脚本语法检查通过。
- 重新生成 `device.csv` 和 `link.csv`，确认数量为 120 devices / 177 links。

## 2026-06-20 迭代 6

### 目标

按用户建议借鉴 NetworkX `spring_layout` / springout 类布局算法，并新增面向外部清单粘贴的批量网元/链路查询能力。

### 实现内容

- Logic Topo 布局升级为浏览器端 spring layout：
  - 使用网络结构化布局作为确定性初始坐标。
  - 链路两端使用弹簧吸引力。
  - 所有节点之间使用斥力。
  - 保留 PE / ASG / CSG 弱层级约束，避免层次完全混杂。
  - 布局计算预留横向标签空间，降低网元名称与节点或其他名称重叠概率。
- 新增批量查询功能：
  - 左侧新增“批量查询”文本框。
  - 支持从 Word / Excel / CSV 粘贴多行、逗号、制表符、空格分隔的网元或链路端点。
  - 点击“查询”后，只显示相关网元、相关链路和链路上下文端点。
  - 点击“清除查询”恢复普通过滤/高亮视图。
- 双语字典补充批量查询相关中文和英文文案。
- 同步更新 `DESIGN.md` 和 `README.md`。

### 测试记录

- 执行 `node --check assets/js/app.js`，业务脚本语法检查通过。
- 验证 `topo_visual_tool.html` 已包含批量查询输入框和查询按钮。
- 验证 `assets/js/app.js` 已包含 `applySpringLayout`、`parseBulkQuery`、`intersectSets` 等关键实现。

## 2026-06-22 迭代 7

### 目标

解决 2w+ 网元、万级链路上传后页面卡死的问题，让工具在大规模数据下仍能快速恢复交互，并支持局部拓扑查看。

### 实现内容

- 新增性能阈值配置 `PERF`：
  - Logic Topo 布局上限：600 网元 / 1000 链路。
  - GIS 渲染上限：2500 网元 / 2500 链路。
  - 数据表渲染上限：500 行。
- 上传数据后建立索引：
  - `nodeByName`
  - `upperNameToName`
  - `linksByNode`
- 大规模数据加载时跳过全量 Logic spring layout，避免 O(n²) 主线程阻塞。
- GIS 使用 Leaflet canvas renderer，并按当前地图视窗裁剪渲染对象。
- 数据管理表格只渲染前 500 行，保留完整数据统计。
- 批量查询与一跳链路查询改用索引，避免全链路反复扫描。
- 坐标缺失和断链统计在加载时缓存，避免地图移动时重复计算。
- 新增大规模测试数据：
  - `large_device.csv`：20000 条网元。
  - `large_link.csv`：30000 条链路。
- 同步更新 `DESIGN.md` 和 `README.md`。

### 测试记录

- 执行 `node --check assets/js/app.js`，业务脚本语法检查通过。
- 生成 `large_device.csv` 和 `large_link.csv`，确认数量为 20000 devices / 30000 links。
- 使用 Node 模拟核心路径：
  - CSV 解析约 39ms。
  - 索引构建约 19ms。
  - 批量查询一跳过滤约 0ms 级。
  - 表格渲染行数限制为 500。

## 2026-06-22 迭代 8

### 目标

按用户反馈重新构造更合理的大规模测试拓扑：节点分布尽可能覆盖泰国，暂不构造 PE，控制 CSG 和 ASG 的连接度。

### 实现内容

- 重新生成 `large_device.csv`：
  - 20000 条网元。
  - 2500 个 ASG。
  - 17500 个 CSG。
  - 经纬度分布覆盖泰国多个区域。
- 重新生成 `large_link.csv`：
  - 17500 条链路。
  - 每个 ASG 连接附近 7 个 CSG。
  - 每个 CSG 只连接 1 个 ASG。
  - ASG-CSG 链路距离控制在约 20km 内。
- 同步更新 `DESIGN.md` 和 `README.md`。

### 测试记录

- 数量校验：`large_device.csv=20000`，`large_link.csv=17500`。
- 连接度校验：`maxCsg=1`，`minAsg=7`，`maxAsg=7`。
- `node --check assets/js/app.js` 通过。

## 2026-06-22 迭代 9

### 目标

解决大规模数据场景下 GIS 地图放大后在线瓦片加载失败、出现灰色色块的问题，同时降低缩放和拖动过程中的业务图层重绘压力。

### 实现内容

- GIS 地图初始化增加瓦片加载优化：
  - `updateWhenIdle=true`
  - `updateWhenZooming=false`
  - `keepBuffer=4`
  - `maxNativeZoom=18`
- 地图拖动和缩放期间不立即重绘网元/链路，改为 `moveend` / `zoomend` 后防抖刷新。
- 增加在线瓦片失败监控，15 秒内连续失败达到阈值后自动切换为本地浅色简洁底图。
- 地图容器增加浅色网格背景兜底，在线瓦片未加载完成或被移除时仍保持可读。
- GIS 单次渲染上限从 2500 网元 / 2500 链路收敛为 1500 网元 / 1500 链路，优先保证大数据缩放响应。
- GIS 视窗裁剪范围增加少量 padding，避免拖动后边缘对象频繁闪现或消失。
- 同步更新 `DESIGN.md` 和 `README.md`。

### 测试记录

- 执行 `node --check assets/js/app.js`，业务脚本语法检查通过。
- 核对 `DESIGN.md`、`README.md` 和 `assets/css/styles.css` 已同步本轮 GIS 瓦片兜底与缩放优化。

## 2026-06-23 迭代 10

### 目标

按用户反馈开放节点视觉样式配置，并优化 Logic Topo 中无连接网元的布局方式，避免孤立散点干扰有连接节点的 spring layout。

### 设计更新

- `DESIGN.md` 新增“可配置节点样式与孤立网元布局”章节。
- 明确高亮节点和角色图例均支持颜色、大小、形状配置。
- 明确 GIS / Logic Topo 统一支持圆形、方形、菱形、三角形。
- 明确 Logic Topo 中自由度为 0 的网元不参与 spring layout，而是统一平铺到画布底部散点带。

### 实现内容

- 侧边栏新增“样式设置”面板：
  - 高亮节点样式：颜色、大小、形状。
  - CSG / ASG / PE / Other 角色样式：颜色、大小、形状。
  - 支持一键恢复默认样式。
- 角色图例改为动态渲染，跟随用户配置实时更新。
- GIS Topo 节点渲染改为统一 shape 工厂：
  - 圆形继续使用 Leaflet `circleMarker`。
  - 方形、菱形、三角形使用 Leaflet polygon，保持矢量渲染和大数据响应能力。
- Logic Topo 节点渲染从固定 `<circle>` 升级为 SVG shape helper。
- Logic Topo 布局分流：
  - 有连接节点进入 spring layout。
  - 无连接节点按名称稳定排序后平铺到画布底部。
  - 引入 layout key，拖拽、缩放、样式变化不会重复触发布局计算。
- `README.md` 同步新增样式配置说明、测试路径和大规模验证结果。

### 测试记录

- `node --check assets/js/app.js` 通过。
- 静态资源一致性检查通过：新增样式控件 ID、CSS 类、JS 绑定均存在。
- 大规模数据路径验证：
  - `large_device.csv=20000`
  - `large_link.csv=17500`
  - 断链 `0`
  - CSG 最大连接数 `1`
  - ASG 最小/最大连接数 `7/7`
  - GIS 有效坐标抽样 `1500`
  - PowerShell 解析、索引和统计验证耗时约 `2999ms`
- Logic 局部样本验证：
  - 360 网元 / 315 链路样本低于 Logic 阈值，可进入布局。
  - 550 网元 / 479 链路样本中识别到孤立节点并进入底部散点带。

## 2026-06-23 迭代 11

### 目标

为高亮条件、过滤条件、网元定位输入框增加历史搜索缓存，用户清空某次输入后，再次点击输入框可以快速选择之前使用过的记录。

### 设计更新

- `DESIGN.md` 新增“搜索历史缓存”设计说明。
- 历史记录使用浏览器 `localStorage` 保存，不写入上传数据文件。
- 网元定位、高亮条件值、过滤条件值三类历史相互独立。
- 每类最多保留 12 条，重复记录去重并前移。

### 实现内容

- `topo_visual_tool.html` 为高亮条件值、过滤条件值增加 datalist 候选源。
- `assets/js/app.js` 增加搜索历史状态、加载、保存、去重、候选刷新逻辑。
- 网元定位候选列表改为“历史定位记录 + 当前网元名称联想”的合并列表。
- 增加自定义历史下拉菜单，输入框为空且获得焦点/点击时直接浮现历史记录，避免依赖不同浏览器的 datalist 弹出行为。
- 高亮/过滤的清除按钮只清空当前输入，不清除历史缓存。
- 为大规模数据场景限制网元定位 datalist 的普通网元候选数量，避免一次性写入 2w 条候选影响响应。

### 测试记录

- `node --check assets/js/app.js` 通过。
- 静态一致性检查通过：`neSuggestions`、`highlightHistory`、`filterHistory` 与 JS 绑定均存在。
- 静态一致性检查通过：`SEARCH_HISTORY_KEY`、`loadSearchHistory`、`rememberSearchHistory`、`bindSearchHistoryInput`、`showSearchHistoryMenu`、`hideSearchHistoryMenu`、`localStorage` 关键实现均存在。

## 2026-06-23 迭代 12

### 目标

补齐高亮样式设置能力：除高亮节点颜色、大小、形状外，开放与高亮节点相关的链路颜色设置。

### 设计更新

- `DESIGN.md` 将高亮样式定义扩展为“节点颜色、节点大小、节点形状、相关链路颜色”。
- 相关链路颜色在 GIS Topo 与 Logic Topo 中保持一致。
- 选中链路仍保留选中态颜色优先级，避免和高亮链路混淆。

### 实现内容

- `topo_visual_tool.html` 在高亮样式设置中新增“链接颜色”颜色选择器。
- `assets/js/app.js` 中 `DEFAULT_HIGHLIGHT_STYLE` 新增 `linkColor`。
- 高亮样式初始化、实时更新、重置流程均接入 `highlightLinkColorInput`。
- GIS 高亮相关链路读取 `state.highlightStyle.linkColor`。
- Logic 高亮相关链路通过内联 `stroke` 使用用户配置的链接颜色。
- 高亮节点描边同步改为使用用户配置的节点颜色。

### 测试记录

- `node --check assets/js/app.js` 通过。
- 静态一致性检查通过：
  - HTML 存在 `highlightLinkColorInput`。
  - JS 存在 `linkColor` 状态和 `el.highlightLinkColorInput` 绑定。
  - GIS / Logic 高亮链路均读取 `state.highlightStyle.linkColor`。
  - CSS 存在 `--node-highlight` 变量，用于 Logic 高亮节点描边。

## 2026-06-23 迭代 13

### 目标

扩展样式设置能力：自动解析上传 link 表字段及枚举值，允许用户按链路字段条件配置链路颜色、线型和线宽；同时增强高亮/过滤条件值的字段枚举联想。

### 设计更新

- `DESIGN.md` 新增“链路样式规则与字段值联想”设计说明。
- 链路样式规则支持多条同时生效，按列表顺序匹配，后匹配规则覆盖前匹配规则。
- 不预设 link 表字段含义，所有字段和值均来自用户上传数据。
- 操作符先支持 `等于`、`包含`、`不等于`。
- GIS Topo 和 Logic Topo 共用链路样式规则；选中链路和高亮相关链路保留更高视觉优先级。

### 实现内容

- `topo_visual_tool.html` 在“样式设置”中新增“链路样式规则”区域：
  - 新增规则。
  - 删除规则。
  - 字段、条件、取值、颜色、线型、线宽配置。
- `assets/js/app.js` 新增：
  - `linkStyleRules` 状态。
  - link 表字段枚举解析 `collectValueOptions`。
  - 链路样式规则渲染、编辑、删除和字段切换逻辑。
  - `resolveLinkStyle` 统一计算链路颜色、线宽、虚线样式。
- GIS 链路渲染接入 `color`、`weight`、`dashArray`。
- Logic 链路渲染接入 SVG `stroke`、`stroke-width`、`stroke-dasharray`。
- 高亮/过滤条件值联想升级：
  - 根据当前选择字段解析网元表已有取值。
  - 字段枚举值优先展示，历史记录作为补充。
  - 仍允许用户直接输入未出现的新值。
- `assets/css/styles.css` 增加链路规则紧凑卡片样式，降低侧边栏视觉负担。

### 测试记录

- `node --check assets/js/app.js` 通过。
- 静态一致性检查通过：
  - HTML 存在 `linkStyleRuleList`、`addLinkStyleRuleBtn`。
  - JS 存在 `linkStyleRules`、`resolveLinkStyle`、`collectValueOptions`、`updateConditionValueSuggestions`。
  - CSS 存在 `.link-style-rule`。
- Mock 数据规则验证：
  - `link.csv=177`。
  - 自动识别字段 `Link Type`。
  - 自动识别枚举值 5 个：`PE-FullMesh`、`ASG-Ring`、`ASG-Uplink`、`CSG-Ring`、`CSG-Uplink`。
  - 示例规则命中 129 条链路。
- 大规模数据规则验证：
  - `large_link.csv=17500`。
  - 自动识别字段 `Link Type`。
  - 枚举值 `ASG-CSG-Access` 命中 17500 条链路。
  - PowerShell 枚举解析与匹配验证耗时约 `640ms`。

## 2026-06-23 迭代 14

### 目标

将节点图例样式从固定 `Role` 字段配置升级为通用节点样式规则：自动解析 device 表字段和值，允许用户按任意字段条件配置节点颜色、大小和形状，并通过拖拽调整规则优先级。

### 设计更新

- `DESIGN.md` 将“角色图例样式”扩展为“节点样式规则”。
- 默认规则仍按 `Role` 自动生成：
  - Other 灰色圆形兜底规则位于最前。
  - CSG 蓝色圆形、ASG 橙色圆形、PE 红色圆形位于其后。
- 规则按从上到下匹配，后匹配规则覆盖前匹配规则。
- 用户新增规则可选择 device 表任意字段，条件值自动联想该字段已有取值，也允许手动输入。
- 规则支持拖拽排序，用于调整匹配优先级。

### 实现内容

- `topo_visual_tool.html`：
  - 固定角色图例改为动态 `nodeLegend`。
  - 角色样式编辑区改为 `nodeStyleRuleList` 节点样式规则区。
  - 新增 `addNodeStyleRuleBtn` 和节点规则取值 datalist。
- `assets/js/app.js`：
  - 移除固定 `roleStyles` 状态。
  - 新增 `nodeStyleRules` 状态。
  - 新增 `resolveNodeStyle`，统一计算节点基础颜色、大小、形状。
  - 新增节点规则新增、删除、编辑、字段值联想和拖拽排序逻辑。
  - 节点图例由当前节点样式规则动态生成。
  - GIS / Logic 节点渲染均改为读取 `resolveNodeStyle`。
- `assets/css/styles.css`：
  - 增加节点样式规则卡片样式。
  - 增加拖拽手柄和拖拽态样式。
- `README.md` 同步更新功能说明和建议测试路径。

### 测试记录

- `node --check assets/js/app.js` 通过。
- 静态一致性检查通过：
  - HTML 存在 `nodeLegend`、`nodeStyleRuleList`、`addNodeStyleRuleBtn`。
  - JS 存在 `nodeStyleRules`、`resolveNodeStyle`、`onNodeRuleDrop`、`updateNodeLegend`。
  - CSS 存在 `.node-style-rule` 和 `.node-style-rule.dragging`。
- `device.csv` 当前包含 4527 条网元，Role 枚举值为 `asg/csg`。
- 默认节点规则使用大小写不敏感匹配：
  - CSG 命中 4407 条。
  - ASG 命中 120 条。
- 修正默认兜底规则顺序：Other 规则放在最前，避免因“后匹配覆盖前匹配”覆盖 CSG/ASG/PE 默认规则。

## 2026-06-23 迭代 15

### 目标

根据用户使用反馈，将“节点图例/角色基础样式”和“节点样式规则覆盖”解耦：节点图例仍默认按角色展示并允许用户单独配置；节点样式规则作为独立覆盖层，只有点击“应用节点规则”后才影响命中节点。

### 设计更新

- `DESIGN.md` 明确节点样式分层：
  - 角色图例基础层：CSG / ASG / PE / Other 的颜色、大小、形状。
  - 节点规则覆盖层：按 device 表字段条件覆盖命中节点样式。
- 节点规则编辑为草稿态，新增、编辑、拖拽不会立即影响拓扑。
- 点击“应用节点规则”后，当前规则列表才进入已应用覆盖层。
- 删除节点规则会同步移除该规则覆盖效果。
- 重置样式会清空节点规则并恢复角色图例基础样式。

### 实现内容

- `topo_visual_tool.html`：
  - 恢复 `roleStyleEditor` 角色图例样式编辑区。
  - 节点规则区新增 `applyNodeStyleRulesBtn`。
- `assets/js/app.js`：
  - 恢复 `roleStyles` 作为基础节点样式状态。
  - 新增 `appliedNodeStyleRules` 作为已应用覆盖层。
  - `resolveNodeStyle` 改为先读取角色基础样式，再叠加已应用节点规则。
  - 节点规则新增、编辑、拖拽只更新草稿规则，不立即刷新拓扑。
  - 删除规则会重建已应用规则并刷新拓扑，确保覆盖效果被移除。
  - 重置样式恢复默认角色样式、清空草稿规则和已应用规则。
  - 节点图例只展示角色基础样式，不再展示自定义节点规则。
- `README.md` 同步更新功能说明和测试路径。

### 测试记录

- `node --check assets/js/app.js` 通过。
- 静态一致性检查通过：
  - HTML 存在 `roleStyleEditor` 和 `applyNodeStyleRulesBtn`。
  - JS 存在 `roleStyles`、`appliedNodeStyleRules`、`applyNodeStyleRules`。
  - `resolveNodeStyle` 从角色基础样式开始计算。
- `device.csv` 当前 4527 条网元：
  - 角色基础样式中 CSG 命中 4407 条。
  - 应用 `Role = csg` 自定义规则后，覆盖命中 4407 条。
  - 清空/删除规则后，恢复 CSG 基础样式命中 4407 条。

## 2026-06-23 迭代 16

### 目标

修复节点样式规则卡片 UI 溢出问题：新增节点规则时输入框向左溢出侧边栏；同时按用户建议取消拖拽排序，改为固定排序按钮。

### 实现内容

- 移除节点规则卡片中的拖拽手柄和 HTML5 拖拽事件。
- 新增“上移 / 下移”按钮调整节点规则顺序。
- 节点规则卡片改为两列稳定布局：
  - 第一行：字段 + 条件。
  - 第二行：取值。
  - 第三行：颜色 + 大小。
  - 第四行：形状。
  - 第五行：上移 / 下移 / 删除操作。
- 调整 CSS，确保输入框使用 `minmax(0, 1fr)` 和固定宽度操作列，避免再从左侧溢出功能面板。
- 删除已废弃的 `dragRule` 文案。
- `DESIGN.md` 和 `README.md` 将“拖拽排序”同步更新为“上移/下移调整顺序”。

### 测试记录

- `node --check assets/js/app.js` 通过。
- 静态一致性检查通过：
  - JS / CSS 不再包含 `drag-handle` 和节点规则拖拽函数。
  - JS 存在 `data-move-node-rule` 上移/下移按钮。
  - CSS 存在 `.rule-actions` 操作区。
- 节点规则卡片使用 `grid-template-columns: minmax(0, 1fr) 110px`，防止输入框溢出。

## 2026-06-24 迭代 17

### 目标

新增链路点击详情能力：用户点击 GIS 或 Logic Topo 中任意一条链路时，右上角弹出链路信息卡片，交互和视觉位置参考现有网元详情卡片。

### 设计更新

- 复用 `#details` 详情卡片容器，链路卡片与网元卡片使用同一套右上角浮层样式。
- 新增链路选中状态 `selectedLinkKey`，与网元选中状态互斥。
- 链路详情按 `state.linkFields` 动态渲染，不绑定固定业务字段。
- 选中链路继续复用当前 GIS / Logic 链路高优先级样式，便于用户识别当前查看对象。

### 实现内容

- GIS Topo：为链路业务线和白色底线同时绑定点击事件，提升细线点击命中率。
- Logic Topo：为 SVG 链路线段绑定点击事件，并通过渲染时的 `data-link` 回查对应链路记录。
- 新增 `showLinkDetails(link)`，展示 `Src NE Name - Sink NE Name` 标题和 link 表全部字段。
- 点击网元或定位网元时自动清除链路选中态，点击链路时自动清除网元选中态。
- 内置 Mock 链路数据补充 `Status`、`Media Type`、`Protection`、`Service Class`、`Utilization` 等属性。
- 当前测试 `link.csv` 补充 `Link Type`、`Status`、`Capacity`、`Media Type`、`Protection`、`Service Class`、`Utilization` 字段，用于链路详情验证。

### 测试记录

- `node --check assets/js/app.js` 通过。
- `link.csv` 当前包含 3480 条链路记录，字段数从 2 个扩展为 9 个。
