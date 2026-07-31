const state = {
  versionId: "",
  actions: [],
  topology: null,
  layout: null,
  currentTable: "devices"
};

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message || "接口调用失败");
  }
  return payload.data;
}

function currentConditionAction(type) {
  return {
    type,
    source: $("sourceSelect").value,
    mode: "all",
    conditions: [{
      field: $("fieldInput").value.trim(),
      op: $("opSelect").value,
      value: $("valueInput").value
    }],
    contrast: 0.72
  };
}

async function loadVersions() {
  const versions = await api("/api/v1/versions");
  const select = $("versionSelect");
  select.innerHTML = "";
  versions.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.version_name} (${item.summary.devices}/${item.summary.links})`;
    select.appendChild(option);
  });
  if (versions.length && !state.versionId) {
    state.versionId = versions[0].id;
    select.value = state.versionId;
    await refreshAll();
  }
}

async function uploadFiles() {
  const device = $("deviceFile").files[0];
  const link = $("linkFile").files[0];
  const ringChain = $("ringChainFile").files[0];
  if (!device || !link) {
    $("uploadMessage").textContent = "请先选择网元表和链路表。";
    return;
  }
  const form = new FormData();
  form.append("device_file", device);
  form.append("link_file", link);
  if (ringChain) {
    form.append("ring_chain_file", ringChain);
  }
  if ($("versionNameInput").value.trim()) {
    form.append("version_name", $("versionNameInput").value.trim());
  }
  $("uploadMessage").textContent = "正在上传解析...";
  const result = await api("/api/v1/uploads/topology", { method: "POST", body: form });
  state.versionId = result.version_id;
  $("uploadMessage").textContent = `解析完成：${result.summary.devices} 网元，${result.summary.links} 链路。`;
  await loadVersions();
  $("versionSelect").value = state.versionId;
  await refreshAll();
}

async function refreshAll() {
  if (!state.versionId) {
    return;
  }
  await Promise.all([queryTopology(), loadMetrics(), loadTable(state.currentTable)]);
  await computeLayout();
}

async function queryTopology() {
  state.topology = await api("/api/v1/topology/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version_id: state.versionId, view: "logic", actions: state.actions })
  });
  $("viewMessage").textContent = `当前显示 ${state.topology.devices.length} 个网元，${state.topology.links.length} 条链路。`;
}

async function computeLayout() {
  if (!state.versionId) {
    return;
  }
  const canvas = $("logicCanvas");
  const rect = canvas.getBoundingClientRect();
  state.layout = await api("/api/v1/layout/logic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      version_id: state.versionId,
      canvas_width: Math.max(rect.width, 900),
      canvas_height: Math.max(rect.height, 600),
      actions: state.actions
    })
  });
  renderLayout();
}

function renderLayout() {
  const canvas = $("logicCanvas");
  canvas.innerHTML = "";
  if (!state.layout || !state.layout.layout_available) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "32");
    text.setAttribute("y", "48");
    text.textContent = state.layout ? state.layout.reason : "暂无布局数据";
    canvas.appendChild(text);
    return;
  }
  const nodeMap = new Map(state.layout.nodes.map((node) => [node.id, node]));
  const highlighted = new Set(state.topology?.state?.highlightNodeIds || []);
  const located = new Set(state.topology?.state?.locateNodeIds || []);
  (state.topology?.links || []).forEach((link) => {
    const src = nodeMap.get(String(link["Src NE Name"] || "").trim());
    const sink = nodeMap.get(String(link["Sink NE Name"] || "").trim());
    if (!src || !sink) {
      return;
    }
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", src.x);
    line.setAttribute("y1", src.y);
    line.setAttribute("x2", sink.x);
    line.setAttribute("y2", sink.y);
    line.setAttribute("class", "link");
    canvas.appendChild(line);
  });
  state.layout.nodes.forEach((node) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "node");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", located.has(node.id) ? "9" : "6");
    circle.setAttribute("fill", roleColor(node.role));
    circle.setAttribute("stroke", highlighted.has(node.id) || located.has(node.id) ? "#b44949" : "#ffffff");
    circle.setAttribute("stroke-width", highlighted.has(node.id) || located.has(node.id) ? "3" : "1.5");
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", node.x + 9);
    label.setAttribute("y", node.y + 4);
    label.setAttribute("class", "node-label");
    label.textContent = node.id;
    group.appendChild(circle);
    group.appendChild(label);
    canvas.appendChild(group);
  });
}

function roleColor(role) {
  const value = String(role || "").toUpperCase();
  if (value === "PE" || value === "CORE") return "#4c83b6";
  if (value === "ASG") return "#d9893d";
  if (value === "CSG") return "#6a9c89";
  return "#8792a2";
}

async function loadMetrics() {
  if (!state.versionId) {
    return;
  }
  const result = await api(`/api/v1/metrics/summary/${state.versionId}`);
  renderMetrics(result.metrics);
}

function renderMetrics(metrics) {
  const container = $("metricsContent");
  container.innerHTML = "";
  metrics.forEach((metric) => {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `<strong>${metric.name}</strong><pre>${formatValue(metric.value)}</pre>`;
    container.appendChild(card);
  });
}

function formatValue(value) {
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value ?? "-");
}

async function runMetricSpec(save = false) {
  const metrics = JSON.parse($("metricSpecInput").value);
  if (save) {
    await api("/api/v1/metrics/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `指标模板-${new Date().toLocaleString()}`, metrics })
    });
  }
  const result = await api("/api/v1/metrics/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version_id: state.versionId, metrics })
  });
  renderMetrics(result.metrics);
}

async function loadTable(tableType) {
  if (!state.versionId) {
    return;
  }
  state.currentTable = tableType;
  const result = await api("/api/v1/tables/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version_id: state.versionId, table_type: tableType, limit: 500 })
  });
  renderTable(result);
}

function renderTable(result) {
  const container = $("tableContent");
  if (!result.rows.length) {
    container.textContent = "暂无数据。";
    return;
  }
  const head = `<thead><tr>${result.fields.map((field) => `<th>${escapeHtml(field)}</th>`).join("")}</tr></thead>`;
  const body = result.rows.map((row) => {
    return `<tr>${result.fields.map((field) => `<td>${escapeHtml(row[field] ?? "")}</td>`).join("")}</tr>`;
  }).join("");
  container.innerHTML = `<table>${head}<tbody>${body}</tbody></table>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

