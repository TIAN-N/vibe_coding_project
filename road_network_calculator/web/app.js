const THAILAND_CENTER = [13.756331, 100.501765];
const HISTORY_KEY = "roadNetworkRouteHistory";
const LANG_KEY = "roadNetworkLanguage";
const MAX_HISTORY = 30;

const i18n = {
  en: {
    appTitle: "Road Network Calculator",
    roadData: "Road Data",
    selectCsv: "Select WKT CSV",
    uploadLoad: "Upload and Load",
    savingUpload: "Saving uploaded file...",
    queuedUpload: "Queued for parsing...",
    parsingUpload: "Parsing WKT rows...",
    buildingGraph: "Building road graph...",
    buildingIndex: "Building spatial index...",
    uploadDone: "Road network loaded",
    uploadFailed: "Road network loading failed",
    networkLayer: "Network Layer",
    showNetwork: "Show road network",
    lineColor: "Line color",
    lineStyle: "Line style",
    solid: "Solid",
    dashed: "Dashed",
    dotted: "Dotted",
    opacity: "Opacity",
    maxLines: "Max lines",
    refreshLayer: "Refresh Layer",
    routeCoordinates: "Route Coordinates",
    startLon: "Start Lon",
    startLat: "Start Lat",
    endLon: "End Lon",
    endLat: "End Lat",
    calculateRoute: "Calculate Route",
    batchQuery: "Batch Query",
    runBatch: "Run Batch",
    batchFileRouting: "Batch Route File",
    selectPairCsv: "Select source-sink CSV",
    thresholdKm: "Threshold km",
    workers: "Workers",
    startBatchRouting: "Start Batch Routing",
    downloadResult: "Download Result CSV",
    searchSrcName: "Search Src Name",
    searchSinkName: "Search Sink Name",
    searchPreview: "Search Preview Routes",
    uploadingBatchRoutes: "Uploading batch route CSV",
    batchRouteDone: "Batch route calculation completed",
    noPreviewRoutes: "No preview routes matched",
    previewRouteShown: "Preview route shown: {src} -> {sink}",
    taskPairNotFound: "The source-sink pair is not in the uploaded task list.",
    taskPairNoRoute: "The source-sink pair exists, but no successful route is available.",
    result: "Result",
    distance: "Distance",
    snapTime: "Snap Time",
    searchTime: "Search Time",
    totalTime: "Total Time",
    history: "History",
    historyHint: "Toggle records to show multiple routes on the map.",
    focusRoute: "Focus",
    showRoute: "Show",
    color: "Color",
    width: "Width",
    style: "Style",
    notLoaded: "Network not loaded",
    loaded: "Loaded: {nodes} nodes, {edges} edges",
    chooseCsv: "Please select a CSV file",
    loading: "Uploading and loading road network...",
    routeFailed: "Route calculation failed",
    batchEmpty: "Paste at least one route with four numbers per row",
    batchDone: "Batch complete: {ok}/{total} reachable",
    noHistory: "No history yet",
    noNetworkPreview: "Load a road network before refreshing the layer",
    previewLoaded: "Road network layer loaded: {shown}/{matched} visible lines ({total} total)",
    previewHidden: "Road network layer hidden",
    snapTooFar: "Start or end point is not within 1km of the loaded road network. Routing cannot continue; road data may be missing.",
    unreachable: "Unreachable",
    baseSwitched: "Base map switched to {name}",
    backendDown: "Cannot connect to backend service",
  },
  zh: {
    appTitle: "路网距离计算器",
    roadData: "路网数据",
    selectCsv: "选择 WKT CSV",
    uploadLoad: "上传并加载",
    savingUpload: "正在保存上传文件...",
    queuedUpload: "等待解析...",
    parsingUpload: "正在解析 WKT 路网...",
    buildingGraph: "正在构建路网图...",
    buildingIndex: "正在构建空间索引...",
    uploadDone: "路网加载完成",
    uploadFailed: "路网加载失败",
    networkLayer: "路网图层",
    showNetwork: "显示路网路径",
    lineColor: "线条颜色",
    lineStyle: "线条样式",
    solid: "实线",
    dashed: "虚线",
    dotted: "点线",
    opacity: "透明度",
    maxLines: "最大线段数",
    refreshLayer: "刷新图层",
    routeCoordinates: "源宿坐标",
    startLon: "起点经度",
    startLat: "起点纬度",
    endLon: "终点经度",
    endLat: "终点纬度",
    calculateRoute: "计算路由",
    batchQuery: "批量查询",
    runBatch: "批量计算",
    batchFileRouting: "批量路由文件",
    selectPairCsv: "选择源宿对 CSV",
    thresholdKm: "阈值 km",
    workers: "Workers",
    startBatchRouting: "开始批量寻路",
    downloadResult: "下载结果 CSV",
    searchSrcName: "搜索源网元",
    searchSinkName: "搜索宿网元",
    searchPreview: "查询预览路由",
    uploadingBatchRoutes: "正在上传批量路由 CSV",
    batchRouteDone: "批量路由计算完成",
    noPreviewRoutes: "没有匹配的预览路由",
    previewRouteShown: "已显示预览路由：{src} -> {sink}",
    taskPairNotFound: "输入的源宿对不在给定的任务清单中。",
    taskPairNoRoute: "该源宿对在任务清单中，但没有成功算出的路由。",
    result: "计算结果",
    distance: "距离",
    snapTime: "吸附耗时",
    searchTime: "寻路耗时",
    totalTime: "总耗时",
    history: "历史查询",
    historyHint: "勾选历史记录，可在地图上同时显示多条路由。",
    focusRoute: "定位",
    showRoute: "显示",
    color: "颜色",
    width: "粗细",
    style: "样式",
    notLoaded: "未加载路网",
    loaded: "已加载：{nodes} 个节点，{edges} 条边",
    chooseCsv: "请选择 CSV 文件",
    loading: "正在上传并加载路网...",
    routeFailed: "路由计算失败",
    batchEmpty: "请至少粘贴一条路线，每行包含 4 个数字",
    batchDone: "批量完成：{ok}/{total} 条可达",
    noHistory: "暂无历史记录",
    noNetworkPreview: "请先加载路网，再刷新图层",
    previewLoaded: "路网图层已加载：当前视野 {shown}/{matched} 条线段（总计 {total} 条）",
    previewHidden: "路网图层已隐藏",
    snapTooFar: "起点或终点不在已加载路网 1km 范围内，无法寻路；请补充对应区域路网数据。",
    unreachable: "不可达",
    baseSwitched: "底图已切换到 {name}",
    backendDown: "无法连接后端服务",
  },
};

