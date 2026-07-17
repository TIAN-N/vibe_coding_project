const REQUIRED_NE = ["NE Name", "Role", "Longitude", "Latitude"];
const REQUIRED_LINK = ["Src NE Name", "Sink NE Name"];
const REQUIRED_RING_CHAIN = ["Category", "Name", "Root1", "Root2", "Label", "Member_num", "Member_path", "Uplink_pair", "Belong_agg"];
const CONDITION_SOURCES = { NODES: "nodes", LINKS: "links", RING_CHAINS: "ringChains" };
const ROLE_ORDER = ["CSG", "ASG", "PE"];
const SHAPES = ["circle", "square", "diamond", "triangle"];
const DEFAULT_ROLE_STYLES = {
  CSG: { color: "#2f74c0", size: 11, shape: "circle" },
  ASG: { color: "#d98a32", size: 13, shape: "diamond" },
  PE: { color: "#c84d4d", size: 15, shape: "square" },
  OTHER: { color: "#718096", size: 10, shape: "circle" }
};
const DEFAULT_LINK_STYLE = { color: "#2f6f86", lineStyle: "solid", width: "medium" };
const DEFAULT_ROUTE_PATH_STYLE = { visible: true, color: "#7a5c2e", lineStyle: "dash", width: "thick", opacity: 0.86 };
const DEFAULT_HIGHLIGHT_CONTRAST = 0.72;
const ROUTE_WKT_FIELD = "Route WKT";
const ROUTE_HIT_TOLERANCE_PX = 8;
const ROUTE_POINTS_CACHE = new WeakMap();
const LINK_STYLE_OPS = ["eq", "contains", "neq"];
const LINE_STYLE_VALUES = ["solid", "dash", "dot"];
const LINE_WIDTH_VALUES = ["thin", "medium", "thick"];
const DEFAULT_NODE_STYLE = { color: "#718096", size: 10, shape: "circle", label: "Other" };
const PERF = {
  logicNodeLimit: 600,
  logicLinkLimit: 1000,
  mapNodeLimit: 1500,
  mapLinkLimit: 1500,
  tableRenderLimit: 500,
  largeNodeCount: 5000,
  largeLinkCount: 8000
};
const MAP_TILE_ERROR_LIMIT = 24;
const MAP_TILE_ERROR_WINDOW_MS = 15000;
const MAP_RENDER_DEBOUNCE_MS = 180;
const SEARCH_HISTORY_KEY = "topo_visual_tool_search_history_v1";
const CONDITION_HISTORY_KEY = "topo_visual_tool_condition_history_v1";
const STYLE_TEMPLATE_SCHEMA = "topo_visual_tool_style_template";
const STYLE_TEMPLATE_VERSION = 1;
const SEARCH_HISTORY_LIMIT = 12;
const CONDITION_HISTORY_LIMIT = 8;
const OPS = [
  ["contains", "opContains"],
  ["eq", "opEq"],
  ["neq", "opNeq"],
  ["starts", "opStarts"],
  ["ends", "opEnds"],
  ["gt", "opGt"],
  ["lt", "opLt"],
  ["empty", "opEmpty"],
  ["notEmpty", "opNotEmpty"]
];

const I18N = {
  zh: {
    appTitle: "拓扑可视工具",
    appSubtitle: "CSV / XLSX 上传，GIS 与逻辑拓扑联动",
    tabTopo: "拓扑视图",
    tabData: "数据管理",
    tabCompare: "版本拓扑对比",
    sectionUpload: "数据上传",
    deviceTable: "网元表",
    linkTable: "链路表",
    ringChainTable: "环链表",
    projectNameLabel: "项目名称",
    projectNamePlaceholder: "输入项目名称",
    projectVersionLabel: "数据版本",
    newVersion: "新建版本",
    deleteVersion: "删除版本",
    chooseFile: "选择文件",
    noFileSelected: "未选择文件",
    mockDataSource: "内置 Mock 数据",
    filePathUnavailable: "浏览器未提供完整本地路径，仅记录文件名",
    untitledVersion: "未命名版本",
    versionCreated: "已新建数据版本：{name}",
    versionDeleted: "已删除数据版本：{name}",
    versionSwitched: "已切换到数据版本：{name}",
    compareLeftVersion: "左侧版本",
    compareRightVersion: "右侧版本",
    compareCenterPlaceholder: "中心网元",
    compareListPlaceholder: "粘贴网元清单或链路清单",
    compareSyncView: "同步视野",
    compareApply: "应用对比",
    compareShowDiff: "显示差异高亮",
    compareNeedVersions: "请先创建并加载至少两个数据版本。",
    compareNoData: "所选版本暂无可对比数据。",
    compareApplied: "对比已应用：左侧 {leftNodes} 个网元 / {leftLinks} 条链路，右侧 {rightNodes} 个网元 / {rightLinks} 条链路。",
    compareCleared: "对比范围已清除，显示所选版本全部拓扑。",
    compareDiffLegend: "差异：红色=仅左侧存在，绿色=仅右侧存在，黄色=属性可能变化。",
    parseUpload: "解析上传数据",
    loadMock: "加载 Mock",
    requiredFields: "必选字段：NE Name、Role、Longitude、Latitude、Src NE Name、Sink NE Name。",
    sectionStats: "统计",
    currentVersion: "当前版本",
    devices: "网元",
    links: "链路",
    rings: "环",
    chains: "链",
    visibleRings: "当前显示环",
    visibleChains: "当前显示链",
    colocatedDevices: "共址网元",
    colocatedDeviceCount: "{count} 个网元",
    colocatedRoleSummary: "角色：{text}",
    colocatedCoordinate: "坐标：{lng}, {lat}",
    visibleDevices: "当前显示网元",
    visibleLinks: "当前显示链路",
    sectionLegend: "节点图例",
    legendCsg: "CSG 接入",
    legendAsg: "ASG 汇聚",
    legendPe: "PE 核心",
    legendOther: "其他",
    sectionLocate: "网元定位",
    searchPlaceholder: "输入网元名称",
    locateDevice: "定位网元",
    sectionHighlight: "高亮条件",
    sectionFilter: "过滤条件",
    conditionValue: "条件值",
    applyHighlight: "应用高亮",
    applyFilter: "应用过滤",
    clear: "清除",
    sectionBulkQuery: "批量查询",
    bulkQueryPlaceholder: "从 Word / Excel / CSV 粘贴网元或链路清单",
    query: "查询",
    clearQuery: "清除查询",
    bulkQueryEmpty: "请先粘贴需要查询的网元或链路清单。",
    bulkQueryApplied: "批量查询已应用：命中 {devices} 个网元，{links} 条链路。",
    bulkQueryCleared: "批量查询已清除。",
    largeDataLoaded: "大规模数据已加载：建议先使用定位、过滤或批量查询缩小范围后查看 Logic Topo。",
    logicTooLarge: "当前 Logic Topo 结果过大（{devices} 网元 / {links} 链路）。请先使用过滤或批量查询缩小范围。",
    renderLimited: "为保证响应速度，当前仅渲染前 {shown}/{total} 条记录。",
    fitView: "适配视图",
    waitUpload: "等待上传数据。",
    emptyState: "上传网元表和链路表，或点击“加载 Mock”开始查看拓扑。",
    tableFilterValue: "表格过滤值",
    clearFilter: "清除过滤",
    addRow: "新增行",
    applyEdit: "应用编辑",
    opContains: "包含",
    opEq: "等于",
    opNeq: "不等于",
    opStarts: "开头是",
    opEnds: "结尾是",
    opGt: "大于",
    opLt: "小于",
    opEmpty: "为空",
    opNotEmpty: "非空",
    leafletMissing: "Leaflet 未加载，GIS 地图不可用；可使用 Logic Topo。",
    chooseBoth: "请同时选择网元表和链路表。",
    uploadDone: "上传数据解析完成。",
    uploadDoneWithRingChain: "上传数据解析完成，环链表已缓存：{rings} 个环，{chains} 条链。",
    ringChainMissingMembers: "环链表有 {count} 个 Member_path 网元未在网元表中找到，已忽略。",
    fileReadFail: "读取文件失败。",
    xlsxMissing: "XLSX 解析库未加载，请确认网络可访问 CDN。",
    unsupportedFile: "仅支持 csv、xlsx、xls 文件。",
    mockLoaded: "Mock 数据已加载：{devices} 个网元，{links} 条链路。",
    tableEmpty: "{name}为空。",
    missingFields: "{name}缺少字段：{fields}",
    locateMissing: "未定位到符合条件网元。",
    locateNoData: "请先上传或加载数据。",
    locateNoCondition: "请输入定位条件。",
    locateMissingCoord: "已命中 {devices} 个网元，但缺少有效经纬度，无法定位地图。",
    located: "已定位：{name}",
    locatedBatch: "已定位 {devices} 个网元，{links} 条内部链路。",
    complexLocateTitle: "复合定位条件",
    unnamedDevice: "未命名网元",
    viewStatus: "显示 {visibleDevices}/{devices} 网元，{visibleLinks}/{links} 链路",
    invalidCoord: "{count} 个网元坐标无效",
    brokenLinks: "{count} 条链路端点缺失",
    ringChainMemberMissing: "{count} 个环链成员缺失",
    noData: "暂无数据。",
    operation: "操作",
    delete: "删除",
    editApplied: "编辑已应用，拓扑已刷新。",
    summaryTable: "当前表",
    summaryVisible: "显示记录",
    summaryTotal: "总记录",
    summaryFields: "字段数",
    summaryQuality: "数据概况",
    roleDistribution: "角色：{text}",
    endpointMissing: "端点缺失：{count}",
    linkEndpointsOk: "端点完整",
    sectionStyle: "样式设置",
    styleTemplate: "样式配置模板",
    exportStyleTemplate: "导出样式配置",
    importStyleTemplate: "导入样式配置",
    styleTemplateExported: "样式配置已导出。",
    styleTemplateImported: "样式配置已导入并应用。",
    styleTemplateImportedWithAdjustments: "样式配置已导入并应用；{adjusted} 条规则字段已按当前数据调整，{skipped} 条无效规则已忽略。",
    styleTemplateInvalid: "样式配置文件格式不正确。",
    styleTemplateUnsupported: "样式配置版本不支持。",
    styleTemplateReadFail: "样式配置文件读取失败。",
    highlightStyle: "高亮节点样式",
    roleStyle: "角色图例样式",
    nodeStyleRules: "节点样式规则",
    addNodeStyleRule: "新增节点规则",
    applyNodeStyleRules: "应用节点规则",
    styleSize: "大小",
    styleColor: "颜色",
    styleNodeColor: "节点颜色",
    styleLinkColor: "链接颜色",
    styleShape: "形状",
    resetStyle: "重置样式",
    shapeCircle: "圆形",
    shapeSquare: "方形",
    shapeDiamond: "菱形",
    shapeTriangle: "三角形",
    linkStyleRules: "链路样式规则",
    addLinkStyleRule: "新增链路规则",
    applyLinkStyleRules: "应用链路规则",
    highlightContrast: "对比度",
    linkRuleField: "字段",
    linkRuleOp: "条件",
    linkRuleValue: "取值",
    linkRuleColor: "颜色",
    linkRuleLineStyle: "线型",
    linkRuleWidth: "线宽",
    removeRule: "删除",
    lineSolid: "实线",
    lineDash: "虚线",
    lineDot: "点线",
    lineThin: "细线",
    lineMedium: "中线",
    lineThick: "粗线",
    routePathStyle: "路网路径样式",
    showRoutePath: "显示路网路径",
    routePathOpacity: "透明度",
    advancedCondition: "复合条件",
    complexHighlightTitle: "复合高亮条件",
    complexFilterTitle: "复合过滤条件",
    matchAll: "全部满足",
    matchAny: "任一满足",
    addCondition: "新增条件",
    apply: "应用",
    cancel: "取消",
    removeCondition: "删除",
    noConditionRule: "未设置条件",
    conditionSummaryAll: "全部满足 {count} 条条件",
    conditionSummaryAny: "任一满足 {count} 条条件",
    conditionHistory: "历史条件",
    noConditionHistory: "暂无历史条件",
    noLinkStyleRule: "暂无链路样式规则",
    ringChainStyleRules: "环链样式规则",
    addRingChainStyleRule: "新增环链规则",
    applyRingChainStyleRules: "应用环链规则",
    noRingChainStyleRule: "暂无环链样式规则",
    conditionSource: "条件来源",
    conditionSourceNodes: "网元字段",
    conditionSourceLinks: "链路字段",
    conditionSourceRingChains: "环链字段",
    nodeRuleField: "字段",
    nodeRuleOp: "条件",
    nodeRuleValue: "取值",
    nodeRuleColor: "颜色",
    nodeRuleShape: "形状",
    nodeRuleSize: "大小",
    moveUp: "上移",
    moveDown: "下移",
    noNodeStyleRule: "暂无节点样式规则"
  },
  en: {
    appTitle: "Topology Visual Tool",
    appSubtitle: "CSV / XLSX upload with GIS and logical topology",
    tabTopo: "Topology",
    tabData: "Data Management",
    tabCompare: "Version Compare",
    sectionUpload: "Data Upload",
    deviceTable: "Device Table",
    linkTable: "Link Table",
    ringChainTable: "Ring/Chain Table",
    projectNameLabel: "Project",
    projectNamePlaceholder: "Enter project name",
    projectVersionLabel: "Data Version",
    newVersion: "New Version",
    deleteVersion: "Delete Version",
    chooseFile: "Choose File",
    noFileSelected: "No file selected",
    mockDataSource: "Built-in Mock data",
    filePathUnavailable: "The browser did not expose the full local path; only the file name is recorded.",
    untitledVersion: "Untitled Version",
    versionCreated: "Data version created: {name}",
    versionDeleted: "Data version deleted: {name}",
    versionSwitched: "Switched to data version: {name}",
    compareLeftVersion: "Left Version",
    compareRightVersion: "Right Version",
    compareCenterPlaceholder: "Center device",
    compareListPlaceholder: "Paste device or link list",
    compareSyncView: "Sync View",
    compareApply: "Apply Compare",
    compareShowDiff: "Show diff highlight",
    compareNeedVersions: "Create and load at least two data versions first.",
    compareNoData: "Selected versions have no topology data to compare.",
    compareApplied: "Compare applied: left {leftNodes} devices / {leftLinks} links, right {rightNodes} devices / {rightLinks} links.",
    compareCleared: "Compare scope cleared; showing all topology in selected versions.",
    compareDiffLegend: "Diff: red=left only, green=right only, yellow=possible attribute change.",
    parseUpload: "Parse Upload",
    loadMock: "Load Mock",
    requiredFields: "Required fields: NE Name, Role, Longitude, Latitude, Src NE Name, Sink NE Name.",
    sectionStats: "Statistics",
    currentVersion: "Current Version",
    devices: "Devices",
    links: "Links",
    rings: "Rings",
    chains: "Chains",
    visibleRings: "Visible Rings",
    visibleChains: "Visible Chains",
    colocatedDevices: "Colocated Devices",
    colocatedDeviceCount: "{count} devices",
    colocatedRoleSummary: "Roles: {text}",
    colocatedCoordinate: "Coordinate: {lng}, {lat}",
    visibleDevices: "Visible Devices",
    visibleLinks: "Visible Links",
    sectionLegend: "Node Legend",
    legendCsg: "CSG Access",
    legendAsg: "ASG Aggregation",
    legendPe: "PE Core",
    legendOther: "Other",
    sectionLocate: "Device Locate",
    searchPlaceholder: "Enter device name",
    locateDevice: "Locate Device",
    sectionHighlight: "Highlight Rule",
    sectionFilter: "Filter Rule",
    conditionValue: "Condition value",
    applyHighlight: "Apply Highlight",
    applyFilter: "Apply Filter",
    clear: "Clear",
    sectionBulkQuery: "Bulk Query",
    bulkQueryPlaceholder: "Paste devices or links from Word / Excel / CSV",
    query: "Query",
    clearQuery: "Clear Query",
    bulkQueryEmpty: "Paste devices or links before querying.",
    bulkQueryApplied: "Bulk query applied: {devices} devices, {links} links matched.",
    bulkQueryCleared: "Bulk query cleared.",
    largeDataLoaded: "Large dataset loaded. Use locate, filters, or bulk query before opening Logic Topo.",
    logicTooLarge: "Current Logic Topo result is too large ({devices} devices / {links} links). Use filters or bulk query first.",
    renderLimited: "For responsiveness, only the first {shown}/{total} rows are rendered.",
    fitView: "Fit View",
    waitUpload: "Waiting for uploaded data.",
    emptyState: "Upload device and link tables, or click Load Mock to start.",
    tableFilterValue: "Table filter value",
    clearFilter: "Clear Filter",
    addRow: "Add Row",
    applyEdit: "Apply Edit",
    opContains: "Contains",
    opEq: "Equals",
    opNeq: "Not equal",
    opStarts: "Starts with",
    opEnds: "Ends with",
    opGt: "Greater than",
    opLt: "Less than",
    opEmpty: "Empty",
    opNotEmpty: "Not empty",
    leafletMissing: "Leaflet is not loaded. GIS map is unavailable; Logic Topo is still available.",
    chooseBoth: "Please choose both device and link tables.",
    uploadDone: "Uploaded data parsed.",
    uploadDoneWithRingChain: "Uploaded data parsed. Ring/chain table cached: {rings} rings, {chains} chains.",
    ringChainMissingMembers: "{count} Member_path devices in the ring/chain table were not found in the device table and were ignored.",
    fileReadFail: "Failed to read file.",
    xlsxMissing: "XLSX parser is not loaded. Please check CDN network access.",
    unsupportedFile: "Only csv, xlsx and xls files are supported.",
    mockLoaded: "Mock data loaded: {devices} devices, {links} links.",
    tableEmpty: "{name} is empty.",
    missingFields: "{name} is missing fields: {fields}",
    locateMissing: "No matching devices found.",
    locateNoData: "Upload or load data first.",
    locateNoCondition: "Enter locate conditions.",
    locateMissingCoord: "{devices} devices matched, but none has valid coordinates for map locating.",
    located: "Located: {name}",
    locatedBatch: "Located {devices} devices and {links} internal links.",
    complexLocateTitle: "Advanced Locate Conditions",
    unnamedDevice: "Unnamed device",
    viewStatus: "Showing {visibleDevices}/{devices} devices, {visibleLinks}/{links} links",
    invalidCoord: "{count} devices have invalid coordinates",
    brokenLinks: "{count} links have missing endpoints",
    ringChainMemberMissing: "{count} ring/chain members missing",
    noData: "No data.",
    operation: "Action",
    delete: "Delete",
    editApplied: "Edits applied and topology refreshed.",
    summaryTable: "Current Table",
    summaryVisible: "Visible Rows",
    summaryTotal: "Total Rows",
    summaryFields: "Fields",
    summaryQuality: "Data Summary",
    roleDistribution: "Roles: {text}",
    endpointMissing: "Missing endpoints: {count}",
    linkEndpointsOk: "Endpoints OK",
    sectionStyle: "Style Settings",
    styleTemplate: "Style Template",
    exportStyleTemplate: "Export Style Config",
    importStyleTemplate: "Import Style Config",
    styleTemplateExported: "Style config exported.",
    styleTemplateImported: "Style config imported and applied.",
    styleTemplateImportedWithAdjustments: "Style config imported and applied; {adjusted} rule fields adjusted for current data, {skipped} invalid rules ignored.",
    styleTemplateInvalid: "Invalid style config file.",
    styleTemplateUnsupported: "Unsupported style config version.",
    styleTemplateReadFail: "Failed to read style config file.",
    highlightStyle: "Highlight Node Style",
    roleStyle: "Role Legend Style",
    nodeStyleRules: "Node Style Rules",
    addNodeStyleRule: "Add Node Rule",
    applyNodeStyleRules: "Apply Node Rules",
    styleSize: "Size",
    styleColor: "Color",
    styleNodeColor: "Node Color",
    styleLinkColor: "Link Color",
    styleShape: "Shape",
    resetStyle: "Reset Style",
    shapeCircle: "Circle",
    shapeSquare: "Square",
    shapeDiamond: "Diamond",
    shapeTriangle: "Triangle",
    linkStyleRules: "Link Style Rules",
    addLinkStyleRule: "Add Link Rule",
    applyLinkStyleRules: "Apply Link Rules",
    highlightContrast: "Contrast",
    linkRuleField: "Field",
    linkRuleOp: "Condition",
    linkRuleValue: "Value",
    linkRuleColor: "Color",
    linkRuleLineStyle: "Line",
    linkRuleWidth: "Width",
    removeRule: "Remove",
    lineSolid: "Solid",
    lineDash: "Dash",
    lineDot: "Dot",
    lineThin: "Thin",
    lineMedium: "Medium",
    lineThick: "Thick",
    routePathStyle: "Route Path Style",
    showRoutePath: "Show Route Paths",
    routePathOpacity: "Opacity",
    advancedCondition: "Advanced",
    complexHighlightTitle: "Advanced Highlight Conditions",
    complexFilterTitle: "Advanced Filter Conditions",
    matchAll: "Match all",
    matchAny: "Match any",
    addCondition: "Add condition",
    apply: "Apply",
    cancel: "Cancel",
    removeCondition: "Remove",
    noConditionRule: "No condition",
    conditionSummaryAll: "Match all {count} conditions",
    conditionSummaryAny: "Match any {count} conditions",
    conditionHistory: "Condition history",
    noConditionHistory: "No condition history",
    noLinkStyleRule: "No link style rules",
    ringChainStyleRules: "Ring/Chain Style Rules",
    addRingChainStyleRule: "Add Ring/Chain Rule",
    applyRingChainStyleRules: "Apply Ring/Chain Rules",
    noRingChainStyleRule: "No ring/chain style rules",
    conditionSource: "Condition Source",
    conditionSourceNodes: "Device Fields",
    conditionSourceLinks: "Link Fields",
    conditionSourceRingChains: "Ring/Chain Fields",
    nodeRuleField: "Field",
    nodeRuleOp: "Condition",
    nodeRuleValue: "Value",
    nodeRuleColor: "Color",
    nodeRuleShape: "Shape",
    nodeRuleSize: "Size",
    moveUp: "Up",
    moveDown: "Down",
    noNodeStyleRule: "No node style rules"
  }
};

const state = {
  lang: "zh",
  projectName: "",
  versions: [],
  activeVersionId: "",
  nodes: [],
  links: [],
  ringChains: [],
  nodeFields: [...REQUIRED_NE],
  linkFields: [...REQUIRED_LINK],
  ringChainFields: [...REQUIRED_RING_CHAIN],
  view: "gis",
  table: "nodes",
  selectedName: "",
  selectedLinkKey: "",
  selectedRouteKey: "",
  selectedCoordinateKey: "",
  highlightRule: null,
  filterRule: null,
  locateRule: null,
  locatedNames: new Set(),
  locatedLinkKeys: new Set(),
  bulkQuery: null,
  roleStyles: cloneStyles(DEFAULT_ROLE_STYLES),
  nodeStyleRules: [],
  appliedNodeStyleRules: [],
  linkStyleRules: [],
  appliedLinkStyleRules: [],
  ringChainStyleRules: [],
  appliedRingChainStyleRules: [],
  routePathStyle: { ...DEFAULT_ROUTE_PATH_STYLE },
  highlightContrast: DEFAULT_HIGHLIGHT_CONTRAST,
  conditionModalType: "",
  conditionModalTarget: null,
  conditionDraft: null,
  conditionHistory: [],
  searchHistory: {
    locate: [],
    highlight: [],
    filter: []
  },
  searchHistoryMenu: null,
  indexes: {
    nodeByName: new Map(),
    upperNameToName: new Map(),
    linksByNode: new Map(),
    ringChainMembersByName: new Map(),
    ringChainSegmentsByName: new Map()
  },
  quality: {
    missingCoord: 0,
    brokenLinks: 0,
    missingRingChainMembers: 0
  },
  map: null,
  tileLayer: null,
  tileErrorCount: 0,
  tileErrorTimer: null,
  mapRenderTimer: null,
  mapMoving: false,
  lightBasemap: false,
  mapLayers: { nodes: [], links: [], routes: [] },
  routeHitEntries: [],
  compare: {
    active: false,
    syncingView: false,
    criteria: { mode: "all", center: "", hops: 1, tokens: [] },
    left: {
      side: "left",
      versionId: "",
      map: null,
      tileLayer: null,
      layers: [],
      selectedName: "",
      selectedLinkKey: "",
      showRoutes: true,
      showDiff: true,
      filterRule: null,
      highlightRule: null,
      width: "medium",
      styleReady: false,
      roleStyles: null,
      nodeStyleRules: [],
      appliedNodeStyleRules: [],
      linkStyleRules: [],
      appliedLinkStyleRules: []
    },
    right: {
      side: "right",
      versionId: "",
      map: null,
      tileLayer: null,
      layers: [],
      selectedName: "",
      selectedLinkKey: "",
      showRoutes: true,
      showDiff: true,
      filterRule: null,
      highlightRule: null,
      width: "medium",
      styleReady: false,
      roleStyles: null,
      nodeStyleRules: [],
      appliedNodeStyleRules: [],
      linkStyleRules: [],
      appliedLinkStyleRules: []
    }
  },
  ringChainStyleCache: {
    key: "",
    styles: new Map()
  },
  logic: {
    positions: new Map(),
    layoutKey: "",
    layoutWidth: 1280,
    layoutHeight: 820,
    zoom: 1,
    panX: 0,
    panY: 0,
    draggingCanvas: false,
    draggingNode: "",
    dragMoved: false,
    lastX: 0,
    lastY: 0
  }
};

const el = {};
document.querySelectorAll("[id]").forEach(item => {
  el[item.id] = item;
});

window.topoLeafletLoaded = () => {
  if (state.map || !window.L) return;
  initMap();
  if (state.compare.active) initCompareMaps();
  renderTopologies();
  if (state.nodes.length) fitCurrentView();
};

init();

function init() {
  loadSearchHistory();
  initDataVersions();
  initMap();
  fillOperatorOptions();
  initStyleControls();
  bindEvents();
  applyLanguage();
  refreshAll();
}

function initMap() {
  if (!window.L) {
    el.viewMessage.textContent = t("leafletMissing");
    return;
  }

  state.map = L.map("map", {
    zoomControl: true,
    preferCanvas: true,
    renderer: L.canvas({ padding: 0.75 })
  }).setView([13.7563, 100.5018], 10);
  installOnlineTileLayer();
  state.map.on("movestart zoomstart", () => {
    state.mapMoving = true;
    clearRouteLayers();
  });
  state.map.on("moveend zoomend", () => {
    state.mapMoving = false;
    scheduleMapRender();
  });
  state.map.on("click", onMapClick);
}

function installOnlineTileLayer() {
  if (!state.map || !window.L) return;

  state.tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    maxNativeZoom: 19,
    opacity: 1,
    attribution: "&copy; OpenStreetMap",
    updateWhenIdle: false,
    updateWhenZooming: true,
    keepBuffer: 4,
    detectRetina: true,
    crossOrigin: true
  }).addTo(state.map);
  state.tileLayer.on("tileerror", onTileError);
}

function onTileError() {
  state.tileErrorCount += 1;
  window.clearTimeout(state.tileErrorTimer);
  state.tileErrorTimer = window.setTimeout(() => {
    state.tileErrorCount = 0;
  }, MAP_TILE_ERROR_WINDOW_MS);

  if (state.tileErrorCount >= MAP_TILE_ERROR_LIMIT) {
    enableLightBasemap();
  }
}

function enableLightBasemap() {
  if (!state.map || state.lightBasemap) return;

  state.lightBasemap = true;
  if (state.tileLayer) {
    state.tileLayer.off("tileerror", onTileError);
    state.tileLayer.remove();
    state.tileLayer = null;
  }
  el.map.classList.add("light-basemap");
  el.viewMessage.textContent = state.lang === "en"
    ? "Online map tiles are unstable. Switched to the light local basemap."
    : "在线地图瓦片不稳定，已切换为本地浅色简洁底图。";
  scheduleMapRender(0);
}

function scheduleMapRender(delay = MAP_RENDER_DEBOUNCE_MS) {
  window.clearTimeout(state.mapRenderTimer);
  state.mapRenderTimer = window.setTimeout(() => {
    if (state.view === "gis" && state.nodes.length && !state.mapMoving) {
      renderTopologies();
    }
  }, delay);
}

function clearRouteLayers() {
  state.mapLayers.routes.forEach(layer => layer.remove());
  state.mapLayers.routes = [];
  state.routeHitEntries = [];
}

function onMapClick(event) {
  const routeHit = findRouteHit(event.containerPoint);
  if (routeHit) {
    state.selectedRouteKey = routeHit.key;
    showLinkDetails(routeHit.link, { route: true });
    renderTopologies();
    return;
  }

  if (clearSelection()) renderTopologies();
}

function bindEvents() {
  el.projectVersionSelect.addEventListener("change", () => switchDataVersion(el.projectVersionSelect.value));
  el.newVersionBtn.addEventListener("click", createAndSwitchDataVersion);
  el.deleteVersionBtn.addEventListener("click", deleteActiveDataVersion);
  el.projectNameInput.addEventListener("input", updateProjectNameFromControl);
  el.langZhBtn.addEventListener("click", () => switchLanguage("zh"));
  el.langEnBtn.addEventListener("click", () => switchLanguage("en"));
  el.tabTopo.addEventListener("click", () => switchPage("topo"));
  el.tabData.addEventListener("click", () => switchPage("data"));
  el.tabCompare.addEventListener("click", () => switchPage("compare"));
  el.gisBtn.addEventListener("click", () => switchTopoView("gis"));
  el.logicBtn.addEventListener("click", () => switchTopoView("logic"));
  el.fitBtn.addEventListener("click", fitCurrentView);
  el.mockBtn.addEventListener("click", loadMockData);
  el.loadFilesBtn.addEventListener("click", loadUploadedFiles);
  el.neFile.addEventListener("change", () => updateSourceFileFromInput("device", el.neFile));
  el.linkFile.addEventListener("change", () => updateSourceFileFromInput("link", el.linkFile));
  if (el.ringChainFile) el.ringChainFile.addEventListener("change", () => updateSourceFileFromInput("ringChain", el.ringChainFile));
  el.locateBtn.addEventListener("click", locateNode);
  el.advancedLocateBtn.addEventListener("click", () => openConditionModal("locate"));
  el.clearLocateBtn.addEventListener("click", clearLocateRule);
  bindSearchHistoryInput(el.searchInput, "locate");
  bindSearchHistoryInput(el.highlightValue, "highlight");
  bindSearchHistoryInput(el.filterValue, "filter");

  el.applyHighlightBtn.addEventListener("click", () => {
    state.highlightRule = ruleGroupFromQuickControls("highlight");
    rememberSearchHistory("highlight", el.highlightValue.value);
    updateRuleSummaries();
    renderTopologies();
    focusMainRuleResult("highlight");
  });
  el.advancedHighlightBtn.addEventListener("click", () => openConditionModal("highlight"));
  el.clearHighlightBtn.addEventListener("click", () => {
    state.highlightRule = null;
    el.highlightValue.value = "";
    updateRuleSummaries();
    renderTopologies();
  });
  el.applyFilterBtn.addEventListener("click", () => {
    state.filterRule = ruleGroupFromQuickControls("filter");
    rememberSearchHistory("filter", el.filterValue.value);
    updateRuleSummaries();
    renderTopologies();
    focusMainRuleResult("filter");
  });
  el.advancedFilterBtn.addEventListener("click", () => openConditionModal("filter"));
  el.clearFilterBtn.addEventListener("click", () => {
    state.filterRule = null;
    el.filterValue.value = "";
    updateRuleSummaries();
    renderTopologies();
  });
  el.conditionModalClose.addEventListener("click", closeConditionModal);
  el.cancelConditionModalBtn.addEventListener("click", closeConditionModal);
  el.addConditionRuleBtn.addEventListener("click", addConditionDraftRule);
  el.applyConditionModalBtn.addEventListener("click", applyConditionModal);
  el.conditionSourceSelect.addEventListener("change", updateConditionSourceFromControl);
  el.conditionRuleList.addEventListener("change", updateConditionRowSuggestions);
  el.conditionRuleList.addEventListener("click", removeConditionDraftRule);
  el.conditionHistoryList.addEventListener("click", restoreConditionHistory);
  el.conditionModal.addEventListener("mousedown", event => {
    if (event.target === el.conditionModal) closeConditionModal();
  });
  el.applyBulkQueryBtn.addEventListener("click", applyBulkQuery);
  el.clearBulkQueryBtn.addEventListener("click", clearBulkQuery);
  el.highlightField.addEventListener("change", () => updateConditionValueSuggestions("highlight"));
  el.filterField.addEventListener("change", () => updateConditionValueSuggestions("filter"));

  el.neTableBtn.addEventListener("click", () => switchTable("nodes"));
  el.linkTableBtn.addEventListener("click", () => switchTable("links"));
  el.tableField.addEventListener("change", updateTable);
  el.tableOp.addEventListener("change", updateTable);
  el.tableValue.addEventListener("input", updateTable);
  el.clearTableFilterBtn.addEventListener("click", () => {
    el.tableValue.value = "";
    updateTable();
  });
  el.addRowBtn.addEventListener("click", addTableRow);
  el.applyEditBtn.addEventListener("click", applyTableEdits);

  bindCompareEvents();
  bindLogicEvents();
  document.addEventListener("mousedown", event => {
    if (state.searchHistoryMenu && !state.searchHistoryMenu.contains(event.target)) {
      hideSearchHistoryMenu();
    }
  });
  window.addEventListener("resize", () => {
    hideSearchHistoryMenu();
    if (state.map) state.map.invalidateSize();
    invalidateCompareMaps();
    if (state.view === "logic") renderLogic(getVisibleData());
  });
}

