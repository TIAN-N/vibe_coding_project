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
    result: "Result",
    distance: "Distance",
    snapTime: "Snap Time",
    searchTime: "Search Time",
    totalTime: "Total Time",
    history: "History",
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
    result: "计算结果",
    distance: "距离",
    snapTime: "吸附耗时",
    searchTime: "寻路耗时",
    totalTime: "总耗时",
    history: "历史查询",
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
let routeLayer = null;
let startMarker = null;
let endMarker = null;
let networkLayer = L.layerGroup();
let networkPreview = null;
let networkLoaded = false;
let networkBounds = null;
let viewportLoadTimer = null;

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
  languageSelect: document.getElementById("languageSelect"),
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
  historyList: document.getElementById("historyList"),
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
  el.languageSelect.value = lang;
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
    setStatus(t("notLoaded"));
  }
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

  try {
    const response = await fetch("/api/network/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to load road network");
    networkLoaded = true;
    networkBounds = metadataToBounds(data.metadata);
    setStatus(t("loaded", { nodes: data.nodes.toLocaleString(), edges: data.edges.toLocaleString() }));
    fitNetworkBounds();
    scheduleNetworkPreviewLoad();
  } catch (error) {
    setStatus(localizeError(error.message), true);
  } finally {
    el.uploadBtn.disabled = false;
  }
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
    renderRoute(result);
    saveHistory(route, result);
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

function renderRoute(data) {
  document.getElementById("distance").textContent = data.reachable ? `${data.distance_m.toFixed(1)} m` : t("unreachable");
  document.getElementById("snapTime").textContent = `${data.timings_ms.snap.toFixed(2)} ms`;
  document.getElementById("searchTime").textContent = `${data.timings_ms.search.toFixed(2)} ms`;
  document.getElementById("totalTime").textContent = `${data.timings_ms.total.toFixed(2)} ms`;

  if (routeLayer) map.removeLayer(routeLayer);
  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);

  const start = [data.snapped_start[1], data.snapped_start[0]];
  const end = [data.snapped_end[1], data.snapped_end[0]];
  startMarker = L.marker(start).addTo(map).bindPopup("Snapped start");
  endMarker = L.marker(end).addTo(map).bindPopup("Snapped end");

  if (data.path.length > 0) {
    routeLayer = L.polyline(data.path.map(([lon, lat]) => [lat, lon]), {
      color: "#1967d2",
      weight: 5,
      opacity: 0.9,
    }).addTo(map);
    map.fitBounds(routeLayer.getBounds().pad(0.2));
  } else {
    map.fitBounds(L.latLngBounds([start, end]).pad(0.2));
  }
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-item";
    const summary = item.ok && item.result ? `${item.result.distance_m.toFixed(1)} m` : localizeError(item.error);
    button.innerHTML = `<strong>#${item.index + 1} ${summary}</strong><span class="muted">${formatRoute(item.route)}</span>`;
    button.addEventListener("click", () => {
      writeRouteInputs(item.route);
      if (item.result) {
        renderRoute(item.result);
        if (item.ok) saveHistory(item.route, item.result);
      } else {
        setStatus(localizeError(item.error), true);
      }
    });
    el.batchResults.appendChild(button);
  });
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(route, result) {
  if (!result.reachable) return;
  const history = loadHistory();
  history.unshift({
    route,
    result,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  renderHistory();
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-item";
    const when = new Date(item.created_at).toLocaleString();
    button.innerHTML = `<strong>${item.result.distance_m.toFixed(1)} m</strong><span class="muted">${when}<br>${formatRoute(item.route)}</span>`;
    button.addEventListener("click", () => {
      writeRouteInputs(item.route);
      renderRoute(item.result);
    });
    el.historyList.appendChild(button);
  });
}

function formatRoute(route) {
  return `${route.start_lon}, ${route.start_lat} -> ${route.end_lon}, ${route.end_lat}`;
}

function localizeError(message) {
  if (!message) return t("routeFailed");
  if (message.includes("more than 1000m") || message.includes("1km")) return t("snapTooFar");
  return message;
}

el.languageSelect.addEventListener("change", () => {
  lang = el.languageSelect.value;
  localStorage.setItem(LANG_KEY, lang);
  applyLanguage();
});
el.uploadBtn.addEventListener("click", uploadNetwork);
el.routeBtn.addEventListener("click", calculateRoute);
el.batchBtn.addEventListener("click", runBatch);
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