let lang = localStorage.getItem(LANG_KEY) || "en";
let networkLayer = L.layerGroup();
let routeOverlayLayer = L.layerGroup();
let networkPreview = null;
let networkLoaded = false;
let networkBounds = null;
let viewportLoadTimer = null;
let routeOverlays = {};
let currentBatchRouteJobId = "";
let batchNameLoadTimer = null;

const map = L.map("map", {
  center: THAILAND_CENTER,
  zoom: 11,
  preferCanvas: true,
});

const baseLayers = {
  "OSM Standard": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }),
  "OSM HOT": L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors, Tiles style by HOT",
  }),
  "Carto Positron": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }),
};

let activeBaseName = "OSM Standard";
baseLayers[activeBaseName].addTo(map);
networkLayer.addTo(map);
routeOverlayLayer.addTo(map);
L.control.layers(baseLayers, null, { position: "topright" }).addTo(map);

for (const [name, layer] of Object.entries(baseLayers)) {
  layer.on("tileerror", () => {
    if (name !== activeBaseName) return;
    const fallback = name === "OSM Standard" ? "Carto Positron" : "OSM HOT";
    if (baseLayers[fallback] && fallback !== activeBaseName) {
      map.removeLayer(layer);
      activeBaseName = fallback;
      baseLayers[fallback].addTo(map);
      setStatus(t("baseSwitched", { name: fallback }));
    }
  });
}

const el = {
  status: document.getElementById("status"),
  langEnBtn: document.getElementById("langEnBtn"),
  langZhBtn: document.getElementById("langZhBtn"),
  uploadBtn: document.getElementById("uploadBtn"),
  routeBtn: document.getElementById("routeBtn"),
  batchBtn: document.getElementById("batchBtn"),
  refreshNetworkBtn: document.getElementById("refreshNetworkBtn"),
  showNetworkLayer: document.getElementById("showNetworkLayer"),
  networkColor: document.getElementById("networkColor"),
  networkStyle: document.getElementById("networkStyle"),
  networkOpacity: document.getElementById("networkOpacity"),
  networkLimit: document.getElementById("networkLimit"),
  batchResults: document.getElementById("batchResults"),
  batchRouteFile: document.getElementById("batchRouteFile"),
  batchThresholdKm: document.getElementById("batchThresholdKm"),
  batchWorkers: document.getElementById("batchWorkers"),
  batchRouteStartBtn: document.getElementById("batchRouteStartBtn"),
  batchRouteProgress: document.getElementById("batchRouteProgress"),
  batchRouteProgressText: document.getElementById("batchRouteProgressText"),
  batchRouteProgressPercent: document.getElementById("batchRouteProgressPercent"),
  batchRouteProgressBar: document.getElementById("batchRouteProgressBar"),
  batchRouteProgressDetail: document.getElementById("batchRouteProgressDetail"),
  batchRouteDownloadBtn: document.getElementById("batchRouteDownloadBtn"),
  batchPreviewSrc: document.getElementById("batchPreviewSrc"),
  batchPreviewSink: document.getElementById("batchPreviewSink"),
  batchPreviewBtn: document.getElementById("batchPreviewBtn"),
  batchPreviewResults: document.getElementById("batchPreviewResults"),
  batchPreviewSrcOptions: document.getElementById("batchPreviewSrcOptions"),
  batchPreviewSinkOptions: document.getElementById("batchPreviewSinkOptions"),
  historyList: document.getElementById("historyList"),
  uploadProgress: document.getElementById("uploadProgress"),
  uploadProgressText: document.getElementById("uploadProgressText"),
  uploadProgressPercent: document.getElementById("uploadProgressPercent"),
  uploadProgressBar: document.getElementById("uploadProgressBar"),
  uploadProgressDetail: document.getElementById("uploadProgressDetail"),
};