function bindCompareEvents() {
  if (!el.compareApplyBtn) return;

  el.compareLeftVersion.addEventListener("change", () => {
    state.compare.left.versionId = el.compareLeftVersion.value;
    renderCompare();
  });
  el.compareRightVersion.addEventListener("change", () => {
    state.compare.right.versionId = el.compareRightVersion.value;
    renderCompare();
  });
  el.compareApplyBtn.addEventListener("click", applyCompareCriteria);
  el.compareClearBtn.addEventListener("click", clearCompareCriteria);
  el.compareFitBtn.addEventListener("click", fitCompareMaps);
  el.compareSyncView.addEventListener("change", () => renderCompare());

  bindCompareSideControls("left");
  bindCompareSideControls("right");
}

function bindCompareSideControls(side) {
  const prefix = side === "left" ? "compareLeft" : "compareRight";
  const ctx = state.compare[side];
  el[`${prefix}StyleToggle`].addEventListener("click", () => {
    el[`${prefix}Drawer`].classList.toggle("open");
  });
  el[`${prefix}Routes`].addEventListener("change", event => {
    ctx.showRoutes = event.target.checked;
    renderCompare();
  });
  el[`${prefix}Diff`].addEventListener("change", event => {
    ctx.showDiff = event.target.checked;
    renderCompare();
  });
  el[`${prefix}Width`].addEventListener("change", event => {
    ctx.width = event.target.value;
    renderCompare();
  });
  el[`${prefix}StyleControls`].addEventListener("input", event => updateCompareStyleFromControl(side, event));
  el[`${prefix}StyleControls`].addEventListener("change", event => updateCompareStyleFromControl(side, event));
  el[`${prefix}StyleControls`].addEventListener("click", event => handleCompareStyleClick(side, event));
}

function setupComparePage() {
  persistActiveVersionState();
  renderCompareVersionControls();
  initCompareMaps();
  updateCompareSuggestions();
  renderCompare();
}

function renderCompareVersionControls() {
  if (!el.compareLeftVersion || !el.compareRightVersion) return;

  const options = state.versions.map(version => {
    const label = `${version.name || t("untitledVersion")} · ${version.nodes.length}/${version.links.length}`;
    return `<option value="${escapeAttr(version.id)}">${escapeHtml(label)}</option>`;
  }).join("");
  el.compareLeftVersion.innerHTML = options;
  el.compareRightVersion.innerHTML = options;

  const loaded = state.versions.filter(version => version.nodes.length || version.links.length);
  const fallbackLeft = state.activeVersionId || (state.versions[0] && state.versions[0].id) || "";
  if (!state.compare.left.versionId || !state.versions.some(version => version.id === state.compare.left.versionId)) {
    state.compare.left.versionId = fallbackLeft;
  }
  if (!state.compare.right.versionId || !state.versions.some(version => version.id === state.compare.right.versionId)) {
    const candidate = loaded.find(version => version.id !== state.compare.left.versionId)
      || state.versions.find(version => version.id !== state.compare.left.versionId)
      || state.versions[1]
      || state.versions[0];
    state.compare.right.versionId = candidate ? candidate.id : "";
  }

  el.compareLeftVersion.value = state.compare.left.versionId;
  el.compareRightVersion.value = state.compare.right.versionId;
}

function initCompareMaps() {
  if (!window.L) {
    setCompareMessage(t("leafletMissing"), "error");
    return;
  }
  initCompareMap("left", "compareMapLeft");
  initCompareMap("right", "compareMapRight");
}

function initCompareMap(side, containerId) {
  const ctx = state.compare[side];
  if (ctx.map) return;

  ctx.map = L.map(containerId, {
    zoomControl: false,
    preferCanvas: true,
    renderer: L.canvas({ padding: 0.75 })
  }).setView([13.7563, 100.5018], 10);
  L.control.zoom({ position: "bottomright" }).addTo(ctx.map);
  ctx.tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    maxNativeZoom: 19,
    attribution: "&copy; OpenStreetMap",
    keepBuffer: 4,
    detectRetina: true,
    crossOrigin: true
  }).addTo(ctx.map);
  ctx.map.on("moveend zoomend", () => syncCompareView(side));
  ctx.map.on("click", () => {
    ctx.selectedName = "";
    ctx.selectedLinkKey = "";
    const details = side === "left" ? el.compareLeftDetails : el.compareRightDetails;
    details.classList.remove("show");
    renderCompare();
  });
}

function syncCompareView(sourceSide) {
  if (!el.compareSyncView || !el.compareSyncView.checked || state.compare.syncingView) return;
  const source = state.compare[sourceSide];
  const target = state.compare[sourceSide === "left" ? "right" : "left"];
  if (!source.map || !target.map) return;

  state.compare.syncingView = true;
  target.map.setView(source.map.getCenter(), source.map.getZoom(), { animate: false });
  state.compare.syncingView = false;
}

function invalidateCompareMaps() {
  ["left", "right"].forEach(side => {
    const map = state.compare[side].map;
    if (map) map.invalidateSize();
  });
}

function applyCompareCriteria() {
  const center = String(el.compareCenterInput.value || "").trim();
  const tokens = parseCompareTokens(el.compareListInput.value);
  state.compare.criteria = {
    mode: center ? "hop" : tokens.length ? "list" : "all",
    center,
    hops: clamp(Number(el.compareHopSelect.value) || 1, 1, 3),
    tokens
  };
  renderCompare();
}

function clearCompareCriteria() {
  el.compareCenterInput.value = "";
  el.compareListInput.value = "";
  state.compare.criteria = { mode: "all", center: "", hops: 1, tokens: [] };
  renderCompare(t("compareCleared"), "ok");
}

function parseCompareTokens(text) {
  return String(text || "")
    .split(/[\n,;，；\t]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function versionById(id) {
  return state.versions.find(version => version.id === id) || null;
}

function buildVersionIndexes(version) {
  const nodeByName = new Map();
  const linksByNode = new Map();
  (version.nodes || []).forEach(node => {
    const name = node["NE Name"];
    if (name) nodeByName.set(name, node);
  });
  (version.links || []).forEach(link => {
    [link["Src NE Name"], link["Sink NE Name"]].forEach(name => {
      if (!name) return;
      if (!linksByNode.has(name)) linksByNode.set(name, []);
      linksByNode.get(name).push(link);
    });
  });
  return { nodeByName, linksByNode };
}

function getCompareVisibleData(version, criteria, ctx = null) {
  const indexes = buildVersionIndexes(version);
  const allNodes = version.nodes || [];
  const allLinks = version.links || [];
  let data;
  if (!criteria || criteria.mode === "all") {
    data = { nodes: allNodes, links: allLinks, nodeByName: indexes.nodeByName };
  } else {
    const names = criteria.mode === "hop"
      ? compareHopNames(criteria.center, criteria.hops, indexes)
      : compareTokenNames(criteria.tokens, indexes);
    const visibleNames = new Set(names);
    const links = [];
    const seenLinks = new Set();
    allLinks.forEach(link => {
      const key = linkKey(link);
      const src = link["Src NE Name"];
      const sink = link["Sink NE Name"];
      const bothVisible = visibleNames.has(src) && visibleNames.has(sink);
      const directlyRequested = criteria.mode === "list" && names.has(key);
      if ((bothVisible || directlyRequested) && !seenLinks.has(key)) {
        seenLinks.add(key);
        links.push(link);
        visibleNames.add(src);
        visibleNames.add(sink);
      }
    });
    data = {
      nodes: [...visibleNames].map(name => indexes.nodeByName.get(name)).filter(Boolean),
      links,
      nodeByName: indexes.nodeByName
    };
  }
  return applyCompareFilter(version, data, ctx);
}

function applyCompareFilter(version, data, ctx) {
  const group = normalizeRuleGroup(ctx && ctx.filterRule);
  if (!group) return data;

  const nodeByName = data.nodeByName;
  const baseVisibleNames = new Set(data.nodes.map(node => node["NE Name"]).filter(Boolean));
  const resultNames = new Set();
  let resultLinks = [];

  if (group.source === CONDITION_SOURCES.LINKS) {
    resultLinks = data.links.filter(link => matchesRule(link, group));
    resultLinks.forEach(link => {
      resultNames.add(link["Src NE Name"]);
      resultNames.add(link["Sink NE Name"]);
    });
  } else if (group.source === CONDITION_SOURCES.RING_CHAINS) {
    compareRingChainNamesForRule(version, group).forEach(name => {
      if (baseVisibleNames.has(name)) resultNames.add(name);
    });
    resultLinks = data.links.filter(link => resultNames.has(link["Src NE Name"]) && resultNames.has(link["Sink NE Name"]));
  } else {
    data.nodes.forEach(node => {
      if (matchesRule(node, group)) resultNames.add(node["NE Name"]);
    });
    resultLinks = data.links.filter(link => resultNames.has(link["Src NE Name"]) && resultNames.has(link["Sink NE Name"]));
  }

  return {
    nodes: [...resultNames].map(name => nodeByName.get(name)).filter(Boolean),
    links: resultLinks,
    nodeByName
  };
}

function compareRingChainNamesForRule(version, group) {
  const names = new Set();
  (version.ringChains || []).forEach(row => {
    if (!matchesRule(row, group)) return;
    parseMemberPath(row.Member_path).forEach(name => names.add(name));
  });
  return names;
}

function compareHopNames(center, hops, indexes) {
  const start = findVersionNodeName(center, indexes.nodeByName);
  const names = new Set();
  if (!start) return names;

  const queue = [{ name: start, depth: 0 }];
  names.add(start);
  while (queue.length) {
    const current = queue.shift();
    if (current.depth >= hops) continue;
    (indexes.linksByNode.get(current.name) || []).forEach(link => {
      const next = link["Src NE Name"] === current.name ? link["Sink NE Name"] : link["Src NE Name"];
      if (!next || names.has(next)) return;
      names.add(next);
      queue.push({ name: next, depth: current.depth + 1 });
    });
  }
  return names;
}

function findVersionNodeName(input, nodeByName) {
  const value = String(input || "").trim();
  if (!value) return "";
  if (nodeByName.has(value)) return value;
  const upper = value.toUpperCase();
  for (const name of nodeByName.keys()) {
    if (String(name).toUpperCase() === upper) return name;
  }
  return "";
}

function compareTokenNames(tokens, indexes) {
  const names = new Set();
  tokens.forEach(token => {
    const direct = findVersionNodeName(token, indexes.nodeByName);
    if (direct) {
      names.add(direct);
      return;
    }
    const [a, b] = String(token).split(/\s*(?:->|=>|--|⇄|<->)\s*/).map(part => part && part.trim());
    const src = findVersionNodeName(a, indexes.nodeByName);
    const sink = findVersionNodeName(b, indexes.nodeByName);
    if (src) names.add(src);
    if (sink) names.add(sink);
  });
  return names;
}

function renderCompare(message = "", type = "") {
  if (!el.comparePage || !state.compare.active) return;
  if (!window.L) {
    setCompareMessage(t("leafletMissing"), "error");
    return;
  }

  renderCompareVersionControls();
  const leftVersion = versionById(state.compare.left.versionId);
  const rightVersion = versionById(state.compare.right.versionId);
  if (state.versions.filter(version => version.nodes.length || version.links.length).length < 2) {
    setCompareMessage(t("compareNeedVersions"), "error");
    return;
  }
  if (!leftVersion || !rightVersion) return;

  const leftData = getCompareVisibleData(leftVersion, state.compare.criteria, state.compare.left);
  const rightData = getCompareVisibleData(rightVersion, state.compare.criteria, state.compare.right);
  const diff = buildCompareDiff(leftData, rightData);

  renderCompareSide("left", leftVersion, leftData, diff);
  renderCompareSide("right", rightVersion, rightData, diff);
  updateCompareSuggestions();
  setCompareMessage(message || t("compareApplied", {
    leftNodes: leftData.nodes.length,
    leftLinks: leftData.links.length,
    rightNodes: rightData.nodes.length,
    rightLinks: rightData.links.length
  }), type || "ok");
}

function buildCompareDiff(leftData, rightData) {
  const leftNodes = new Set(leftData.nodes.map(node => node["NE Name"]).filter(Boolean));
  const rightNodes = new Set(rightData.nodes.map(node => node["NE Name"]).filter(Boolean));
  const leftLinks = new Set(leftData.links.map(linkKey));
  const rightLinks = new Set(rightData.links.map(linkKey));
  const changedNodes = new Set();
  leftNodes.forEach(name => {
    if (!rightNodes.has(name)) return;
    const left = leftData.nodeByName.get(name);
    const right = rightData.nodeByName.get(name);
    if (JSON.stringify(left || {}) !== JSON.stringify(right || {})) changedNodes.add(name);
  });
  return { leftNodes, rightNodes, leftLinks, rightLinks, changedNodes };
}

function renderCompareSide(side, version, data, diff) {
  const ctx = state.compare[side];
  const prefix = side === "left" ? "compareLeft" : "compareRight";
  const map = ctx.map;
  if (!map) return;
  ensureCompareStyleState(ctx);

  ctx.layers.forEach(layer => layer.remove());
  ctx.layers = [];
  el[`${prefix}Title`].textContent = version.name || t("untitledVersion");
  el[`${prefix}Stats`].textContent = `${data.nodes.length}/${version.nodes.length} ${t("devices")} · ${data.links.length}/${version.links.length} ${t("links")}`;
  renderCompareLegend(prefix);
  renderCompareStyleControls(side, version);
  const highlight = compareHighlightInfo(version, data, ctx);

  const degreeMap = getNodeDegreeMap(data.links);
  data.links.forEach(link => {
    const src = data.nodeByName.get(link["Src NE Name"]);
    const sink = data.nodeByName.get(link["Sink NE Name"]);
    if (!src || !sink || !hasCoord(src) || !hasCoord(sink)) return;
    const status = compareLinkStatus(side, link, diff, ctx.showDiff);
    const sideStyle = compareResolveLinkStyle(ctx, link);
    if (ctx.showRoutes) {
      const points = routePointsForLink(link);
      if (points.length > 1) {
        ctx.layers.push(L.polyline(points, {
          color: status.override ? status.color : sideStyle.color,
          weight: Math.max(sideStyle.weight, compareLinkWeight(ctx.width), 3.2),
          dashArray: "6 6",
          opacity: 0.42
        }).addTo(map));
      }
    }
    const selected = ctx.selectedLinkKey === linkKey(link);
    const highlighted = highlight.linkKeys.has(linkKey(link));
    const dimLink = highlight.active && !highlighted;
    const line = L.polyline([[Number(src.Latitude), Number(src.Longitude)], [Number(sink.Latitude), Number(sink.Longitude)]], {
      color: selected ? "#245a6e" : status.override ? status.color : sideStyle.color,
      weight: selected || highlighted ? Math.max(sideStyle.weight, compareLinkWeight(ctx.width)) + 1.4 : Math.max(sideStyle.weight, compareLinkWeight(ctx.width)),
      dashArray: status.dashArray || sideStyle.dashArray,
      opacity: dimLink ? 0.18 : status.opacity
    }).addTo(map);
    line.bindTooltip(`${link["Src NE Name"]} ⇄ ${link["Sink NE Name"]}`);
    line.on("click", event => {
      if (window.L && event) L.DomEvent.stop(event);
      ctx.selectedLinkKey = linkKey(link);
      ctx.selectedName = "";
      showCompareLinkDetails(side, link);
      renderCompare();
    });
    ctx.layers.push(line);
  });

  data.nodes.forEach(node => {
    if (!hasCoord(node)) return;
    const name = node["NE Name"];
    const selected = ctx.selectedName === name;
    const highlighted = highlight.names.has(name);
    const dimNode = highlight.active && !highlighted;
    const status = compareNodeStatus(side, node, diff, ctx.showDiff);
    const radius = compareMapNodeRadius(ctx, degreeMap.get(name) || 0, node, selected);
    const marker = L.circleMarker([Number(node.Latitude), Number(node.Longitude)], {
      radius: highlighted ? radius + 2 : radius,
      fillColor: compareNodeFill(ctx, node),
      color: selected ? "#245a6e" : highlighted ? "#c99a3d" : status.color,
      weight: selected ? 3.4 : highlighted ? Math.max(status.weight, 3.4) : status.weight,
      fillOpacity: dimNode ? 0.24 : 0.94,
      opacity: dimNode ? 0.34 : 1
    }).addTo(map);
    marker.bindTooltip(name, { permanent: false, direction: "top", className: "node-tip" });
    marker.on("click", event => {
      if (window.L && event) L.DomEvent.stop(event);
      ctx.selectedName = name;
      ctx.selectedLinkKey = "";
      showCompareNodeDetails(side, node);
      renderCompare();
    });
    ctx.layers.push(marker);
  });
}

function compareNodeStatus(side, node, diff, showDiff) {
  if (!showDiff) return { color: "#ffffff", weight: 2.4 };
  const name = node["NE Name"];
  const onlyLeft = side === "left" && !diff.rightNodes.has(name);
  const onlyRight = side === "right" && !diff.leftNodes.has(name);
  if (onlyLeft) return { color: "#bd3b3b", weight: 4 };
  if (onlyRight) return { color: "#138a65", weight: 4 };
  if (diff.changedNodes.has(name)) return { color: "#c99a3d", weight: 3.6 };
  return { color: "#ffffff", weight: 2.4 };
}

function compareLinkStatus(side, link, diff, showDiff) {
  const base = { color: "", dashArray: "", opacity: 0.86, override: false };
  if (!showDiff) return base;
  const key = linkKey(link);
  if (side === "left" && !diff.rightLinks.has(key)) return { color: "#bd3b3b", dashArray: "8 5", opacity: 0.96, override: true };
  if (side === "right" && !diff.leftLinks.has(key)) return { color: "#138a65", dashArray: "8 5", opacity: 0.96, override: true };
  return base;
}

function compareHighlightInfo(version, data, ctx) {
  const group = normalizeRuleGroup(ctx && ctx.highlightRule);
  const names = new Set();
  const linkKeys = new Set();
  if (!group) return { active: false, names, linkKeys };

  if (group.source === CONDITION_SOURCES.LINKS) {
    data.links.forEach(link => {
      if (!matchesRule(link, group)) return;
      const key = linkKey(link);
      linkKeys.add(key);
      names.add(link["Src NE Name"]);
      names.add(link["Sink NE Name"]);
    });
  } else if (group.source === CONDITION_SOURCES.RING_CHAINS) {
    const ringNames = compareRingChainNamesForRule(version, group);
    data.nodes.forEach(node => {
      const name = node["NE Name"];
      if (ringNames.has(name)) names.add(name);
    });
    data.links.forEach(link => {
      if (names.has(link["Src NE Name"]) && names.has(link["Sink NE Name"])) linkKeys.add(linkKey(link));
    });
  } else {
    data.nodes.forEach(node => {
      if (matchesRule(node, group)) names.add(node["NE Name"]);
    });
    data.links.forEach(link => {
      if (names.has(link["Src NE Name"]) || names.has(link["Sink NE Name"])) linkKeys.add(linkKey(link));
    });
  }

  return { active: names.size > 0 || linkKeys.size > 0, names, linkKeys };
}

function ensureCompareStyleState(ctx) {
  if (ctx.styleReady) return;
  ctx.roleStyles = cloneStyles(state.roleStyles || DEFAULT_ROLE_STYLES);
  ctx.nodeStyleRules = cloneRuleList(state.nodeStyleRules || []);
  ctx.appliedNodeStyleRules = cloneRuleList(state.appliedNodeStyleRules || ctx.nodeStyleRules);
  ctx.linkStyleRules = cloneRuleList(state.linkStyleRules || []);
  ctx.appliedLinkStyleRules = cloneRuleList(state.appliedLinkStyleRules || ctx.linkStyleRules);
  ctx.styleReady = true;
}

function compareResolveNodeStyle(ctx, node) {
  ensureCompareStyleState(ctx);
  const key = roleKey(node);
  const style = { ...(ctx.roleStyles[key] || ctx.roleStyles.OTHER || DEFAULT_NODE_STYLE) };
  ctx.appliedNodeStyleRules.forEach(rule => {
    if (!normalizeRuleGroup(rule) || !matchesRule(node, rule)) return;
    style.color = normalizeColor(rule.color, style.color);
    style.size = clamp(Number(rule.size) || style.size, 4, 40);
    style.shape = normalizeShape(rule.shape, style.shape);
  });
  return style;
}

function compareNodeFill(ctx, node) {
  return compareResolveNodeStyle(ctx, node).color;
}

function compareMapNodeRadius(ctx, degree, node, active) {
  const base = compareResolveNodeStyle(ctx, node).size;
  return clamp(base / 2 + Math.sqrt(degree) * 0.9 + (active ? 1.5 : 0), 4, 22);
}

function compareResolveLinkStyle(ctx, link) {
  ensureCompareStyleState(ctx);
  const style = { ...DEFAULT_LINK_STYLE };
  ctx.appliedLinkStyleRules.forEach(rule => {
    if (!normalizeRuleGroup(rule) || !matchesRule(link, rule)) return;
    style.color = normalizeColor(rule.color, style.color);
    style.lineStyle = LINE_STYLE_VALUES.includes(rule.lineStyle) ? rule.lineStyle : style.lineStyle;
    style.width = LINE_WIDTH_VALUES.includes(rule.width) ? rule.width : style.width;
  });
  return {
    color: style.color,
    weight: linkWeight(style.width),
    dashArray: linkDashArray(style.lineStyle)
  };
}

function compareLinkWeight(width) {
  if (width === "thin") return 1.8;
  if (width === "thick") return 4.4;
  return 2.8;
}

function renderCompareLegend(prefix) {
  el[`${prefix}Legend`].innerHTML = `
    <span><i style="color:#bd3b3b"></i>${escapeHtml(state.lang === "zh" ? "仅左侧存在" : "Left only")}</span>
    <span><i style="color:#138a65"></i>${escapeHtml(state.lang === "zh" ? "仅右侧存在" : "Right only")}</span>
    <span><i style="color:#c99a3d"></i>${escapeHtml(state.lang === "zh" ? "属性可能变化" : "Possible attribute change")}</span>
    <span>${escapeHtml(t("compareDiffLegend"))}</span>
  `;
}

function renderCompareStyleControls(side, version) {
  const ctx = state.compare[side];
  ensureCompareStyleState(ctx);
  const prefix = side === "left" ? "compareLeft" : "compareRight";
  const nodeFields = collectFields(version.nodes || [], REQUIRED_NE);
  const linkFields = collectFields(version.links || [], REQUIRED_LINK);
  const nodeField = firstAvailableField(nodeFields, REQUIRED_NE);
  const linkField = firstAvailableField(linkFields, REQUIRED_LINK);
  const roles = ROLE_ORDER.concat("OTHER");

  el[`${prefix}StyleControls`].innerHTML = `
    <div class="compare-style-group">
      <div class="compare-style-title">${escapeHtml(t("styleTemplate"))}</div>
      <label class="button-like">
        <span>${escapeHtml(t("importStyleTemplate"))}</span>
        <input type="file" accept=".json,application/json" data-import-compare-style-template>
      </label>
      <div class="message" data-compare-style-message></div>
    </div>
    <div class="compare-style-group">
      <div class="compare-style-title">${escapeHtml(t("sectionHighlight"))}</div>
      <div class="rule-condition"><span>${escapeHtml(ruleSummary(ctx.highlightRule))}</span><button type="button" data-edit-compare-highlight>${escapeHtml(t("advancedCondition"))}</button></div>
      <button type="button" data-clear-compare-highlight>${escapeHtml(t("clear"))}</button>
    </div>
    <div class="compare-style-group">
      <div class="compare-style-title">${escapeHtml(t("sectionFilter"))}</div>
      <div class="rule-condition"><span>${escapeHtml(ruleSummary(ctx.filterRule))}</span><button type="button" data-edit-compare-filter>${escapeHtml(t("advancedCondition"))}</button></div>
      <button type="button" data-clear-compare-filter>${escapeHtml(t("clear"))}</button>
    </div>
    <div class="compare-style-group">
      <div class="compare-style-title">${escapeHtml(t("roleStyle"))}</div>
      ${roles.map(role => {
        const style = ctx.roleStyles[role] || DEFAULT_ROLE_STYLES.OTHER;
        return `<div class="compare-role-row" data-compare-role="${escapeAttr(role)}">
          <span>${escapeHtml(role)}</span>
          <input type="color" value="${escapeAttr(normalizeColor(style.color, DEFAULT_NODE_STYLE.color))}" data-compare-role-field="color">
          <input type="number" min="4" max="40" step="1" value="${escapeAttr(style.size || DEFAULT_NODE_STYLE.size)}" data-compare-role-field="size">
          <select data-compare-role-field="shape">${compareShapeOptions(style.shape)}</select>
        </div>`;
      }).join("")}
    </div>
    <div class="compare-style-group">
      <div class="compare-style-title">
        <span>${escapeHtml(t("nodeStyleRules"))}</span>
        <button type="button" data-add-compare-node-rule>${escapeHtml(t("addNodeStyleRule"))}</button>
      </div>
      <div class="compare-rule-list">
        ${ctx.nodeStyleRules.length ? ctx.nodeStyleRules.map((rule, index) => compareNodeRuleMarkup(rule, index, nodeFields, nodeField)).join("") : `<div class="notice">${escapeHtml(t("noNodeStyleRule"))}</div>`}
      </div>
    </div>
    <div class="compare-style-group">
      <div class="compare-style-title">
        <span>${escapeHtml(t("linkStyleRules"))}</span>
        <button type="button" data-add-compare-link-rule>${escapeHtml(t("addLinkStyleRule"))}</button>
      </div>
      <div class="compare-rule-list">
        ${ctx.linkStyleRules.length ? ctx.linkStyleRules.map((rule, index) => compareLinkRuleMarkup(rule, index, linkFields, linkField)).join("") : `<div class="notice">${escapeHtml(t("noLinkStyleRule"))}</div>`}
      </div>
    </div>
  `;
}

function firstAvailableField(fields, required) {
  return fields.find(field => !required.includes(field)) || fields[0] || "";
}

function compareFieldOptions(fields, current) {
  return fields.map(field => `<option value="${escapeAttr(field)}" ${field === current ? "selected" : ""}>${escapeHtml(field)}</option>`).join("");
}

function compareOpOptions(current) {
  return OPS.map(([value, key]) => `<option value="${escapeAttr(value)}" ${value === current ? "selected" : ""}>${escapeHtml(t(key))}</option>`).join("");
}

function compareShapeOptions(current) {
  return SHAPES.map(shape => `<option value="${escapeAttr(shape)}" ${shape === current ? "selected" : ""}>${escapeHtml(shapeLabel(shape))}</option>`).join("");
}

function compareLineStyleOptions(current) {
  return LINE_STYLE_VALUES.map(value => `<option value="${escapeAttr(value)}" ${value === current ? "selected" : ""}>${escapeHtml(t(`line${value[0].toUpperCase()}${value.slice(1)}`))}</option>`).join("");
}

function compareLineWidthOptions(current) {
  return LINE_WIDTH_VALUES.map(value => `<option value="${escapeAttr(value)}" ${value === current ? "selected" : ""}>${escapeHtml(t(`line${value[0].toUpperCase()}${value.slice(1)}`))}</option>`).join("");
}

function compareNodeRuleMarkup(rule, index, fields, fallbackField) {
  const field = rule.field || fallbackField;
  return `<div class="compare-rule-row" data-compare-node-rule="${index}">
    <div class="rule-condition"><span>${escapeHtml(ruleSummary(rule))}</span><button type="button" data-edit-compare-node-rule-condition="${index}">${escapeHtml(t("advancedCondition"))}</button></div>
    <div class="compare-rule-grid">
      <select data-compare-rule-field="field">${compareFieldOptions(fields, field)}</select>
      <select data-compare-rule-field="op">${compareOpOptions(rule.op || "eq")}</select>
    </div>
    <input value="${escapeAttr(rule.value || "")}" data-compare-rule-field="value" placeholder="${escapeAttr(t("conditionValue"))}">
    <div class="compare-rule-visual">
      <input type="color" value="${escapeAttr(normalizeColor(rule.color, DEFAULT_NODE_STYLE.color))}" data-compare-rule-field="color">
      <select data-compare-rule-field="shape">${compareShapeOptions(rule.shape || DEFAULT_NODE_STYLE.shape)}</select>
      <input type="number" min="4" max="40" step="1" value="${escapeAttr(rule.size || DEFAULT_NODE_STYLE.size)}" data-compare-rule-field="size">
    </div>
    <button type="button" data-remove-compare-node-rule="${index}">${escapeHtml(t("removeRule"))}</button>
  </div>`;
}

function compareLinkRuleMarkup(rule, index, fields, fallbackField) {
  const field = rule.field || fallbackField;
  return `<div class="compare-rule-row" data-compare-link-rule="${index}">
    <div class="rule-condition"><span>${escapeHtml(ruleSummary(rule))}</span><button type="button" data-edit-compare-link-rule-condition="${index}">${escapeHtml(t("advancedCondition"))}</button></div>
    <div class="compare-rule-grid">
      <select data-compare-rule-field="field">${compareFieldOptions(fields, field)}</select>
      <select data-compare-rule-field="op">${compareOpOptions(rule.op || "eq")}</select>
    </div>
    <input value="${escapeAttr(rule.value || "")}" data-compare-rule-field="value" placeholder="${escapeAttr(t("conditionValue"))}">
    <div class="compare-rule-visual">
      <input type="color" value="${escapeAttr(normalizeColor(rule.color, DEFAULT_LINK_STYLE.color))}" data-compare-rule-field="color">
      <select data-compare-rule-field="lineStyle">${compareLineStyleOptions(rule.lineStyle || DEFAULT_LINK_STYLE.lineStyle)}</select>
      <select data-compare-rule-field="width">${compareLineWidthOptions(rule.width || DEFAULT_LINK_STYLE.width)}</select>
    </div>
    <button type="button" data-remove-compare-link-rule="${index}">${escapeHtml(t("removeRule"))}</button>
  </div>`;
}

function handleCompareStyleClick(side, event) {
  const ctx = state.compare[side];
  ensureCompareStyleState(ctx);
  const version = versionById(ctx.versionId) || { nodes: [], links: [] };
  const nodeField = firstAvailableField(collectFields(version.nodes || [], REQUIRED_NE), REQUIRED_NE);
  const linkField = firstAvailableField(collectFields(version.links || [], REQUIRED_LINK), REQUIRED_LINK);

  if (event.target.closest("[data-add-compare-node-rule]")) {
    ctx.nodeStyleRules.push({
      source: CONDITION_SOURCES.NODES,
      field: nodeField,
      op: "eq",
      value: "",
      mode: "all",
      conditions: [{ field: nodeField, op: "eq", value: "" }],
      color: DEFAULT_NODE_STYLE.color,
      shape: DEFAULT_NODE_STYLE.shape,
      size: DEFAULT_NODE_STYLE.size
    });
    ctx.appliedNodeStyleRules = cloneRuleList(ctx.nodeStyleRules);
    renderCompare();
    return;
  }

  if (event.target.closest("[data-edit-compare-highlight]")) {
    openConditionModal("compareHighlight", { side });
    return;
  }

  if (event.target.closest("[data-edit-compare-filter]")) {
    openConditionModal("compareFilter", { side });
    return;
  }

  if (event.target.closest("[data-clear-compare-highlight]")) {
    ctx.highlightRule = null;
    renderCompare();
    return;
  }

  if (event.target.closest("[data-clear-compare-filter]")) {
    ctx.filterRule = null;
    renderCompare();
    return;
  }

  if (event.target.closest("[data-add-compare-link-rule]")) {
    ctx.linkStyleRules.push({
      source: CONDITION_SOURCES.LINKS,
      field: linkField,
      op: "eq",
      value: "",
      mode: "all",
      conditions: [{ field: linkField, op: "eq", value: "" }],
      color: DEFAULT_LINK_STYLE.color,
      lineStyle: DEFAULT_LINK_STYLE.lineStyle,
      width: DEFAULT_LINK_STYLE.width
    });
    ctx.appliedLinkStyleRules = cloneRuleList(ctx.linkStyleRules);
    renderCompare();
    return;
  }

  const removeNode = event.target.closest("[data-remove-compare-node-rule]");
  if (removeNode) {
    ctx.nodeStyleRules.splice(Number(removeNode.getAttribute("data-remove-compare-node-rule")), 1);
    ctx.appliedNodeStyleRules = cloneRuleList(ctx.nodeStyleRules);
    renderCompare();
    return;
  }

  const editNode = event.target.closest("[data-edit-compare-node-rule-condition]");
  if (editNode) {
    openConditionModal("compareNodeStyle", {
      side,
      index: Number(editNode.getAttribute("data-edit-compare-node-rule-condition"))
    });
    return;
  }

  const editLink = event.target.closest("[data-edit-compare-link-rule-condition]");
  if (editLink) {
    openConditionModal("compareLinkStyle", {
      side,
      index: Number(editLink.getAttribute("data-edit-compare-link-rule-condition"))
    });
    return;
  }

  const removeLink = event.target.closest("[data-remove-compare-link-rule]");
  if (removeLink) {
    ctx.linkStyleRules.splice(Number(removeLink.getAttribute("data-remove-compare-link-rule")), 1);
    ctx.appliedLinkStyleRules = cloneRuleList(ctx.linkStyleRules);
    renderCompare();
  }
}

function updateCompareStyleFromControl(side, event) {
  const ctx = state.compare[side];
  ensureCompareStyleState(ctx);
  const target = event.target;
  if (target.matches("[data-import-compare-style-template]")) {
    importCompareStyleTemplateFromFile(side, event);
    return;
  }
  const roleRow = target.closest("[data-compare-role]");
  if (roleRow && target.dataset.compareRoleField) {
    const role = roleRow.getAttribute("data-compare-role");
    const field = target.dataset.compareRoleField;
    const style = ctx.roleStyles[role] || (ctx.roleStyles[role] = { ...DEFAULT_NODE_STYLE });
    if (field === "color") style.color = normalizeColor(target.value, style.color);
    if (field === "size") style.size = clamp(Number(target.value) || style.size, 4, 40);
    if (field === "shape") style.shape = normalizeShape(target.value, style.shape);
    renderCompare();
    return;
  }

  const nodeRow = target.closest("[data-compare-node-rule]");
  if (nodeRow && target.dataset.compareRuleField) {
    updateCompareRule(ctx.nodeStyleRules[Number(nodeRow.getAttribute("data-compare-node-rule"))], target);
    ctx.appliedNodeStyleRules = cloneRuleList(ctx.nodeStyleRules);
    renderCompare();
    return;
  }

  const linkRow = target.closest("[data-compare-link-rule]");
  if (linkRow && target.dataset.compareRuleField) {
    updateCompareRule(ctx.linkStyleRules[Number(linkRow.getAttribute("data-compare-link-rule"))], target);
    ctx.appliedLinkStyleRules = cloneRuleList(ctx.linkStyleRules);
    renderCompare();
  }
}

function updateCompareRule(rule, target) {
  if (!rule) return;
  const field = target.dataset.compareRuleField;
  if (field === "color") rule.color = normalizeColor(target.value, rule.color || DEFAULT_NODE_STYLE.color);
  else if (field === "size") rule.size = clamp(Number(target.value) || rule.size || DEFAULT_NODE_STYLE.size, 4, 40);
  else if (field === "shape") rule.shape = normalizeShape(target.value, rule.shape || DEFAULT_NODE_STYLE.shape);
  else if (field === "lineStyle") rule.lineStyle = LINE_STYLE_VALUES.includes(target.value) ? target.value : DEFAULT_LINK_STYLE.lineStyle;
  else if (field === "width") rule.width = LINE_WIDTH_VALUES.includes(target.value) ? target.value : DEFAULT_LINK_STYLE.width;
  else rule[field] = target.value;
  rule.source = rule.lineStyle || rule.width ? CONDITION_SOURCES.LINKS : CONDITION_SOURCES.NODES;
  rule.mode = "all";
  rule.conditions = [{ field: rule.field, op: rule.op, value: rule.value }];
}

function importCompareStyleTemplateFromFile(side, event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const template = JSON.parse(String(reader.result || ""));
      importCompareStyleTemplate(side, template);
    } catch (error) {
      setCompareStyleMessage(side, t("styleTemplateInvalid"), "error");
    } finally {
      event.target.value = "";
    }
  };
  reader.onerror = () => {
    setCompareStyleMessage(side, t("styleTemplateReadFail"), "error");
    event.target.value = "";
  };
  reader.readAsText(file, "utf-8");
}

