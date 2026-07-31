(function () {
  "use strict";

  const adapter = {
    versionId: "",
    versions: [],
    tableType: "devices",
    layoutCacheKey: "",
    layoutCache: null,
    oldLoadUploadedFiles: null,
    oldComputeLogicLayout: null,
    oldRenderTopologies: null
  };

  function boot() {
    if (typeof state === "undefined" || typeof el === "undefined") {
      setTimeout(boot, 80);
      return;
    }
    buildPanels();
    hookUpload();
    hookBackendLayout();
    hookRenderRefresh();
    loadBackendVersions();
    refreshAdapterPanels();
  }

  function buildPanels() {
    if (document.getElementById("agentMetricsDrawer")) return;

    const metricsToggle = document.createElement("button");
    metricsToggle.id = "agentMetricsToggle";
    metricsToggle.className = "agent-floating-toggle agent-metrics-toggle";
    metricsToggle.type = "button";
    metricsToggle.textContent = "指标";
    document.body.appendChild(metricsToggle);

    const tableToggle = document.createElement("button");
    tableToggle.id = "agentTableToggle";
    tableToggle.className = "agent-floating-toggle agent-table-toggle";
    tableToggle.type = "button";
    tableToggle.textContent = "明细";
    document.body.appendChild(tableToggle);

    const drawer = document.createElement("aside");
    drawer.id = "agentMetricsDrawer";
    drawer.className = "agent-metrics-drawer";
    drawer.innerHTML = `
      <div class="agent-drawer-head">
        <h2>动态指标看板</h2>
        <button id="agentCloseMetricsBtn" type="button">收起</button>
      </div>
      <div class="agent-version-row">
        <select id="agentBackendVersionSelect" aria-label="后端数据版本"></select>
        <button id="agentLoadBackendVersionBtn" type="button">加载</button>
      </div>
      <div id="agentMetricCards" class="agent-metric-cards"></div>
    `;
    document.body.appendChild(drawer);

    const tablePanel = document.createElement("section");
    tablePanel.id = "agentTablePanel";
    tablePanel.className = "agent-table-panel";
    tablePanel.innerHTML = `
      <div class="agent-table-toolbar">
        <strong>数据库明细联动</strong>
        <div class="agent-table-actions">
          <select id="agentTableTypeSelect">
            <option value="devices">网元表</option>
            <option value="links">链路表</option>
            <option value="ringChains">环链表</option>
          </select>
          <button id="agentRefreshTableBtn" type="button">刷新</button>
          <span id="agentTableNote" class="agent-status-note">跟随当前过滤结果</span>
        </div>
      </div>
      <div id="agentTableWrap" class="agent-table-wrap"></div>
    `;
    document.body.appendChild(tablePanel);

    metricsToggle.addEventListener("click", () => drawer.classList.toggle("open"));
    tableToggle.addEventListener("click", () => tablePanel.classList.toggle("open"));
    document.getElementById("agentCloseMetricsBtn").addEventListener("click", () => drawer.classList.remove("open"));
    document.getElementById("agentLoadBackendVersionBtn").addEventListener("click", loadSelectedBackendVersion);
    document.getElementById("agentRefreshTableBtn").addEventListener("click", refreshAdapterTable);
    document.getElementById("agentTableTypeSelect").addEventListener("change", event => {
      adapter.tableType = event.target.value;
      refreshAdapterTable();
    });
  }

  function hookUpload() {
    adapter.oldLoadUploadedFiles = typeof loadUploadedFiles === "function" ? loadUploadedFiles : null;
    if (!el.loadFilesBtn || !adapter.oldLoadUploadedFiles) return;

    el.loadFilesBtn.addEventListener("click", async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      await uploadToBackend();
      await adapter.oldLoadUploadedFiles();
      refreshAdapterPanels();
    }, true);
  }

  function hookBackendLayout() {
    if (typeof computeLogicLayout !== "function") return;
    adapter.oldComputeLogicLayout = computeLogicLayout;
    computeLogicLayout = function (resetTransform, layoutNodes, layoutLinks, reservedBottomHeight) {
      adapter.oldComputeLogicLayout(resetTransform, layoutNodes, layoutLinks, reservedBottomHeight);
      requestBackendLayout(resetTransform, layoutNodes || state.nodes, layoutLinks || state.links);
    };
  }

  function hookRenderRefresh() {
    if (typeof renderTopologies !== "function") return;
    adapter.oldRenderTopologies = renderTopologies;
    renderTopologies = function () {
      adapter.oldRenderTopologies();
      refreshAdapterPanels();
    };
  }

  async function uploadToBackend() {
    const neFile = el.neFile && el.neFile.files[0];
    const linkFile = el.linkFile && el.linkFile.files[0];
    const ringChainFile = el.ringChainFile && el.ringChainFile.files[0];
    if (!neFile || !linkFile) return;

    const form = new FormData();
    form.append("device_file", neFile);
    form.append("link_file", linkFile);
    if (ringChainFile) form.append("ring_chain_file", ringChainFile);
    if (el.projectNameInput && el.projectNameInput.value.trim()) {
      form.append("version_name", el.projectNameInput.value.trim());
    }

    setBackendMessage("正在同步保存到后端数据库...");
    const result = await api("/api/v1/uploads/topology", { method: "POST", body: form });
    adapter.versionId = result.version_id;
    setBackendMessage(`后端已保存版本：${result.version_name || result.parse_timestamp}`);
    await loadBackendVersions();
  }

  async function loadBackendVersions() {
    try {
      adapter.versions = await api("/api/v1/versions");
      const select = document.getElementById("agentBackendVersionSelect");
      if (!select) return;
      select.innerHTML = adapter.versions.map(item => {
        const summary = item.summary || {};
        const selected = item.id === adapter.versionId ? " selected" : "";
        return `<option value="${escapeAttrLocal(item.id)}"${selected}>${escapeHtmlLocal(item.version_name)} · ${summary.devices || 0}/${summary.links || 0}</option>`;
      }).join("");
      if (!adapter.versionId && adapter.versions.length) {
        adapter.versionId = adapter.versions[0].id;
        select.value = adapter.versionId;
      }
    } catch (error) {
      setBackendMessage(error.message || String(error));
    }
  }

  async function loadSelectedBackendVersion() {
    const select = document.getElementById("agentBackendVersionSelect");
    if (!select || !select.value) return;
    adapter.versionId = select.value;
    const payload = await api("/api/v1/topology/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version_id: adapter.versionId, view: "gis", actions: [] })
    });
    if (typeof setData === "function") {
      setData(payload.devices || [], payload.links || [], payload.ringChains || []);
      if (el.projectNameInput) {
        const version = adapter.versions.find(item => item.id === adapter.versionId);
        el.projectNameInput.value = version ? version.version_name : adapter.versionId;
        if (typeof updateProjectNameFromControl === "function") updateProjectNameFromControl();
      }
    }
    refreshAdapterPanels();
  }

  async function requestBackendLayout(resetTransform, layoutNodes, layoutLinks) {
    if (!adapter.versionId || !layoutNodes || !layoutNodes.length) return;
    if (layoutNodes.length > 500) return;

    const rect = el.logicCanvas.getBoundingClientRect();
    const layoutKey = [
      adapter.versionId,
      layoutNodes.map(node => node["NE Name"]).sort().join("|"),
      layoutLinks.map(link => `${link["Src NE Name"]}->${link["Sink NE Name"]}`).sort().join("|"),
      Math.round(rect.width),
      Math.round(rect.height)
    ].join("::");
    if (layoutKey === adapter.layoutCacheKey && adapter.layoutCache) {
      applyBackendLayout(adapter.layoutCache, resetTransform, layoutNodes);
      return;
    }

    try {
      const result = await api("/api/v1/layout/logic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version_id: adapter.versionId,
          canvas_width: Math.max(900, rect.width || 900),
          canvas_height: Math.max(600, rect.height || 600),
          actions: buildBackendActions()
        })
      });
      if (!result.layout_available) return;
      adapter.layoutCacheKey = layoutKey;
      adapter.layoutCache = result;
      applyBackendLayout(result, resetTransform, layoutNodes);
    } catch (error) {
      setBackendMessage(error.message || String(error));
    }
  }

  function applyBackendLayout(result, resetTransform, layoutNodes) {
    const positions = new Map();
    (result.nodes || []).forEach(node => {
      positions.set(node.id, { x: node.x, y: node.y });
    });
    if (!positions.size) return;
    state.logic.positions = positions;
    state.logic.layoutWidth = result.canvas ? result.canvas.width : el.logicCanvas.clientWidth;
    state.logic.layoutHeight = result.canvas ? result.canvas.height : el.logicCanvas.clientHeight;
    if (resetTransform && typeof fitLogicToBounds === "function") {
      fitLogicToBounds(layoutNodes);
    }
    if (state.view === "logic" && typeof renderLogic === "function" && typeof getVisibleData === "function") {
      renderLogic(getVisibleData());
    }
  }

  function buildBackendActions() {
    const actions = [];
    const filter = normalizeBackendGroup(state.filterRule);
    const highlight = normalizeBackendGroup(state.highlightRule);
    const locate = normalizeBackendGroup(state.locateRule);
    if (filter) actions.push({ type: "filter", ...filter });
    if (highlight) actions.push({ type: "highlight", ...highlight, contrast: state.highlightContrast || 0.72 });
    if (locate) actions.push({ type: "locate", ...locate });
    return actions;
  }

  function normalizeBackendGroup(rule) {
    if (!rule) return null;
    const source = rule.source || "nodes";
    const mode = rule.mode || "all";
    const conditions = Array.isArray(rule.conditions) && rule.conditions.length
      ? rule.conditions
      : [{ field: rule.field, op: rule.op, value: rule.value }];
    const clean = conditions
      .filter(item => item && item.field)
      .map(item => ({
        field: item.field,
        op: normalizeOp(item.op),
        value: item.value == null ? "" : item.value
      }));
    if (!clean.length) return null;
    return { source, mode, conditions: clean };
  }

  function normalizeOp(op) {
    const value = String(op || "contains");
    if (value === "notEmpty") return "not_empty";
    if (value === "notContains") return "not_contains";
    if (value === "startsWith") return "startswith";
    if (value === "endsWith") return "endswith";
    return value;
  }

  function refreshAdapterPanels() {
    renderMetricCards();
    refreshAdapterTable();
  }

  function renderMetricCards() {
    const target = document.getElementById("agentMetricCards");
    if (!target || typeof getVisibleData !== "function") return;

    const data = getVisibleData();
    const ringRows = Array.isArray(data.filteredRingChains) ? data.filteredRingChains : state.ringChains;
    const cards = [
      simpleCard("当前版本", state.projectName || "-"),
      simpleCard("网元", `${data.nodes.length} / ${state.nodes.length}`),
      simpleCard("链路", `${data.links.length} / ${state.links.length}`),
      simpleCard("环", `${countByValue(ringRows, "Category").Ring || 0}`),
      simpleCard("链", `${countByValue(ringRows, "Category").Link || 0}`),
      listCard("角色分布", countByValue(data.nodes, "Role")),
      listCard("链路状态", countByValue(data.links, "Status")),
      listCard("环链标签", countByValue(ringRows, "Label"))
    ];
    target.innerHTML = cards.join("");
  }

  function simpleCard(title, value) {
    return `<div class="agent-card"><div class="agent-card-title">${escapeHtmlLocal(title)}</div><div class="agent-card-value">${escapeHtmlLocal(value)}</div></div>`;
  }

  function listCard(title, values) {
    const entries = Object.entries(values).slice(0, 8);
    const body = entries.length
      ? entries.map(([key, value]) => `<div><span>${escapeHtmlLocal(key || "(空)")}</span><b>${value}</b></div>`).join("")
      : `<div><span>暂无</span><b>0</b></div>`;
    return `<div class="agent-card"><div class="agent-card-title">${escapeHtmlLocal(title)}</div><div class="agent-card-list">${body}</div></div>`;
  }

  function refreshAdapterTable() {
    const wrap = document.getElementById("agentTableWrap");
    const note = document.getElementById("agentTableNote");
    if (!wrap || typeof getVisibleData !== "function") return;

    const data = getVisibleData();
    const rows = adapter.tableType === "devices"
      ? data.nodes
      : adapter.tableType === "links"
        ? data.links
        : (Array.isArray(data.filteredRingChains) ? data.filteredRingChains : state.ringChains);
    note.textContent = `当前 ${rows.length} 条，最多显示 500 条`;
    renderLocalTable(wrap, rows.slice(0, 500));
  }

  function renderLocalTable(wrap, rows) {
    if (!rows.length) {
      wrap.innerHTML = `<div class="agent-status-note" style="padding:12px">暂无数据</div>`;
      return;
    }
    const fields = collectFields(rows).slice(0, 40);
    const head = `<thead><tr>${fields.map(field => `<th>${escapeHtmlLocal(field)}</th>`).join("")}</tr></thead>`;
    const body = rows.map(row => `<tr>${fields.map(field => `<td>${escapeHtmlLocal(row[field] == null ? "" : row[field])}</td>`).join("")}</tr>`).join("");
    wrap.innerHTML = `<table class="agent-table">${head}<tbody>${body}</tbody></table>`;
  }

  function collectFields(rows) {
    const fields = [];
    const seen = new Set();
    rows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key.startsWith("_") || seen.has(key)) return;
        seen.add(key);
        fields.push(key);
      });
    });
    return fields;
  }

  function countByValue(rows, field) {
    const result = {};
    rows.forEach(row => {
      const key = String(row[field] || "").trim() || "(空)";
      result[key] = (result[key] || 0) + 1;
    });
    return Object.fromEntries(Object.entries(result).sort((a, b) => b[1] - a[1]));
  }

  async function api(path, options) {
    const response = await fetch(path, options);
    const payload = await response.json();
    if (!payload.success) throw new Error(payload.message || "后端接口调用失败");
    return payload.data;
  }

  function setBackendMessage(message) {
    if (el.uploadMessage && typeof setMessage === "function") {
      setMessage(el.uploadMessage, message, "ok");
    }
  }

  function escapeHtmlLocal(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function escapeAttrLocal(value) {
    return escapeHtmlLocal(value).replace(/`/g, "&#96;");
  }

  boot();
})();