async function saveStyleTemplate() {
  const template = {
    roleStyles: {
      PE: { color: "#4c83b6", shape: "circle" },
      ASG: { color: "#d9893d", shape: "square" },
      CSG: { color: "#6a9c89", shape: "triangle" }
    },
    nodeStyleRules: [],
    linkStyleRules: [],
    ringChainStyleRules: []
  };
  await api("/api/v1/styles/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: $("templateNameInput").value.trim() || `样式模板-${new Date().toLocaleString()}`,
      scope: "global",
      template
    })
  });
  await loadStyleTemplates();
}

async function loadStyleTemplates() {
  const templates = await api(`/api/v1/styles/templates${state.versionId ? `?version_id=${state.versionId}` : ""}`);
  const list = $("templateList");
  list.innerHTML = templates.map((item) => `<div>${escapeHtml(item.name)} · ${escapeHtml(item.scope)}</div>`).join("");
}

function bindEvents() {
  $("uploadBtn").addEventListener("click", () => uploadFiles().catch(showError));
  $("refreshVersionsBtn").addEventListener("click", () => loadVersions().catch(showError));
  $("versionSelect").addEventListener("change", async (event) => {
    state.versionId = event.target.value;
    state.actions = [];
    await refreshAll();
  });
  $("layoutBtn").addEventListener("click", () => computeLayout().catch(showError));
  $("filterBtn").addEventListener("click", async () => {
    state.actions = [currentConditionAction("filter")];
    await refreshAll();
  });
  $("highlightBtn").addEventListener("click", async () => {
    state.actions = [currentConditionAction("highlight")];
    await refreshAll();
  });
  $("locateBtn").addEventListener("click", async () => {
    state.actions = [currentConditionAction("locate")];
    await refreshAll();
  });
  $("clearBtn").addEventListener("click", async () => {
    state.actions = [];
    await refreshAll();
  });
  $("metricsToggleBtn").addEventListener("click", () => $("metricsDrawer").classList.toggle("open"));
  $("tableToggleBtn").addEventListener("click", () => $("tableDrawer").classList.toggle("open"));
  $("runMetricSpecBtn").addEventListener("click", () => runMetricSpec(false).catch(showError));
  $("saveMetricSpecBtn").addEventListener("click", () => runMetricSpec(true).catch(showError));
  $("saveStyleTemplateBtn").addEventListener("click", () => saveStyleTemplate().catch(showError));
  $("loadTemplatesBtn").addEventListener("click", () => loadStyleTemplates().catch(showError));
  document.querySelectorAll("[data-table]").forEach((button) => {
    button.addEventListener("click", () => loadTable(button.dataset.table).catch(showError));
  });
}

function showError(error) {
  $("viewMessage").textContent = error.message;
  $("uploadMessage").textContent = error.message;
}

bindEvents();
loadVersions().catch(showError);