function importCompareStyleTemplate(side, template) {
  const ctx = state.compare[side];
  ensureCompareStyleState(ctx);
  if (!template || template.schema !== STYLE_TEMPLATE_SCHEMA || !template.styles || typeof template.styles !== "object") {
    setCompareStyleMessage(side, t("styleTemplateInvalid"), "error");
    return;
  }
  if (Number(template.version) > STYLE_TEMPLATE_VERSION) {
    setCompareStyleMessage(side, t("styleTemplateUnsupported"), "error");
    return;
  }

  const version = versionById(ctx.versionId) || { nodes: [], links: [] };
  const report = { adjusted: 0, skipped: 0 };
  const styles = template.styles;
  ctx.roleStyles = sanitizeRoleStyles(styles.roleStyles);
  ctx.nodeStyleRules = sanitizeCompareStyleRuleList(styles.nodeStyleRules, "node", version, report);
  ctx.appliedNodeStyleRules = cloneRuleList(ctx.nodeStyleRules);
  ctx.linkStyleRules = sanitizeCompareStyleRuleList(styles.linkStyleRules, "link", version, report);
  ctx.appliedLinkStyleRules = cloneRuleList(ctx.linkStyleRules);
  renderCompare();
  setCompareStyleMessage(
    side,
    report.adjusted || report.skipped
      ? t("styleTemplateImportedWithAdjustments", { adjusted: report.adjusted, skipped: report.skipped })
      : t("styleTemplateImported"),
    report.skipped ? "warning" : "ok"
  );
}

function sanitizeCompareStyleRuleList(rules, type, version, report) {
  if (!Array.isArray(rules)) return [];
  return rules
    .map(rule => sanitizeCompareStyleRule(rule, type, version, report))
    .filter(Boolean);
}

function sanitizeCompareStyleRule(rule, type, version, report) {
  if (!rule || typeof rule !== "object") {
    report.skipped += 1;
    return null;
  }
  const fields = type === "link"
    ? collectFields(version.links || [], REQUIRED_LINK)
    : collectFields(version.nodes || [], REQUIRED_NE);
  const source = type === "link" ? CONDITION_SOURCES.LINKS : CONDITION_SOURCES.NODES;
  const available = new Set(fields);
  const fallback = firstAvailableField(fields, type === "link" ? REQUIRED_LINK : REQUIRED_NE);
  const group = normalizeRuleGroup({ ...rule, source });
  if (!group || !fallback) {
    report.skipped += 1;
    return null;
  }
  const sanitizedConditions = group.conditions.map(condition => {
    if (!available.has(condition.field)) {
      report.adjusted += 1;
      return { field: fallback, op: normalizeOp(condition.op), value: "" };
    }
    return { field: condition.field, op: normalizeOp(condition.op), value: String(condition.value || "") };
  });
  const first = sanitizedConditions[0];
  if (type === "node") {
    return {
      source,
      mode: group.mode,
      conditions: sanitizedConditions,
      field: first.field,
      op: first.op,
      value: first.value,
      color: normalizeColor(rule.color, DEFAULT_NODE_STYLE.color),
      size: clamp(Number(rule.size) || DEFAULT_NODE_STYLE.size, 4, 40),
      shape: normalizeShape(rule.shape, DEFAULT_NODE_STYLE.shape),
      label: String(rule.label || "")
    };
  }
  return {
    source,
    mode: group.mode,
    conditions: sanitizedConditions,
    field: first.field,
    op: first.op,
    value: first.value,
    color: normalizeColor(rule.color, DEFAULT_LINK_STYLE.color),
    lineStyle: LINE_STYLE_VALUES.includes(rule.lineStyle) ? rule.lineStyle : DEFAULT_LINK_STYLE.lineStyle,
    width: LINE_WIDTH_VALUES.includes(rule.width) ? rule.width : DEFAULT_LINK_STYLE.width
  };
}

function setCompareStyleMessage(side, text, type) {
  const prefix = side === "left" ? "compareLeft" : "compareRight";
  const host = el[`${prefix}StyleControls`];
  const target = host && host.querySelector("[data-compare-style-message]");
  if (!target) return;
  setMessage(target, text, type);
}

function fitCompareMaps() {
  ["left", "right"].forEach(side => {
    const ctx = state.compare[side];
    const version = versionById(ctx.versionId);
    if (!ctx.map || !version) return;
    const data = getCompareVisibleData(version, state.compare.criteria, ctx);
    const points = data.nodes.filter(hasCoord).map(node => [Number(node.Latitude), Number(node.Longitude)]);
    if (points.length === 1) ctx.map.setView(points[0], 13);
    else if (points.length > 1) ctx.map.fitBounds(points, { padding: [36, 36] });
  });
}

function focusCompareRuleResult(side, kind) {
  const ctx = state.compare[side];
  const version = ctx && versionById(ctx.versionId);
  if (!ctx || !ctx.map || !version) return;

  const data = getCompareVisibleData(version, state.compare.criteria, ctx);
  const nodes = kind === "filter"
    ? data.nodes
    : compareNodesForHighlight(version, data, ctx);
  focusLeafletMapOnNodes(ctx.map, nodes, { padding: [58, 58], maxZoom: 14 });
}

function compareNodesForHighlight(version, data, ctx) {
  const highlight = compareHighlightInfo(version, data, ctx);
  if (!highlight.active) return [];
  const names = new Set(highlight.names);
  data.links.forEach(link => {
    if (!highlight.linkKeys.has(linkKey(link))) return;
    names.add(link["Src NE Name"]);
    names.add(link["Sink NE Name"]);
  });
  return [...names].map(name => data.nodeByName.get(name)).filter(Boolean);
}

function showCompareNodeDetails(side, node) {
  const target = side === "left" ? el.compareLeftDetails : el.compareRightDetails;
  const fields = collectFields([node], REQUIRED_NE);
  target.innerHTML = `<h3>${escapeHtml(node["NE Name"] || t("unnamedDevice"))}</h3><div class="kv">${
    fields.map(field => `<div>${escapeHtml(field)}</div><div>${escapeHtml(node[field] ?? "")}</div>`).join("")
  }</div>`;
  target.classList.add("show");
}

function showCompareLinkDetails(side, link) {
  const target = side === "left" ? el.compareLeftDetails : el.compareRightDetails;
  const fields = collectFields([link], REQUIRED_LINK);
  target.innerHTML = `<h3>${escapeHtml(link["Src NE Name"] || "")} ⇄ ${escapeHtml(link["Sink NE Name"] || "")}</h3><div class="kv">${
    fields.map(field => `<div>${escapeHtml(field)}</div><div>${escapeHtml(link[field] ?? "")}</div>`).join("")
  }</div>`;
  target.classList.add("show");
}

function setCompareMessage(text, type) {
  if (!el.compareMessage) return;
  el.compareMessage.textContent = text || "";
  el.compareMessage.classList.remove("error", "ok", "warning");
  if (type) el.compareMessage.classList.add(type);
}

function updateCompareSuggestions() {
  if (!el.compareNodeSuggestions) return;
  const names = new Set();
  state.versions.forEach(version => {
    (version.nodes || []).slice(0, 2000).forEach(node => {
      if (node["NE Name"]) names.add(node["NE Name"]);
    });
  });
  el.compareNodeSuggestions.innerHTML = [...names].slice(0, 400).map(name => `<option value="${escapeAttr(name)}"></option>`).join("");
}

function switchLanguage(lang) {
  state.lang = lang;
  el.langZhBtn.classList.toggle("active", lang === "zh");
  el.langEnBtn.classList.toggle("active", lang === "en");
  fillOperatorOptions();
  applyLanguage();
  renderTopologies();
  if (state.compare.active) renderCompare();
  updateTable();
}

function applyLanguage() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = t("appTitle");
  document.querySelectorAll("[data-i18n]").forEach(node => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
    node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder")));
  });
  refreshShapeOptionLabels();
  refreshRoutePathStyleControls();
  renderRoleStyleEditor();
  renderNodeStyleRules();
  renderLinkStyleRules();
  renderRingChainStyleRules();
  renderVersionControls();
  renderFileSources();
  updateRuleSummaries();
  if (!el.conditionModal.classList.contains("hidden")) renderConditionModal();
}

function t(key, params = {}) {
  let value = (I18N[state.lang] && I18N[state.lang][key]) || I18N.zh[key] || key;
  Object.keys(params).forEach(name => {
    value = value.replaceAll(`{${name}}`, params[name]);
  });
  return value;
}

function updateProjectNameFromControl() {
  state.projectName = el.projectNameInput.value.trim();
  const version = activeDataVersion();
  if (version) {
    version.name = state.projectName || t("untitledVersion");
    version.nameTouched = true;
    version.updatedAt = new Date().toISOString();
    persistActiveVersionState();
    renderVersionControls();
  }
}

function setDefaultProjectName(date = new Date(), options = {}) {
  const { force = true } = options;
  const version = activeDataVersion();
  if (version && version.nameTouched && !force) {
    state.projectName = version.name;
    if (el.projectNameInput) el.projectNameInput.value = state.projectName;
    return;
  }
  state.projectName = formatProjectTimestamp(date);
  if (el.projectNameInput) el.projectNameInput.value = state.projectName;
  if (version) {
    version.name = state.projectName;
    version.nameTouched = false;
    version.updatedAt = date.toISOString();
    renderVersionControls();
  }
}

function formatProjectTimestamp(date = new Date()) {
  const pad = value => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("-");
}

function initDataVersions() {
  if (state.versions.length) return;
  const version = createEmptyDataVersion(formatProjectTimestamp());
  state.versions.push(version);
  state.activeVersionId = version.id;
  loadVersionIntoState(version);
  renderVersionControls();
}

function createEmptyDataVersion(name = formatProjectTimestamp()) {
  return {
    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    nameTouched: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [],
    links: [],
    ringChains: [],
    sourceFiles: emptySourceFiles(),
    viewState: emptyVersionViewState()
  };
}

function emptySourceFiles() {
  return { device: null, link: null, ringChain: null };
}

function emptyVersionViewState() {
  return {
    highlightRule: null,
    filterRule: null,
    locateRule: null,
    locatedNames: [],
    locatedLinkKeys: [],
    bulkQuery: null
  };
}

function activeDataVersion() {
  return state.versions.find(version => version.id === state.activeVersionId) || null;
}

function createAndSwitchDataVersion() {
  persistActiveVersionState();
  const version = createEmptyDataVersion(formatProjectTimestamp());
  state.versions.push(version);
  state.activeVersionId = version.id;
  loadVersionIntoState(version);
  clearFileInputs();
  renderVersionControls();
  refreshAll();
  setMessage(el.uploadMessage, t("versionCreated", { name: version.name }), "ok");
}

function switchDataVersion(id) {
  if (!id || id === state.activeVersionId) return;
  const target = state.versions.find(version => version.id === id);
  if (!target) return;
  persistActiveVersionState();
  state.activeVersionId = id;
  loadVersionIntoState(target);
  clearFileInputs();
  renderVersionControls();
  refreshAll();
  fitCurrentView();
  setMessage(el.uploadMessage, t("versionSwitched", { name: target.name || t("untitledVersion") }), "ok");
}

function deleteActiveDataVersion() {
  const current = activeDataVersion();
  if (!current) return;
  const deletedName = current.name || t("untitledVersion");
  if (state.versions.length <= 1) {
    const replacement = createEmptyDataVersion(formatProjectTimestamp());
    replacement.id = current.id;
    replacement.createdAt = current.createdAt;
    state.versions = [replacement];
    state.activeVersionId = replacement.id;
    loadVersionIntoState(replacement);
  } else {
    const index = state.versions.findIndex(version => version.id === current.id);
    state.versions.splice(index, 1);
    const next = state.versions[Math.max(0, index - 1)] || state.versions[0];
    state.activeVersionId = next.id;
    loadVersionIntoState(next);
  }
  clearFileInputs();
  renderVersionControls();
  refreshAll();
  fitCurrentView();
  setMessage(el.uploadMessage, t("versionDeleted", { name: deletedName }), "ok");
}

function persistActiveVersionState() {
  const version = activeDataVersion();
  if (!version) return;
  version.name = state.projectName || version.name || t("untitledVersion");
  version.nodes = cloneRows(state.nodes);
  version.links = cloneRows(state.links);
  version.ringChains = cloneRows(state.ringChains);
  version.sourceFiles = cloneSourceFiles(version.sourceFiles || emptySourceFiles());
  version.viewState = {
    highlightRule: cloneRuleGroup(state.highlightRule),
    filterRule: cloneRuleGroup(state.filterRule),
    locateRule: cloneRuleGroup(state.locateRule),
    locatedNames: [...state.locatedNames],
    locatedLinkKeys: [...state.locatedLinkKeys],
    bulkQuery: cloneBulkQuery(state.bulkQuery)
  };
  version.updatedAt = new Date().toISOString();
}

function loadVersionIntoState(version) {
  state.projectName = version.name || t("untitledVersion");
  if (el.projectNameInput) el.projectNameInput.value = state.projectName;
  state.nodes = cloneRows(version.nodes);
  state.links = cloneRows(version.links);
  state.ringChains = cloneRows(version.ringChains);
  version.sourceFiles = cloneSourceFiles(version.sourceFiles || emptySourceFiles());
  state.nodeFields = collectFields(state.nodes, REQUIRED_NE);
  state.linkFields = collectFields(state.links, REQUIRED_LINK);
  state.ringChainFields = collectFields(state.ringChains, REQUIRED_RING_CHAIN);
  rebuildIndexes();
  restoreVersionViewState(version.viewState || emptyVersionViewState());
  if (el.bulkQueryInput) el.bulkQueryInput.value = state.bulkQuery ? state.bulkQuery.raw || "" : "";
  resetTransientSelection();
  state.logic.positions = new Map();
  state.logic.layoutKey = "";
  clearRingChainStyleCache();
  renderFileSources();
}

function restoreVersionViewState(viewState) {
  state.highlightRule = cloneRuleGroup(viewState.highlightRule);
  state.filterRule = cloneRuleGroup(viewState.filterRule);
  state.locateRule = cloneRuleGroup(viewState.locateRule);
  state.locatedNames = new Set(viewState.locatedNames || []);
  state.locatedLinkKeys = new Set(viewState.locatedLinkKeys || []);
  state.bulkQuery = cloneBulkQuery(viewState.bulkQuery);
}

function resetTransientSelection() {
  state.selectedName = "";
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  state.selectedCoordinateKey = "";
  state.routeHitEntries = [];
  if (el.details) el.details.classList.remove("show");
}

function cloneRows(rows) {
  return (rows || []).map(row => ({ ...row }));
}

function cloneSourceFiles(sourceFiles) {
  return {
    device: sourceFiles && sourceFiles.device ? { ...sourceFiles.device } : null,
    link: sourceFiles && sourceFiles.link ? { ...sourceFiles.link } : null,
    ringChain: sourceFiles && sourceFiles.ringChain ? { ...sourceFiles.ringChain } : null
  };
}

function cloneBulkQuery(query) {
  if (!query) return null;
  return {
    raw: query.raw || "",
    tokens: [...(query.tokens || [])],
    matchNames: new Set([...(query.matchNames || [])]),
    matchLinks: new Set([...(query.matchLinks || [])])
  };
}

function renderVersionControls() {
  if (!el.projectVersionSelect) return;
  el.projectVersionSelect.innerHTML = state.versions.map(version => {
    const label = `${version.name || t("untitledVersion")} · ${version.nodes.length}/${version.links.length}`;
    return `<option value="${escapeAttr(version.id)}">${escapeHtml(label)}</option>`;
  }).join("");
  el.projectVersionSelect.value = state.activeVersionId;
  if (el.deleteVersionBtn) el.deleteVersionBtn.disabled = !state.versions.length;
  renderCompareVersionControls();
}

function updateSourceFileFromInput(type, input) {
  const version = activeDataVersion();
  if (!version || !input) return;
  version.sourceFiles = cloneSourceFiles(version.sourceFiles || emptySourceFiles());
  version.sourceFiles[type] = sourceFileFromInput(input);
  version.updatedAt = new Date().toISOString();
  renderFileSources();
  renderVersionControls();
}

function syncSourceFilesFromInputs() {
  const version = activeDataVersion();
  if (!version) return;
  version.sourceFiles = cloneSourceFiles(version.sourceFiles || emptySourceFiles());
  const device = sourceFileFromInput(el.neFile);
  const link = sourceFileFromInput(el.linkFile);
  const ringChain = sourceFileFromInput(el.ringChainFile);
  if (device) version.sourceFiles.device = device;
  if (link) version.sourceFiles.link = link;
  version.sourceFiles.ringChain = ringChain || null;
  renderFileSources();
}

function sourceFileFromInput(input) {
  const file = input.files && input.files[0];
  if (!file) return null;
  const rawPath = input.value || file.webkitRelativePath || file.name;
  const fakePath = /^C:\\fakepath\\/i.test(rawPath);
  const pathValue = fakePath ? file.name : rawPath;
  return {
    name: file.name,
    path: pathValue,
    fullPathAvailable: !fakePath && pathValue !== file.name,
    size: file.size || 0,
    lastModified: file.lastModified || 0,
    updatedAt: new Date().toISOString()
  };
}

function mockSourceFile(label) {
  return {
    name: label,
    path: t("mockDataSource"),
    fullPathAvailable: true,
    size: 0,
    lastModified: 0,
    updatedAt: new Date().toISOString(),
    mock: true
  };
}

function renderFileSources() {
  const version = activeDataVersion();
  const sourceFiles = version && version.sourceFiles || emptySourceFiles();
  renderFileSource(el.neFileSource, sourceFiles.device);
  renderFileSource(el.linkFileSource, sourceFiles.link);
  renderFileSource(el.ringChainFileSource, sourceFiles.ringChain);
}

function renderFileSource(node, source) {
  if (!node) return;
  if (!source) {
    node.textContent = t("noFileSelected");
    node.title = t("noFileSelected");
    node.classList.remove("has-file");
    return;
  }
  const text = source.path || source.name || t("noFileSelected");
  node.textContent = text;
  node.title = source.fullPathAvailable || source.mock
    ? text
    : `${source.name || text}\n${t("filePathUnavailable")}`;
  node.classList.add("has-file");
}

function clearFileInputs() {
  ["neFile", "linkFile", "ringChainFile"].forEach(id => {
    if (el[id]) el[id].value = "";
  });
}

function loadSearchHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "{}");
    state.searchHistory.locate = sanitizeHistory(parsed.locate);
    state.searchHistory.highlight = sanitizeHistory(parsed.highlight);
    state.searchHistory.filter = sanitizeHistory(parsed.filter);
  } catch (error) {
    state.searchHistory = { locate: [], highlight: [], filter: [] };
  }
  try {
    state.conditionHistory = sanitizeConditionHistory(JSON.parse(localStorage.getItem(CONDITION_HISTORY_KEY) || "[]"));
  } catch (error) {
    state.conditionHistory = [];
  }
}

function saveSearchHistory() {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(state.searchHistory));
  } catch (error) {
    // localStorage may be disabled in strict browser privacy modes.
  }
}

function sanitizeHistory(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];
  items.forEach(item => {
    const value = String(item || "").trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });
  return result.slice(0, SEARCH_HISTORY_LIMIT);
}

function rememberSearchHistory(type, value) {
  const text = String(value || "").trim();
  if (!text || !state.searchHistory[type]) return;

  const next = [text, ...state.searchHistory[type].filter(item => item.toLowerCase() !== text.toLowerCase())];
  state.searchHistory[type] = next.slice(0, SEARCH_HISTORY_LIMIT);
  saveSearchHistory();
  updateSearchHistoryOptions();
}

function saveConditionHistory() {
  try {
    localStorage.setItem(CONDITION_HISTORY_KEY, JSON.stringify(state.conditionHistory));
  } catch (error) {
    // localStorage may be disabled in strict browser privacy modes.
  }
}

