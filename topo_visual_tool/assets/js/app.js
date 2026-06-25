const REQUIRED_NE = ["NE Name", "Role", "Longitude", "Latitude"];
const REQUIRED_LINK = ["Src NE Name", "Sink NE Name"];
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
    sectionUpload: "数据上传",
    deviceTable: "网元表",
    linkTable: "链路表",
    parseUpload: "解析上传数据",
    loadMock: "加载 Mock",
    requiredFields: "必选字段：NE Name、Role、Longitude、Latitude、Src NE Name、Sink NE Name。",
    sectionStats: "统计",
    devices: "网元",
    links: "链路",
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
    fileReadFail: "读取文件失败。",
    xlsxMissing: "XLSX 解析库未加载，请确认网络可访问 CDN。",
    unsupportedFile: "仅支持 csv、xlsx、xls 文件。",
    mockLoaded: "Mock 数据已加载：{devices} 个网元，{links} 条链路。",
    tableEmpty: "{name}为空。",
    missingFields: "{name}缺少字段：{fields}",
    locateMissing: "未找到匹配网元。",
    located: "已定位：{name}",
    unnamedDevice: "未命名网元",
    viewStatus: "显示 {visibleDevices}/{devices} 网元，{visibleLinks}/{links} 链路",
    invalidCoord: "{count} 个网元坐标无效",
    brokenLinks: "{count} 条链路端点缺失",
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
    sectionUpload: "Data Upload",
    deviceTable: "Device Table",
    linkTable: "Link Table",
    parseUpload: "Parse Upload",
    loadMock: "Load Mock",
    requiredFields: "Required fields: NE Name, Role, Longitude, Latitude, Src NE Name, Sink NE Name.",
    sectionStats: "Statistics",
    devices: "Devices",
    links: "Links",
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
    fileReadFail: "Failed to read file.",
    xlsxMissing: "XLSX parser is not loaded. Please check CDN network access.",
    unsupportedFile: "Only csv, xlsx and xls files are supported.",
    mockLoaded: "Mock data loaded: {devices} devices, {links} links.",
    tableEmpty: "{name} is empty.",
    missingFields: "{name} is missing fields: {fields}",
    locateMissing: "No matching device found.",
    located: "Located: {name}",
    unnamedDevice: "Unnamed device",
    viewStatus: "Showing {visibleDevices}/{devices} devices, {visibleLinks}/{links} links",
    invalidCoord: "{count} devices have invalid coordinates",
    brokenLinks: "{count} links have missing endpoints",
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
  nodes: [],
  links: [],
  nodeFields: [...REQUIRED_NE],
  linkFields: [...REQUIRED_LINK],
  view: "gis",
  table: "nodes",
  selectedName: "",
  selectedLinkKey: "",
  selectedRouteKey: "",
  highlightRule: null,
  filterRule: null,
  bulkQuery: null,
  roleStyles: cloneStyles(DEFAULT_ROLE_STYLES),
  nodeStyleRules: [],
  appliedNodeStyleRules: [],
  linkStyleRules: [],
  appliedLinkStyleRules: [],
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
    linksByNode: new Map()
  },
  quality: {
    missingCoord: 0,
    brokenLinks: 0
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
  logic: {
    positions: new Map(),
    layoutKey: "",
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

init();

function init() {
  loadSearchHistory();
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
    renderer: L.canvas({ padding: 0.35 })
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
  el.langZhBtn.addEventListener("click", () => switchLanguage("zh"));
  el.langEnBtn.addEventListener("click", () => switchLanguage("en"));
  el.tabTopo.addEventListener("click", () => switchPage("topo"));
  el.tabData.addEventListener("click", () => switchPage("data"));
  el.gisBtn.addEventListener("click", () => switchTopoView("gis"));
  el.logicBtn.addEventListener("click", () => switchTopoView("logic"));
  el.fitBtn.addEventListener("click", fitCurrentView);
  el.mockBtn.addEventListener("click", loadMockData);
  el.loadFilesBtn.addEventListener("click", loadUploadedFiles);
  el.locateBtn.addEventListener("click", locateNode);
  bindSearchHistoryInput(el.searchInput, "locate");
  bindSearchHistoryInput(el.highlightValue, "highlight");
  bindSearchHistoryInput(el.filterValue, "filter");

  el.applyHighlightBtn.addEventListener("click", () => {
    state.highlightRule = ruleGroupFromQuickControls("highlight");
    rememberSearchHistory("highlight", el.highlightValue.value);
    updateRuleSummaries();
    renderTopologies();
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

  bindLogicEvents();
  document.addEventListener("mousedown", event => {
    if (state.searchHistoryMenu && !state.searchHistoryMenu.contains(event.target)) {
      hideSearchHistoryMenu();
    }
  });
  window.addEventListener("resize", () => {
    hideSearchHistoryMenu();
    if (state.map) state.map.invalidateSize();
    if (state.view === "logic") renderLogic(getVisibleData());
  });
}

function switchLanguage(lang) {
  state.lang = lang;
  el.langZhBtn.classList.toggle("active", lang === "zh");
  el.langEnBtn.classList.toggle("active", lang === "en");
  fillOperatorOptions();
  applyLanguage();
  renderTopologies();
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
  el.highlightContrastInput.value = state.highlightContrast;
  el.highlightContrastInput.addEventListener("input", updateHighlightContrastFromControl);
  el.highlightContrastInput.addEventListener("change", updateHighlightContrastFromControl);
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

function resetStyleControls() {
  state.roleStyles = cloneStyles(DEFAULT_ROLE_STYLES);
  state.nodeStyleRules = [];
  state.appliedNodeStyleRules = [];
  state.linkStyleRules = [];
  state.appliedLinkStyleRules = [];
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

function firstConfigurableLinkField() {
  return state.linkFields.find(field => !REQUIRED_LINK.includes(field)) || state.linkFields[0] || REQUIRED_LINK[0];
}

function pruneLinkStyleRules() {
  const available = new Set(state.linkFields);
  const fallback = firstConfigurableLinkField();
  [...state.linkStyleRules, ...state.appliedLinkStyleRules].forEach(rule => {
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
  el.topoPage.classList.toggle("hidden", page !== "topo");
  el.dataPage.classList.toggle("active", page === "data");

  if (page === "data") updateTable();
  if (page === "topo" && state.map) {
    setTimeout(() => state.map.invalidateSize(), 50);
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

  if (!neFile || !linkFile) {
    setMessage(el.uploadMessage, t("chooseBoth"), "error");
    return;
  }

  try {
    const [nodes, links] = await Promise.all([readDataFile(neFile), readDataFile(linkFile)]);
    setData(nodes, links);
    setMessage(el.uploadMessage, t("uploadDone"), "ok");
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

function setData(nodes, links) {
  const normalizedNodes = nodes.map(normalizeRow);
  const normalizedLinks = links.map(normalizeRow);
  validateRows(normalizedNodes, REQUIRED_NE, t("deviceTable"));
  validateRows(normalizedLinks, REQUIRED_LINK, t("linkTable"));

  state.nodes = normalizedNodes;
  state.links = normalizedLinks;
  state.nodeFields = collectFields(state.nodes, REQUIRED_NE);
  state.linkFields = collectFields(state.links, REQUIRED_LINK);
  pruneNodeStyleRules();
  pruneLinkStyleRules();
  rebuildIndexes();
  state.selectedName = "";
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  state.routeHitEntries = [];
  state.highlightRule = null;
  state.filterRule = null;
  state.bulkQuery = null;

  state.logic.positions = new Map();
  state.logic.layoutKey = "";
  refreshAll();
  fitCurrentView();
  if (isLargeDataset()) setMessage(el.uploadMessage, t("largeDataLoaded"), "ok");
}

function rebuildIndexes() {
  const nodeByName = new Map();
  const upperNameToName = new Map();
  const linksByNode = new Map();
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
  state.indexes = { nodeByName, upperNameToName, linksByNode };
  state.quality = { missingCoord, brokenLinks };
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

function refreshAll() {
  updateFieldSelectors();
  updateSuggestions();
  updateRuleSummaries();
  renderTopologies();
  updateTable();
}

function updateFieldSelectors() {
  const nodeOptions = state.nodeFields.map(field => `<option value="${escapeAttr(field)}">${escapeHtml(field)}</option>`).join("");
  el.highlightField.innerHTML = nodeOptions;
  el.filterField.innerHTML = nodeOptions;
  updateTableFieldSelector();
  renderNodeStyleRules();
  renderLinkStyleRules();
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
  if (group.conditions.length === 1) {
    const condition = group.conditions[0];
    return `${condition.field} ${operatorLabel(condition.op)} ${condition.value || ""}`.trim();
  }
  return t(group.mode === "any" ? "conditionSummaryAny" : "conditionSummaryAll", { count: group.conditions.length });
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
    mode: rule.mode === "any" ? "any" : "all",
    conditions: normalized
  };
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
  state.conditionDraft = cloneRuleGroup(conditionTargetRule(type, index)) || quickRuleGroupForTarget(type) || emptyRuleGroup(conditionFieldsForTarget(type)[0]);
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
  if (type === "highlight" || type === "filter") return state[`${type}Rule`];
  if (type === "nodeStyle") return state.nodeStyleRules[index];
  if (type === "linkStyle") return state.linkStyleRules[index];
  return null;
}

function quickRuleGroupForTarget(type) {
  if (type === "highlight" || type === "filter") return ruleGroupFromQuickControls(type);
  return null;
}

function conditionFieldsForTarget(type) {
  return type === "linkStyle" ? state.linkFields : state.nodeFields;
}

function emptyRuleGroup(field = "") {
  return {
    mode: "all",
    conditions: [{ field, op: "contains", value: "" }]
  };
}

function cloneRuleGroup(rule) {
  const group = normalizeRuleGroup(rule);
  return group ? { mode: group.mode, conditions: group.conditions.map(condition => ({ ...condition })) } : null;
}

function renderConditionModal() {
  const type = state.conditionModalType;
  const draft = state.conditionDraft || emptyRuleGroup(conditionFieldsForTarget(type)[0]);
  el.conditionModalTitle.textContent = conditionModalTitle(type);
  el.conditionModeGroup.querySelectorAll("input[name='conditionMode']").forEach(input => {
    input.checked = input.value === draft.mode;
  });
  el.conditionRuleList.innerHTML = draft.conditions.map((condition, index) => conditionRowMarkup(condition, index)).join("");
  renderConditionHistory();
}

function conditionRowMarkup(condition, index) {
  const fields = conditionFieldsForTarget(state.conditionModalType);
  const fieldOptions = fields
    .map(field => `<option value="${escapeAttr(field)}" ${field === condition.field ? "selected" : ""}>${escapeHtml(field)}</option>`)
    .join("");
  const opOptions = OPS
    .map(([value, key]) => `<option value="${value}" ${value === condition.op ? "selected" : ""}>${escapeHtml(t(key))}</option>`)
    .join("");
  return `<div class="condition-row" data-condition-index="${index}">
    <select data-condition-field>${fieldOptions}</select>
    <select data-condition-op>${opOptions}</select>
    <input data-condition-value value="${escapeAttr(condition.value || "")}" placeholder="${escapeAttr(t("conditionValue"))}">
    <button type="button" data-remove-condition="${index}">${escapeHtml(t("removeCondition"))}</button>
  </div>`;
}

function conditionModalTitle(type) {
  if (type === "filter") return t("complexFilterTitle");
  if (type === "nodeStyle") return t("nodeStyleRules");
  if (type === "linkStyle") return t("linkStyleRules");
  return t("complexHighlightTitle");
}

function applyRuleGroupToTarget(target, group) {
  if (!target) return;
  if (target.type === "highlight" || target.type === "filter") {
    state[`${target.type}Rule`] = group;
    return;
  }

  const rules = target.type === "nodeStyle" ? state.nodeStyleRules : state.linkStyleRules;
  const rule = rules[target.index];
  if (!rule || !group) return;

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
  const history = state.conditionHistory.filter(item => item.type === type);
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

  const history = state.conditionHistory.filter(item => item.type === state.conditionModalType);
  const item = history[Number(button.getAttribute("data-restore-condition"))];
  if (!item) return;
  state.conditionDraft = cloneRuleGroup(item.rule);
  renderConditionModal();
}

function syncConditionDraftFromModal() {
  if (!state.conditionDraft) state.conditionDraft = emptyRuleGroup();
  const checkedMode = el.conditionModeGroup.querySelector("input[name='conditionMode']:checked");
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
  if (group && (type === "highlight" || type === "filter")) {
    const first = group.conditions[0];
    el[`${type}Field`].value = first.field;
    el[`${type}Op`].value = first.op;
    el[`${type}Value`].value = first.value || "";
    group.conditions.forEach(condition => rememberSearchHistory(type, condition.value));
  }
  if (group) rememberConditionHistory(type, group);
  updateRuleSummaries();
  renderNodeStyleRules();
  renderLinkStyleRules();
  closeConditionModal();
  renderTopologies();
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

function getVisibleData() {
  const nodeByName = state.indexes.nodeByName;
  const filterMatchNames = new Set(state.nodes.map(node => node["NE Name"]));
  if (state.filterRule) {
    filterMatchNames.clear();
    state.nodes.forEach(node => {
      if (matchesRule(node, state.filterRule)) filterMatchNames.add(node["NE Name"]);
    });
  }
  const queryMatchNames = state.bulkQuery ? state.bulkQuery.matchNames : null;
  const activeSeedNames = queryMatchNames
    ? intersectSets(filterMatchNames, queryMatchNames)
    : filterMatchNames;
  const hasFiltering = Boolean(state.filterRule || state.bulkQuery);
  let links = state.links;
  if (hasFiltering) {
    if (state.filterRule) {
      links = state.links.filter(link =>
        activeSeedNames.has(link["Src NE Name"]) && activeSeedNames.has(link["Sink NE Name"])
      );
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
    nodes.forEach(node => {
      if (matchesRule(node, state.highlightRule)) highlightNames.add(node["NE Name"]);
    });
    links.forEach(link => {
      if (highlightNames.has(link["Src NE Name"]) || highlightNames.has(link["Sink NE Name"])) {
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

  return { nodes, links, visibleNames, filterMatchNames: activeSeedNames, highlightNames, highlightLinkKeys, selectedNeighborNames, selectedLinkKeys, nodeByName };
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
  const mapNodeNames = new Set(mapNodes.map(node => node["NE Name"]));
  const mapLinks = shouldClip
    ? data.links.filter(link => {
      if (mapNodeNames.has(link["Src NE Name"]) || mapNodeNames.has(link["Sink NE Name"])) return true;
      const src = data.nodeByName.get(link["Src NE Name"]);
      const sink = data.nodeByName.get(link["Sink NE Name"]);
      return src && sink && hasCoord(src) && hasCoord(sink)
        && (bounds.contains([Number(src.Latitude), Number(src.Longitude)]) || bounds.contains([Number(sink.Latitude), Number(sink.Longitude)]));
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
    const related = data.highlightLinkKeys.has(linkKey(link)) || selectedLink;
    const userStyle = resolveLinkStyle(link);
    const visualStyle = selectedLink
      ? { ...userStyle, color: "#245a6e", weight: Math.max(userStyle.weight, 3.6), dashArray: "" }
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

  mapNodes.forEach(node => {
    if (!hasCoord(node)) return;

    const name = node["NE Name"];
    const selected = state.selectedName === name;
    const neighbor = data.selectedNeighborNames.has(name);
    const highlighted = data.highlightNames.has(name);
    const active = selected || neighbor;
    const dim = hasHighlight && !highlighted && !active;
    const radius = mapNodeRadius(degreeMap.get(name) || 0, node, active);
    const point = [Number(node.Latitude), Number(node.Longitude)];
    const marker = createMapNodeLayer(point, radius, nodeShape(node), {
      fillColor: nodeFill(node),
      color: selected ? "#245a6e" : neighbor ? "#2f6f86" : "#ffffff",
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
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  applyCanvasDash(ctx, state.routePathStyle.lineStyle);
  entries.forEach(entry => {
    if (selectedKey && entry.key === selectedKey) return;
    drawRoutePath(ctx, entry.points, topLeft, state.routePathStyle.color, baseWidth, selectedKey ? Math.max(0.08, routeOpacity * 0.28) : routeOpacity);
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
    const related = data.highlightLinkKeys.has(linkKey(link)) || selectedLink;
    const cls = `logic-link ${selectedLink ? "selected" : ""} ${related ? "highlight" : ""} ${hasHighlight && !related ? "dim" : ""}`;
    const userStyle = resolveLinkStyle(link);
    const visualStyle = selectedLink
      ? { ...userStyle, color: "#245a6e", weight: Math.max(userStyle.weight, 3.6), dashArray: "" }
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
    const radius = logicNodeRadius(degreeMap.get(name) || 0, node);
    const cls = `logic-node ${selected ? "selected" : ""} ${neighbor ? "neighbor" : ""} ${highlighted ? "highlight" : ""} ${hasHighlight && !highlighted && !selected && !neighbor ? "dim" : ""}`;
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
  const width = Math.max(1280, el.logicCanvas.clientWidth || 1280);
  const height = Math.max(820, el.logicCanvas.clientHeight || 820);
  const layoutHeight = Math.max(320, height - reservedBottomHeight);
  const positions = new Map();
  const hasRingModel = layoutNodes.some(node => node["Ring ID"]);
  if (hasRingModel) {
    computeRingAwareLayout(positions, width, layoutHeight, layoutNodes);
  } else {
    computeFallbackLayeredLayout(positions, width, layoutHeight, layoutNodes);
  }
  applySpringLayout(positions, width, layoutHeight, layoutNodes, layoutLinks);

  state.logic.positions = positions;
  if (resetTransform) {
    state.logic.zoom = 1;
    state.logic.panX = 0;
    state.logic.panY = 0;
  }
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
  const names = nodes.map(node => node["NE Name"]).sort().join("|");
  const edgeKeys = links.map(link => linkKey(link)).sort().join("|");
  return `${nodes.length}:${links.length}:${isolatedCount}:${names}:${edgeKeys}`;
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

function applySpringLayout(positions, width, height, layoutNodes, layoutLinks) {
  const nodes = layoutNodes.filter(node => positions.has(node["NE Name"]));
  const names = nodes.map(node => node["NE Name"]);
  const nodeByName = new Map(nodes.map(node => [node["NE Name"], node]));
  const edges = layoutLinks
    .filter(link => positions.has(link["Src NE Name"]) && positions.has(link["Sink NE Name"]))
    .map(link => ({ srcName: link["Src NE Name"], sinkName: link["Sink NE Name"], type: link["Link Type"] }));
  if (!nodes.length) return;

  const area = width * height;
  const k = Math.sqrt(area / Math.max(1, nodes.length)) * 0.72;
  const ideal = {
    "PE-FullMesh": k * 1.35,
    "ASG-Ring": k * 0.92,
    "CSG-Ring": k * 0.72,
    "ASG-Uplink": k * 1.28,
    "CSG-Uplink": k * 1.05
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
      const node = nodeByName.get(name);
      const p = positions.get(name);
      const d = disp.get(name);
      const anchor = anchors.get(name);
      const role = String(node.Role || "").toUpperCase();
      const targetY = role === "PE" ? height * 0.16 : role === "ASG" ? height * 0.38 : role === "CSG" ? height * 0.68 : height * 0.82;
      d.y += (targetY - p.y) * 0.35;
      d.x += (anchor.x - p.x) * 0.045;
      d.y += (anchor.y - p.y) * 0.055;

      const len = Math.sqrt(d.x * d.x + d.y * d.y) || 0.01;
      const limited = Math.min(len, temperature);
      const labelPad = 130;
      p.x = clamp(p.x + (d.x / len) * limited, 42, width - labelPad);
      p.y = clamp(p.y + (d.y / len) * limited, 42, height - 46);
    });

    temperature *= 0.965;
  }
}

function locateNode() {
  const rawKeyword = el.searchInput.value.trim();
  const keyword = rawKeyword.toLowerCase();
  const exactName = state.indexes.upperNameToName.get(keyword.toUpperCase());
  const node = exactName
    ? state.indexes.nodeByName.get(exactName)
    : state.nodes.find(item => String(item["NE Name"]).toLowerCase().includes(keyword));

  if (!node) {
    setMessage(el.locateMessage, t("locateMissing"), "error");
    return;
  }

  state.selectedName = node["NE Name"];
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  rememberSearchHistory("locate", rawKeyword || node["NE Name"]);
  setMessage(el.locateMessage, t("located", { name: node["NE Name"] }), "ok");

  if (state.view === "gis") {
    if (state.map && hasCoord(node)) state.map.setView([Number(node.Latitude), Number(node.Longitude)], 14);
  } else {
    centerLogicOn(node["NE Name"]);
  }

  showDetails(node);
  renderTopologies();
}

function centerLogicOn(name) {
  const position = state.logic.positions.get(name);
  if (!position) return;

  const rect = el.logicCanvas.getBoundingClientRect();
  state.logic.panX = rect.width / 2 - position.x * state.logic.zoom;
  state.logic.panY = rect.height / 2 - position.y * state.logic.zoom;
}

function fitCurrentView() {
  if (state.view === "gis") fitMap();
  else {
    state.logic.zoom = 1;
    state.logic.panX = 0;
    state.logic.panY = 0;
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

function showDetails(node) {
  state.selectedName = node["NE Name"];
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  el.details.innerHTML = `<h3>${escapeHtml(node["NE Name"] || t("unnamedDevice"))}</h3><div class="kv">${
    state.nodeFields.map(field => `<div>${escapeHtml(field)}</div><div>${escapeHtml(node[field] ?? "")}</div>`).join("")
  }</div>`;
  el.details.classList.add("show");
}

function showLinkDetails(link, options = {}) {
  state.selectedName = "";
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
  const changed = Boolean(state.selectedName || state.selectedLinkKey || state.selectedRouteKey || el.details.classList.contains("show"));
  state.selectedName = "";
  state.selectedLinkKey = "";
  state.selectedRouteKey = "";
  el.details.classList.remove("show");
  return changed;
}

function updateStats(data) {
  el.statNodes.textContent = state.nodes.length;
  el.statLinks.textContent = state.links.length;
  el.statVisibleNodes.textContent = data.nodes.length;
  el.statVisibleLinks.textContent = data.links.length;
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
  state.logic.positions = new Map();
  state.logic.layoutKey = "";
  refreshAll();
  setMessage(el.uploadMessage, t("editApplied"), "ok");
}

function linkKey(link) {
  return `${link["Src NE Name"] || ""}::${link["Sink NE Name"] || ""}`;
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

  return {
    color: style.color,
    weight: linkWeight(style.width),
    dashArray: linkDashArray(style.lineStyle)
  };
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
  target.classList.remove("error", "ok");
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
