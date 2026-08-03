(function () {
  "use strict";

  const CATALOG_SYNC_INTERVAL_MS = 5000;
  const BACKEND_VERSION_PREFIX = "backend:";

  const adapter = {
    versionId: "",
    versions: [],
    styles: [],
    catalogSyncTimer: 0,
    catalogSyncInFlight: false,
    catalogsReady: false,
    followLatest: true,
    loadingVersionId: "",
    tableType: "devices",
    oldLoadUploadedFiles: null,
    oldRenderVersionControls: null,
    oldRenderTopologies: null
  };

  function boot() {
    if (typeof state === "undefined" || typeof el === "undefined") {
      setTimeout(boot, 80);
      return;
    }
    buildPanels();
    hookUpload();
    hookBackendCatalogControls();
    hookRenderRefresh();
    startBackendCatalogSync();
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
      <div class="agent-catalog-controls">
        <div class="agent-version-row">
          <select id="agentBackendVersionSelect" aria-label="数据库规划版本"></select>
          <button id="agentLoadBackendVersionBtn" type="button">加载版本</button>
        </div>
        <div class="agent-version-row">
          <select id="agentBackendStyleSelect" aria-label="数据库样式版本"></select>
          <button id="agentApplyBackendStyleBtn" type="button">应用样式</button>
        </div>
        <div class="agent-style-save-row">
          <input id="agentStyleNameInput" type="text" maxlength="80" placeholder="样式模板名称">
          <select id="agentStyleScopeSelect" aria-label="样式模板范围">
            <option value="global">全局共享</option>
            <option value="version">当前版本</option>
          </select>
          <button id="agentSaveBackendStyleBtn" type="button">保存</button>
        </div>
        <div id="agentCatalogStatus" class="agent-catalog-status">正在同步数据库版本...</div>
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
    document.getElementById("agentApplyBackendStyleBtn").addEventListener("click", applySelectedBackendStyle);
    document.getElementById("agentSaveBackendStyleBtn").addEventListener("click", saveCurrentBackendStyle);
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
      try {
        const saved = await uploadToBackend();
        if (saved && typeof switchTopoView === "function") switchTopoView("gis");
        await adapter.oldLoadUploadedFiles();
        refreshAdapterPanels();
      } catch (error) {
        setBackendMessage(error.message || String(error), "error");
      }
    }, true);
  }

  function hookBackendCatalogControls() {
    if (typeof renderVersionControls === "function") {
      adapter.oldRenderVersionControls = renderVersionControls;
      renderVersionControls = function () {
        adapter.oldRenderVersionControls();
        renderBackendVersionOptions();
      };
    }
    if (el.projectVersionSelect) {
      el.projectVersionSelect.addEventListener("change", event => {
        const value = String(event.target.value || "");
        if (value.startsWith(BACKEND_VERSION_PREFIX)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          loadBackendVersionById(value.slice(BACKEND_VERSION_PREFIX.length));
          return;
        }
        if (adapter.versionId) {
          adapter.followLatest = false;
          activateBackendVersion("");
        }
      }, true);
    }
    if (el.newVersionBtn) {
      el.newVersionBtn.addEventListener("click", () => {
        adapter.followLatest = false;
        activateBackendVersion("");
      }, true);
    }
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
    if (!neFile || !linkFile) return false;

    const form = new FormData();
    form.append("device_file", neFile);
    form.append("link_file", linkFile);
    if (ringChainFile) form.append("ring_chain_file", ringChainFile);
    if (el.projectNameInput && el.projectNameInput.value.trim()) {
      form.append("version_name", el.projectNameInput.value.trim());
    }

    setBackendMessage("正在同步保存到后端数据库...");
    const result = await api("/api/v1/uploads/topology", { method: "POST", body: form });
    activateBackendVersion(result.version_id);
    adapter.followLatest = true;
    setBackendMessage(`后端已保存版本：${result.version_name || result.parse_timestamp}`);
    await syncBackendCatalogs(true);
    return true;
  }

  function startBackendCatalogSync() {
    syncBackendCatalogs(true);
    window.clearInterval(adapter.catalogSyncTimer);
    adapter.catalogSyncTimer = window.setInterval(() => syncBackendCatalogs(false), CATALOG_SYNC_INTERVAL_MS);
    window.addEventListener("focus", () => syncBackendCatalogs(false));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) syncBackendCatalogs(false);
    });
  }

  async function syncBackendCatalogs(force) {
    if (adapter.catalogSyncInFlight) return;
    adapter.catalogSyncInFlight = true;
    const previousLatestId = adapter.versions.length ? adapter.versions[0].id : "";
    const firstSync = !adapter.catalogsReady;
    try {
      const [versions, styles] = await Promise.all([
        api("/api/v1/versions"),
        api("/api/v1/styles/templates")
      ]);
      adapter.versions = Array.isArray(versions) ? versions : [];
      adapter.styles = Array.isArray(styles) ? styles : [];
      adapter.catalogsReady = true;
      renderBackendCatalogs();

      const latest = adapter.versions[0];
      const shouldLoadInitial = firstSync && latest && !adapter.versionId && !state.nodes.length;
      const shouldFollowNew = !firstSync
        && latest
        && previousLatestId
        && latest.id !== previousLatestId
        && adapter.followLatest
        && adapter.versionId === previousLatestId;
      if ((shouldLoadInitial || shouldFollowNew) && !adapter.loadingVersionId) {
        await loadBackendVersionById(latest.id, { followLatest: true, silent: true });
      }
      setCatalogStatus(`已同步 ${adapter.versions.length} 个规划版本、${adapter.styles.length} 个样式版本`);
    } catch (error) {
      if (force || firstSync) setCatalogStatus(`同步失败：${error.message || String(error)}`, "error");
    } finally {
      adapter.catalogSyncInFlight = false;
    }
  }

  async function loadSelectedBackendVersion() {
    const select = document.getElementById("agentBackendVersionSelect");
    if (!select || !select.value) return;
    await loadBackendVersionById(select.value);
  }

  async function loadBackendVersionById(selectedVersionId, options = {}) {
    if (!selectedVersionId || adapter.loadingVersionId === selectedVersionId) return;
    adapter.loadingVersionId = selectedVersionId;
    setCatalogStatus("正在加载数据库规划版本...");
    const latestId = adapter.versions.length ? adapter.versions[0].id : "";
    adapter.followLatest = options.followLatest == null ? selectedVersionId === latestId : Boolean(options.followLatest);
    try {
    const payload = await api("/api/v1/topology/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version_id: selectedVersionId, view: "gis", actions: [] })
    });
    activateBackendVersion(selectedVersionId);
    if (typeof switchTopoView === "function") switchTopoView("gis");
    if (typeof setData === "function") {
      setData(payload.devices || [], payload.links || [], payload.ringChains || []);
      if (el.projectNameInput) {
        const version = adapter.versions.find(item => item.id === adapter.versionId);
        el.projectNameInput.value = version ? version.version_name : adapter.versionId;
        if (typeof updateProjectNameFromControl === "function") updateProjectNameFromControl();
      }
    }
      renderBackendCatalogs();
      setCatalogStatus(`已加载规划版本：${versionDisplayName(selectedVersionId)}`);
      refreshAdapterPanels();
    } catch (error) {
      setCatalogStatus(`版本加载失败：${error.message || String(error)}`, "error");
      if (!options.silent) setBackendMessage(error.message || String(error), "error");
    } finally {
      adapter.loadingVersionId = "";
      if (!options.fromRemote && window.topoUiController) {
        window.topoUiController.publishCurrentState("manual-version-switch");
      }
    }
  }

  function renderBackendCatalogs() {
    renderBackendVersionSelect();
    renderBackendStyleSelect();
    renderBackendVersionOptions();
  }

  function renderBackendVersionSelect() {
    const select = document.getElementById("agentBackendVersionSelect");
    if (!select) return;
    const selectedId = adapter.versionId || select.value;
    select.innerHTML = adapter.versions.length
      ? adapter.versions.map(item => {
        const summary = item.summary || {};
        const selected = item.id === selectedId ? " selected" : "";
        return `<option value="${escapeAttrLocal(item.id)}"${selected}>${escapeHtmlLocal(item.version_name)} · ${summary.devices || 0}/${summary.links || 0}</option>`;
      }).join("")
      : '<option value="">暂无数据库规划版本</option>';
  }

  function renderBackendVersionOptions() {
    if (!el.projectVersionSelect) return;
    const oldGroup = el.projectVersionSelect.querySelector("optgroup[data-backend-versions]");
    if (oldGroup) oldGroup.remove();
    if (!adapter.versions.length) return;
    const group = document.createElement("optgroup");
    group.label = "数据库规划版本";
    group.setAttribute("data-backend-versions", "true");
    adapter.versions.forEach(item => {
      const summary = item.summary || {};
      const option = document.createElement("option");
      option.value = `${BACKEND_VERSION_PREFIX}${item.id}`;
      option.textContent = `${item.version_name} · ${summary.devices || 0}/${summary.links || 0}`;
      group.appendChild(option);
    });
    el.projectVersionSelect.appendChild(group);
    if (adapter.versionId) el.projectVersionSelect.value = `${BACKEND_VERSION_PREFIX}${adapter.versionId}`;
  }

  function renderBackendStyleSelect() {
    const select = document.getElementById("agentBackendStyleSelect");
    if (!select) return;
    const selectedId = select.value;
    select.innerHTML = adapter.styles.length
      ? adapter.styles.map(item => {
        const scope = item.scope === "global" ? "全局" : "版本";
        const selected = item.id === selectedId ? " selected" : "";
        return `<option value="${escapeAttrLocal(item.id)}"${selected}>${escapeHtmlLocal(item.name)} · ${scope}</option>`;
      }).join("")
      : '<option value="">暂无数据库样式版本</option>';
  }

  function versionDisplayName(versionId) {
    const version = adapter.versions.find(item => item.id === versionId);
    return version ? version.version_name : versionId;
  }

  function applySelectedBackendStyle() {
    const select = document.getElementById("agentBackendStyleSelect");
    const style = select ? adapter.styles.find(item => item.id === select.value) : null;
    if (!style || typeof importStyleTemplate !== "function") {
      setCatalogStatus("请选择可用的数据库样式版本。", "error");
      return;
    }
    const template = style.template && style.template.schema
      ? style.template
      : {
        schema: "topo_visual_tool_style_template",
        version: 1,
        styles: style.template || {}
      };
    importStyleTemplate(template);
    setCatalogStatus(`已应用样式版本：${style.name}`);
  }

  async function saveCurrentBackendStyle() {
    const nameInput = document.getElementById("agentStyleNameInput");
    const scopeSelect = document.getElementById("agentStyleScopeSelect");
    const name = nameInput ? nameInput.value.trim() : "";
    const scope = scopeSelect ? scopeSelect.value : "global";
    if (!name) {
      setCatalogStatus("请输入样式模板名称。", "error");
      return;
    }
    if (scope === "version" && !adapter.versionId) {
      setCatalogStatus("版本样式必须先加载一个数据库规划版本。", "error");
      return;
    }
    try {
      await api("/api/v1/styles/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          scope,
          version_id: scope === "version" ? adapter.versionId : null,
          template: currentStyleTemplate()
        })
      });
      nameInput.value = "";
      await syncBackendCatalogs(true);
      setCatalogStatus(`已保存样式版本：${name}`);
    } catch (error) {
      setCatalogStatus(`样式保存失败：${error.message || String(error)}`, "error");
    }
  }

  function currentStyleTemplate() {
    return {
      schema: "topo_visual_tool_style_template",
      version: 1,
      exportedAt: new Date().toISOString(),
      projectName: state.projectName || "",
      styles: JSON.parse(JSON.stringify({
        roleStyles: state.roleStyles,
        nodeStyleRules: state.nodeStyleRules,
        appliedNodeStyleRules: state.appliedNodeStyleRules,
        linkStyleRules: state.linkStyleRules,
        appliedLinkStyleRules: state.appliedLinkStyleRules,
        ringChainStyleRules: state.ringChainStyleRules,
        appliedRingChainStyleRules: state.appliedRingChainStyleRules,
        routePathStyle: state.routePathStyle
      }))
    };
  }

  function setCatalogStatus(message, level = "ok") {
    const target = document.getElementById("agentCatalogStatus");
    if (!target) return;
    target.textContent = message;
    target.classList.toggle("error", level === "error");
  }

  function activateBackendVersion(versionId) {
    adapter.versionId = versionId;
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

  function setBackendMessage(message, level = "ok") {
    if (el.uploadMessage && typeof setMessage === "function") {
      setMessage(el.uploadMessage, message, level);
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

  window.topoBackendAdapter = {
    getVersionId: () => adapter.versionId,
    isLoading: () => Boolean(adapter.loadingVersionId),
    loadVersionById: loadBackendVersionById,
    refreshCatalogs: () => syncBackendCatalogs(true),
    refreshPanels: refreshAdapterPanels
  };

  boot();
})();