function sanitizeConditionHistory(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];
  items.forEach(item => {
    const group = normalizeRuleGroup(item && item.rule);
    const type = item && item.type ? String(item.type) : "condition";
    if (!group) return;
    const key = `${type}:${JSON.stringify(group)}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ type, rule: group, label: item.label || ruleSummary(group) });
  });
  return result.slice(0, CONDITION_HISTORY_LIMIT);
}

function rememberConditionHistory(type, rule) {
  const group = normalizeRuleGroup(rule);
  if (!group) return;
  state.conditionHistory = sanitizeConditionHistory([
    { type, rule: group, label: ruleSummary(group) },
    ...state.conditionHistory
  ]);
  saveConditionHistory();
}

function updateSearchHistoryOptions() {
  updateConditionValueSuggestions("highlight");
  updateConditionValueSuggestions("filter");
  updateSuggestions();
}

function updateConditionValueSuggestions(type) {
  const datalist = type === "highlight" ? el.highlightHistory : el.filterHistory;
  const fieldSelect = type === "highlight" ? el.highlightField : el.filterField;
  if (!datalist || !fieldSelect) return;

  const values = mergeSuggestionValues(collectValueOptions(state.nodes, fieldSelect.value), state.searchHistory[type] || []);
  datalist.innerHTML = values.map(value => `<option value="${escapeAttr(value)}"></option>`).join("");
}

function mergeSuggestionValues(primary, secondary, limit = 160) {
  const seen = new Set();
  const values = [];
  [...primary, ...secondary].forEach(value => {
    const text = String(value || "").trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);
    values.push(text);
  });
  return values.slice(0, limit);
}

function bindSearchHistoryInput(input, type) {
  if (!input) return;

  const openIfEmpty = () => {
    if (!input.value.trim()) showSearchHistoryMenu(input, type);
  };
  input.addEventListener("focus", openIfEmpty);
  input.addEventListener("click", openIfEmpty);
  input.addEventListener("input", () => {
    if (input.value.trim()) hideSearchHistoryMenu();
    else showSearchHistoryMenu(input, type);
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Escape") hideSearchHistoryMenu();
  });
}

function showSearchHistoryMenu(input, type) {
  const items = getInputSuggestionValues(type);
  if (!items.length) {
    hideSearchHistoryMenu();
    return;
  }

  if (!state.searchHistoryMenu) {
    state.searchHistoryMenu = document.createElement("div");
    state.searchHistoryMenu.className = "history-menu";
    document.body.appendChild(state.searchHistoryMenu);
  }

  const rect = input.getBoundingClientRect();
  state.searchHistoryMenu.style.left = `${rect.left}px`;
  state.searchHistoryMenu.style.top = `${rect.bottom + 4}px`;
  state.searchHistoryMenu.style.width = `${rect.width}px`;
  state.searchHistoryMenu.innerHTML = items
    .map(value => `<button type="button" data-history-value="${escapeAttr(value)}">${escapeHtml(value)}</button>`)
    .join("");
  state.searchHistoryMenu.querySelectorAll("[data-history-value]").forEach(button => {
    button.addEventListener("mousedown", event => {
      event.preventDefault();
      input.value = button.getAttribute("data-history-value");
      input.focus();
      hideSearchHistoryMenu();
    });
  });
  state.searchHistoryMenu.classList.add("show");
}

function getInputSuggestionValues(type) {
  if (type === "highlight") return mergeSuggestionValues(collectValueOptions(state.nodes, el.highlightField.value), state.searchHistory.highlight);
  if (type === "filter") return mergeSuggestionValues(collectValueOptions(state.nodes, el.filterField.value), state.searchHistory.filter);
  return state.searchHistory[type] || [];
}

function hideSearchHistoryMenu() {
  if (state.searchHistoryMenu) state.searchHistoryMenu.classList.remove("show");
}

function initStyleControls() {
  if (!el.roleStyleEditor || !el.nodeStyleRuleList) return;

  renderRoleStyleEditor();

  el.routePathVisibleInput.checked = state.routePathStyle.visible;
  el.routePathColorInput.value = state.routePathStyle.color;
  el.routePathWidthSelect.innerHTML = lineWidthOptions(state.routePathStyle.width);
  el.routePathLineStyleSelect.innerHTML = lineStyleOptions(state.routePathStyle.lineStyle);
  el.routePathOpacityInput.value = state.routePathStyle.opacity;

  [el.routePathVisibleInput, el.routePathColorInput, el.routePathWidthSelect, el.routePathLineStyleSelect, el.routePathOpacityInput].forEach(input => {
    input.addEventListener("input", updateRoutePathStyleFromControls);
    input.addEventListener("change", updateRoutePathStyleFromControls);
  });
  el.roleStyleEditor.addEventListener("input", updateRoleStyleFromControl);
  el.roleStyleEditor.addEventListener("change", updateRoleStyleFromControl);
  el.addNodeStyleRuleBtn.addEventListener("click", addNodeStyleRule);
  el.applyNodeStyleRulesBtn.addEventListener("click", applyNodeStyleRules);
  el.nodeStyleRuleList.addEventListener("input", updateNodeStyleRuleFromControl);
  el.nodeStyleRuleList.addEventListener("change", updateNodeStyleRuleFromControl);
  el.nodeStyleRuleList.addEventListener("click", removeNodeStyleRule);
  el.addLinkStyleRuleBtn.addEventListener("click", addLinkStyleRule);
  el.applyLinkStyleRulesBtn.addEventListener("click", applyLinkStyleRules);
  el.linkStyleRuleList.addEventListener("input", updateLinkStyleRuleFromControl);
  el.linkStyleRuleList.addEventListener("change", updateLinkStyleRuleFromControl);
  el.linkStyleRuleList.addEventListener("click", removeLinkStyleRule);
  el.addRingChainStyleRuleBtn.addEventListener("click", addRingChainStyleRule);
  el.applyRingChainStyleRulesBtn.addEventListener("click", applyRingChainStyleRules);
  el.ringChainStyleRuleList.addEventListener("input", updateRingChainStyleRuleFromControl);
  el.ringChainStyleRuleList.addEventListener("change", updateRingChainStyleRuleFromControl);
  el.ringChainStyleRuleList.addEventListener("click", removeRingChainStyleRule);
  el.highlightContrastInput.value = state.highlightContrast;
  el.highlightContrastInput.addEventListener("input", updateHighlightContrastFromControl);
  el.highlightContrastInput.addEventListener("change", updateHighlightContrastFromControl);
  el.exportStyleTemplateBtn.addEventListener("click", exportStyleTemplate);
  el.styleTemplateFile.addEventListener("change", importStyleTemplateFromFile);
  el.resetStyleBtn.addEventListener("click", resetStyleControls);
  updateNodeLegend();
  renderNodeStyleRules();
  renderLinkStyleRules();
}

function fillShapeOptions(select) {
  select.innerHTML = SHAPES.map(shape => `<option value="${shape}" data-shape-label="${shape}">${shapeLabel(shape)}</option>`).join("");
}

function refreshShapeOptionLabels() {
  document.querySelectorAll("[data-shape-label]").forEach(option => {
    option.textContent = shapeLabel(option.getAttribute("data-shape-label"));
  });
}

function refreshRoutePathStyleControls() {
  if (!el.routePathWidthSelect || !el.routePathLineStyleSelect) return;
  const width = el.routePathWidthSelect.value || state.routePathStyle.width;
  const lineStyle = el.routePathLineStyleSelect.value || state.routePathStyle.lineStyle;
  el.routePathWidthSelect.innerHTML = lineWidthOptions(width);
  el.routePathLineStyleSelect.innerHTML = lineStyleOptions(lineStyle);
}

function shapeLabel(shape) {
  const key = `shape${shape.charAt(0).toUpperCase()}${shape.slice(1)}`;
  return t(key);
}

function updateRoutePathStyleFromControls() {
  state.routePathStyle = {
    visible: el.routePathVisibleInput.checked,
    color: normalizeColor(el.routePathColorInput.value, DEFAULT_ROUTE_PATH_STYLE.color),
    width: LINE_WIDTH_VALUES.includes(el.routePathWidthSelect.value) ? el.routePathWidthSelect.value : DEFAULT_ROUTE_PATH_STYLE.width,
    lineStyle: LINE_STYLE_VALUES.includes(el.routePathLineStyleSelect.value) ? el.routePathLineStyleSelect.value : DEFAULT_ROUTE_PATH_STYLE.lineStyle,
    opacity: clamp(Number(el.routePathOpacityInput.value) || DEFAULT_ROUTE_PATH_STYLE.opacity, 0.1, 1)
  };
  renderTopologies();
}

function updateHighlightContrastFromControl() {
  const value = Number(el.highlightContrastInput.value);
  state.highlightContrast = clamp(Number.isFinite(value) ? value : DEFAULT_HIGHLIGHT_CONTRAST, 0, 1);
  renderTopologies();
}

function exportStyleTemplate() {
  const template = {
    schema: STYLE_TEMPLATE_SCHEMA,
    version: STYLE_TEMPLATE_VERSION,
    exportedAt: new Date().toISOString(),
    projectName: state.projectName || "",
    styles: {
      roleStyles: cloneStyles(state.roleStyles),
      nodeStyleRules: cloneRuleList(state.nodeStyleRules),
      appliedNodeStyleRules: cloneRuleList(state.appliedNodeStyleRules),
      linkStyleRules: cloneRuleList(state.linkStyleRules),
      appliedLinkStyleRules: cloneRuleList(state.appliedLinkStyleRules),
      ringChainStyleRules: cloneRuleList(state.ringChainStyleRules),
      appliedRingChainStyleRules: cloneRuleList(state.appliedRingChainStyleRules),
      routePathStyle: { ...state.routePathStyle }
    }
  };
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(state.projectName || "topo")}-style-template.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setMessage(el.styleTemplateMessage, t("styleTemplateExported"), "ok");
}

function importStyleTemplateFromFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const template = JSON.parse(String(reader.result || ""));
      importStyleTemplate(template);
    } catch (error) {
      setMessage(el.styleTemplateMessage, t("styleTemplateInvalid"), "error");
    } finally {
      event.target.value = "";
    }
  };
  reader.onerror = () => {
    setMessage(el.styleTemplateMessage, t("styleTemplateReadFail"), "error");
    event.target.value = "";
  };
  reader.readAsText(file, "utf-8");
}

function importStyleTemplate(template) {
  if (!template || template.schema !== STYLE_TEMPLATE_SCHEMA || !template.styles || typeof template.styles !== "object") {
    setMessage(el.styleTemplateMessage, t("styleTemplateInvalid"), "error");
    return;
  }
  if (Number(template.version) > STYLE_TEMPLATE_VERSION) {
    setMessage(el.styleTemplateMessage, t("styleTemplateUnsupported"), "error");
    return;
  }

  const report = { adjusted: 0, skipped: 0 };
  const styles = template.styles;
  state.roleStyles = sanitizeRoleStyles(styles.roleStyles);
  state.nodeStyleRules = sanitizeStyleRuleList(styles.nodeStyleRules, "node", report);
  state.appliedNodeStyleRules = cloneRuleList(state.nodeStyleRules);
  state.linkStyleRules = sanitizeStyleRuleList(styles.linkStyleRules, "link", report);
  state.appliedLinkStyleRules = cloneRuleList(state.linkStyleRules);
  state.ringChainStyleRules = sanitizeStyleRuleList(styles.ringChainStyleRules, "ringChain", report);
  state.appliedRingChainStyleRules = cloneRuleList(state.ringChainStyleRules);
  state.routePathStyle = sanitizeRoutePathStyle(styles.routePathStyle);

  pruneNodeStyleRules();
  pruneLinkStyleRules();
  pruneRingChainStyleRules();
  clearRingChainStyleCache();
  syncStyleControlsFromState();
  setMessage(
    el.styleTemplateMessage,
    report.adjusted || report.skipped
      ? t("styleTemplateImportedWithAdjustments", { adjusted: report.adjusted, skipped: report.skipped })
      : t("styleTemplateImported"),
    report.skipped ? "warning" : "ok"
  );
  renderTopologies();
}

function syncStyleControlsFromState() {
  el.routePathVisibleInput.checked = Boolean(state.routePathStyle.visible);
  el.routePathColorInput.value = state.routePathStyle.color;
  el.routePathWidthSelect.innerHTML = lineWidthOptions(state.routePathStyle.width);
  el.routePathLineStyleSelect.innerHTML = lineStyleOptions(state.routePathStyle.lineStyle);
  el.routePathOpacityInput.value = state.routePathStyle.opacity;
  renderRoleStyleEditor();
  updateNodeLegend();
  renderNodeStyleRules();
  renderLinkStyleRules();
  renderRingChainStyleRules();
}

function sanitizeRoleStyles(roleStyles) {
  const result = cloneStyles(DEFAULT_ROLE_STYLES);
  ROLE_ORDER.concat("OTHER").forEach(role => {
    const input = roleStyles && roleStyles[role] || {};
    const fallback = DEFAULT_ROLE_STYLES[role] || DEFAULT_ROLE_STYLES.OTHER;
    result[role] = {
      color: normalizeColor(input.color, fallback.color),
      size: clamp(Number(input.size) || fallback.size, 4, 40),
      shape: normalizeShape(input.shape, fallback.shape)
    };
  });
  return result;
}

function sanitizeStyleRuleList(rules, type, report) {
  if (!Array.isArray(rules)) return [];
  return rules
    .map(rule => sanitizeStyleRule(rule, type, report))
    .filter(Boolean);
}

function sanitizeStyleRule(rule, type, report) {
  if (!rule || typeof rule !== "object") {
    report.skipped += 1;
    return null;
  }
  const config = styleRuleConfig(type);
  const group = normalizeRuleGroup({ ...rule, source: config.source });
  if (!group) {
    report.skipped += 1;
    return null;
  }
  const sanitizedConditions = group.conditions.map(condition => {
    if (!config.available.has(condition.field)) {
      report.adjusted += 1;
      return { field: config.fallback, op: normalizeOp(condition.op), value: "" };
    }
    return { field: condition.field, op: normalizeOp(condition.op), value: String(condition.value || "") };
  });
  const first = sanitizedConditions[0];
  if (type === "node") {
    return {
      source: config.source,
      mode: group.mode,
      conditions: sanitizedConditions,
      field: first.field,
      op: first.op,
      value: first.value,
      color: normalizeColor(rule.color, DEFAULT_NODE_STYLE.color),
      size: clamp(Number(rule.size) || DEFAULT_NODE_STYLE.size, 4, 40),
      shape: normalizeShape(rule.shape, DEFAULT_NODE_STYLE.shape),
      label: String(rule.label || "")
    };
  }
  return {
    source: config.source,
    mode: group.mode,
    conditions: sanitizedConditions,
    field: first.field,
    op: first.op,
    value: first.value,
    color: normalizeColor(rule.color, DEFAULT_LINK_STYLE.color),
    lineStyle: LINE_STYLE_VALUES.includes(rule.lineStyle) ? rule.lineStyle : DEFAULT_LINK_STYLE.lineStyle,
    width: LINE_WIDTH_VALUES.includes(rule.width) ? rule.width : DEFAULT_LINK_STYLE.width
  };
}

function styleRuleConfig(type) {
  if (type === "link") {
    return { source: CONDITION_SOURCES.LINKS, available: new Set(state.linkFields), fallback: firstConfigurableLinkField() };
  }
  if (type === "ringChain") {
    return { source: CONDITION_SOURCES.RING_CHAINS, available: new Set(state.ringChainFields), fallback: firstConfigurableRingChainField() };
  }
  return { source: CONDITION_SOURCES.NODES, available: new Set(state.nodeFields), fallback: firstConfigurableNodeField() };
}

function normalizeOp(op) {
  return OPS.some(([value]) => value === op) ? op : "contains";
}

function sanitizeRoutePathStyle(style) {
  const input = style && typeof style === "object" ? style : {};
  return {
    visible: input.visible !== false,
    color: normalizeColor(input.color, DEFAULT_ROUTE_PATH_STYLE.color),
    width: LINE_WIDTH_VALUES.includes(input.width) ? input.width : DEFAULT_ROUTE_PATH_STYLE.width,
    lineStyle: LINE_STYLE_VALUES.includes(input.lineStyle) ? input.lineStyle : DEFAULT_ROUTE_PATH_STYLE.lineStyle,
    opacity: clamp(Number(input.opacity) || DEFAULT_ROUTE_PATH_STYLE.opacity, 0.1, 1)
  };
}

function safeFileName(value) {
  return String(value || "topo")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "topo";
}

function resetStyleControls() {
  state.roleStyles = cloneStyles(DEFAULT_ROLE_STYLES);
  state.nodeStyleRules = [];
  state.appliedNodeStyleRules = [];
  state.linkStyleRules = [];
  state.appliedLinkStyleRules = [];
  state.ringChainStyleRules = [];
  state.appliedRingChainStyleRules = [];
  state.routePathStyle = { ...DEFAULT_ROUTE_PATH_STYLE };
  state.highlightContrast = DEFAULT_HIGHLIGHT_CONTRAST;
  el.highlightContrastInput.value = state.highlightContrast;
  el.routePathVisibleInput.checked = state.routePathStyle.visible;
  el.routePathColorInput.value = state.routePathStyle.color;
  el.routePathWidthSelect.innerHTML = lineWidthOptions(state.routePathStyle.width);
  el.routePathLineStyleSelect.innerHTML = lineStyleOptions(state.routePathStyle.lineStyle);
  el.routePathOpacityInput.value = state.routePathStyle.opacity;
  renderRoleStyleEditor();
  updateNodeLegend();
  renderNodeStyleRules();
  renderLinkStyleRules();
  renderRingChainStyleRules();
  renderTopologies();
}

function renderRoleStyleEditor() {
  el.roleStyleEditor.innerHTML = ROLE_ORDER.concat("OTHER").map(role => {
    const style = state.roleStyles[role] || DEFAULT_ROLE_STYLES.OTHER;
    return `<div class="role-style-row">
      <div class="role-style-name"><i data-style-swatch="${role}"></i><span>${escapeHtml(role)}</span></div>
      <label><span data-i18n="styleSize">${escapeHtml(t("styleSize"))}</span><input type="number" min="4" max="40" step="1" value="${escapeAttr(style.size)}" data-style-role="${role}" data-style-field="size"></label>
      <label><span data-i18n="styleColor">${escapeHtml(t("styleColor"))}</span><input type="color" value="${escapeAttr(style.color)}" data-style-role="${role}" data-style-field="color"></label>
      <label><span data-i18n="styleShape">${escapeHtml(t("styleShape"))}</span><select data-style-role="${role}" data-style-field="shape">${nodeShapeOptions(style.shape)}</select></label>
    </div>`;
  }).join("");
  updateRoleSwatches();
}

function updateRoleStyleFromControl(event) {
  const input = event.target;
  const role = input.getAttribute("data-style-role");
  const field = input.getAttribute("data-style-field");
  if (!role || !field || !state.roleStyles[role]) return;

  if (field === "size") state.roleStyles[role].size = clamp(Number(input.value) || DEFAULT_ROLE_STYLES[role].size, 4, 40);
  if (field === "color") state.roleStyles[role].color = normalizeColor(input.value, DEFAULT_ROLE_STYLES[role].color);
  if (field === "shape") state.roleStyles[role].shape = normalizeShape(input.value, DEFAULT_ROLE_STYLES[role].shape);

  updateRoleSwatches();
  updateNodeLegend();
  renderTopologies();
}

function updateRoleSwatches() {
  ROLE_ORDER.concat("OTHER").forEach(role => {
    const style = state.roleStyles[role] || DEFAULT_ROLE_STYLES.OTHER;
    const swatch = el.roleStyleEditor.querySelector(`[data-style-swatch="${role}"]`);
    if (!swatch) return;
    swatch.style.background = style.color;
    swatch.style.color = style.color;
    swatch.className = `shape-${style.shape}`;
  });
}

function addNodeStyleRule() {
  const field = firstConfigurableNodeField();
  state.nodeStyleRules.push({
    field,
    op: "eq",
    value: "",
    mode: "all",
    conditions: [{ field, op: "eq", value: "" }],
    color: DEFAULT_NODE_STYLE.color,
    size: DEFAULT_NODE_STYLE.size,
    shape: DEFAULT_NODE_STYLE.shape,
    label: ""
  });
  renderNodeStyleRules();
}

function removeNodeStyleRule(event) {
  const editButton = event.target.closest("[data-edit-node-rule-condition]");
  if (editButton) {
    openConditionModal("nodeStyle", Number(editButton.getAttribute("data-edit-node-rule-condition")));
    return;
  }

  const moveButton = event.target.closest("[data-move-node-rule]");
  if (moveButton) {
    const [rawIndex, rawDelta] = moveButton.getAttribute("data-move-node-rule").split(":");
    const index = Number(rawIndex);
    const delta = Number(rawDelta);
    const target = index + delta;
    if (Number.isInteger(index) && Number.isInteger(target) && target >= 0 && target < state.nodeStyleRules.length) {
      const [moved] = state.nodeStyleRules.splice(index, 1);
      state.nodeStyleRules.splice(target, 0, moved);
      renderNodeStyleRules();
    }
    return;
  }

  const button = event.target.closest("[data-remove-node-rule]");
  if (!button) return;

  const index = Number(button.getAttribute("data-remove-node-rule"));
  if (!Number.isInteger(index)) return;
  state.nodeStyleRules.splice(index, 1);
  state.appliedNodeStyleRules = cloneRuleList(state.nodeStyleRules);
  renderNodeStyleRules();
  renderTopologies();
}

function updateNodeStyleRuleFromControl(event) {
  const input = event.target;
  const index = Number(input.getAttribute("data-node-rule-index"));
  const field = input.getAttribute("data-node-rule-field");
  if (!Number.isInteger(index) || !field || !state.nodeStyleRules[index]) return;

  const rule = state.nodeStyleRules[index];
  if (field === "field") {
    rule.field = input.value;
    rule.value = "";
    rule.label = "";
    renderNodeStyleRules();
  } else if (field === "op") {
    rule.op = input.value;
  } else if (field === "value") {
    rule.value = input.value;
    rule.label = input.value || rule.label;
  } else if (field === "color") {
    rule.color = normalizeColor(input.value, DEFAULT_NODE_STYLE.color);
  } else if (field === "size") {
    rule.size = clamp(Number(input.value) || DEFAULT_NODE_STYLE.size, 4, 40);
  } else if (field === "shape") {
    rule.shape = normalizeShape(input.value, DEFAULT_NODE_STYLE.shape);
  }
}

function applyNodeStyleRules() {
  state.appliedNodeStyleRules = cloneRuleList(state.nodeStyleRules);
  renderTopologies();
}

function cloneRuleList(rules) {
  return rules.map(rule => ({
    ...rule,
    conditions: Array.isArray(rule.conditions) ? rule.conditions.map(condition => ({ ...condition })) : undefined
  }));
}

function addLinkStyleRule() {
  const field = firstConfigurableLinkField();
  state.linkStyleRules.push({
    source: CONDITION_SOURCES.LINKS,
    field,
    op: "eq",
    value: "",
    mode: "all",
    conditions: [{ field, op: "eq", value: "" }],
    color: DEFAULT_LINK_STYLE.color,
    lineStyle: DEFAULT_LINK_STYLE.lineStyle,
    width: DEFAULT_LINK_STYLE.width
  });
  renderLinkStyleRules();
}

function renderNodeStyleRules() {
  if (!el.nodeStyleRuleList) return;

  updateNodeLegend();
  if (!state.nodeStyleRules.length) {
    el.nodeStyleRuleList.innerHTML = `<div class="empty-rule">${escapeHtml(t("noNodeStyleRule"))}</div>`;
    return;
  }

  el.nodeStyleRuleList.innerHTML = state.nodeStyleRules.map((rule, index) => {
    return `<div class="node-style-rule" data-node-style-rule="${index}">
      <div class="rule-condition"><span>${escapeHtml(ruleSummary(rule))}</span><button type="button" data-edit-node-rule-condition="${index}">${escapeHtml(t("advancedCondition"))}</button></div>
      <label class="rule-color"><span>${escapeHtml(t("nodeRuleColor"))}</span><input type="color" value="${escapeAttr(rule.color || DEFAULT_NODE_STYLE.color)}" data-node-rule-index="${index}" data-node-rule-field="color"></label>
      <label class="rule-size"><span>${escapeHtml(t("nodeRuleSize"))}</span><input type="number" min="4" max="40" step="1" value="${escapeAttr(rule.size || DEFAULT_NODE_STYLE.size)}" data-node-rule-index="${index}" data-node-rule-field="size"></label>
      <label class="rule-shape"><span>${escapeHtml(t("nodeRuleShape"))}</span><select data-node-rule-index="${index}" data-node-rule-field="shape">${nodeShapeOptions(rule.shape)}</select></label>
      <div class="rule-actions">
        <button type="button" data-move-node-rule="${index}:-1" ${index === 0 ? "disabled" : ""}>${escapeHtml(t("moveUp"))}</button>
        <button type="button" data-move-node-rule="${index}:1" ${index === state.nodeStyleRules.length - 1 ? "disabled" : ""}>${escapeHtml(t("moveDown"))}</button>
        <button type="button" data-remove-node-rule="${index}" title="${escapeAttr(t("removeRule"))}">${escapeHtml(t("removeRule"))}</button>
      </div>
    </div>`;
  }).join("");
}

function firstConfigurableNodeField() {
  return state.nodeFields.find(field => !REQUIRED_NE.includes(field)) || "Role";
}

function pruneNodeStyleRules() {
  const available = new Set(state.nodeFields);
  const fallback = firstConfigurableNodeField();
  [...state.nodeStyleRules, ...state.appliedNodeStyleRules].forEach(rule => {
    if (!available.has(rule.field)) {
      rule.field = fallback;
      rule.value = "";
      rule.label = "";
    }
    pruneRuleGroupFields(rule, available, fallback);
  });
}

function nodeFieldOptions(selected) {
  return state.nodeFields
    .map(field => `<option value="${escapeAttr(field)}" ${field === selected ? "selected" : ""}>${escapeHtml(field)}</option>`)
    .join("");
}

function nodeOpOptions(selected) {
  return OPS
    .filter(([value]) => ["eq", "contains", "neq", "notEmpty", "empty"].includes(value))
    .map(([value, key]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(t(key))}</option>`)
    .join("");
}

function nodeShapeOptions(selected) {
  return SHAPES
    .map(shape => `<option value="${shape}" ${shape === selected ? "selected" : ""}>${escapeHtml(shapeLabel(shape))}</option>`)
    .join("");
}

function nodeFieldValueOptions(field) {
  return collectValueOptions(state.nodes, field)
    .map(value => `<option value="${escapeAttr(value)}"></option>`)
    .join("");
}

function removeLinkStyleRule(event) {
  const editButton = event.target.closest("[data-edit-link-rule-condition]");
  if (editButton) {
    openConditionModal("linkStyle", Number(editButton.getAttribute("data-edit-link-rule-condition")));
    return;
  }

  const button = event.target.closest("[data-remove-link-rule]");
  if (!button) return;

  const index = Number(button.getAttribute("data-remove-link-rule"));
  if (!Number.isInteger(index)) return;
  state.linkStyleRules.splice(index, 1);
  renderLinkStyleRules();
}

function updateLinkStyleRuleFromControl(event) {
  const input = event.target;
  const index = Number(input.getAttribute("data-link-rule-index"));
  const field = input.getAttribute("data-link-rule-field");
  if (!Number.isInteger(index) || !field || !state.linkStyleRules[index]) return;

  const rule = state.linkStyleRules[index];
  if (field === "field") {
    rule.field = input.value;
    rule.value = "";
    renderLinkStyleRules();
  } else if (field === "op") {
    rule.op = input.value;
  } else if (field === "value") {
    rule.value = input.value;
  } else if (field === "color") {
    rule.color = normalizeColor(input.value, DEFAULT_LINK_STYLE.color);
  } else if (field === "lineStyle") {
    rule.lineStyle = LINE_STYLE_VALUES.includes(input.value) ? input.value : DEFAULT_LINK_STYLE.lineStyle;
  } else if (field === "width") {
    rule.width = LINE_WIDTH_VALUES.includes(input.value) ? input.value : DEFAULT_LINK_STYLE.width;
  }
}

function applyLinkStyleRules() {
  state.appliedLinkStyleRules = cloneRuleList(state.linkStyleRules);
  renderTopologies();
}

function addRingChainStyleRule() {
  if (!state.ringChains.length) return;
  const field = firstConfigurableRingChainField();
  state.ringChainStyleRules.push({
    source: CONDITION_SOURCES.RING_CHAINS,
    field,
    op: "eq",
    value: "",
    mode: "all",
    conditions: [{ field, op: "eq", value: "" }],
    color: DEFAULT_LINK_STYLE.color,
    lineStyle: DEFAULT_LINK_STYLE.lineStyle,
    width: DEFAULT_LINK_STYLE.width
  });
  renderRingChainStyleRules();
}

function removeRingChainStyleRule(event) {
  const editButton = event.target.closest("[data-edit-ring-chain-rule-condition]");
  if (editButton) {
    openConditionModal("ringChainStyle", Number(editButton.getAttribute("data-edit-ring-chain-rule-condition")));
    return;
  }

  const button = event.target.closest("[data-remove-ring-chain-rule]");
  if (!button) return;

  const index = Number(button.getAttribute("data-remove-ring-chain-rule"));
  if (!Number.isInteger(index)) return;
  state.ringChainStyleRules.splice(index, 1);
  renderRingChainStyleRules();
}

function updateRingChainStyleRuleFromControl(event) {
  const input = event.target;
  const index = Number(input.getAttribute("data-ring-chain-rule-index"));
  const field = input.getAttribute("data-ring-chain-rule-field");
  if (!Number.isInteger(index) || !field || !state.ringChainStyleRules[index]) return;

  const rule = state.ringChainStyleRules[index];
  if (field === "color") {
    rule.color = normalizeColor(input.value, DEFAULT_LINK_STYLE.color);
  } else if (field === "lineStyle") {
    rule.lineStyle = LINE_STYLE_VALUES.includes(input.value) ? input.value : DEFAULT_LINK_STYLE.lineStyle;
  } else if (field === "width") {
    rule.width = LINE_WIDTH_VALUES.includes(input.value) ? input.value : DEFAULT_LINK_STYLE.width;
  }
}

function applyRingChainStyleRules() {
  state.appliedRingChainStyleRules = cloneRuleList(state.ringChainStyleRules);
  clearRingChainStyleCache();
  renderTopologies();
}

function renderLinkStyleRules() {
  if (!el.linkStyleRuleList) return;

  if (!state.linkStyleRules.length) {
    el.linkStyleRuleList.innerHTML = `<div class="empty-rule">${escapeHtml(t("noLinkStyleRule"))}</div>`;
    return;
  }

  el.linkStyleRuleList.innerHTML = state.linkStyleRules.map((rule, index) => {
    return `<div class="link-style-rule" data-link-style-rule="${index}">
      <div class="rule-condition"><span>${escapeHtml(ruleSummary(rule))}</span><button type="button" data-edit-link-rule-condition="${index}">${escapeHtml(t("advancedCondition"))}</button></div>
      <label><span>${escapeHtml(t("linkRuleColor"))}</span><input type="color" value="${escapeAttr(rule.color || DEFAULT_LINK_STYLE.color)}" data-link-rule-index="${index}" data-link-rule-field="color"></label>
      <label><span>${escapeHtml(t("linkRuleLineStyle"))}</span><select data-link-rule-index="${index}" data-link-rule-field="lineStyle">${lineStyleOptions(rule.lineStyle)}</select></label>
      <label><span>${escapeHtml(t("linkRuleWidth"))}</span><select data-link-rule-index="${index}" data-link-rule-field="width">${lineWidthOptions(rule.width)}</select></label>
      <button type="button" data-remove-link-rule="${index}" title="${escapeAttr(t("removeRule"))}">${escapeHtml(t("removeRule"))}</button>
    </div>`;
  }).join("");
}

function renderRingChainStyleRules() {
  if (!el.ringChainStyleGroup || !el.ringChainStyleRuleList) return;

  const available = state.ringChains.length > 0;
  el.ringChainStyleGroup.classList.toggle("hidden", !available);
  if (!available) return;

  if (!state.ringChainStyleRules.length) {
    el.ringChainStyleRuleList.innerHTML = `<div class="empty-rule">${escapeHtml(t("noRingChainStyleRule"))}</div>`;
    return;
  }

  el.ringChainStyleRuleList.innerHTML = state.ringChainStyleRules.map((rule, index) => {
    return `<div class="link-style-rule" data-ring-chain-style-rule="${index}">
      <div class="rule-condition"><span>${escapeHtml(ruleSummary(rule))}</span><button type="button" data-edit-ring-chain-rule-condition="${index}">${escapeHtml(t("advancedCondition"))}</button></div>
      <label><span>${escapeHtml(t("linkRuleColor"))}</span><input type="color" value="${escapeAttr(rule.color || DEFAULT_LINK_STYLE.color)}" data-ring-chain-rule-index="${index}" data-ring-chain-rule-field="color"></label>
      <label><span>${escapeHtml(t("linkRuleLineStyle"))}</span><select data-ring-chain-rule-index="${index}" data-ring-chain-rule-field="lineStyle">${lineStyleOptions(rule.lineStyle)}</select></label>
      <label><span>${escapeHtml(t("linkRuleWidth"))}</span><select data-ring-chain-rule-index="${index}" data-ring-chain-rule-field="width">${lineWidthOptions(rule.width)}</select></label>
      <button type="button" data-remove-ring-chain-rule="${index}" title="${escapeAttr(t("removeRule"))}">${escapeHtml(t("removeRule"))}</button>
    </div>`;
  }).join("");
}

function firstConfigurableLinkField() {
  return state.linkFields.find(field => !REQUIRED_LINK.includes(field)) || state.linkFields[0] || REQUIRED_LINK[0];
}

function firstConfigurableRingChainField() {
  return state.ringChainFields.find(field => !["Member_path"].includes(field)) || state.ringChainFields[0] || REQUIRED_RING_CHAIN[0];
}

function pruneLinkStyleRules() {
  const available = new Set(state.linkFields);
  const fallback = firstConfigurableLinkField();
  [...state.linkStyleRules, ...state.appliedLinkStyleRules].forEach(rule => {
    rule.source = CONDITION_SOURCES.LINKS;
    if (!available.has(rule.field)) {
      rule.field = fallback;
      rule.value = "";
    }
    pruneRuleGroupFields(rule, available, fallback);
  });
}

function pruneRingChainStyleRules() {
  const available = new Set(state.ringChainFields);
  const fallback = firstConfigurableRingChainField();
  [...state.ringChainStyleRules, ...state.appliedRingChainStyleRules].forEach(rule => {
    rule.source = CONDITION_SOURCES.RING_CHAINS;
    if (!available.has(rule.field)) {
      rule.field = fallback;
      rule.value = "";
    }
    pruneRuleGroupFields(rule, available, fallback);
  });
}

function linkFieldOptions(selected) {
  return state.linkFields
    .map(field => `<option value="${escapeAttr(field)}" ${field === selected ? "selected" : ""}>${escapeHtml(field)}</option>`)
    .join("");
}