function t(key, vars = {}) {
  let text = (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replace(`{${name}}`, value);
  }
  return text;
}

function applyLanguage() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  el.langEnBtn.classList.toggle("active", lang === "en");
  el.langZhBtn.classList.toggle("active", lang === "zh");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  if (!networkLoaded) setStatus(t("notLoaded"));
  renderHistory();
}

function setStatus(text, isError = false) {
  el.status.textContent = text;
  el.status.classList.toggle("error", isError);
}

async function refreshStatus() {
  const response = await fetch("/api/network/status");
  const data = await response.json();
  networkLoaded = data.loaded;
  if (data.loaded) {
    networkBounds = metadataToBounds(data.metadata);
    setStatus(t("loaded", { nodes: data.nodes.toLocaleString(), edges: data.edges.toLocaleString() }));
  } else {
    clearRouteCache();
    networkBounds = null;
    networkPreview = null;
    networkLayer.clearLayers();
    setStatus(t("notLoaded"));
  }
  updateNetworkSections();
}

function clearRouteCache() {
  routeOverlayLayer.clearLayers();
  routeOverlays = {};
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
  if (el.historyList) renderHistory();
  if (el.batchResults) el.batchResults.innerHTML = "";
  if (el.batchPreviewResults) el.batchPreviewResults.innerHTML = "";
  currentBatchRouteJobId = "";
  clearBatchNameOptions();
}

function getLineOptions() {
  const style = el.networkStyle.value;
  return {
    color: el.networkColor.value,
    weight: 2,
    opacity: Number(el.networkOpacity.value),
    dashArray: style === "dashed" ? "8 6" : style === "dotted" ? "2 7" : null,
  };
}