function linkOpOptions(selected) {
  return LINK_STYLE_OPS
    .map(op => `<option value="${op}" ${op === selected ? "selected" : ""}>${escapeHtml(t(`op${op.charAt(0).toUpperCase()}${op.slice(1)}`))}</option>`)
    .join("");
}

function lineStyleOptions(selected) {
  const labels = { solid: "lineSolid", dash: "lineDash", dot: "lineDot" };
  return LINE_STYLE_VALUES
    .map(value => `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(t(labels[value]))}</option>`)
    .join("");
}

function lineWidthOptions(selected) {
  const labels = { thin: "lineThin", medium: "lineMedium", thick: "lineThick" };
  return LINE_WIDTH_VALUES
    .map(value => `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(t(labels[value]))}</option>`)
    .join("");
}

function linkFieldValueOptions(field) {
  return collectValueOptions(state.links, field)
    .map(value => `<option value="${escapeAttr(value)}"></option>`)
    .join("");
}

function fillOperatorOptions() {
  const options = OPS.map(([value, key]) => `<option value="${value}">${t(key)}</option>`).join("");
  [el.highlightOp, el.filterOp, el.tableOp].forEach(select => {
    const current = select.value;
    select.innerHTML = options;
    if (current) select.value = current;
  });
}

function switchPage(page) {
  el.tabTopo.classList.toggle("active", page === "topo");
  el.tabData.classList.toggle("active", page === "data");
  el.tabCompare.classList.toggle("active", page === "compare");
  el.topoPage.classList.toggle("hidden", page !== "topo");
  el.dataPage.classList.toggle("active", page === "data");
  el.comparePage.classList.toggle("active", page === "compare");
  state.compare.active = page === "compare";

  if (page === "data") updateTable();
  if (page === "topo" && state.map) {
    setTimeout(() => state.map.invalidateSize(), 50);
  }
  if (page === "compare") {
    setupComparePage();
    setTimeout(() => invalidateCompareMaps(), 80);
  }
}

function switchTopoView(view) {
  state.view = view;
  el.gisBtn.classList.toggle("active", view === "gis");
  el.logicBtn.classList.toggle("active", view === "logic");
  el.map.classList.toggle("hidden", view !== "gis");
  el.logicCanvas.classList.toggle("hidden", view !== "logic");
  el.details.classList.remove("show");

  if (view === "gis" && state.map) {
    setTimeout(() => state.map.invalidateSize(), 50);
  }
  renderTopologies();
}

async function loadUploadedFiles() {
  const neFile = el.neFile.files[0];
  const linkFile = el.linkFile.files[0];
  const ringChainFile = el.ringChainFile && el.ringChainFile.files[0];

  if (!neFile || !linkFile) {
    setMessage(el.uploadMessage, t("chooseBoth"), "error");
    return;
  }

  try {
    const reads = [readDataFile(neFile), readDataFile(linkFile)];
    if (ringChainFile) reads.push(readDataFile(ringChainFile));
    const [nodes, links, ringChains = []] = await Promise.all(reads);
    syncSourceFilesFromInputs();
    setData(nodes, links, ringChainFile ? ringChains : []);
    const stats = ringChainStats();
    const message = ringChainFile
      ? [
        t("uploadDoneWithRingChain", { rings: stats.rings, chains: stats.chains }),
        state.quality.missingRingChainMembers ? t("ringChainMissingMembers", { count: state.quality.missingRingChainMembers }) : ""
      ].filter(Boolean).join(state.lang === "zh" ? "；" : "; ")
      : t("uploadDone");
    setMessage(el.uploadMessage, message, state.quality.missingRingChainMembers ? "warning" : "ok");
  } catch (error) {
    setMessage(el.uploadMessage, error.message || String(error), "error");
  }
}

function readDataFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(t("fileReadFail")));
    reader.onload = event => {
      try {
        if (ext === "csv") {
          resolve(parseCsv(String(event.target.result)));
        } else if (ext === "xlsx" || ext === "xls") {
          if (!window.XLSX) throw new Error(t("xlsxMissing"));
          const workbook = XLSX.read(new Uint8Array(event.target.result), { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(sheet, { defval: "" }).map(normalizeRow));
        } else {
          throw new Error(t("unsupportedFile"));
        }
      } catch (error) {
        reject(error);
      }
    };

    if (ext === "csv") reader.readAsText(file, "utf-8");
    else reader.readAsArrayBuffer(file);
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (c === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") {
      cell += c;
    }
  }

  row.push(cell);
  rows.push(row);
  const effectiveRows = rows.filter(item => item.some(value => String(value).trim() !== ""));
  if (!effectiveRows.length) return [];

  const headers = effectiveRows[0].map(header => String(header).trim());
  return effectiveRows.slice(1).map(values => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] || "").trim();
    });
    return normalizeRow(record);
  });
}

function loadMockData() {
  const { nodes, links } = createMockTopology();
  const version = activeDataVersion();
  if (version) {
    version.sourceFiles = {
      device: mockSourceFile("Mock Device"),
      link: mockSourceFile("Mock Link"),
      ringChain: null
    };
  }
  setData(nodes, links);
  setMessage(el.uploadMessage, t("mockLoaded", { devices: nodes.length, links: links.length }), "ok");
}

function createMockTopology() {
  const regions = [
    { code: "BKN", name: "Bangkok-North", lat: 13.83, lng: 100.58 },
    { code: "BKE", name: "Bangkok-East", lat: 13.74, lng: 100.68 },
    { code: "BKW", name: "Bangkok-West", lat: 13.76, lng: 100.42 },
    { code: "BKS", name: "Bangkok-South", lat: 13.62, lng: 100.55 },
    { code: "NON", name: "Nonthaburi", lat: 13.91, lng: 100.51 },
    { code: "SAM", name: "Samut-Prakan", lat: 13.60, lng: 100.70 }
  ];
  const vendors = ["Huawei", "ZTE", "Nokia", "Cisco", "Juniper"];
  const statuses = ["Up", "Up", "Up", "Maintenance", "Down"];
  const nodes = [];
  const pe = [];
  const asgRings = [];
  const csgRings = [];
  const links = [];
  const linkKeys = new Set();
  const addNode = (role, name, region, index, extra = {}) => {
    const angle = (index * 47 + role.length * 29) * Math.PI / 180;
    const spread = role === "PE" ? 0.030 : role === "ASG" ? 0.018 : 0.026;
    const node = {
      "NE Name": name,
      Role: role,
      Longitude: (region.lng + Math.cos(angle) * spread).toFixed(6),
      Latitude: (region.lat + Math.sin(angle) * spread).toFixed(6),
      Region: region.name,
      Vendor: vendors[index % vendors.length],
      Status: statuses[index % statuses.length],
      "Site Type": role === "CSG" ? "Access" : role === "ASG" ? "Aggregation" : "Core",
      "Service Level": index % 11 === 0 ? "Gold" : index % 3 === 0 ? "Silver" : "Bronze",
      ...extra
    };
    nodes.push(node);
    return node;
  };
  const addLink = (src, sink, type, extra = {}) => {
    if (!src || !sink || src["NE Name"] === sink["NE Name"]) return;
    const a = src["NE Name"];
    const b = sink["NE Name"];
    const key = [a, b].sort().join("::");
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({
      "Src NE Name": a,
      "Sink NE Name": b,
      "Link Type": type,
      Status: type.includes("Uplink") && links.length % 5 === 0 ? "Maintenance" : links.length % 17 === 0 ? "Down" : "Up",
      Capacity: type === "PE-FullMesh" ? "100G" : type.includes("Uplink") ? "40G" : "10G",
      "Media Type": type === "PE-FullMesh" ? "DWDM" : "Fiber",
      Protection: type.includes("Ring") ? "Ring" : type.includes("Uplink") ? "Dual-Homed" : "Mesh",
      "Service Class": type === "PE-FullMesh" ? "Core" : type.includes("ASG") ? "Aggregation" : "Access",
      Utilization: `${35 + (links.length * 7) % 58}%`,
      [ROUTE_WKT_FIELD]: routeWktFromNodes(src, sink, links.length),
      ...extra
    });
  };

  const coreRegion = { name: "Core", lat: 13.78, lng: 100.56 };
  for (let i = 0; i < 6; i++) {
    pe.push(addNode("PE", `PE-CORE-${String(i + 1).padStart(2, "0")}`, coreRegion, i, {
      "Ring ID": "PE-FULLMESH",
      "Ring Role": "Core",
      "Uplink Pair": ""
    }));
  }
  for (let i = 0; i < pe.length; i++) {
    for (let j = i + 1; j < pe.length; j++) {
      addLink(pe[i], pe[j], "PE-FullMesh", { "Ring ID": "PE-FULLMESH" });
    }
  }

  regions.forEach((region, regionIndex) => {
    const asgRingId = `ASG-RING-${region.code}`;
    const pePair = [pe[regionIndex % pe.length], pe[(regionIndex + 1) % pe.length]];
    const asgNodes = [];
    for (let i = 0; i < 4; i++) {
      asgNodes.push(addNode("ASG", `ASG-${region.code}-${String(i + 1).padStart(2, "0")}`, region, regionIndex * 10 + i, {
        "Ring ID": asgRingId,
        "Ring Role": "Aggregation Ring",
        "Uplink Pair": `${pePair[0]["NE Name"]}/${pePair[1]["NE Name"]}`
      }));
    }
    asgNodes.forEach((node, index) => {
      addLink(node, asgNodes[(index + 1) % asgNodes.length], "ASG-Ring", { "Ring ID": asgRingId });
    });
    addLink(asgNodes[0], pePair[0], "ASG-Uplink", { "Ring ID": asgRingId });
    addLink(asgNodes[asgNodes.length - 1], pePair[1], "ASG-Uplink", { "Ring ID": asgRingId });
    asgRings.push({ ringId: asgRingId, region, nodes: asgNodes, pePair });

    for (let ringIndex = 0; ringIndex < 3; ringIndex++) {
      const csgRingId = `CSG-RING-${region.code}-${ringIndex + 1}`;
      const asgPair = [asgNodes[ringIndex % asgNodes.length], asgNodes[(ringIndex + 1) % asgNodes.length]];
      const csgNodes = [];
      for (let i = 0; i < 5; i++) {
        const serial = String(ringIndex * 5 + i + 1).padStart(2, "0");
        csgNodes.push(addNode("CSG", `CSG-${region.code}-${serial}`, region, regionIndex * 20 + i, {
          "Ring ID": csgRingId,
          "Ring Role": "Access Ring",
          "Uplink Pair": `${asgPair[0]["NE Name"]}/${asgPair[1]["NE Name"]}`
        }));
      }
      csgNodes.forEach((node, index) => {
        addLink(node, csgNodes[(index + 1) % csgNodes.length], "CSG-Ring", { "Ring ID": csgRingId });
      });
      addLink(csgNodes[0], asgPair[0], "CSG-Uplink", { "Ring ID": csgRingId });
      addLink(csgNodes[csgNodes.length - 1], asgPair[1], "CSG-Uplink", { "Ring ID": csgRingId });
      csgRings.push({ ringId: csgRingId, region, nodes: csgNodes, asgPair });
    }
  });

  return { nodes, links };
}

function routeWktFromNodes(src, sink, index = 0) {
  if (!src || !sink || !hasCoord(src) || !hasCoord(sink)) return "";

  const srcLng = Number(src.Longitude);
  const srcLat = Number(src.Latitude);
  const sinkLng = Number(sink.Longitude);
  const sinkLat = Number(sink.Latitude);
  const midLng = (srcLng + sinkLng) / 2;
  const midLat = (srcLat + sinkLat) / 2;
  const dx = sinkLng - srcLng;
  const dy = sinkLat - srcLat;
  const length = Math.sqrt(dx * dx + dy * dy) || 0.0001;
  const bend = Math.min(0.018, Math.max(0.0025, length * 0.18)) * (index % 2 ? -1 : 1);
  const ctrlLng = midLng - (dy / length) * bend;
  const ctrlLat = midLat + (dx / length) * bend;
  return `LINESTRING(${formatCoord(srcLng)} ${formatCoord(srcLat)}, ${formatCoord(ctrlLng)} ${formatCoord(ctrlLat)}, ${formatCoord(sinkLng)} ${formatCoord(sinkLat)})`;
}

function formatCoord(value) {
  return Number(value).toFixed(7).replace(/0+$/, "").replace(/\.$/, "");
}

function setData(nodes, links, ringChains = [], options = {}) {
  const { refreshProjectName = true } = options;
  const normalizedNodes = nodes.map(normalizeRow);
  const normalizedLinks = links.map(normalizeRow);
  const normalizedRingChains = ringChains.map(normalizeRow);
  validateRows(normalizedNodes, REQUIRED_NE, t("deviceTable"));
  validateRows(normalizedLinks, REQUIRED_LINK, t("linkTable"));
  if (normalizedRingChains.length) validateRows(normalizedRingChains, REQUIRED_RING_CHAIN, t("ringChainTable"));

  state.nodes = normalizedNodes;
  state.links = normalizedLinks;
  state.ringChains = normalizedRingChains;
  state.nodeFields = collectFields(state.nodes, REQUIRED_NE);
  state.linkFields = collectFields(state.links, REQUIRED_LINK);
  state.ringChainFields = collectFields(state.ringChains, REQUIRED_RING_CHAIN);
  pruneNodeStyleRules();
  pruneLinkStyleRules();
  pruneRingChainStyleRules();
  rebuildIndexes();
  state.selectedName = "";
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  state.selectedCoordinateKey = "";
  state.routeHitEntries = [];
  state.highlightRule = null;
  state.filterRule = null;
  state.locateRule = null;
  state.locatedNames = new Set();
  state.locatedLinkKeys = new Set();
  state.bulkQuery = null;
  if (el.bulkQueryInput) el.bulkQueryInput.value = "";
  if (refreshProjectName) setDefaultProjectName(new Date(), { force: false });
  state.ringChainStyleRules = state.ringChains.length ? state.ringChainStyleRules : [];
  state.appliedRingChainStyleRules = state.ringChains.length ? state.appliedRingChainStyleRules : [];
  clearRingChainStyleCache();

  state.logic.positions = new Map();
  state.logic.layoutKey = "";
  persistActiveVersionState();
  renderVersionControls();
  refreshAll();
  fitCurrentView();
  if (isLargeDataset()) setMessage(el.uploadMessage, t("largeDataLoaded"), "ok");
}

function rebuildIndexes() {
  const nodeByName = new Map();
  const upperNameToName = new Map();
  const linksByNode = new Map();
  const ringChainMembersByName = new Map();
  const ringChainSegmentsByName = new Map();
  state.nodes.forEach(node => {
    const name = node["NE Name"];
    if (!name) return;
    nodeByName.set(name, node);
    upperNameToName.set(name.toUpperCase(), name);
    linksByNode.set(name, []);
  });
  state.links.forEach(link => {
    const src = link["Src NE Name"];
    const sink = link["Sink NE Name"];
    if (!linksByNode.has(src)) linksByNode.set(src, []);
    if (!linksByNode.has(sink)) linksByNode.set(sink, []);
    linksByNode.get(src).push(link);
    linksByNode.get(sink).push(link);
  });
  const missingCoord = state.nodes.filter(node => !hasCoord(node)).length;
  const brokenLinks = state.links.filter(link => !nodeByName.has(link["Src NE Name"]) || !nodeByName.has(link["Sink NE Name"])).length;
  const missingRingChainMemberNames = new Set();
  state.ringChains.forEach((row, index) => {
    const rowKey = ringChainRowKey(row, index);
    const members = parseMemberPath(row.Member_path);
    const validMembers = members.filter(name => {
      const exists = nodeByName.has(name);
      if (!exists) missingRingChainMemberNames.add(name);
      return exists;
    });
    const segments = [];
    for (let i = 1; i < members.length; i++) {
      if (nodeByName.has(members[i - 1]) && nodeByName.has(members[i])) {
        segments.push(linkPairKey(members[i - 1], members[i]));
      }
    }
    ringChainMembersByName.set(rowKey, validMembers);
    ringChainSegmentsByName.set(rowKey, segments);
  });
  state.indexes = { nodeByName, upperNameToName, linksByNode, ringChainMembersByName, ringChainSegmentsByName };
  state.quality = { missingCoord, brokenLinks, missingRingChainMembers: missingRingChainMemberNames.size };
}

function isLargeDataset() {
  return state.nodes.length > PERF.largeNodeCount || state.links.length > PERF.largeLinkCount;
}

function normalizeRow(row) {
  const out = {};
  Object.keys(row || {}).forEach(key => {
    out[String(key).trim()] = row[key] == null ? "" : String(row[key]).trim();
  });
  return out;
}

function validateRows(rows, requiredFields, label) {
  if (!rows.length) throw new Error(t("tableEmpty", { name: label }));
  const fields = new Set(Object.keys(rows[0]));
  const missing = requiredFields.filter(field => !fields.has(field));
  if (missing.length) throw new Error(t("missingFields", { name: label, fields: missing.join("、") }));
}

function collectFields(rows, preferredFields) {
  const fields = new Set(preferredFields);
  rows.forEach(row => Object.keys(row).forEach(field => fields.add(field)));
  return [...fields];
}

function collectValueOptions(rows, field, limit = 120) {
  if (!field) return [];

  const seen = new Set();
  const values = [];
  for (const row of rows) {
    const value = String(row[field] ?? "").trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    values.push(value);
    if (values.length >= limit) break;
  }
  return values.sort((a, b) => a.localeCompare(b));
}

function parseMemberPath(value) {
  return String(value || "")
    .split("->")
    .map(item => item.trim())
    .filter(Boolean);
}

function ringChainRowKey(row, index) {
  return String(row && row.Name || "").trim() || `ring-chain-${index}`;
}

function refreshAll() {
  renderVersionControls();
  updateFieldSelectors();
  updateSuggestions();
  updateRuleSummaries();
  renderTopologies();
  if (state.compare.active) renderCompare();
  updateTable();
}

function updateFieldSelectors() {
  const nodeOptions = state.nodeFields.map(field => `<option value="${escapeAttr(field)}">${escapeHtml(field)}</option>`).join("");
  el.highlightField.innerHTML = nodeOptions;
  el.filterField.innerHTML = nodeOptions;
  updateTableFieldSelector();
  renderNodeStyleRules();
  renderLinkStyleRules();
  renderRingChainStyleRules();
  updateConditionValueSuggestions("highlight");
  updateConditionValueSuggestions("filter");
  updateRuleSummaries();
}

function updateRuleSummaries() {
  if (el.highlightRuleSummary) el.highlightRuleSummary.textContent = ruleSummary(state.highlightRule);
  if (el.filterRuleSummary) el.filterRuleSummary.textContent = ruleSummary(state.filterRule);
}

function ruleSummary(rule) {
  const group = normalizeRuleGroup(rule);
  if (!group) return t("noConditionRule");
  const sourceLabels = {
    [CONDITION_SOURCES.LINKS]: "conditionSourceLinks",
    [CONDITION_SOURCES.RING_CHAINS]: "conditionSourceRingChains"
  };
  const prefix = sourceLabels[group.source] ? `${t(sourceLabels[group.source])} / ` : "";
  if (group.conditions.length === 1) {
    const condition = group.conditions[0];
    return `${prefix}${condition.field} ${operatorLabel(condition.op)} ${condition.value || ""}`.trim();
  }
  return `${prefix}${t(group.mode === "any" ? "conditionSummaryAny" : "conditionSummaryAll", { count: group.conditions.length })}`;
}

function operatorLabel(op) {
  const found = OPS.find(([value]) => value === op);
  return found ? t(found[1]) : op;
}

function updateTableFieldSelector() {
  const fields = state.table === "nodes" ? state.nodeFields : state.linkFields;
  el.tableField.innerHTML = fields.map(field => `<option value="${escapeAttr(field)}">${escapeHtml(field)}</option>`).join("");
}

function updateSuggestions() {
  const history = state.searchHistory.locate;
  const seen = new Set(history.map(item => item.toLowerCase()));
  const nodeNames = [];
  for (const node of state.nodes) {
    const name = String(node["NE Name"] || "").trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    nodeNames.push(name);
    if (nodeNames.length >= 500) break;
  }
  el.neSuggestions.innerHTML = [...history, ...nodeNames]
    .map(name => `<option value="${escapeAttr(name)}"></option>`)
    .join("");
  if (el.highlightHistory) {
    el.highlightHistory.innerHTML = state.searchHistory.highlight
      .map(value => `<option value="${escapeAttr(value)}"></option>`)
      .join("");
  }
  if (el.filterHistory) {
    el.filterHistory.innerHTML = state.searchHistory.filter
      .map(value => `<option value="${escapeAttr(value)}"></option>`)
      .join("");
  }
}

function readRule(prefix) {
  return {
    source: CONDITION_SOURCES.NODES,
    field: el[`${prefix}Field`].value,
    op: el[`${prefix}Op`].value,
    value: el[`${prefix}Value`].value
  };
}

function ruleGroupFromQuickControls(prefix) {
  return normalizeRuleGroup({
    mode: "all",
    conditions: [readRule(prefix)]
  });
}

function normalizeRuleGroup(rule) {
  if (!rule) return null;

  const source = normalizeConditionSource(rule.source);
  const conditions = Array.isArray(rule.conditions)
    ? rule.conditions
    : [rule];
  const normalized = conditions
    .map(condition => ({
      field: condition.field || "",
      op: condition.op || "contains",
      value: condition.value || ""
    }))
    .filter(condition => condition.field);

  if (!normalized.length) return null;
  return {
    source,
    mode: rule.mode === "any" ? "any" : "all",
    conditions: normalized
  };
}

function normalizeConditionSource(source) {
  if (source === CONDITION_SOURCES.LINKS) return CONDITION_SOURCES.LINKS;
  if (source === CONDITION_SOURCES.RING_CHAINS) return CONDITION_SOURCES.RING_CHAINS;
  return CONDITION_SOURCES.NODES;
}

function pruneRuleGroupFields(rule, available, fallback) {
  if (!Array.isArray(rule.conditions)) return;
  rule.conditions.forEach(condition => {
    if (!available.has(condition.field)) {
      condition.field = fallback;
      condition.value = "";
    }
  });
  const first = rule.conditions[0];
  if (first) {
    rule.field = first.field;
    rule.op = first.op;
    rule.value = first.value;
  }
}

function matchesRule(row, rule) {
  const group = normalizeRuleGroup(rule);
  if (!group) return true;

  const checks = group.conditions.map(condition => matchesCondition(row, condition));
  return group.mode === "any" ? checks.some(Boolean) : checks.every(Boolean);
}

function matchesCondition(row, rule) {
  if (!rule || !rule.field) return true;

  const value = String(row[rule.field] ?? "").trim();
  const target = String(rule.value ?? "").trim();
  const left = value.toLowerCase();
  const right = target.toLowerCase();

  if (rule.op === "contains") return left.includes(right);
  if (rule.op === "eq") return left === right;
  if (rule.op === "neq") return left !== right;
  if (rule.op === "starts") return left.startsWith(right);
  if (rule.op === "ends") return left.endsWith(right);
  if (rule.op === "gt") return Number(value) > Number(target);
  if (rule.op === "lt") return Number(value) < Number(target);
  if (rule.op === "empty") return value === "";
  if (rule.op === "notEmpty") return value !== "";

  return true;
}

function openConditionModal(type, index = null) {
  state.conditionModalType = type;
  state.conditionModalTarget = { type, index };
  const initialSource = type === "ringChainStyle"
    ? CONDITION_SOURCES.RING_CHAINS
    : type === "linkStyle" || type === "compareLinkStyle"
      ? CONDITION_SOURCES.LINKS
      : CONDITION_SOURCES.NODES;
  state.conditionDraft = cloneRuleGroup(conditionTargetRule(type, index)) || quickRuleGroupForTarget(type) || emptyRuleGroup("", initialSource);
  const fields = conditionFieldsForTarget(type);
  if (!state.conditionDraft.conditions[0].field) state.conditionDraft.conditions[0].field = fields[0] || "";
  renderConditionModal();
  el.conditionModal.classList.remove("hidden");
}

function closeConditionModal() {
  el.conditionModal.classList.add("hidden");
  state.conditionModalType = "";
  state.conditionModalTarget = null;
  state.conditionDraft = null;
}

function conditionTargetRule(type, index = null) {
  if (type === "locate") return state.locateRule;
  if (type === "highlight" || type === "filter") return state[`${type}Rule`];
  if (type === "compareHighlight" || type === "compareFilter") {
    const target = state.conditionModalTarget && state.conditionModalTarget.index;
    const ctx = target && state.compare[target.side];
    return ctx ? ctx[type === "compareHighlight" ? "highlightRule" : "filterRule"] : null;
  }
  if (type === "nodeStyle") return state.nodeStyleRules[index];
  if (type === "linkStyle") return state.linkStyleRules[index];
  if (type === "ringChainStyle") return state.ringChainStyleRules[index];
  if (type === "compareNodeStyle" || type === "compareLinkStyle") {
    const target = state.conditionModalTarget && state.conditionModalTarget.index;
    const ctx = target && state.compare[target.side];
    if (!ctx) return null;
    return type === "compareNodeStyle" ? ctx.nodeStyleRules[target.index] : ctx.linkStyleRules[target.index];
  }
  return null;
}

function quickRuleGroupForTarget(type) {
  if (type === "locate") return locateRuleFromQuickInput();
  if (type === "highlight" || type === "filter") return ruleGroupFromQuickControls(type);
  return null;
}

function conditionFieldsForTarget(type) {
  const source = conditionSourceForTarget(type);
  if (type === "compareNodeStyle" || type === "compareLinkStyle" || type === "compareHighlight" || type === "compareFilter") {
    const target = state.conditionModalTarget && state.conditionModalTarget.index;
    const ctx = target && state.compare[target.side];
    const version = ctx ? versionById(ctx.versionId) : null;
    const source = conditionSourceForTarget(type);
    if (source === CONDITION_SOURCES.RING_CHAINS) return collectFields(version && version.ringChains || [], REQUIRED_RING_CHAIN);
    return source === CONDITION_SOURCES.LINKS || type === "compareLinkStyle"
      ? collectFields(version && version.links || [], REQUIRED_LINK)
      : collectFields(version && version.nodes || [], REQUIRED_NE);
  }
  if (type === "linkStyle") return state.linkFields;
  if (source === CONDITION_SOURCES.LINKS) return state.linkFields;
  if (source === CONDITION_SOURCES.RING_CHAINS) return state.ringChainFields;
  return state.nodeFields;
}

function conditionSourceForTarget(type) {
  if (type === "linkStyle" || type === "compareLinkStyle") return CONDITION_SOURCES.LINKS;
  if (type === "compareNodeStyle") return CONDITION_SOURCES.NODES;
  if (type === "ringChainStyle") return CONDITION_SOURCES.RING_CHAINS;
  return normalizeConditionSource(state.conditionDraft && state.conditionDraft.source);
}

function conditionSourceOptions(selected) {
  const options = [
    [CONDITION_SOURCES.NODES, "conditionSourceNodes"],
    [CONDITION_SOURCES.LINKS, "conditionSourceLinks"]
  ];
  const compareTarget = state.conditionModalTarget && state.conditionModalTarget.index;
  const compareCtx = compareTarget && state.compare[compareTarget.side];
  const compareVersion = compareCtx ? versionById(compareCtx.versionId) : null;
  const hasRingChains = state.conditionModalType && state.conditionModalType.startsWith("compare")
    ? Boolean(compareVersion && compareVersion.ringChains && compareVersion.ringChains.length)
    : state.ringChains.length;
  if (hasRingChains) options.push([CONDITION_SOURCES.RING_CHAINS, "conditionSourceRingChains"]);
  return options
    .map(([value, key]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(t(key))}</option>`)
    .join("");
}

function canChooseConditionSource(type) {
  return type === "locate" || type === "highlight" || type === "filter" || type === "compareHighlight" || type === "compareFilter";
}

function emptyRuleGroup(field = "", source = CONDITION_SOURCES.NODES) {
  return {
    source,
    mode: "all",
    conditions: [{ field, op: "contains", value: "" }]
  };
}

function cloneRuleGroup(rule) {
  const group = normalizeRuleGroup(rule);
  return group ? { source: group.source, mode: group.mode, conditions: group.conditions.map(condition => ({ ...condition })) } : null;
}

function renderConditionModal() {
  const type = state.conditionModalType;
  const draft = state.conditionDraft || emptyRuleGroup(conditionFieldsForTarget(type)[0]);
  el.conditionModalTitle.textContent = conditionModalTitle(type);
  el.conditionModeGroup.querySelectorAll("input[name='conditionMode']").forEach(input => {
    input.checked = input.value === draft.mode;
  });
  const source = conditionSourceForTarget(type);
  el.conditionSourceGroup.classList.toggle("hidden", !canChooseConditionSource(type));
  el.conditionSourceSelect.innerHTML = conditionSourceOptions(source);
  el.conditionSourceSelect.value = source;
  el.conditionRuleList.innerHTML = draft.conditions.map((condition, index) => conditionRowMarkup(condition, index)).join("");
  renderConditionHistory();
}

function conditionRowMarkup(condition, index) {
  const fields = conditionFieldsForTarget(state.conditionModalType);
  const valueListId = `conditionValueOptions${index}`;
  const fieldOptions = fields
    .map(field => `<option value="${escapeAttr(field)}" ${field === condition.field ? "selected" : ""}>${escapeHtml(field)}</option>`)
    .join("");
  const opOptions = OPS
    .map(([value, key]) => `<option value="${value}" ${value === condition.op ? "selected" : ""}>${escapeHtml(t(key))}</option>`)
    .join("");
  return `<div class="condition-row" data-condition-index="${index}">
    <select data-condition-field>${fieldOptions}</select>
    <select data-condition-op>${opOptions}</select>
    <input data-condition-value list="${valueListId}" value="${escapeAttr(condition.value || "")}" placeholder="${escapeAttr(t("conditionValue"))}">
    <datalist id="${valueListId}">${conditionValueOptions(condition.field)}</datalist>
    <button type="button" data-remove-condition="${index}">${escapeHtml(t("removeCondition"))}</button>
  </div>`;
}

function conditionValueOptions(field) {
  const type = state.conditionModalType;
  const source = conditionSourceForTarget(type);
  if (type === "compareNodeStyle" || type === "compareLinkStyle" || type === "compareHighlight" || type === "compareFilter") {
    const target = state.conditionModalTarget && state.conditionModalTarget.index;
    const ctx = target && state.compare[target.side];
    const version = ctx ? versionById(ctx.versionId) : null;
    const source = conditionSourceForTarget(type);
    const rows = source === CONDITION_SOURCES.RING_CHAINS
      ? version && version.ringChains || []
      : source === CONDITION_SOURCES.LINKS || type === "compareLinkStyle"
        ? version && version.links || []
        : version && version.nodes || [];
    return mergeSuggestionValues(collectValueOptions(rows, field), conditionValueHistory(type, field))
      .map(value => `<option value="${escapeAttr(value)}"></option>`)
      .join("");
  }
  const rows = type === "linkStyle"
    ? state.links
    : source === CONDITION_SOURCES.RING_CHAINS
      ? state.ringChains
      : source === CONDITION_SOURCES.LINKS
        ? state.links
      : state.nodes;
  const history = type === "filter"
    ? state.searchHistory.filter
    : type === "highlight"
      ? state.searchHistory.highlight
      : type === "locate"
        ? state.searchHistory.locate
      : conditionValueHistory(type, field);
  return mergeSuggestionValues(collectValueOptions(rows, field), history)
    .map(value => `<option value="${escapeAttr(value)}"></option>`)
    .join("");
}

function conditionValueHistory(type, field) {
  const values = [];
  const source = conditionSourceForTarget(type);
  state.conditionHistory
    .filter(item => item.type === type)
    .forEach(item => {
      const group = normalizeRuleGroup(item.rule);
      if (!group) return;
      if (group.source !== source) return;
      group.conditions.forEach(condition => {
        if (condition.field === field && condition.value) values.push(condition.value);
      });
    });
  return values;
}

function updateConditionSourceFromControl() {
  if (!state.conditionDraft) return;
  const source = normalizeConditionSource(el.conditionSourceSelect.value);
  state.conditionDraft.source = source;
  const fields = conditionFieldsForTarget(state.conditionModalType);
  state.conditionDraft.conditions = [{ field: fields[0] || "", op: "contains", value: "" }];
  renderConditionModal();
}

function updateConditionRowSuggestions(event) {
  if (!event.target.closest("[data-condition-field]")) return;

  const row = event.target.closest(".condition-row");
  const input = row && row.querySelector("[data-condition-value]");
  const datalist = row && row.querySelector("datalist");
  if (!row || !input || !datalist) return;
  input.value = "";
  datalist.innerHTML = conditionValueOptions(event.target.value);
}

function conditionModalTitle(type) {
  if (type === "locate") return t("complexLocateTitle");
  if (type === "filter") return t("complexFilterTitle");
  if (type === "compareFilter") return t("complexFilterTitle");
  if (type === "compareHighlight") return t("complexHighlightTitle");
  if (type === "nodeStyle") return t("nodeStyleRules");
  if (type === "compareNodeStyle") return t("nodeStyleRules");
  if (type === "linkStyle") return t("linkStyleRules");
  if (type === "compareLinkStyle") return t("linkStyleRules");
  if (type === "ringChainStyle") return t("ringChainStyleRules");
  return t("complexHighlightTitle");
}

function applyRuleGroupToTarget(target, group) {
  if (!target) return;
  if (target.type === "locate") {
    state.locateRule = group;
    return;
  }
  if (target.type === "highlight" || target.type === "filter") {
    state[`${target.type}Rule`] = group;
    return;
  }
  if (target.type === "compareHighlight" || target.type === "compareFilter") {
    const compareTarget = target.index || {};
    const ctx = state.compare[compareTarget.side];
    if (!ctx) return;
    if (target.type === "compareHighlight") ctx.highlightRule = group;
    else ctx.filterRule = group;
    return;
  }
  if (target.type === "compareNodeStyle" || target.type === "compareLinkStyle") {
    const compareTarget = target.index || {};
    const ctx = state.compare[compareTarget.side];
    const rules = target.type === "compareNodeStyle" ? ctx && ctx.nodeStyleRules : ctx && ctx.linkStyleRules;
    const rule = rules && rules[compareTarget.index];
    if (!rule || !group) return;
    rule.source = group.source;
    rule.mode = group.mode;
    rule.conditions = group.conditions.map(condition => ({ ...condition }));
    const first = group.conditions[0];
    rule.field = first.field;
    rule.op = first.op;
    rule.value = first.value;
    if (target.type === "compareNodeStyle") {
      rule.label = rule.label || rule.value;
      ctx.appliedNodeStyleRules = cloneRuleList(ctx.nodeStyleRules);
    } else {
      ctx.appliedLinkStyleRules = cloneRuleList(ctx.linkStyleRules);
    }
    return;
  }

  const rules = target.type === "nodeStyle"
    ? state.nodeStyleRules
    : target.type === "ringChainStyle"
      ? state.ringChainStyleRules
      : state.linkStyleRules;
  const rule = rules[target.index];
  if (!rule || !group) return;

  rule.source = group.source;
  rule.mode = group.mode;
  rule.conditions = group.conditions.map(condition => ({ ...condition }));
  const first = group.conditions[0];
  rule.field = first.field;
  rule.op = first.op;
  rule.value = first.value;
  if (target.type === "nodeStyle") rule.label = rule.label || rule.value;
}

function renderConditionHistory() {
  const type = state.conditionModalType;
  const source = conditionSourceForTarget(type);
  const history = state.conditionHistory.filter(item => {
    const group = normalizeRuleGroup(item.rule);
    return item.type === type && (!group || group.source === source);
  });
  if (!history.length) {
    el.conditionHistoryList.innerHTML = `<span class="notice">${escapeHtml(t("noConditionHistory"))}</span>`;
    return;
  }

  el.conditionHistoryList.innerHTML = history
    .map((item, index) => `<button type="button" data-restore-condition="${index}" title="${escapeAttr(item.label)}">${escapeHtml(item.label)}</button>`)
    .join("");
}

function restoreConditionHistory(event) {
  const button = event.target.closest("[data-restore-condition]");
  if (!button) return;

  const source = conditionSourceForTarget(state.conditionModalType);
  const history = state.conditionHistory.filter(item => {
    const group = normalizeRuleGroup(item.rule);
    return item.type === state.conditionModalType && (!group || group.source === source);
  });
  const item = history[Number(button.getAttribute("data-restore-condition"))];
  if (!item) return;
  state.conditionDraft = cloneRuleGroup(item.rule);
  renderConditionModal();
}

function syncConditionDraftFromModal() {
  if (!state.conditionDraft) state.conditionDraft = emptyRuleGroup();
  const checkedMode = el.conditionModeGroup.querySelector("input[name='conditionMode']:checked");
  state.conditionDraft.source = canChooseConditionSource(state.conditionModalType)
    ? normalizeConditionSource(el.conditionSourceSelect.value)
    : conditionSourceForTarget(state.conditionModalType);
  state.conditionDraft.mode = checkedMode ? checkedMode.value : "all";
  state.conditionDraft.conditions = [...el.conditionRuleList.querySelectorAll(".condition-row")].map(row => ({
    field: row.querySelector("[data-condition-field]").value,
    op: row.querySelector("[data-condition-op]").value,
    value: row.querySelector("[data-condition-value]").value
  }));
}

function addConditionDraftRule() {
  syncConditionDraftFromModal();
  state.conditionDraft.conditions.push({ field: conditionFieldsForTarget(state.conditionModalType)[0] || "", op: "contains", value: "" });
  renderConditionModal();
}

function removeConditionDraftRule(event) {
  const button = event.target.closest("[data-remove-condition]");
  if (!button) return;

  syncConditionDraftFromModal();
  const index = Number(button.getAttribute("data-remove-condition"));
  state.conditionDraft.conditions.splice(index, 1);
  if (!state.conditionDraft.conditions.length) state.conditionDraft.conditions.push({ field: conditionFieldsForTarget(state.conditionModalType)[0] || "", op: "contains", value: "" });
  renderConditionModal();
}

function applyConditionModal() {
  syncConditionDraftFromModal();
  const target = state.conditionModalTarget || { type: state.conditionModalType, index: null };
  const type = target.type;
  const group = normalizeRuleGroup(state.conditionDraft);
  applyRuleGroupToTarget(target, group);
  if (group && type === "locate") {
    group.conditions.forEach(condition => rememberSearchHistory("locate", condition.value));
    rememberConditionHistory(type, group);
    closeConditionModal();
    applyLocateRule(group);
    return;
  }
  if (group && (type === "highlight" || type === "filter") && group.source === CONDITION_SOURCES.NODES) {
    const first = group.conditions[0];
    el[`${type}Field`].value = first.field;
    el[`${type}Op`].value = first.op;
    el[`${type}Value`].value = first.value || "";
    group.conditions.forEach(condition => rememberSearchHistory(type, condition.value));
  } else if (group && (type === "highlight" || type === "filter")) {
    group.conditions.forEach(condition => rememberSearchHistory(type, condition.value));
  }
  if (group) rememberConditionHistory(type, group);
  updateRuleSummaries();
  renderNodeStyleRules();
  renderLinkStyleRules();
  renderRingChainStyleRules();
  closeConditionModal();
  if (type === "compareNodeStyle" || type === "compareLinkStyle" || type === "compareHighlight" || type === "compareFilter") {
    renderCompare();
    if (type === "compareHighlight" || type === "compareFilter") {
      const compareTarget = target.index || {};
      focusCompareRuleResult(compareTarget.side, type === "compareHighlight" ? "highlight" : "filter");
    }
    return;
  }
  renderTopologies();
  if (type === "highlight" || type === "filter") focusMainRuleResult(type);
}

function applyBulkQuery() {
  const raw = el.bulkQueryInput.value.trim();
  if (!raw) {
    state.bulkQuery = null;
    setMessage(el.bulkQueryMessage, t("bulkQueryEmpty"), "error");
    renderTopologies();
    return;
  }

  const result = parseBulkQuery(raw);
  state.bulkQuery = result;
  setMessage(el.bulkQueryMessage, t("bulkQueryApplied", {
    devices: result.matchNames.size,
    links: result.matchLinks.size
  }), "ok");
  renderTopologies();
}

function clearBulkQuery() {
  state.bulkQuery = null;
  el.bulkQueryInput.value = "";
  setMessage(el.bulkQueryMessage, t("bulkQueryCleared"), "ok");
  renderTopologies();
}

function parseBulkQuery(raw) {
  const tokens = raw
    .split(/[\s,，;；|]+/)
    .map(token => token.trim())
    .filter(Boolean);
  const upperText = raw.toUpperCase();
  const matchNames = new Set();
  const matchLinks = new Set();

  tokens.forEach(token => {
    const direct = state.indexes.upperNameToName.get(token.toUpperCase());
    if (direct) matchNames.add(direct);
  });
  if (raw.length < 200000) {
    state.indexes.nodeByName.forEach((_, name) => {
      if (upperText.includes(name.toUpperCase())) matchNames.add(name);
    });
  }
  const seedNames = [...matchNames];
  seedNames.forEach(name => {
    (state.indexes.linksByNode.get(name) || []).forEach(link => {
      matchLinks.add(linkKey(link));
      matchNames.add(link["Src NE Name"]);
      matchNames.add(link["Sink NE Name"]);
    });
  });

  return { raw, tokens, matchNames, matchLinks };
}

function intersectSets(a, b) {
  const out = new Set();
  a.forEach(value => {
    if (b.has(value)) out.add(value);
  });
  return out;
}

function nodeNamesForRule(rule, sourceRows = state.nodes, linkRows = state.links) {
  const group = normalizeRuleGroup(rule);
  const names = new Set();
  if (!group) return names;

  if (group.source === CONDITION_SOURCES.LINKS) {
    linkRows.forEach(link => {
      if (!matchesRule(link, group)) return;
      names.add(link["Src NE Name"]);
      names.add(link["Sink NE Name"]);
    });
    return names;
  }

  if (group.source === CONDITION_SOURCES.RING_CHAINS) {
    state.ringChains.forEach((row, index) => {
      if (!matchesRule(row, group)) return;
      const key = ringChainRowKey(row, index);
      const members = state.indexes.ringChainMembersByName.get(key) || parseMemberPath(row.Member_path).filter(name => state.indexes.nodeByName.has(name));
      members.forEach(name => names.add(name));
    });
    return names;
  }

  sourceRows.forEach(node => {
    if (matchesRule(node, group)) names.add(node["NE Name"]);
  });
  return names;
}

function linkKeysForRule(rule, linkRows = state.links) {
  const group = normalizeRuleGroup(rule);
  const keys = new Set();
  if (!group || group.source !== CONDITION_SOURCES.LINKS) return keys;

  linkRows.forEach(link => {
    if (matchesRule(link, group)) keys.add(linkKey(link));
  });
  return keys;
}

function ringChainRowsForRule(rule) {
  const group = normalizeRuleGroup(rule);
  if (!group || group.source !== CONDITION_SOURCES.RING_CHAINS) return [];
  return state.ringChains.filter(row => matchesRule(row, group));
}

function getVisibleData() {
  const nodeByName = state.indexes.nodeByName;
  const filterGroup = normalizeRuleGroup(state.filterRule);
  const filteredRingChains = filterGroup && filterGroup.source === CONDITION_SOURCES.RING_CHAINS
    ? ringChainRowsForRule(filterGroup)
    : null;
  const filterLinkKeys = filterGroup && filterGroup.source === CONDITION_SOURCES.LINKS
    ? linkKeysForRule(filterGroup, state.links)
    : null;
  const filterMatchNames = new Set(state.nodes.map(node => node["NE Name"]));
  if (state.filterRule) {
    filterMatchNames.clear();
    nodeNamesForRule(state.filterRule, state.nodes, state.links).forEach(name => filterMatchNames.add(name));
  }
  const queryMatchNames = state.bulkQuery ? state.bulkQuery.matchNames : null;
  const activeSeedNames = queryMatchNames
    ? intersectSets(filterMatchNames, queryMatchNames)
    : filterMatchNames;
  const hasFiltering = Boolean(state.filterRule || state.bulkQuery);
  let links = state.links;
  if (hasFiltering) {
    if (state.filterRule) {
      links = state.links.filter(link => {
        if (!activeSeedNames.has(link["Src NE Name"]) || !activeSeedNames.has(link["Sink NE Name"])) return false;
        return filterLinkKeys ? filterLinkKeys.has(linkKey(link)) : true;
      });
    } else {
      const seen = new Set();
      links = [];
      activeSeedNames.forEach(name => {
        (state.indexes.linksByNode.get(name) || []).forEach(link => {
          const key = linkKey(link);
          if (!seen.has(key)) {
            seen.add(key);
            links.push(link);
          }
        });
      });
    }
  }
  const visibleNames = new Set();
  if (hasFiltering) {
    activeSeedNames.forEach(name => visibleNames.add(name));
    if (!state.filterRule) {
      links.forEach(link => {
        visibleNames.add(link["Src NE Name"]);
        visibleNames.add(link["Sink NE Name"]);
      });
    }
  } else {
    state.nodes.forEach(node => visibleNames.add(node["NE Name"]));
  }
  const nodes = hasFiltering
    ? [...visibleNames].map(name => nodeByName.get(name)).filter(Boolean)
    : state.nodes;
  const highlightNames = new Set();
  const highlightLinkKeys = new Set();
  const selectedNeighborNames = new Set();
  const selectedLinkKeys = new Set();

  if (state.highlightRule) {
    const highlightGroup = normalizeRuleGroup(state.highlightRule);
    const highlightRuleLinkKeys = highlightGroup && highlightGroup.source === CONDITION_SOURCES.LINKS
      ? linkKeysForRule(highlightGroup, links)
      : null;
    nodeNamesForRule(state.highlightRule, nodes, links).forEach(name => {
      if (visibleNames.has(name)) highlightNames.add(name);
    });
    links.forEach(link => {
      const endpointsHighlighted = highlightNames.has(link["Src NE Name"]) && highlightNames.has(link["Sink NE Name"]);
      const linkHighlighted = highlightRuleLinkKeys ? highlightRuleLinkKeys.has(linkKey(link)) && endpointsHighlighted : endpointsHighlighted;
      if (linkHighlighted) {
        highlightLinkKeys.add(linkKey(link));
      }
    });
  }
  if (state.selectedName) {
    links.forEach(link => {
      const src = link["Src NE Name"];
      const sink = link["Sink NE Name"];
      if (src === state.selectedName || sink === state.selectedName) {
        selectedLinkKeys.add(linkKey(link));
        selectedNeighborNames.add(src === state.selectedName ? sink : src);
      }
    });
  }
  if (state.selectedLinkKey) {
    selectedLinkKeys.add(state.selectedLinkKey);
    const selectedLink = links.find(link => linkKey(link) === state.selectedLinkKey);
    if (selectedLink) {
      selectedNeighborNames.add(selectedLink["Src NE Name"]);
      selectedNeighborNames.add(selectedLink["Sink NE Name"]);
    }
  }

  const locatedNames = new Set();
  state.locatedNames.forEach(name => {
    if (visibleNames.has(name)) locatedNames.add(name);
  });
  const locatedLinkKeys = new Set();
  if (locatedNames.size > 1) {
    links.forEach(link => {
      const key = linkKey(link);
      const endpointsLocated = locatedNames.has(link["Src NE Name"]) && locatedNames.has(link["Sink NE Name"]);
      if (endpointsLocated && state.locatedLinkKeys.has(key)) locatedLinkKeys.add(key);
    });
  }

  return { nodes, links, visibleNames, filterMatchNames: activeSeedNames, filteredRingChains, highlightNames, highlightLinkKeys, locatedNames, locatedLinkKeys, selectedNeighborNames, selectedLinkKeys, nodeByName };
}

function highlightDimOpacity(kind) {
  const value = Number(state.highlightContrast);
  const contrast = clamp(Number.isFinite(value) ? value : DEFAULT_HIGHLIGHT_CONTRAST, 0, 1);
  const baseOpacity = {
    linkBase: 0.82,
    linkLine: 0.86,
    nodeFill: 0.95,
    node: 1
  };
  return (baseOpacity[kind] ?? 1) * (1 - contrast);
}

function renderTopologies() {
  const data = getVisibleData();
  el.emptyState.classList.toggle("hidden", state.nodes.length > 0);

  if (state.view === "gis") renderMap(data);
  else renderLogic(data);

  updateStats(data);
  updateViewMessage(data);
}

function renderMap(data) {
  if (!state.map) return;
  if (state.mapMoving) return;

  state.mapLayers.nodes.forEach(layer => layer.remove());
  state.mapLayers.links.forEach(layer => layer.remove());
  state.mapLayers.routes.forEach(layer => layer.remove());
  state.mapLayers = { nodes: [], links: [], routes: [] };

  const hasHighlight = data.highlightNames.size > 0;
  const dimLinkBaseOpacity = highlightDimOpacity("linkBase");
  const dimLinkLineOpacity = highlightDimOpacity("linkLine");
  const dimNodeFillOpacity = highlightDimOpacity("nodeFill");
  const dimNodeOpacity = highlightDimOpacity("node");
  const bounds = state.map.getBounds().pad(0.18);
  const shouldClip = data.nodes.length > PERF.mapNodeLimit || data.links.length > PERF.mapLinkLimit;
  const mapNodes = shouldClip
    ? data.nodes.filter(node => hasCoord(node) && bounds.contains([Number(node.Latitude), Number(node.Longitude)])).slice(0, PERF.mapNodeLimit)
    : data.nodes;
  const mapLinks = shouldClip
    ? data.links.filter(link => {
      const src = data.nodeByName.get(link["Src NE Name"]);
      const sink = data.nodeByName.get(link["Sink NE Name"]);
      return linkIntersectsBounds(src, sink, bounds);
    }).slice(0, PERF.mapLinkLimit)
    : data.links;
  const degreeMap = getNodeDegreeMap(mapLinks);

  if (state.routePathStyle.visible) {
    renderRouteCanvas(mapLinks, data);
  } else {
    state.routeHitEntries = [];
  }

  mapLinks.forEach(link => {
    const src = data.nodeByName.get(link["Src NE Name"]);
    const sink = data.nodeByName.get(link["Sink NE Name"]);
    if (!src || !sink || !hasCoord(src) || !hasCoord(sink)) return;

    const selectedLink = data.selectedLinkKeys.has(linkKey(link));
    const locatedLink = data.locatedLinkKeys.has(linkKey(link));
    const related = data.highlightLinkKeys.has(linkKey(link)) || selectedLink || locatedLink;
    const userStyle = resolveLinkStyle(link);
    const visualStyle = selectedLink
      ? { ...userStyle, color: "#245a6e", weight: Math.max(userStyle.weight, 3.6), dashArray: "" }
      : locatedLink
        ? { ...userStyle, weight: Math.max(userStyle.weight + 1.4, 3.2) }
      : userStyle;
    const points = [[Number(src.Latitude), Number(src.Longitude)], [Number(sink.Latitude), Number(sink.Longitude)]];
    const base = L.polyline(points, {
      color: "#ffffff",
      weight: visualStyle.weight + 3,
      opacity: hasHighlight && !related ? dimLinkBaseOpacity : 0.82
    }).addTo(state.map);
    const line = L.polyline(points, {
      color: visualStyle.color,
      weight: visualStyle.weight,
      dashArray: visualStyle.dashArray,
      opacity: hasHighlight && !related ? dimLinkLineOpacity : 0.86
    }).addTo(state.map);

    line.bindTooltip(`${link["Src NE Name"]} ⇄ ${link["Sink NE Name"]}`);
    const onLinkClick = event => {
      if (window.L && event) L.DomEvent.stop(event);
      showLinkDetails(link);
      renderTopologies();
    };
    base.on("click", onLinkClick);
    line.on("click", onLinkClick);
    state.mapLayers.links.push(base, line);
  });

  groupNodesByCoordinate(mapNodes).forEach(group => {
    if (group.nodes.length > 1) {
      const marker = createColocatedNodeLayer(group, data, degreeMap, {
        hasHighlight,
        dimNodeOpacity
      }).addTo(state.map);
      marker.bindTooltip(colocatedTooltip(group), { permanent: false, direction: "top", className: "node-tip" });
      marker.on("click", event => {
        if (window.L && event) L.DomEvent.stop(event);
        showColocatedDetails(group);
        renderTopologies();
      });
      state.mapLayers.nodes.push(marker);
      return;
    }

    const node = group.nodes[0];
    const name = node["NE Name"];
    const selected = state.selectedName === name;
    const neighbor = data.selectedNeighborNames.has(name);
    const highlighted = data.highlightNames.has(name);
    const located = data.locatedNames.has(name);
    const active = selected || neighbor || located;
    const dim = hasHighlight && !highlighted && !active;
    const radius = mapNodeRadius(degreeMap.get(name) || 0, node, active);
    const point = [Number(node.Latitude), Number(node.Longitude)];
    const marker = createMapNodeLayer(point, radius, nodeShape(node), {
      fillColor: nodeFill(node),
      color: selected ? "#245a6e" : neighbor ? "#2f6f86" : located ? "#245a6e" : "#ffffff",
      weight: active ? 3 : 2.4,
      fillOpacity: dim ? dimNodeFillOpacity : 0.95,
      opacity: dim ? dimNodeOpacity : 1
    }).addTo(state.map);

    marker.bindTooltip(name, { permanent: false, direction: "top", className: "node-tip" });
    marker.on("click", event => {
      if (window.L && event) L.DomEvent.stop(event);
      showDetails(node);
      renderTopologies();
    });
    state.mapLayers.nodes.push(marker);
  });
}

function linkIntersectsBounds(src, sink, bounds) {
  if (!src || !sink || !hasCoord(src) || !hasCoord(sink) || !bounds) return false;
  const srcPoint = [Number(src.Latitude), Number(src.Longitude)];
  const sinkPoint = [Number(sink.Latitude), Number(sink.Longitude)];
  if (bounds.contains(srcPoint) || bounds.contains(sinkPoint)) return true;
  return L.latLngBounds(srcPoint, sinkPoint).intersects(bounds);
}

function groupNodesByCoordinate(nodes) {
  const groups = new Map();
  nodes.forEach(node => {
    if (!hasCoord(node)) return;
    const key = coordinateKey(node);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        lat: Number(node.Latitude),
        lng: Number(node.Longitude),
        nodes: []
      });
    }
    groups.get(key).nodes.push(node);
  });
  return [...groups.values()];
}

function coordinateKey(node) {
  return `${formatCoordinateKey(node.Longitude)}::${formatCoordinateKey(node.Latitude)}`;
}

function formatCoordinateKey(value) {
  return Number(value).toFixed(7);
}

function createColocatedNodeLayer(group, data, degreeMap, options) {
  const style = colocatedGroupStyle(group.nodes);
  const selected = group.nodes.some(node => state.selectedName === node["NE Name"]) || state.selectedCoordinateKey === group.key;
  const neighbor = group.nodes.some(node => data.selectedNeighborNames.has(node["NE Name"]));
  const highlighted = group.nodes.some(node => data.highlightNames.has(node["NE Name"]));
  const located = group.nodes.some(node => data.locatedNames.has(node["NE Name"]));
  const active = selected || neighbor || located;
  const dim = options.hasHighlight && !highlighted && !active;
  const maxDegree = group.nodes.reduce((max, node) => Math.max(max, degreeMap.get(node["NE Name"]) || 0), 0);
  const size = clamp(22 + Math.sqrt(group.nodes.length) * 4 + Math.sqrt(maxDegree), 24, 42);
  const borderColor = selected ? "#245a6e" : neighbor ? "#2f6f86" : "#ffffff";
  const opacity = dim ? options.dimNodeOpacity : 1;
  const html = `<div class="colocated-marker ${active ? "active" : ""}" style="--cluster-color:${escapeAttr(style.color)};--cluster-border:${escapeAttr(borderColor)};--cluster-opacity:${opacity};width:${size}px;height:${size}px;">${group.nodes.length}</div>`;
  return L.marker([group.lat, group.lng], {
    interactive: true,
    icon: L.divIcon({
      className: "colocated-marker-wrap",
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    })
  });
}

function colocatedGroupStyle(nodes) {
  const sameRole = nodes.every(node => roleKey(node) === roleKey(nodes[0]));
  if (sameRole) return resolveNodeStyle(nodes[0]);

  const priority = ["PE", "ASG", "CSG", "OTHER"];
  const bestRole = nodes
    .map(node => roleKey(node))
    .sort((a, b) => priority.indexOf(a) - priority.indexOf(b))[0] || "OTHER";
  const bestNode = nodes.find(node => roleKey(node) === bestRole) || nodes[0];
  return resolveNodeStyle(bestNode);
}

function roleKey(node) {
  const role = String(node && node.Role || "").trim().toUpperCase();
  return ROLE_ORDER.includes(role) ? role : "OTHER";
}

function colocatedTooltip(group) {
  const names = group.nodes.slice(0, 6).map(node => escapeHtml(node["NE Name"])).join("<br>");
  const more = group.nodes.length > 6 ? `<br>... +${group.nodes.length - 6}` : "";
  return `<strong>${escapeHtml(t("colocatedDevices"))}</strong><br>${escapeHtml(t("colocatedDeviceCount", { count: group.nodes.length }))}<br>${escapeHtml(t("colocatedRoleSummary", { text: roleSummaryText(group.nodes) }))}<br>${names}${more}`;
}

function roleSummaryText(nodes) {
  const counts = {};
  nodes.forEach(node => {
    const role = roleKey(node);
    counts[role] = (counts[role] || 0) + 1;
  });
  return ["PE", "ASG", "CSG", "OTHER"]
    .filter(role => counts[role])
    .map(role => `${role}:${counts[role]}`)
    .join(" ");
}

function renderRouteCanvas(mapLinks, data) {
  const entries = mapLinks
    .map(link => ({ link, key: linkKey(link), points: routePointsForLink(link) }))
    .filter(entry => entry.points.length > 1);
  state.routeHitEntries = entries;
  if (!entries.length) return;

  const canvas = document.createElement("canvas");
  const size = state.map.getSize();
  const topLeft = state.map.containerPointToLayerPoint([0, 0]);
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(size.x * pixelRatio);
  canvas.height = Math.round(size.y * pixelRatio);
  canvas.style.width = `${size.x}px`;
  canvas.style.height = `${size.y}px`;
  canvas.className = "route-canvas-layer";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "350";
  L.DomUtil.setPosition(canvas, topLeft);
  state.map.getPanes().overlayPane.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(pixelRatio, pixelRatio);

  const selectedKey = state.selectedRouteKey || state.selectedLinkKey;
  const baseWidth = linkWeight(state.routePathStyle.width);
  const routeOpacity = clamp(Number(state.routePathStyle.opacity) || DEFAULT_ROUTE_PATH_STYLE.opacity, 0.1, 1);
  const hasHighlight = data.highlightNames.size > 0;
  const highlightContrast = Number(state.highlightContrast);
  const dimRouteOpacity = routeOpacity * (1 - clamp(Number.isFinite(highlightContrast) ? highlightContrast : DEFAULT_HIGHLIGHT_CONTRAST, 0, 1));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  applyCanvasDash(ctx, state.routePathStyle.lineStyle);
  entries.forEach(entry => {
    if (selectedKey && entry.key === selectedKey) return;
    const related = data.highlightLinkKeys.has(entry.key);
    const opacity = hasHighlight && !related ? dimRouteOpacity : selectedKey ? Math.max(0.08, routeOpacity * 0.28) : routeOpacity;
    drawRoutePath(ctx, entry.points, topLeft, state.routePathStyle.color, baseWidth, opacity);
  });

  if (selectedKey) {
    const selected = entries.find(entry => entry.key === selectedKey);
    if (selected) {
      applyCanvasDash(ctx, "solid");
      drawRoutePath(ctx, selected.points, topLeft, "#245a6e", Math.max(baseWidth + 2, 5), 1);
      drawRouteEndpointGuides(ctx, selected.link, selected.points, data.nodeByName, topLeft);
    }
  }

  state.mapLayers.routes.push({ remove: () => canvas.remove() });
}

function drawRoutePath(ctx, points, topLeft, color, width, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach((point, index) => {
    const layerPoint = state.map.latLngToLayerPoint(point);
    const x = layerPoint.x - topLeft.x;
    const y = layerPoint.y - topLeft.y;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawRouteEndpointGuides(ctx, link, routePoints, nodeByName, topLeft) {
  const src = nodeByName.get(link["Src NE Name"]);
  const sink = nodeByName.get(link["Sink NE Name"]);
  if (!src || !sink || !hasCoord(src) || !hasCoord(sink)) return;

  const guides = [
    [routePoints[0], [Number(src.Latitude), Number(src.Longitude)]],
    [routePoints[routePoints.length - 1], [Number(sink.Latitude), Number(sink.Longitude)]]
  ];
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#245a6e";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 5]);
  guides.forEach(([from, to]) => {
    const a = state.map.latLngToLayerPoint(from);
    const b = state.map.latLngToLayerPoint(to);
    ctx.beginPath();
    ctx.moveTo(a.x - topLeft.x, a.y - topLeft.y);
    ctx.lineTo(b.x - topLeft.x, b.y - topLeft.y);
    ctx.stroke();
  });
  ctx.restore();
}

function applyCanvasDash(ctx, lineStyle) {
  if (lineStyle === "dash") ctx.setLineDash([8, 6]);
  else if (lineStyle === "dot") ctx.setLineDash([2, 5]);
  else ctx.setLineDash([]);
}

function findRouteHit(containerPoint) {
  if (!state.routePathStyle.visible || !state.routeHitEntries.length || !state.map) return null;

  let best = null;
  let bestDistance = ROUTE_HIT_TOLERANCE_PX;
  state.routeHitEntries.forEach(entry => {
    const distance = routeDistanceToContainerPoint(entry.points, containerPoint);
    if (distance <= bestDistance) {
      best = entry;
      bestDistance = distance;
    }
  });
  return best;
}

function routeDistanceToContainerPoint(points, target) {
  let min = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = state.map.latLngToContainerPoint(points[i - 1]);
    const b = state.map.latLngToContainerPoint(points[i]);
    min = Math.min(min, pointToSegmentDistance(target, a, b));
  }
  return min;
}

function pointToSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - a.x, point.y - a.y);

  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
  const x = a.x + dx * t;
  const y = a.y + dy * t;
  return Math.hypot(point.x - x, point.y - y);
}

function createMapNodeLayer(point, radius, shape, options) {
  if (shape === "circle") {
    return L.circleMarker(point, { radius, ...options });
  }

  const center = L.latLng(point[0], point[1]);
  const layerPoint = state.map.latLngToLayerPoint(center);
  const points = shapePixelOffsets(radius, shape)
    .map(([dx, dy]) => state.map.layerPointToLatLng([layerPoint.x + dx, layerPoint.y + dy]));
  return L.polygon(points, {
    ...options,
    smoothFactor: 0,
    interactive: true
  });
}

function shapePixelOffsets(radius, shape) {
  const r = Math.max(4, radius);
  if (shape === "square") return [[-r, -r], [r, -r], [r, r], [-r, r]];
  if (shape === "diamond") return [[0, -r * 1.18], [r * 1.18, 0], [0, r * 1.18], [-r * 1.18, 0]];
  if (shape === "triangle") return [[0, -r * 1.28], [r * 1.16, r], [-r * 1.16, r]];
  return [];
}

function renderLogic(data = getVisibleData()) {
  const svg = el.logicCanvas;
  const rect = svg.getBoundingClientRect();
  const width = Math.max(320, rect.width || 900);
  const height = Math.max(240, rect.height || 600);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  if (data.nodes.length > PERF.logicNodeLimit || data.links.length > PERF.logicLinkLimit) {
    svg.innerHTML = `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#667789" font-size="14">${escapeHtml(t("logicTooLarge", { devices: data.nodes.length, links: data.links.length }))}</text>`;
    return;
  }

  const hasHighlight = data.highlightNames.size > 0;
  svg.style.setProperty("--logic-link-dim-opacity", String(highlightDimOpacity("linkLine")));
  svg.style.setProperty("--logic-node-dim-opacity", String(highlightDimOpacity("node")));
  const degreeMap = getNodeDegreeMap(data.links);
  const connectedNodes = data.nodes.filter(node => (degreeMap.get(node["NE Name"]) || 0) > 0);
  const isolatedNodes = data.nodes.filter(node => (degreeMap.get(node["NE Name"]) || 0) === 0);
  const isolatedLayout = getIsolatedLayoutMetrics(isolatedNodes.length, width, height, connectedNodes.length);
  const layoutKey = logicLayoutKey(connectedNodes, data.links, isolatedNodes.length);
  if (layoutKey !== state.logic.layoutKey || !hasPositionsFor(connectedNodes)) {
    computeLogicLayout(true, connectedNodes, data.links, isolatedLayout.bandHeight);
    state.logic.layoutKey = layoutKey;
  }
  layoutIsolatedNodes(isolatedNodes, width, height, isolatedLayout);

  const linkMarkup = data.links.map((link, index) => {
    const src = state.logic.positions.get(link["Src NE Name"]);
    const sink = state.logic.positions.get(link["Sink NE Name"]);
    if (!src || !sink) return "";

    const selectedLink = data.selectedLinkKeys.has(linkKey(link));
    const locatedLink = data.locatedLinkKeys.has(linkKey(link));
    const related = data.highlightLinkKeys.has(linkKey(link)) || selectedLink || locatedLink;
    const cls = `logic-link ${selectedLink ? "selected" : ""} ${locatedLink ? "located" : ""} ${related ? "highlight" : ""} ${hasHighlight && !related ? "dim" : ""}`;
    const userStyle = resolveLinkStyle(link);
    const visualStyle = selectedLink
      ? { ...userStyle, color: "#245a6e", weight: Math.max(userStyle.weight, 3.6), dashArray: "" }
      : locatedLink
        ? { ...userStyle, weight: Math.max(userStyle.weight + 1.4, 3.2) }
      : userStyle;
    const style = ` style="stroke:${escapeAttr(visualStyle.color)};stroke-width:${visualStyle.weight};${visualStyle.dashArray ? `stroke-dasharray:${escapeAttr(visualStyle.dashArray)};` : ""}"`;
    return `<line class="${cls}"${style} x1="${src.x}" y1="${src.y}" x2="${sink.x}" y2="${sink.y}" data-link="${index}"></line>`;
  }).join("");

  const nodeMarkup = data.nodes.map(node => {
    const name = node["NE Name"];
    const position = state.logic.positions.get(name);
    if (!position) return "";

    const selected = state.selectedName === name;
    const neighbor = data.selectedNeighborNames.has(name);
    const highlighted = data.highlightNames.has(name);
    const located = data.locatedNames.has(name);
    const radius = logicNodeRadius(degreeMap.get(name) || 0, node);
    const cls = `logic-node ${selected ? "selected" : ""} ${neighbor ? "neighbor" : ""} ${located ? "located" : ""} ${highlighted ? "highlight" : ""} ${hasHighlight && !highlighted && !selected && !neighbor && !located ? "dim" : ""}`;
    const shapeMarkup = svgShapeMarkup(nodeShape(node), radius, nodeFill(node));
    const style = "";
    return `<g class="${cls}"${style} data-node="${escapeAttr(name)}" transform="translate(${position.x},${position.y})">
      ${shapeMarkup}
      <text x="${radius + 7}" y="4">${escapeHtml(name)}</text>
    </g>`;
  }).join("");

  svg.innerHTML = `<g id="logicViewport" transform="translate(${state.logic.panX},${state.logic.panY}) scale(${state.logic.zoom})">${linkMarkup}${nodeMarkup}</g>`;

  svg.querySelectorAll(".logic-node").forEach(group => {
    group.addEventListener("mousedown", event => {
      event.stopPropagation();
      state.logic.draggingNode = group.getAttribute("data-node");
      state.logic.lastX = event.clientX;
      state.logic.lastY = event.clientY;
    });
    group.addEventListener("click", event => {
      event.stopPropagation();
      const node = data.nodeByName.get(group.getAttribute("data-node"));
      if (node) {
        showDetails(node);
        renderTopologies();
      }
    });
  });
  svg.querySelectorAll(".logic-link").forEach(line => {
    line.addEventListener("click", event => {
      event.stopPropagation();
      const link = data.links[Number(line.getAttribute("data-link"))];
      if (link) {
        showLinkDetails(link);
        renderTopologies();
      }
    });
  });
}