async function loadNetworkPreview() {
  if (!networkLoaded) {
    setStatus(t("noNetworkPreview"), true);
    return;
  }
  const limit = Number(el.networkLimit.value) || 5000;
  const bounds = map.getBounds();
  const params = new URLSearchParams({
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
    limit,
  });
  const response = await fetch(`/api/network/viewport?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to load viewport road network");
  networkPreview = data;
  drawNetworkPreview();
}

function scheduleNetworkPreviewLoad() {
  if (!networkLoaded || !el.showNetworkLayer.checked) return;
  clearTimeout(viewportLoadTimer);
  viewportLoadTimer = setTimeout(() => {
    loadNetworkPreview().catch((error) => setStatus(localizeError(error.message), true));
  }, 250);
}

function drawNetworkPreview() {
  networkLayer.clearLayers();
  if (!el.showNetworkLayer.checked) {
    setStatus(t("previewHidden"));
    return;
  }
  if (!networkPreview || !networkPreview.lines.length) return;

  const options = getLineOptions();
  const lines = networkPreview.lines;
  let index = 0;
  const chunkSize = 300;

  function drawChunk() {
    const end = Math.min(index + chunkSize, lines.length);
    for (; index < end; index++) {
      const latLngs = lines[index].map(([lon, lat]) => [lat, lon]);
      L.polyline(latLngs, options).addTo(networkLayer);
    }
    if (index < lines.length) {
      requestAnimationFrame(drawChunk);
    } else {
      setStatus(
        t("previewLoaded", {
          shown: networkPreview.returned_edges,
          matched: networkPreview.matched_edges || networkPreview.returned_edges,
          total: networkPreview.total_edges,
        }),
      );
    }
  }

  requestAnimationFrame(drawChunk);
}

async function uploadNetwork() {
  const fileInput = document.getElementById("csvFile");
  if (!fileInput.files.length) {
    setStatus(t("chooseCsv"), true);
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  el.uploadBtn.disabled = true;
  setStatus(t("loading"));
  showUploadProgress();
  updateUploadProgress({
    progress: 1,
    stage: "saving",
    message: t("savingUpload"),
    bytes_read: 0,
    total_bytes: fileInput.files[0].size || 0,
    nodes: 0,
    edges: 0,
  });

  try {
    const response = await fetch("/api/network/upload/start", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to start road network loading");
    await pollUploadJob(data.job_id);
  } catch (error) {
    setStatus(localizeError(error.message), true);
    updateUploadProgress({ progress: 100, stage: "failed", message: t("uploadFailed"), error: error.message });
  } finally {
    el.uploadBtn.disabled = false;
  }
}

async function pollUploadJob(jobId) {
  while (true) {
    const response = await fetch(`/api/network/upload/status/${encodeURIComponent(jobId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to read upload status");
    updateUploadProgress(data);

    if (data.state === "done") {
      clearRouteCache();
      networkLoaded = true;
      const network = data.network;
      networkBounds = metadataToBounds(network.metadata);
      setStatus(t("loaded", { nodes: network.nodes.toLocaleString(), edges: network.edges.toLocaleString() }));
      updateNetworkSections();
      fitNetworkBounds();
      scheduleNetworkPreviewLoad();
      return;
    }
    if (data.state === "failed") {
      throw new Error(data.error || t("uploadFailed"));
    }
    await sleep(500);
  }
}

function showUploadProgress() {
  el.uploadProgress.classList.remove("hidden");
}

function updateUploadProgress(data) {
  const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
  el.uploadProgressBar.style.width = `${progress}%`;
  el.uploadProgressPercent.textContent = `${progress.toFixed(1)}%`;
  el.uploadProgressText.textContent = uploadStageText(data.stage, data.message);

  const bytes = data.total_bytes ? `${formatBytes(data.bytes_read)} / ${formatBytes(data.total_bytes)}` : "";
  const counts = data.nodes || data.edges ? `nodes=${Number(data.nodes || 0).toLocaleString()} edges=${Number(data.edges || 0).toLocaleString()}` : "";
  el.uploadProgressDetail.textContent = [bytes, counts, data.error || ""].filter(Boolean).join(" | ");
}

function uploadStageText(stage, fallback) {
  if (stage === "saving") return t("savingUpload");
  if (stage === "queued") return t("queuedUpload");
  if (stage === "parsing") return t("parsingUpload");
  if (stage === "building_graph") return t("buildingGraph");
  if (stage === "building_index") return t("buildingIndex");
  if (stage === "done") return t("uploadDone");
  if (stage === "failed") return t("uploadFailed");
  return fallback || "";
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(2)} KB`;
  return `${value} B`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateNetworkSections() {
  document.querySelectorAll(".requires-network").forEach((node) => {
    node.classList.toggle("hidden", !networkLoaded);
  });
}

function readRouteInputs() {
  return {
    start_lon: Number(document.getElementById("startLon").value),
    start_lat: Number(document.getElementById("startLat").value),
    end_lon: Number(document.getElementById("endLon").value),
    end_lat: Number(document.getElementById("endLat").value),
  };
}

function writeRouteInputs(route) {
  document.getElementById("startLon").value = route.start_lon;
  document.getElementById("startLat").value = route.start_lat;
  document.getElementById("endLon").value = route.end_lon;
  document.getElementById("endLat").value = route.end_lat;
}

async function calculateRoute() {
  const route = readRouteInputs();
  el.routeBtn.disabled = true;
  try {
    const result = await requestRoute(route);
    const historyItem = saveHistory(route, result, { visible: true });
    const routeId = historyItem ? historyItem.id : routeKey(route);
    addOrUpdateRouteOverlay(routeId, route, result, { visible: true, fit: true });
    updateResultPanel(result);
  } catch (error) {
    setStatus(localizeError(error.message), true);
  } finally {
    el.routeBtn.disabled = false;
  }
}

async function requestRoute(route) {
  const response = await fetch("/api/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(route),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || t("routeFailed"));
  return data;
}

function updateResultPanel(data) {
  document.getElementById("distance").textContent = data.reachable ? `${data.distance_m.toFixed(1)} m` : t("unreachable");
  document.getElementById("snapTime").textContent = `${data.timings_ms.snap.toFixed(2)} ms`;
  document.getElementById("searchTime").textContent = `${data.timings_ms.search.toFixed(2)} ms`;
  document.getElementById("totalTime").textContent = `${data.timings_ms.total.toFixed(2)} ms`;
}

function renderRoute(data) {
  updateResultPanel(data);
  const route = {
    start_lon: data.snapped_start[0],
    start_lat: data.snapped_start[1],
    end_lon: data.snapped_end[0],
    end_lat: data.snapped_end[1],
  };
  addOrUpdateRouteOverlay(routeKey(route), route, data, { visible: true, fit: true });
}

function addOrUpdateRouteOverlay(routeId, route, data, options = {}) {
  if (!data || !data.reachable || !Array.isArray(data.path) || !data.path.length) return;
  const existing = routeOverlays[routeId];
  const style = Object.assign(defaultRouteStyle(Object.keys(routeOverlays).length), existing ? existing.style : {}, options.style || {});
  if (existing) {
    removeRouteOverlay(routeId);
  }
  const start = [data.snapped_start[1], data.snapped_start[0]];
  const end = [data.snapped_end[1], data.snapped_end[0]];
  const polyline = L.polyline(data.path.map(([lon, lat]) => [lat, lon]), leafletRouteStyle(style));
  const startMarker = L.circleMarker(start, markerStyle(style)).bindPopup("Snapped start");
  const endMarker = L.circleMarker(end, markerStyle(style)).bindPopup("Snapped end");
  const group = L.layerGroup([polyline, startMarker, endMarker]);
  routeOverlays[routeId] = { route, result: data, style, group, polyline };
  if (options.visible !== false) group.addTo(routeOverlayLayer);
  if (options.fit !== false) focusRouteOverlay(routeId);
}

function removeRouteOverlay(routeId) {
  const existing = routeOverlays[routeId];
  if (!existing) return;
  routeOverlayLayer.removeLayer(existing.group);
  delete routeOverlays[routeId];
}

function setRouteOverlayVisible(routeId, visible, route, result, style) {
  if (visible) {
    addOrUpdateRouteOverlay(routeId, route, result, { visible: true, fit: false, style });
  } else {
    removeRouteOverlay(routeId);
  }
}

function updateRouteOverlayStyle(routeId, style) {
  const overlay = routeOverlays[routeId];
  if (!overlay) return;
  overlay.style = Object.assign({}, overlay.style, style);
  overlay.polyline.setStyle(leafletRouteStyle(overlay.style));
}

function focusRouteOverlay(routeId) {
  const overlay = routeOverlays[routeId];
  if (!overlay || !overlay.polyline) return;
  map.fitBounds(overlay.polyline.getBounds().pad(0.2));
  updateResultPanel(overlay.result);
}

function defaultRouteStyle(index) {
  const palette = ["#1967d2", "#d93025", "#188038", "#f9ab00", "#8e24aa", "#00acc1", "#ef6c00", "#3949ab"];
  return { color: palette[index % palette.length], weight: 5, opacity: 0.9, dash: "solid" };
}

function leafletRouteStyle(style) {
  return {
    color: style.color,
    weight: Number(style.weight) || 5,
    opacity: Number(style.opacity) || 0.9,
    dashArray: style.dash === "dashed" ? "10 7" : style.dash === "dotted" ? "2 8" : null,
  };
}

function markerStyle(style) {
  return {
    radius: 5,
    color: style.color,
    fillColor: style.color,
    fillOpacity: 0.9,
    weight: 2,
  };
}

function parseBatchInput(text) {
  const routes = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const values = trimmed.match(/-?\d+(?:\.\d+)?/g);
    if (!values || values.length < 4) continue;
    for (let i = 0; i + 3 < values.length; i += 4) {
      routes.push({
        start_lon: Number(values[i]),
        start_lat: Number(values[i + 1]),
        end_lon: Number(values[i + 2]),
        end_lat: Number(values[i + 3]),
      });
    }
  }
  return routes;
}

async function runBatch() {
  const routes = parseBatchInput(document.getElementById("batchInput").value);
  if (!routes.length) {
    setStatus(t("batchEmpty"), true);
    return;
  }
  el.batchBtn.disabled = true;
  el.batchResults.innerHTML = "";

  try {
    const response = await fetch("/api/routes/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routes }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Batch route failed");
    renderBatchResults(data.results);
    const okCount = data.results.filter((item) => item.ok).length;
    setStatus(t("batchDone", { ok: okCount, total: data.results.length }));
  } catch (error) {
    setStatus(localizeError(error.message), true);
  } finally {
    el.batchBtn.disabled = false;
  }
}

function renderBatchResults(results) {
  el.batchResults.innerHTML = "";
  results.forEach((item) => {
    let routeId = null;
    if (item.ok && item.result) {
      const historyItem = saveHistory(item.route, item.result, { visible: true, silent: true });
      routeId = historyItem ? historyItem.id : routeKey(item.route);
      addOrUpdateRouteOverlay(routeId, item.route, item.result, { visible: true, fit: false });
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-item";
    const summary = item.ok && item.result ? `${item.result.distance_m.toFixed(1)} m` : localizeError(item.error);
    button.innerHTML = `<strong>#${item.index + 1} ${summary}</strong><span class="muted">${formatRoute(item.route)}</span>`;
    button.addEventListener("click", () => {
      writeRouteInputs(item.route);
      if (item.result) {
        if (routeId) focusRouteOverlay(routeId);
        updateResultPanel(item.result);
      } else {
        setStatus(localizeError(item.error), true);
      }
    });
    el.batchResults.appendChild(button);
  });
  renderHistory();
}