function bindLogicEvents() {
  const svg = el.logicCanvas;

  svg.addEventListener("mousedown", event => {
    state.logic.draggingCanvas = true;
    state.logic.dragMoved = false;
    state.logic.lastX = event.clientX;
    state.logic.lastY = event.clientY;
  });

  window.addEventListener("mousemove", event => {
    const dx = event.clientX - state.logic.lastX;
    const dy = event.clientY - state.logic.lastY;

    if (state.logic.draggingNode) {
      const position = state.logic.positions.get(state.logic.draggingNode);
      if (position) {
        position.x += dx / state.logic.zoom;
        position.y += dy / state.logic.zoom;
      }
      state.logic.lastX = event.clientX;
      state.logic.lastY = event.clientY;
      renderLogic(getVisibleData());
    } else if (state.logic.draggingCanvas) {
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) state.logic.dragMoved = true;
      state.logic.panX += dx;
      state.logic.panY += dy;
      state.logic.lastX = event.clientX;
      state.logic.lastY = event.clientY;
      renderLogic(getVisibleData());
    }
  });

  window.addEventListener("mouseup", () => {
    state.logic.draggingCanvas = false;
    state.logic.draggingNode = "";
  });

  svg.addEventListener("click", event => {
    if (state.logic.dragMoved) return;
    if (event.target === svg || event.target.id === "logicViewport") {
      if (clearSelection()) renderTopologies();
    }
  });

  svg.addEventListener("wheel", event => {
    event.preventDefault();
    const oldZoom = state.logic.zoom;
    const newZoom = clamp(oldZoom * (event.deltaY < 0 ? 1.1 : 0.9), 0.25, 3);
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    state.logic.panX = x - (x - state.logic.panX) * (newZoom / oldZoom);
    state.logic.panY = y - (y - state.logic.panY) * (newZoom / oldZoom);
    state.logic.zoom = newZoom;
    renderLogic(getVisibleData());
  }, { passive: false });
}

function computeLogicLayout(resetTransform, layoutNodes = state.nodes, layoutLinks = state.links, reservedBottomHeight = 0) {
  const viewportWidth = Math.max(320, el.logicCanvas.clientWidth || 900);
  const viewportHeight = Math.max(240, el.logicCanvas.clientHeight || 600);
  const paths = logicRingChainPaths(new Set(layoutNodes.map(node => node["NE Name"])));
  const layoutSize = getLogicLayoutSize(viewportWidth, viewportHeight, layoutNodes, paths, reservedBottomHeight);
  const width = layoutSize.width;
  const layoutHeight = layoutSize.height;
  const positions = new Map();
  state.logic.layoutWidth = width;
  state.logic.layoutHeight = layoutHeight;

  computeStructureAwareInitialLayout(positions, width, layoutHeight, layoutNodes, layoutLinks, paths);
  if (layoutNodes.length <= 300) {
    applyKamadaKawaiLayout(positions, width, layoutHeight, layoutNodes, layoutLinks);
  } else {
    applySpringLayout(positions, width, layoutHeight, layoutNodes, layoutLinks);
  }
  resolveLogicNodeOverlap(positions, width, layoutHeight, layoutNodes, layoutLinks, 8);
  normalizeLogicPositions(positions, width, layoutHeight, layoutNodes);

  state.logic.positions = positions;
  if (resetTransform) {
    fitLogicToBounds(layoutNodes);
  }
}

function getLogicLayoutSize(viewportWidth, viewportHeight, layoutNodes, paths, reservedBottomHeight = 0) {
  const nodeCount = Math.max(1, layoutNodes.length);
  const ringCount = paths.filter(path => path.category === "ring").length;
  const componentEstimate = Math.max(1, ringCount || Math.ceil(nodeCount / 18));
  const columns = Math.max(1, Math.ceil(Math.sqrt(componentEstimate * 1.45)));
  const rows = Math.max(1, Math.ceil(componentEstimate / columns));
  const minCellW = 360;
  const minCellH = 260;
  const width = Math.max(viewportWidth, columns * minCellW + 180, Math.sqrt(nodeCount) * 230);
  const height = Math.max(viewportHeight - reservedBottomHeight, rows * minCellH + 160, Math.sqrt(nodeCount) * 170);
  return {
    width: Math.ceil(width),
    height: Math.ceil(height)
  };
}

function computeStructureAwareInitialLayout(positions, width, height, layoutNodes, layoutLinks, precomputedPaths = null) {
  const nodeSet = new Set(layoutNodes.map(node => node["NE Name"]));
  const accum = new Map();
  const paths = precomputedPaths || logicRingChainPaths(nodeSet);

  if (paths.length) {
    placeRingChainInitialPositions(accum, paths, width, height);
    accum.forEach((items, name) => {
      const total = items.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
      positions.set(name, { x: total.x / items.length, y: total.y / items.length });
    });
  }

  const remaining = layoutNodes.filter(node => !positions.has(node["NE Name"]));
  placeRemainingComponents(positions, remaining, layoutLinks, width, height);

  layoutNodes.forEach((node, index) => {
    const name = node["NE Name"];
    if (positions.has(name)) return;
    const angle = (Math.PI * 2 * index) / Math.max(1, layoutNodes.length);
    const r = Math.min(width, height) * 0.32;
    positions.set(name, {
      x: width / 2 + Math.cos(angle) * r,
      y: height / 2 + Math.sin(angle) * r
    });
  });
}

function logicRingChainPaths(nodeSet) {
  if (!state.ringChains.length) return [];
  const paths = [];
  state.ringChains.forEach((row, index) => {
    const rowKey = ringChainRowKey(row, index);
    const members = (state.indexes.ringChainMembersByName.get(rowKey) || parseMemberPath(row.Member_path))
      .filter(name => nodeSet.has(name));
    const uniqueMembers = members.filter((name, memberIndex) => memberIndex === 0 || name !== members[memberIndex - 1]);
    if (uniqueMembers.length < 2) return;
    const category = String(row.Category || "").trim().toLowerCase() === "ring" ? "ring" : "link";
    paths.push({
      category,
      name: row.Name || row.Label || rowKey,
      group: row.Belong_agg || row.Uplink_pair || row.Root1 && row.Root2 && `${row.Root1}***${row.Root2}` || rowKey,
      members: uniqueMembers
    });
  });
  return paths.sort((a, b) => {
    if (a.category !== b.category) return a.category === "ring" ? -1 : 1;
    return b.members.length - a.members.length || String(a.name).localeCompare(String(b.name));
  });
}

function placeRingChainInitialPositions(accum, paths, width, height) {
  const groups = [...groupBy(paths, path => path.group || path.name).values()]
    .sort((a, b) => String(a[0].group || a[0].name).localeCompare(String(b[0].group || b[0].name)));
  const count = groups.length;
  const columns = Math.max(1, Math.ceil(Math.sqrt(count * (width / Math.max(1, height)))));
  const rows = Math.max(1, Math.ceil(count / columns));
  const cellW = width / columns;
  const cellH = height / rows;
  const padX = Math.min(90, cellW * 0.16);
  const padY = Math.min(72, cellH * 0.16);

  groups.forEach((groupPaths, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cx = col * cellW + cellW / 2;
    const cy = row * cellH + cellH / 2;
    const rx = Math.max(160, cellW / 2 - padX);
    const ry = Math.max(108, cellH / 2 - padY);
    const rings = groupPaths.filter(path => path.category === "ring");
    const chains = groupPaths.filter(path => path.category !== "ring");
    const primaryRing = rings[0] || groupPaths[0];
    placePathAsRing(accum, primaryRing.members, cx, cy, rx, ry);
    chains.forEach((path, chainIndex) => {
      const inset = 0.34 + chainIndex * 0.13;
      placePathAsChain(accum, path.members, cx, cy + (chainIndex % 2 ? -ry * 0.18 : ry * 0.18), rx * (1 - inset), ry * 0.48);
    });
    rings.slice(1).forEach((path, ringIndex) => {
      const scale = 0.78 - ringIndex * 0.08;
      placePathAsRing(accum, path.members, cx, cy, rx * Math.max(0.52, scale), ry * Math.max(0.52, scale));
    });
  });
}

function placePathAsRing(accum, members, cx, cy, rx, ry) {
  members.forEach((name, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, members.length);
    addPositionCandidate(accum, name, {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry
    });
  });
}

function placePathAsChain(accum, members, cx, cy, rx, ry) {
  members.forEach((name, index) => {
    const ratio = members.length === 1 ? 0.5 : index / (members.length - 1);
    const x = cx - rx + ratio * rx * 2;
    const wave = Math.sin(ratio * Math.PI) * ry * 0.36;
    const y = cy + (index % 2 ? -wave : wave) * 0.42;
    addPositionCandidate(accum, name, { x, y });
  });
}

function addPositionCandidate(accum, name, point) {
  if (!accum.has(name)) accum.set(name, []);
  accum.get(name).push(point);
}

function placeRemainingComponents(positions, nodes, links, width, height) {
  if (!nodes.length) return;
  const nodeSet = new Set(nodes.map(node => node["NE Name"]));
  const components = logicConnectedComponents(nodes, links)
    .sort((a, b) => b.length - a.length || String(a[0]["NE Name"]).localeCompare(String(b[0]["NE Name"])));
  const count = components.length;
  const columns = Math.max(1, Math.ceil(Math.sqrt(count * (width / Math.max(1, height)))));
  const rows = Math.max(1, Math.ceil(count / columns));
  const cellW = width / columns;
  const cellH = height / rows;

  components.forEach((component, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cx = col * cellW + cellW / 2;
    const cy = row * cellH + cellH / 2;
    const radius = Math.max(46, Math.min(cellW, cellH) * 0.32);
    const sorted = component.slice().sort((a, b) => String(a["NE Name"]).localeCompare(String(b["NE Name"])));
    sorted.forEach((node, nodeIndex) => {
      if (!nodeSet.has(node["NE Name"])) return;
      const angle = -Math.PI / 2 + (Math.PI * 2 * nodeIndex) / Math.max(1, sorted.length);
      positions.set(node["NE Name"], {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    });
  });
}

function logicConnectedComponents(nodes, links) {
  const nodeByName = new Map(nodes.map(node => [node["NE Name"], node]));
  const adjacency = new Map(nodes.map(node => [node["NE Name"], new Set()]));
  buildLogicLayoutEdges(nodes, links).forEach(edge => {
    if (!adjacency.has(edge.srcName) || !adjacency.has(edge.sinkName)) return;
    adjacency.get(edge.srcName).add(edge.sinkName);
    adjacency.get(edge.sinkName).add(edge.srcName);
  });

  const seen = new Set();
  const components = [];
  nodes.forEach(node => {
    const start = node["NE Name"];
    if (seen.has(start)) return;
    const queue = [start];
    const component = [];
    seen.add(start);
    while (queue.length) {
      const name = queue.shift();
      const item = nodeByName.get(name);
      if (item) component.push(item);
      (adjacency.get(name) || []).forEach(next => {
        if (seen.has(next)) return;
        seen.add(next);
        queue.push(next);
      });
    }
    components.push(component);
  });
  return components;
}

function computeRingAwareLayout(positions, width, height, layoutNodes) {
  const peNodes = layoutNodes
    .filter(node => String(node.Role || "").toUpperCase() === "PE")
    .sort((a, b) => String(a["NE Name"]).localeCompare(String(b["NE Name"])));
  const asgNodes = layoutNodes.filter(node => String(node.Role || "").toUpperCase() === "ASG");
  const csgNodes = layoutNodes.filter(node => String(node.Role || "").toUpperCase() === "CSG");
  const asgRings = [...groupBy(asgNodes, node => node["Ring ID"] || node.Region || "ASG").entries()].sort(([a], [b]) => a.localeCompare(b));
  const csgRings = [...groupBy(csgNodes, node => node["Ring ID"] || node.Region || "CSG").entries()].sort(([a], [b]) => a.localeCompare(b));
  const centerX = width / 2;
  const peY = height * 0.14;
  const peRx = Math.min(300, width * 0.22);
  const peRy = 58;

  peNodes.forEach((node, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, peNodes.length);
    positions.set(node["NE Name"], {
      x: centerX + Math.cos(angle) * peRx,
      y: peY + Math.sin(angle) * peRy
    });
  });

  const asgBandTop = height * 0.30;
  const asgColWidth = (width - 120) / Math.max(1, asgRings.length);
  const asgCenters = new Map();
  asgRings.forEach(([ringId, nodes], index) => {
    const cx = 60 + asgColWidth * (index + 0.5);
    const cy = asgBandTop + (index % 2) * 34;
    asgCenters.set(ringId, { x: cx, y: cy });
    placeNodesOnArc(positions, nodes, cx, cy, Math.min(70, asgColWidth * 0.32), 44, -150, -30);
  });

  const csgColWidth = (width - 100) / Math.max(1, asgRings.length);
  csgRings.forEach(([ringId, nodes], index) => {
    const regionIndex = Math.min(asgRings.length - 1, Math.floor(index / 3));
    const localIndex = index % 3;
    const cx = 50 + csgColWidth * (regionIndex + 0.5);
    const cy = height * (0.52 + localIndex * 0.145);
    placeNodesOnArc(positions, nodes, cx, cy, Math.min(76, csgColWidth * 0.35), 40, 205, 335);
  });

  const otherNodes = layoutNodes.filter(node => !positions.has(node["NE Name"]));
  placeNodesInGrid(positions, otherNodes, width * 0.08, height * 0.90, width * 0.84, 40, 9);
}

function computeFallbackLayeredLayout(positions, width, height, layoutNodes) {
  const roleRows = [
    { role: "PE", y: height * 0.18 },
    { role: "ASG", y: height * 0.45 },
    { role: "CSG", y: height * 0.74 },
    { role: "OTHER", y: height * 0.90 }
  ];
  const marginX = 70;
  const minColWidth = 160;

  roleRows.forEach(row => {
    const rowNodes = layoutNodes.filter(node => {
      const role = String(node.Role || "").toUpperCase();
      return row.role === "OTHER" ? !ROLE_ORDER.includes(role) : role === row.role;
    });
    const groups = groupBy(rowNodes, node => node.Region || "Default");
    const groupNames = [...groups.keys()].sort();
    const colWidth = Math.max(minColWidth, (width - marginX * 2) / Math.max(1, groupNames.length));

    groupNames.forEach((groupName, groupIndex) => {
      const nodes = groups.get(groupName).slice().sort((a, b) => String(a["NE Name"]).localeCompare(String(b["NE Name"])));
      const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
      const rows = Math.max(1, Math.ceil(nodes.length / columns));
      const cellX = Math.min(70, colWidth / Math.max(1, columns));
      const cellY = row.role === "CSG" ? 34 : 42;
      const startX = marginX + groupIndex * colWidth + Math.max(26, (colWidth - (columns - 1) * cellX) / 2);
      const startY = row.y - ((rows - 1) * cellY) / 2;

      nodes.forEach((node, index) => {
        const c = index % columns;
        const r = Math.floor(index / columns);
        positions.set(node["NE Name"], {
          x: clamp(startX + c * cellX, 42, width - 190),
          y: clamp(startY + r * cellY, 40, height - 40)
        });
      });
    });
  });
}

function placeNodesOnArc(positions, nodes, cx, cy, rx, ry, startDeg, endDeg) {
  const sorted = nodes.slice().sort((a, b) => String(a["NE Name"]).localeCompare(String(b["NE Name"])));
  sorted.forEach((node, index) => {
    const ratio = sorted.length === 1 ? 0.5 : index / (sorted.length - 1);
    const angle = (startDeg + (endDeg - startDeg) * ratio) * Math.PI / 180;
    positions.set(node["NE Name"], {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry
    });
  });
}

function placeNodesInGrid(positions, nodes, x, y, width, rowGap, columns) {
  nodes.forEach((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    positions.set(node["NE Name"], {
      x: x + (width / Math.max(1, columns - 1)) * col,
      y: y + row * rowGap
    });
  });
}

function hasPositionsFor(nodes) {
  return nodes.every(node => state.logic.positions.has(node["NE Name"]));
}

function logicLayoutKey(nodes, links, isolatedCount) {
  const layoutVersion = "logic-v2-ring-chain-first";
  const names = nodes.map(node => node["NE Name"]).sort().join("|");
  const edgeKeys = links.map(link => linkKey(link)).sort().join("|");
  const nodeSet = new Set(nodes.map(node => node["NE Name"]));
  const pathKeys = logicRingChainPaths(nodeSet)
    .map(path => `${path.category}:${path.name}:${path.members.join(">")}`)
    .sort()
    .join("|");
  return `${layoutVersion}:${nodes.length}:${links.length}:${isolatedCount}:${names}:${edgeKeys}:${pathKeys}`;
}

function getIsolatedLayoutMetrics(count, width, height, connectedCount) {
  if (!count) return { bandTop: height, bandHeight: 0, columns: 1, cellW: 120, cellH: 26 };

  const cellW = 118;
  const cellH = 26;
  const columns = Math.max(1, Math.floor((width - 80) / cellW));
  const rows = Math.ceil(count / columns);
  const desired = rows * cellH + 52;
  const maxBand = connectedCount ? height * 0.45 : height - 40;
  const bandHeight = clamp(desired, 110, maxBand);
  return {
    bandTop: height - bandHeight,
    bandHeight,
    columns,
    cellW,
    cellH
  };
}

function layoutIsolatedNodes(nodes, width, height, layout) {
  if (!nodes.length) return;

  const sorted = nodes.slice().sort((a, b) => String(a["NE Name"]).localeCompare(String(b["NE Name"])));
  const bandTop = layout.bandTop;
  const bandHeight = layout.bandHeight;
  const cellW = layout.cellW;
  const cellH = layout.cellH;
  const columns = layout.columns;
  const startX = 44;
  const startY = bandTop + 24;
  sorted.forEach((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const rowOffset = (row % 2) * 10;
    state.logic.positions.set(node["NE Name"], {
      x: clamp(startX + col * cellW + rowOffset, 36, width - 170),
      y: clamp(startY + row * cellH, bandTop + 20, bandTop + bandHeight)
    });
  });
}

function svgShapeMarkup(shape, radius, fill) {
  const common = `class="core" fill="${escapeAttr(fill)}"`;
  if (shape === "square") {
    const size = radius * 1.72;
    return `<rect ${common} x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="2"></rect>`;
  }
  if (shape === "diamond") {
    const r = radius * 1.18;
    return `<polygon ${common} points="0,${-r} ${r},0 0,${r} ${-r},0"></polygon>`;
  }
  if (shape === "triangle") {
    const r = radius * 1.18;
    return `<polygon ${common} points="0,${-r} ${r},${r * 0.86} ${-r},${r * 0.86}"></polygon>`;
  }
  return `<circle ${common} r="${radius}"></circle>`;
}

function buildLogicLayoutEdges(layoutNodes, layoutLinks) {
  const nodeSet = new Set(layoutNodes.map(node => node["NE Name"]));
  const edges = [];
  const seen = new Set();
  const addEdge = (srcName, sinkName, type, virtual = false) => {
    if (!nodeSet.has(srcName) || !nodeSet.has(sinkName) || srcName === sinkName) return;
    const key = [srcName, sinkName].sort().join("::");
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ srcName, sinkName, type, virtual });
  };

  layoutLinks.forEach(link => {
    addEdge(link["Src NE Name"], link["Sink NE Name"], link["Link Type"] || "Link", false);
  });
  logicRingChainPaths(nodeSet).forEach(path => {
    for (let i = 1; i < path.members.length; i++) {
      addEdge(path.members[i - 1], path.members[i], path.category === "ring" ? "RingChain-Ring" : "RingChain-Link", true);
    }
    if (path.category === "ring" && path.members.length > 2) {
      addEdge(path.members[path.members.length - 1], path.members[0], "RingChain-Ring", true);
    }
  });
  return edges;
}

function applyKamadaKawaiLayout(positions, width, height, layoutNodes, layoutLinks) {
  const positioned = layoutNodes.filter(node => positions.has(node["NE Name"]));
  if (positioned.length < 2) return;

  const edges = buildLogicLayoutEdges(layoutNodes, layoutLinks)
    .filter(edge => positions.has(edge.srcName) && positions.has(edge.sinkName));
  const components = logicConnectedComponents(positioned, edges.map(edge => ({
    "Src NE Name": edge.srcName,
    "Sink NE Name": edge.sinkName,
    "Link Type": edge.type
  }))).filter(component => component.length > 1);

  components.forEach(component => {
    const names = component.map(node => node["NE Name"]);
    const componentEdges = edges.filter(edge => names.includes(edge.srcName) && names.includes(edge.sinkName));
    optimizeKamadaKawaiComponent(positions, names, componentEdges, width, height);
  });
}

function optimizeKamadaKawaiComponent(positions, names, edges, width, height) {
  if (names.length < 2) return;
  const distances = logicGraphDistances(names, edges);
  const area = width * height;
  const baseLength = Math.sqrt(area / Math.max(1, names.length)) * 0.46;
  const matrices = buildKamadaKawaiMatrices(names, distances, baseLength);
  const maxOuter = names.length > 120 ? 180 : 260;
  const maxInner = 16;
  const epsilon = 0.08;

  for (let outer = 0; outer < maxOuter; outer++) {
    let targetIndex = -1;
    let targetDelta = 0;
    for (let i = 0; i < names.length; i++) {
      const gradient = kamadaKawaiGradient(positions, names, matrices, i);
      if (gradient.delta > targetDelta) {
        targetDelta = gradient.delta;
        targetIndex = i;
      }
    }
    if (targetIndex < 0 || targetDelta < epsilon) break;

    for (let inner = 0; inner < maxInner; inner++) {
      const step = kamadaKawaiNewtonStep(positions, names, matrices, targetIndex);
      if (!step || Math.abs(step.dx) + Math.abs(step.dy) < 0.01) break;
      const point = positions.get(names[targetIndex]);
      point.x = clamp(point.x + step.dx, 42, width - logicLabelWidth(names[targetIndex]));
      point.y = clamp(point.y + step.dy, 42, height - 46);
      const gradient = kamadaKawaiGradient(positions, names, matrices, targetIndex);
      if (gradient.delta < epsilon) break;
    }
  }
}

function buildKamadaKawaiMatrices(names, distances, baseLength) {
  const length = new Map();
  const strength = new Map();
  names.forEach((a, i) => {
    for (let j = i + 1; j < names.length; j++) {
      const b = names[j];
      const key = [a, b].sort().join("::");
      const graphDistance = Math.max(1, distances.get(key) || 5);
      length.set(key, Math.min(baseLength * graphDistance, baseLength * 5));
      strength.set(key, 1 / (graphDistance * graphDistance));
    }
  });
  return { length, strength };
}

function kamadaKawaiGradient(positions, names, matrices, index) {
  const name = names[index];
  const point = positions.get(name);
  let gx = 0;
  let gy = 0;
  for (let i = 0; i < names.length; i++) {
    if (i === index) continue;
    const otherName = names[i];
    const other = positions.get(otherName);
    const key = [name, otherName].sort().join("::");
    const k = matrices.strength.get(key) || 0;
    const l = matrices.length.get(key) || 1;
    const dx = point.x - other.x;
    const dy = point.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const factor = k * (1 - l / dist);
    gx += factor * dx;
    gy += factor * dy;
  }
  return { gx, gy, delta: Math.sqrt(gx * gx + gy * gy) };
}

function kamadaKawaiNewtonStep(positions, names, matrices, index) {
  const name = names[index];
  const point = positions.get(name);
  let gx = 0;
  let gy = 0;
  let hxx = 0;
  let hyy = 0;
  let hxy = 0;
  for (let i = 0; i < names.length; i++) {
    if (i === index) continue;
    const otherName = names[i];
    const other = positions.get(otherName);
    const key = [name, otherName].sort().join("::");
    const k = matrices.strength.get(key) || 0;
    const l = matrices.length.get(key) || 1;
    const dx = point.x - other.x;
    const dy = point.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const dist3 = Math.max(0.000001, dist * dist * dist);
    const factor = k * (1 - l / dist);
    gx += factor * dx;
    gy += factor * dy;
    hxx += k * (1 - (l * dy * dy) / dist3);
    hyy += k * (1 - (l * dx * dx) / dist3);
    hxy += k * ((l * dx * dy) / dist3);
  }
  const det = hxx * hyy - hxy * hxy;
  if (!Number.isFinite(det) || Math.abs(det) < 0.000001) return null;
  const dx = (-gx * hyy + gy * hxy) / det;
  const dy = (gx * hxy - gy * hxx) / det;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  const maxStep = 36;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > maxStep) {
    return { dx: (dx / len) * maxStep, dy: (dy / len) * maxStep };
  }
  return { dx, dy };
}

function logicGraphDistances(names, edges) {
  const adjacency = new Map(names.map(name => [name, new Set()]));
  edges.forEach(edge => {
    if (!adjacency.has(edge.srcName) || !adjacency.has(edge.sinkName)) return;
    adjacency.get(edge.srcName).add(edge.sinkName);
    adjacency.get(edge.sinkName).add(edge.srcName);
  });

  const distances = new Map();
  names.forEach(start => {
    const queue = [start];
    const seen = new Map([[start, 0]]);
    while (queue.length) {
      const name = queue.shift();
      const distance = seen.get(name);
      (adjacency.get(name) || []).forEach(next => {
        if (seen.has(next)) return;
        seen.set(next, distance + 1);
        queue.push(next);
      });
    }
    names.forEach(end => {
      if (start === end) return;
      const key = [start, end].sort().join("::");
      if (!distances.has(key)) distances.set(key, seen.get(end) || 5);
    });
  });
  return distances;
}

function applySpringLayout(positions, width, height, layoutNodes, layoutLinks) {
  const nodes = layoutNodes.filter(node => positions.has(node["NE Name"]));
  const names = nodes.map(node => node["NE Name"]);
  const edges = buildLogicLayoutEdges(layoutNodes, layoutLinks)
    .filter(edge => positions.has(edge.srcName) && positions.has(edge.sinkName));
  if (!nodes.length) return;

  const area = width * height;
  const k = Math.sqrt(area / Math.max(1, nodes.length)) * 0.78;
  const ideal = {
    "PE-FullMesh": k * 1.35,
    "ASG-Ring": k * 0.92,
    "CSG-Ring": k * 0.72,
    "ASG-Uplink": k * 1.28,
    "CSG-Uplink": k * 1.05,
    "RingChain-Ring": k * 0.82,
    "RingChain-Link": k * 0.95
  };
  const anchors = new Map();
  nodes.forEach(node => {
    const p = positions.get(node["NE Name"]);
    anchors.set(node["NE Name"], { x: p.x, y: p.y });
  });

  const iterations = nodes.length > 300 ? 90 : nodes.length > 180 ? 120 : 180;
  let temperature = Math.min(width, height) * 0.08;
  for (let step = 0; step < iterations; step++) {
    const disp = new Map(names.map(name => [name, { x: 0, y: 0 }]));

    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = positions.get(names[i]);
        const b = positions.get(names[j]);
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const repulse = (k * k) / dist;
        dx /= dist;
        dy /= dist;
        disp.get(names[i]).x += dx * repulse;
        disp.get(names[i]).y += dy * repulse;
        disp.get(names[j]).x -= dx * repulse;
        disp.get(names[j]).y -= dy * repulse;
      }
    }

    edges.forEach(({ srcName, sinkName, type }) => {
      const src = positions.get(srcName);
      const sink = positions.get(sinkName);
      const target = ideal[type] || k;
      let dx = sink.x - src.x;
      let dy = sink.y - src.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const attract = ((dist - target) * Math.abs(dist - target)) / Math.max(k, target) * 0.22;
      dx /= dist;
      dy /= dist;
      disp.get(srcName).x += dx * attract;
      disp.get(srcName).y += dy * attract;
      disp.get(sinkName).x -= dx * attract;
      disp.get(sinkName).y -= dy * attract;
    });

    names.forEach(name => {
      const p = positions.get(name);
      const d = disp.get(name);
      const anchor = anchors.get(name);
      d.x += (anchor.x - p.x) * 0.035;
      d.y += (anchor.y - p.y) * 0.035;
    });

    moveLogicPositions(positions, names, disp, width, height, temperature);
    temperature *= 0.965;
  }
}

function moveLogicPositions(positions, names, disp, width, height, temperature) {
  names.forEach(name => {
    const p = positions.get(name);
    const d = disp.get(name);
    const len = Math.sqrt(d.x * d.x + d.y * d.y) || 0.01;
    const limited = Math.min(len, temperature);
    const labelPad = logicLabelWidth(name);
    p.x = clamp(p.x + (d.x / len) * limited, 42, width - labelPad);
    p.y = clamp(p.y + (d.y / len) * limited, 42, height - 46);
  });
}

function resolveLogicNodeOverlap(positions, width, height, layoutNodes, layoutLinks, rounds = 6) {
  const nodes = layoutNodes.filter(node => positions.has(node["NE Name"]));
  const names = nodes.map(node => node["NE Name"]);
  if (names.length < 2) return;
  const degreeLinks = buildLogicLayoutEdges(layoutNodes, layoutLinks).map(edge => ({
    "Src NE Name": edge.srcName,
    "Sink NE Name": edge.sinkName
  }));
  const degreeMap = getNodeDegreeMap(degreeLinks);

  for (let round = 0; round < rounds; round++) {
    let moved = false;
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const aName = names[i];
        const bName = names[j];
        const a = positions.get(aName);
        const b = positions.get(bName);
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (!dist) {
          dx = ((i % 3) - 1) || 1;
          dy = ((j % 3) - 1) || -1;
          dist = Math.sqrt(dx * dx + dy * dy);
        }
        const minDistance = logicNodeRadius(degreeMap.get(aName) || 0, nodes[i])
          + logicNodeRadius(degreeMap.get(bName) || 0, nodes[j])
          + Math.min(92, (logicLabelWidth(aName) + logicLabelWidth(bName)) * 0.22)
          + 12;
        if (dist >= minDistance) continue;
        const push = (minDistance - dist) / 2 + 0.5;
        const ux = dx / dist;
        const uy = dy / dist;
        a.x = clamp(a.x - ux * push, 42, width - logicLabelWidth(aName));
        a.y = clamp(a.y - uy * push, 42, height - 46);
        b.x = clamp(b.x + ux * push, 42, width - logicLabelWidth(bName));
        b.y = clamp(b.y + uy * push, 42, height - 46);
        moved = true;
      }
    }
    if (!moved) break;
  }
}

function normalizeLogicPositions(positions, width, height, layoutNodes) {
  const nodes = layoutNodes.filter(node => positions.has(node["NE Name"]));
  if (!nodes.length) return;
  const xs = nodes.map(node => positions.get(node["NE Name"]).x);
  const ys = nodes.map(node => positions.get(node["NE Name"]).y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 120;
  const labelPad = 220;
  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);
  const scale = Math.min(1, (width - pad * 2 - labelPad) / rangeX, (height - pad * 2) / rangeY);
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const usedW = rangeX * safeScale;
  const usedH = rangeY * safeScale;
  const offsetX = pad + Math.max(0, (width - labelPad - pad * 2 - usedW) / 2);
  const offsetY = pad + Math.max(0, (height - pad * 2 - usedH) / 2);
  nodes.forEach(node => {
    const name = node["NE Name"];
    const point = positions.get(name);
    point.x = offsetX + (point.x - minX) * safeScale;
    point.y = offsetY + (point.y - minY) * safeScale;
  });
}

function logicLabelWidth(name) {
  return clamp(String(name || "").length * 6.5 + 42, 90, 190);
}

function locateRuleFromQuickInput() {
  const rawKeyword = el.searchInput.value.trim();
  if (!rawKeyword) return null;
  return normalizeRuleGroup({
    source: CONDITION_SOURCES.NODES,
    mode: "all",
    conditions: [{ field: "NE Name", op: "contains", value: rawKeyword }]
  });
}

function locateNode() {
  if (!state.nodes.length) {
    setMessage(el.locateMessage, t("locateNoData"), "error");
    return;
  }

  const rule = locateRuleFromQuickInput();
  if (!rule) {
    setMessage(el.locateMessage, t("locateNoCondition"), "error");
    return;
  }

  applyLocateRule(rule, true);
}

function applyLocateRule(rule, syncQuickInput = false) {
  const group = normalizeRuleGroup(rule);
  if (!group) {
    setMessage(el.locateMessage, t("locateNoCondition"), "error");
    return;
  }

  const result = locateMatchesForRule(group);
  state.locateRule = group;
  state.locatedNames = result.names;
  state.locatedLinkKeys = result.linkKeys;
  state.selectedName = "";
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  state.selectedCoordinateKey = "";

  if (!result.names.size) {
    setMessage(el.locateMessage, t("locateMissing"), "error");
    renderTopologies();
    return;
  }

  group.conditions.forEach(condition => rememberSearchHistory("locate", condition.value));
  if (syncQuickInput) rememberConditionHistory("locate", group);

  const firstName = [...result.names][0];
  const firstNode = state.indexes.nodeByName.get(firstName);
  if (result.names.size === 1 && firstNode) {
    state.selectedName = firstName;
    setMessage(el.locateMessage, t("located", { name: firstName }), "ok");
  } else {
    setMessage(el.locateMessage, t("locatedBatch", { devices: result.names.size, links: result.linkKeys.size }), "ok");
  }

  focusLocatedNodes(result.nodes);

  if (result.names.size === 1 && state.view === "gis" && firstNode && hasCoord(firstNode)) {
    const visibleNodes = getVisibleData().nodes;
    const colocated = visibleNodes.filter(item => hasCoord(item) && coordinateKey(item) === coordinateKey(firstNode));
    if (colocated.length > 1) showColocatedDetails({ key: coordinateKey(firstNode), lat: Number(firstNode.Latitude), lng: Number(firstNode.Longitude), nodes: colocated }, firstName);
    else showDetails(firstNode);
  } else if (result.names.size === 1 && firstNode) {
    showDetails(firstNode);
  }
  renderTopologies();
}

function locateMatchesForRule(rule) {
  const group = normalizeRuleGroup(rule);
  const visibleData = getVisibleData();
  const rawNames = nodeNamesForRule(group, visibleData.nodes, visibleData.links);
  const names = intersectSets(rawNames, visibleData.visibleNames);
  const nodes = [...names].map(name => state.indexes.nodeByName.get(name)).filter(Boolean);
  const linkKeys = new Set();

  if (names.size > 1) {
    if (group && group.source === CONDITION_SOURCES.LINKS) {
      linkKeysForRule(group, visibleData.links).forEach(key => linkKeys.add(key));
    } else {
      visibleData.links.forEach(link => {
        if (names.has(link["Src NE Name"]) && names.has(link["Sink NE Name"])) {
          linkKeys.add(linkKey(link));
        }
      });
    }
  }

  return { names, nodes, linkKeys };
}

function clearLocateRule() {
  state.locateRule = null;
  state.locatedNames = new Set();
  state.locatedLinkKeys = new Set();
  state.selectedName = "";
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  state.selectedCoordinateKey = "";
  el.searchInput.value = "";
  setMessage(el.locateMessage, "", "");
  renderTopologies();
}

function focusLocatedNodes(nodes) {
  const validNodes = nodes.filter(hasCoord);
  if (state.view === "gis") {
    if (!state.map) return;
    const points = validNodes.map(node => [Number(node.Latitude), Number(node.Longitude)]);
    if (!points.length) {
      setMessage(el.locateMessage, t("locateMissingCoord", { devices: nodes.length }), "warning");
    } else if (points.length === 1) {
      state.map.setView(points[0], 14);
    } else {
      state.map.fitBounds(points, { padding: [70, 70], maxZoom: 14 });
    }
    return;
  }

  focusLogicOnNodes(nodes);
}

function centerLogicOn(name) {
  const position = state.logic.positions.get(name);
  if (!position) return;

  const rect = el.logicCanvas.getBoundingClientRect();
  state.logic.panX = rect.width / 2 - position.x * state.logic.zoom;
  state.logic.panY = rect.height / 2 - position.y * state.logic.zoom;
}

function fitLogicToBounds(nodes = getVisibleData().nodes, padding = 72, maxZoom = 1.6) {
  const points = nodes
    .map(node => state.logic.positions.get(node["NE Name"]))
    .filter(Boolean);
  const rect = el.logicCanvas.getBoundingClientRect();
  if (!points.length || !rect.width || !rect.height) {
    state.logic.zoom = 1;
    state.logic.panX = 0;
    state.logic.panY = 0;
    return;
  }
  const minX = Math.min(...points.map(point => point.x));
  const maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const boxWidth = Math.max(80, maxX - minX);
  const boxHeight = Math.max(80, maxY - minY);
  const nextZoom = clamp(Math.min((rect.width - padding * 2) / boxWidth, (rect.height - padding * 2) / boxHeight), 0.12, maxZoom);
  state.logic.zoom = Number.isFinite(nextZoom) ? nextZoom : 1;
  state.logic.panX = rect.width / 2 - ((minX + maxX) / 2) * state.logic.zoom;
  state.logic.panY = rect.height / 2 - ((minY + maxY) / 2) * state.logic.zoom;
}

function focusLogicOnNodes(nodes) {
  const names = nodes.map(node => node["NE Name"]).filter(Boolean);
  if (!names.length) return;
  const data = getVisibleData();
  if (!names.every(name => state.logic.positions.has(name))) {
    renderLogic(data);
  }
  if (names.length === 1) {
    centerLogicOn(names[0]);
    return;
  }

  fitLogicToBounds(nodes, 80, 2.2);
}


function fitCurrentView() {
  if (state.view === "gis") fitMap();
  else {
    fitLogicToBounds(getVisibleData().nodes);
    renderLogic(getVisibleData());
  }
}

function fitMap() {
  if (!state.map) return;

  const data = getVisibleData();
  const sourceNodes = data.nodes.length > PERF.mapNodeLimit ? data.nodes.slice(0, PERF.mapNodeLimit) : data.nodes;
  const points = sourceNodes
    .filter(hasCoord)
    .map(node => [Number(node.Latitude), Number(node.Longitude)]);

  if (points.length === 1) state.map.setView(points[0], 13);
  else if (points.length > 1) state.map.fitBounds(points, { padding: [50, 50] });
}

function focusMainRuleResult(kind) {
  if (!state.map || state.view !== "gis") return;
  const data = getVisibleData();
  const nodes = kind === "filter"
    ? data.nodes
    : mainNodesForHighlight(data);
  focusLeafletMapOnNodes(state.map, nodes, { padding: [70, 70], maxZoom: 14 });
}

function mainNodesForHighlight(data) {
  if (!data.highlightNames || !data.highlightNames.size && !data.highlightLinkKeys.size) return [];
  const names = new Set(data.highlightNames);
  data.links.forEach(link => {
    if (!data.highlightLinkKeys.has(linkKey(link))) return;
    names.add(link["Src NE Name"]);
    names.add(link["Sink NE Name"]);
  });
  return [...names].map(name => data.nodeByName.get(name)).filter(Boolean);
}

function focusLeafletMapOnNodes(map, nodes, options = {}) {
  if (!map || !Array.isArray(nodes)) return false;
  const points = nodes
    .filter(hasCoord)
    .map(node => [Number(node.Latitude), Number(node.Longitude)]);
  if (!points.length) return false;
  if (points.length === 1) map.setView(points[0], options.singleZoom || 14);
  else map.fitBounds(points, {
    padding: options.padding || [70, 70],
    maxZoom: options.maxZoom || 14
  });
  return true;
}

function showDetails(node) {
  state.selectedName = node["NE Name"];
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  state.selectedCoordinateKey = "";
  el.details.innerHTML = `<h3>${escapeHtml(node["NE Name"] || t("unnamedDevice"))}</h3><div class="kv">${
    state.nodeFields.map(field => `<div>${escapeHtml(field)}</div><div>${escapeHtml(node[field] ?? "")}</div>`).join("")
  }</div>`;
  el.details.classList.add("show");
}

function showColocatedDetails(group, focusName = "") {
  state.selectedCoordinateKey = group.key;
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  if (!focusName) state.selectedName = "";
  const sortedNodes = [...group.nodes].sort((a, b) => rolePriority(roleKey(a)) - rolePriority(roleKey(b)) || String(a["NE Name"]).localeCompare(String(b["NE Name"])));
  el.details.innerHTML = `<h3>${escapeHtml(t("colocatedDevices"))}</h3>
    <div class="colocated-summary">
      <div>${escapeHtml(t("colocatedDeviceCount", { count: group.nodes.length }))}</div>
      <div>${escapeHtml(t("colocatedRoleSummary", { text: roleSummaryText(group.nodes) }))}</div>
      <div>${escapeHtml(t("colocatedCoordinate", { lng: formatCoord(group.lng), lat: formatCoord(group.lat) }))}</div>
    </div>
    <div class="colocated-list">
      ${sortedNodes.map(node => {
        const name = node["NE Name"];
        const active = focusName && name === focusName;
        return `<button class="${active ? "active" : ""}" type="button" data-colocated-node="${escapeAttr(name)}">
          <span>${escapeHtml(name)}</span><em>${escapeHtml(roleKey(node))}</em>
        </button>`;
      }).join("")}
    </div>`;
  el.details.classList.add("show");
  el.details.querySelectorAll("[data-colocated-node]").forEach(button => {
    button.addEventListener("click", () => {
      const node = state.indexes.nodeByName.get(button.getAttribute("data-colocated-node"));
      if (node) {
        showDetails(node);
        renderTopologies();
      }
    });
  });
}

function rolePriority(role) {
  const priority = { PE: 0, ASG: 1, CSG: 2, OTHER: 3 };
  return priority[role] ?? priority.OTHER;
}

function showLinkDetails(link, options = {}) {
  state.selectedName = "";
  state.selectedCoordinateKey = "";
  const key = linkKey(link);
  state.selectedLinkKey = key;
  state.selectedRouteKey = options.route || routePointsForLink(link).length > 1 ? key : "";
  const title = `${link["Src NE Name"] || ""} - ${link["Sink NE Name"] || ""}`;
  el.details.innerHTML = `<h3>${escapeHtml(title)}</h3><div class="kv">${
    state.linkFields.map(field => `<div>${escapeHtml(field)}</div><div>${escapeHtml(link[field] ?? "")}</div>`).join("")
  }</div>`;
  el.details.classList.add("show");
}

function clearSelection() {
  const changed = Boolean(state.selectedName || state.selectedLinkKey || state.selectedRouteKey || state.selectedCoordinateKey || el.details.classList.contains("show"));
  state.selectedName = "";
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  state.selectedCoordinateKey = "";
  el.details.classList.remove("show");
  return changed;
}

function updateStats(data) {
  if (el.statVersion) el.statVersion.textContent = state.projectName || "-";
  el.statNodes.textContent = state.nodes.length;
  el.statLinks.textContent = state.links.length;
  el.statVisibleNodes.textContent = data.nodes.length;
  el.statVisibleLinks.textContent = data.links.length;
  const hasRingChains = state.ringChains.length > 0;
  if (el.statRingCard) el.statRingCard.classList.toggle("hidden", !hasRingChains);
  if (el.statChainCard) el.statChainCard.classList.toggle("hidden", !hasRingChains);
  if (hasRingChains) {
    const stats = ringChainStats();
    el.statRings.textContent = stats.rings;
    el.statChains.textContent = stats.chains;
  }
  const hasRingChainFilter = Array.isArray(data.filteredRingChains);
  if (el.statVisibleRingCard) el.statVisibleRingCard.classList.toggle("hidden", !hasRingChainFilter);
  if (el.statVisibleChainCard) el.statVisibleChainCard.classList.toggle("hidden", !hasRingChainFilter);
  if (hasRingChainFilter) {
    const stats = ringChainStats(data.filteredRingChains);
    el.statVisibleRings.textContent = stats.rings;
    el.statVisibleChains.textContent = stats.chains;
  }
}

function ringChainStats(rows = state.ringChains) {
  let rings = 0;
  let chains = 0;
  rows.forEach(row => {
    const category = String(row.Category || "").trim().toLowerCase();
    if (category === "ring") rings += 1;
    if (category === "link") chains += 1;
  });
  return { rings, chains };
}

function updateViewMessage(data) {
  if (!state.nodes.length) {
    el.viewMessage.textContent = t("waitUpload");
    return;
  }

  const missingCoord = state.quality.missingCoord;
  const brokenLinks = state.quality.brokenLinks;
  const parts = [t("viewStatus", {
    visibleDevices: data.nodes.length,
    devices: state.nodes.length,
    visibleLinks: data.links.length,
    links: state.links.length
  })];

  if (missingCoord) parts.push(t("invalidCoord", { count: missingCoord }));
  if (brokenLinks) parts.push(t("brokenLinks", { count: brokenLinks }));
  if (state.quality.missingRingChainMembers) parts.push(t("ringChainMemberMissing", { count: state.quality.missingRingChainMembers }));
  el.viewMessage.textContent = parts.join(state.lang === "zh" ? "，" : ", ");
}

function switchTable(table) {
  state.table = table;
  el.neTableBtn.classList.toggle("active", table === "nodes");
  el.linkTableBtn.classList.toggle("active", table === "links");
  updateTableFieldSelector();
  updateTable();
}

function getFilteredTableRows() {
  const rows = state.table === "nodes" ? state.nodes : state.links;
  const rule = { field: el.tableField.value, op: el.tableOp.value, value: el.tableValue.value };
  const shouldFilter = Boolean(el.tableValue.value) || rule.op === "empty" || rule.op === "notEmpty";
  return rows
    .map((row, index) => ({ row, index }))
    .filter(item => !shouldFilter || matchesRule(item.row, rule));
}

function updateTable() {
  const rows = state.table === "nodes" ? state.nodes : state.links;
  const fields = state.table === "nodes" ? state.nodeFields : state.linkFields;
  const filtered = getFilteredTableRows();

  updateDataSummary(filtered, rows, fields);

  if (!rows.length) {
    el.dataTable.innerHTML = `<tbody><tr><td>${t("noData")}</td></tr></tbody>`;
    return;
  }

  const rendered = filtered.slice(0, PERF.tableRenderLimit);
  const header = `<thead><tr>${fields.map(field => `<th>${escapeHtml(field)}</th>`).join("")}<th class="delete-cell">${t("operation")}</th></tr></thead>`;
  const notice = filtered.length > rendered.length
    ? `<caption>${escapeHtml(t("renderLimited", { shown: rendered.length, total: filtered.length }))}</caption>`
    : "";
  const body = `<tbody>${rendered.map(({ row, index }) => `<tr data-index="${index}">${
    fields.map(field => `<td><input class="cell-input" data-field="${escapeAttr(field)}" value="${escapeAttr(row[field] ?? "")}"></td>`).join("")
  }<td class="delete-cell"><button class="danger" type="button" data-delete="${index}">${t("delete")}</button></td></tr>`).join("")}</tbody>`;

  el.dataTable.innerHTML = notice + header + body;
  el.dataTable.querySelectorAll("button[data-delete]").forEach(button => {
    button.addEventListener("click", () => deleteTableRow(Number(button.getAttribute("data-delete"))));
  });
}

function updateDataSummary(filtered, rows, fields) {
  const tableName = state.table === "nodes" ? t("deviceTable") : t("linkTable");
  const quality = state.table === "nodes" ? getRoleDistributionText(rows) : getLinkQualityText(rows);
  el.dataSummary.innerHTML = [
    summaryItem(tableName, t("summaryTable")),
    summaryItem(filtered.length, t("summaryVisible")),
    summaryItem(rows.length, t("summaryTotal")),
    summaryItem(fields.length, t("summaryFields")),
    summaryItem(quality, t("summaryQuality"))
  ].join("");
}

function summaryItem(value, label) {
  return `<div class="summary-item"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`;
}

function getRoleDistributionText(rows) {
  const counts = {};
  rows.forEach(row => {
    const role = String(row.Role || "Other").toUpperCase();
    counts[role] = (counts[role] || 0) + 1;
  });
  const ordered = [...ROLE_ORDER, "OTHER"]
    .filter(role => counts[role])
    .map(role => `${role}:${counts[role]}`)
    .join(" ");
  return t("roleDistribution", { text: ordered || "0" });
}

function getLinkQualityText(rows) {
  const names = new Set(state.nodes.map(node => node["NE Name"]));
  const broken = rows.filter(link => !names.has(link["Src NE Name"]) || !names.has(link["Sink NE Name"])).length;
  return broken ? t("endpointMissing", { count: broken }) : t("linkEndpointsOk");
}

function addTableRow() {
  const fields = state.table === "nodes" ? state.nodeFields : state.linkFields;
  const row = {};
  fields.forEach(field => {
    row[field] = "";
  });

  if (state.table === "nodes") state.nodes.push(row);
  else state.links.push(row);

  updateTable();
}

function deleteTableRow(index) {
  if (state.table === "nodes") state.nodes.splice(index, 1);
  else state.links.splice(index, 1);
  applyTableEdits();
}

function applyTableEdits() {
  const rows = state.table === "nodes" ? state.nodes : state.links;

  el.dataTable.querySelectorAll("tbody tr[data-index]").forEach(tr => {
    const index = Number(tr.getAttribute("data-index"));
    const row = rows[index];
    if (!row) return;

    tr.querySelectorAll(".cell-input[data-field]").forEach(input => {
      row[input.getAttribute("data-field")] = input.value.trim();
    });
  });

  state.nodeFields = collectFields(state.nodes, REQUIRED_NE);
  state.linkFields = collectFields(state.links, REQUIRED_LINK);
  pruneNodeStyleRules();
  pruneLinkStyleRules();
  pruneRingChainStyleRules();
  rebuildIndexes();
  clearRingChainStyleCache();
  state.logic.positions = new Map();
  state.logic.layoutKey = "";
  persistActiveVersionState();
  renderVersionControls();
  refreshAll();
  setMessage(el.uploadMessage, t("editApplied"), "ok");
}

function linkKey(link) {
  return `${link["Src NE Name"] || ""}::${link["Sink NE Name"] || ""}`;
}

function linkPairKey(a, b) {
  return `${a || ""}::${b || ""}`;
}

function groupBy(items, getter) {
  const groups = new Map();
  items.forEach(item => {
    const key = String(getter(item) || "Default");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return groups;
}

function getNodeDegreeMap(links) {
  const degree = new Map();
  links.forEach(link => {
    const src = link["Src NE Name"];
    const sink = link["Sink NE Name"];
    degree.set(src, (degree.get(src) || 0) + 1);
    degree.set(sink, (degree.get(sink) || 0) + 1);
  });
  return degree;
}

function resolveLinkStyle(link) {
  const style = { ...DEFAULT_LINK_STYLE };
  state.appliedLinkStyleRules.forEach(rule => {
    if (!normalizeRuleGroup(rule) || !matchesRule(link, rule)) return;
    style.color = normalizeColor(rule.color, style.color);
    style.lineStyle = LINE_STYLE_VALUES.includes(rule.lineStyle) ? rule.lineStyle : style.lineStyle;
    style.width = LINE_WIDTH_VALUES.includes(rule.width) ? rule.width : style.width;
  });
  applyRingChainLinkStyle(link, style);

  return {
    color: style.color,
    weight: linkWeight(style.width),
    dashArray: linkDashArray(style.lineStyle)
  };
}

function applyRingChainLinkStyle(link, style) {
  if (!state.ringChains.length || !state.appliedRingChainStyleRules.length) return;

  const key = linkKey(link);
  const reverseKey = linkPairKey(link["Sink NE Name"], link["Src NE Name"]);
  const segmentStyles = getRingChainSegmentStyleMap();
  const matchedStyle = segmentStyles.get(key) || segmentStyles.get(reverseKey);
  if (!matchedStyle) return;
  style.color = normalizeColor(matchedStyle.color, style.color);
  style.lineStyle = LINE_STYLE_VALUES.includes(matchedStyle.lineStyle) ? matchedStyle.lineStyle : style.lineStyle;
  style.width = LINE_WIDTH_VALUES.includes(matchedStyle.width) ? matchedStyle.width : style.width;
}

function getRingChainSegmentStyleMap() {
  const key = JSON.stringify(state.appliedRingChainStyleRules) + `:${state.ringChains.length}`;
  if (state.ringChainStyleCache.key === key) return state.ringChainStyleCache.styles;

  const styles = new Map();
  state.appliedRingChainStyleRules.forEach(rule => {
    const group = normalizeRuleGroup(rule);
    if (!group) return;
    state.ringChains.forEach((row, index) => {
      if (!matchesRule(row, group)) return false;
      const rowKey = ringChainRowKey(row, index);
      const segments = state.indexes.ringChainSegmentsByName.get(rowKey) || [];
      segments.forEach(segmentKey => {
        styles.set(segmentKey, {
          color: normalizeColor(rule.color, DEFAULT_LINK_STYLE.color),
          lineStyle: LINE_STYLE_VALUES.includes(rule.lineStyle) ? rule.lineStyle : DEFAULT_LINK_STYLE.lineStyle,
          width: LINE_WIDTH_VALUES.includes(rule.width) ? rule.width : DEFAULT_LINK_STYLE.width
        });
      });
    });
  });
  state.ringChainStyleCache = { key, styles };
  return styles;
}

function clearRingChainStyleCache() {
  state.ringChainStyleCache = { key: "", styles: new Map() };
}

function linkWeight(width) {
  if (width === "thin") return 1.7;
  if (width === "thick") return 4.2;
  return 2.8;
}

function linkDashArray(lineStyle) {
  if (lineStyle === "dash") return "8 6";
  if (lineStyle === "dot") return "2 5";
  return "";
}

function logicNodeRadius(degree, node) {
  const base = resolveNodeStyle(node).size;
  return clamp(base / 2 + Math.sqrt(degree) * 1.4, 4, 22);
}

function mapNodeRadius(degree, node, active) {
  const base = resolveNodeStyle(node).size;
  return clamp(base / 2 + Math.sqrt(degree) * 0.9 + (active ? 1.5 : 0), 4, 22);
}

function resolveNodeStyle(node) {
  const roleKey = String(node.Role || "").trim().toUpperCase();
  const style = { ...(state.roleStyles[roleKey] || state.roleStyles.OTHER || DEFAULT_NODE_STYLE) };
  state.appliedNodeStyleRules.forEach(rule => {
    if (!normalizeRuleGroup(rule) || !matchesRule(node, rule)) return;
    style.color = normalizeColor(rule.color, style.color);
    style.size = clamp(Number(rule.size) || style.size, 4, 40);
    style.shape = normalizeShape(rule.shape, style.shape);
    style.label = rule.label || rule.value || `${rule.field} ${rule.op}`;
  });
  return style;
}

function nodeShape(node) {
  return resolveNodeStyle(node).shape;
}

function nodeFill(node) {
  return resolveNodeStyle(node).color;
}

function cloneStyles(styles) {
  return Object.fromEntries(Object.entries(styles).map(([key, value]) => [key, { ...value }]));
}

function normalizeShape(shape, fallback) {
  return SHAPES.includes(shape) ? shape : fallback;
}

function normalizeColor(color, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(color || "")) ? color : fallback;
}

function updateNodeLegend() {
  if (!el.nodeLegend) return;

  el.nodeLegend.innerHTML = ROLE_ORDER.concat("OTHER").map(role => {
    const style = state.roleStyles[role] || DEFAULT_ROLE_STYLES.OTHER;
    const color = normalizeColor(style.color, DEFAULT_NODE_STYLE.color);
    const shape = normalizeShape(style.shape, DEFAULT_NODE_STYLE.shape);
    return `<span><i class="shape-${shape}" style="background:${escapeAttr(color)};color:${escapeAttr(color)}"></i><span>${escapeHtml(role)}</span></span>`;
  }).join("");
}

function parseRouteWkt(value) {
  const text = String(value || "").trim();
  if (!text) return [];

  const match = text.match(/^LINESTRING\s*[\(\uff08]\s*(.*?)\s*[\)\uff09]$/i);
  if (!match) return [];

  return match[1]
    .replaceAll("\uff0c", ",")
    .split(",")
    .map(pair => pair.trim().split(/\s+/).map(Number))
    .filter(coords => coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1]))
    .map(([lng, lat]) => [lat, lng]);
}

function routePointsForLink(link) {
  if (!link || typeof link !== "object") return [];
  if (ROUTE_POINTS_CACHE.has(link)) return ROUTE_POINTS_CACHE.get(link);

  const points = parseRouteWkt(link[ROUTE_WKT_FIELD]);
  ROUTE_POINTS_CACHE.set(link, points);
  return points;
}

function hasCoord(node) {
  return Number.isFinite(Number(node.Longitude)) && Number.isFinite(Number(node.Latitude));
}

function setMessage(target, text, type) {
  target.textContent = text;
  target.classList.remove("error", "ok", "warning");
  if (type) target.classList.add(type);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