async function startBatchRouteFileJob() {
  if (!el.batchRouteFile.files.length) {
    setStatus(t("chooseCsv"), true);
    return;
  }
  const formData = new FormData();
  formData.append("file", el.batchRouteFile.files[0]);
  formData.append("straight_distance_threshold_km", Number(el.batchThresholdKm.value) || 30);
  formData.append("workers", Number(el.batchWorkers.value) || 4);

  el.batchRouteStartBtn.disabled = true;
  el.batchRouteDownloadBtn.classList.add("hidden");
  el.batchPreviewBtn.classList.add("hidden");
  el.batchPreviewResults.innerHTML = "";
  showBatchRouteProgress();
  updateBatchRouteProgress({ progress: 1, completed: 0, total: 0, message: t("uploadingBatchRoutes") });

  try {
    const response = await fetch("/api/batch-routes/upload/start", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to start batch routing");
    await pollBatchRouteJob(data.job_id);
  } catch (error) {
    setStatus(localizeError(error.message), true);
    updateBatchRouteProgress({ progress: 100, message: error.message });
  } finally {
    el.batchRouteStartBtn.disabled = false;
  }
}

async function pollBatchRouteJob(jobId) {
  while (true) {
    const response = await fetch(`/api/batch-routes/status/${encodeURIComponent(jobId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to read batch route status");
    updateBatchRouteProgress(data);
    if (data.state === "done") {
      currentBatchRouteJobId = jobId;
      el.batchRouteDownloadBtn.classList.remove("hidden");
      el.batchPreviewBtn.classList.remove("hidden");
      el.batchRouteDownloadBtn.onclick = () => {
        window.location.href = `/api/batch-routes/download/${encodeURIComponent(jobId)}`;
      };
      el.batchPreviewBtn.onclick = () => searchBatchRoutePreview(jobId);
      loadBatchRouteNameOptions(jobId).catch((error) => setStatus(error.message, true));
      setStatus(data.message || t("batchRouteDone"));
      return;
    }
    if (data.state === "failed") {
      throw new Error(data.error || "Batch route calculation failed");
    }
    await sleep(800);
  }
}

function showBatchRouteProgress() {
  el.batchRouteProgress.classList.remove("hidden");
}

function updateBatchRouteProgress(data) {
  const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
  el.batchRouteProgressBar.style.width = `${progress}%`;
  el.batchRouteProgressPercent.textContent = `${progress.toFixed(1)}%`;
  el.batchRouteProgressText.textContent = data.message || "Calculating routes";
  el.batchRouteProgressDetail.textContent = [
    `${Number(data.completed || 0).toLocaleString()} / ${Number(data.total || 0).toLocaleString()}`,
    `success=${Number(data.success || 0).toLocaleString()}`,
    `failed=${Number(data.failed || 0).toLocaleString()}`,
    `threshold=${Number(data.skipped_by_threshold || 0).toLocaleString()}`,
  ].join(" | ");
}

async function searchBatchRoutePreview(jobId) {
  const params = new URLSearchParams({
    src: el.batchPreviewSrc.value || "",
    sink: el.batchPreviewSink.value || "",
    limit: 50,
  });
  const response = await fetch(`/api/batch-routes/preview/${encodeURIComponent(jobId)}?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    setStatus(data.detail || "Failed to load preview routes", true);
    return;
  }
  const rows = data.rows || [];
  renderBatchRoutePreview(rows);
  if (rows.length) {
    showBatchPreviewRoute(rows[0]);
  } else if (data.matched_tasks === 0) {
    showBatchPreviewMessage(t("taskPairNotFound"), true);
  } else {
    showBatchPreviewMessage(t("taskPairNoRoute"), true);
  }
}

function renderBatchRoutePreview(rows) {
  el.batchPreviewResults.innerHTML = "";
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = t("noPreviewRoutes");
    el.batchPreviewResults.appendChild(empty);
    return;
  }
  rows.forEach((row) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-item";
    button.innerHTML = `<strong>${row["Src NE Name"]} -> ${row["Sink NE Name"]}</strong><span class="muted">${row.Distance} m</span>`;
    button.addEventListener("click", () => showBatchPreviewRoute(row));
    el.batchPreviewResults.appendChild(button);
  });
}

function showBatchPreviewRoute(row) {
  const route = {
    start_lon: Number(row["Src Lon"]),
    start_lat: Number(row["Src Lat"]),
    end_lon: Number(row["Sink Lon"]),
    end_lat: Number(row["Sink Lat"]),
  };
  const result = resultFromBatchPreviewRow(row);
  if (!result.reachable) {
    setStatus(t("noPreviewRoutes"), true);
    return;
  }
  const label = `${row["Src NE Name"]} -> ${row["Sink NE Name"]}`;
  const historyItem = saveHistory(route, result, { visible: true, label });
  const routeId = historyItem ? historyItem.id : routeKey(route);
  addOrUpdateRouteOverlay(routeId, route, result, { visible: true, fit: true });
  updateResultPanel(result);
  setStatus(t("previewRouteShown", { src: row["Src NE Name"], sink: row["Sink NE Name"] }));
}

function showBatchPreviewMessage(message, isError = false) {
  el.batchPreviewResults.innerHTML = "";
  const item = document.createElement("div");
  item.className = isError ? "muted error" : "muted";
  item.textContent = message;
  el.batchPreviewResults.appendChild(item);
  setStatus(message, isError);
}

async function loadBatchRouteNameOptions(jobId) {
  if (!jobId) return;
  const params = new URLSearchParams({
    src: el.batchPreviewSrc.value || "",
    sink: el.batchPreviewSink.value || "",
    limit: 100,
  });
  const response = await fetch(`/api/batch-routes/names/${encodeURIComponent(jobId)}?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to load source-sink names");
  renderDatalist(el.batchPreviewSrcOptions, data.src_names || []);
  renderDatalist(el.batchPreviewSinkOptions, data.sink_names || []);
}

function scheduleBatchNameOptionsLoad() {
  if (!currentBatchRouteJobId) return;
  clearTimeout(batchNameLoadTimer);
  batchNameLoadTimer = setTimeout(() => {
    loadBatchRouteNameOptions(currentBatchRouteJobId).catch((error) => setStatus(error.message, true));
  }, 250);
}

function renderDatalist(node, values) {
  node.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    node.appendChild(option);
  });
}

function clearBatchNameOptions() {
  if (el.batchPreviewSrcOptions) el.batchPreviewSrcOptions.innerHTML = "";
  if (el.batchPreviewSinkOptions) el.batchPreviewSinkOptions.innerHTML = "";
}

function resultFromBatchPreviewRow(row) {
  const path = parseLinestringPath(row["Route WKT"] || row.Route || "");
  return {
    distance_m: Number(row.Distance) || 0,
    path,
    snapped_start: path.length ? path[0] : [Number(row["Src Lon"]), Number(row["Src Lat"])],
    snapped_end: path.length ? path[path.length - 1] : [Number(row["Sink Lon"]), Number(row["Sink Lat"])],
    timings_ms: { snap: 0, search: 0, total: 0 },
    reachable: path.length > 0,
    snap_start_distance_m: 0,
    snap_end_distance_m: 0,
  };
}

function parseLinestringPath(wkt) {
  const match = /^\s*LINESTRING\s*\((.*)\)\s*$/i.exec(wkt || "");
  if (!match) return [];
  return match[1].split(",").map((pair) => {
    const parts = pair.trim().split(/\s+/);
    return [Number(parts[0]), Number(parts[1])];
  }).filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(route, result, options = {}) {
  if (!result.reachable) return null;
  const history = loadHistory();
  const id = routeKey(route);
  const existingIndex = history.findIndex((item) => item.id === id || routeKey(item.route) === id);
  const compactResult = compactHistoryResult(result);
  const item = {
    id,
    route,
    result: compactResult,
    label: options.label || (existingIndex >= 0 ? history[existingIndex].label : ""),
    visible: options.visible !== undefined ? options.visible : true,
    style: existingIndex >= 0 && history[existingIndex].style ? history[existingIndex].style : defaultRouteStyle(history.length),
    created_at: new Date().toISOString(),
  };
  if (existingIndex >= 0) {
    history.splice(existingIndex, 1);
  }
  history.unshift(item);
  persistHistory(history);
  if (!options.silent) renderHistory();
  return item;
}

function compactHistoryResult(result) {
  const path = Array.isArray(result.path) ? result.path : [];
  return {
    distance_m: result.distance_m,
    path: simplifyPathForHistory(path, 1200),
    snapped_start: result.snapped_start,
    snapped_end: result.snapped_end,
    timings_ms: result.timings_ms,
    reachable: result.reachable,
    snap_start_distance_m: result.snap_start_distance_m,
    snap_end_distance_m: result.snap_end_distance_m,
  };
}

function simplifyPathForHistory(path, maxPoints) {
  if (path.length <= maxPoints) return path;
  const simplified = [];
  const step = (path.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    simplified.push(path[Math.round(i * step)]);
  }
  return simplified;
}

function persistHistory(history) {
  let items = history.slice(0, MAX_HISTORY);
  while (items.length) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
      return;
    } catch (error) {
      items = items.slice(0, Math.max(0, items.length - 5));
    }
  }
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function renderHistory() {
  const history = loadHistory();
  el.historyList.innerHTML = "";
  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = t("noHistory");
    el.historyList.appendChild(empty);
    return;
  }

  history.forEach((item, index) => {
    const routeId = item.id || routeKey(item.route);
    const style = item.style || defaultRouteStyle(index);
    const card = document.createElement("div");
    card.className = "list-item route-card";
    const when = new Date(item.created_at).toLocaleString();
    const label = item.label ? `<span class="route-label">${item.label}</span>` : "";
    card.innerHTML = `
      <div class="route-card-header">
        <input type="checkbox" ${item.visible ? "checked" : ""} aria-label="${t("showRoute")}" />
        <div class="route-card-main">
          <strong>${item.result.distance_m.toFixed(1)} m</strong>
          ${label}
          <span class="muted">${when}<br>${formatRoute(item.route)}</span>
        </div>
      </div>
      <div class="route-actions">
        <label>${t("color")}<input class="route-color" type="color" value="${style.color}" /></label>
        <label>${t("width")}<input class="route-width" type="number" min="1" max="14" step="1" value="${style.weight}" /></label>
        <label>${t("style")}
          <select class="route-dash">
            <option value="solid" ${style.dash === "solid" ? "selected" : ""}>${t("solid")}</option>
            <option value="dashed" ${style.dash === "dashed" ? "selected" : ""}>${t("dashed")}</option>
            <option value="dotted" ${style.dash === "dotted" ? "selected" : ""}>${t("dotted")}</option>
          </select>
        </label>
      </div>
      <button type="button" class="route-focus">${t("focusRoute")}</button>
    `;
    const checkbox = card.querySelector('input[type="checkbox"]');
    const colorInput = card.querySelector(".route-color");
    const widthInput = card.querySelector(".route-width");
    const dashSelect = card.querySelector(".route-dash");
    const focusBtn = card.querySelector(".route-focus");

    checkbox.addEventListener("change", () => {
      item.visible = checkbox.checked;
      item.style = readRouteStyleControls(colorInput, widthInput, dashSelect);
      persistHistory(history);
      setRouteOverlayVisible(routeId, item.visible, item.route, item.result, item.style);
      if (item.visible) focusRouteOverlay(routeId);
    });
    [colorInput, widthInput, dashSelect].forEach((control) => {
      control.addEventListener("change", () => {
        item.style = readRouteStyleControls(colorInput, widthInput, dashSelect);
        persistHistory(history);
        if (item.visible) {
          if (!routeOverlays[routeId]) {
            addOrUpdateRouteOverlay(routeId, item.route, item.result, { visible: true, fit: false, style: item.style });
          } else {
            updateRouteOverlayStyle(routeId, item.style);
          }
        }
      });
    });
    focusBtn.addEventListener("click", () => {
      writeRouteInputs(item.route);
      if (item.visible) {
        if (!routeOverlays[routeId]) addOrUpdateRouteOverlay(routeId, item.route, item.result, { visible: true, fit: false, style: item.style });
        focusRouteOverlay(routeId);
      } else {
        updateResultPanel(item.result);
      }
    });
    if (item.visible && !routeOverlays[routeId]) {
      addOrUpdateRouteOverlay(routeId, item.route, item.result, { visible: true, fit: false, style: item.style });
    }
    el.historyList.appendChild(card);
  });
}

function readRouteStyleControls(colorInput, widthInput, dashSelect) {
  return {
    color: colorInput.value,
    weight: Number(widthInput.value) || 5,
    opacity: 0.9,
    dash: dashSelect.value,
  };
}

function formatRoute(route) {
  return `${route.start_lon}, ${route.start_lat} -> ${route.end_lon}, ${route.end_lat}`;
}

function routeKey(route) {
  return [
    Number(route.start_lon).toFixed(6),
    Number(route.start_lat).toFixed(6),
    Number(route.end_lon).toFixed(6),
    Number(route.end_lat).toFixed(6),
  ].join(",");
}

function localizeError(message) {
  if (!message) return t("routeFailed");
  if (message.includes("more than 1000m") || message.includes("1km")) return t("snapTooFar");
  return message;
}

function setLanguage(nextLang) {
  lang = nextLang;
  localStorage.setItem(LANG_KEY, lang);
  applyLanguage();
}

el.langEnBtn.addEventListener("click", () => setLanguage("en"));
el.langZhBtn.addEventListener("click", () => setLanguage("zh"));
el.uploadBtn.addEventListener("click", uploadNetwork);
el.routeBtn.addEventListener("click", calculateRoute);
el.batchBtn.addEventListener("click", runBatch);
el.batchRouteStartBtn.addEventListener("click", startBatchRouteFileJob);
el.batchPreviewSrc.addEventListener("input", scheduleBatchNameOptionsLoad);
el.batchPreviewSink.addEventListener("input", scheduleBatchNameOptionsLoad);
el.refreshNetworkBtn.addEventListener("click", () => loadNetworkPreview().catch((error) => setStatus(localizeError(error.message), true)));
el.showNetworkLayer.addEventListener("change", () => {
  if (el.showNetworkLayer.checked) {
    scheduleNetworkPreviewLoad();
  } else {
    drawNetworkPreview();
  }
});
el.networkColor.addEventListener("input", drawNetworkPreview);
el.networkStyle.addEventListener("change", drawNetworkPreview);
el.networkOpacity.addEventListener("input", drawNetworkPreview);
el.networkLimit.addEventListener("change", scheduleNetworkPreviewLoad);
map.on("moveend zoomend", scheduleNetworkPreviewLoad);

function metadataToBounds(metadata) {
  if (!metadata) return null;
  const keys = ["min_lon", "min_lat", "max_lon", "max_lat"];
  if (!keys.every((key) => Number.isFinite(Number(metadata[key])))) return null;
  return {
    west: Number(metadata.min_lon),
    south: Number(metadata.min_lat),
    east: Number(metadata.max_lon),
    north: Number(metadata.max_lat),
  };
}

function fitNetworkBounds() {
  if (!networkBounds) return;
  const bounds = L.latLngBounds(
    [networkBounds.south, networkBounds.west],
    [networkBounds.north, networkBounds.east],
  );
  if (bounds.isValid()) map.fitBounds(bounds.pad(0.08));
}

map.whenReady(() => {
  setTimeout(() => map.invalidateSize(), 100);
});

applyLanguage();
refreshStatus().catch(() => setStatus(t("backendDown"), true));
updateNetworkSections();
