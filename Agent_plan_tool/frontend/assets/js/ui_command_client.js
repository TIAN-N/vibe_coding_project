(function () {
  "use strict";

  const CLIENT_KEY = "topo_visual_ui_client_id_v1";
  const controller = {
    clientId: getOrCreateClientId(),
    sessionId: "",
    revision: 0,
    applyingRemote: false,
    eventSource: null,
    heartbeatTimer: 0,
    publishTimer: 0,
    pendingReason: "",
    applyQueue: Promise.resolve()
  };

  window.topoUiController = {
    publishCurrentState,
    isApplyingRemote: () => controller.applyingRemote,
    getSessionId: () => controller.sessionId,
    getRevision: () => controller.revision
  };

  boot();

  async function boot() {
    try {
      const registered = await api("/api/v1/ui/sessions/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: controller.clientId,
          is_focused: document.hasFocus(),
          active_version_id: currentVersionId() || null
        })
      });
      controller.sessionId = registered.session.id;
      if (registered.ui_state) await enqueueSnapshot(registered.ui_state);
      connectEvents();
      startHeartbeat();
    } catch (error) {
      reportStatus(`浏览器控制会话注册失败：${error.message || String(error)}`, "error");
      window.setTimeout(boot, 3000);
    }
  }

  function connectEvents() {
    if (!controller.sessionId) return;
    if (controller.eventSource) controller.eventSource.close();
    const url = `/api/v1/ui/sessions/${encodeURIComponent(controller.sessionId)}/events?after_revision=${controller.revision}`;
    controller.eventSource = new EventSource(url);
    controller.eventSource.addEventListener("ui_state", event => {
      try {
        enqueueSnapshot(JSON.parse(event.data));
      } catch (error) {
        reportStatus(`可视化指令解析失败：${error.message || String(error)}`, "error");
      }
    });
  }

  function startHeartbeat() {
    window.clearInterval(controller.heartbeatTimer);
    controller.heartbeatTimer = window.setInterval(sendHeartbeat, 10000);
    window.addEventListener("focus", sendHeartbeat);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) sendHeartbeat();
    });
  }

  async function sendHeartbeat() {
    if (!controller.sessionId) return;
    try {
      await api(`/api/v1/ui/sessions/${encodeURIComponent(controller.sessionId)}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_focused: document.hasFocus() && !document.hidden,
          active_version_id: currentVersionId() || null
        })
      });
    } catch (error) {
      reportStatus(`浏览器控制心跳失败：${error.message || String(error)}`, "error");
    }
  }

  function publishCurrentState(reason) {
    if (controller.applyingRemote || !controller.sessionId || !currentVersionId()) return;
    controller.pendingReason = reason || "browser";
    window.clearTimeout(controller.publishTimer);
    controller.publishTimer = window.setTimeout(flushCurrentState, 100);
  }

  async function flushCurrentState() {
    if (controller.applyingRemote || !controller.sessionId || !currentVersionId()) return;
    try {
      const command = await api("/api/v1/ui/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: controller.sessionId,
          expected_revision: controller.revision,
          requested_by: `browser:${controller.pendingReason || "manual"}`,
          operations: buildCurrentOperations()
        })
      });
      if (command.ui_state) controller.revision = Number(command.ui_state.revision) || controller.revision;
      await acknowledge(command.id, controller.revision, true, await waitForRender());
    } catch (error) {
      if (String(error.message || error).includes("409")) await reconcileState();
      else reportStatus(`界面状态回写失败：${error.message || String(error)}`, "error");
    }
  }

  function enqueueSnapshot(snapshot) {
    controller.applyQueue = controller.applyQueue
      .then(() => applySnapshot(snapshot))
      .catch(error => reportStatus(`界面指令执行失败：${error.message || String(error)}`, "error"));
    return controller.applyQueue;
  }

  async function applySnapshot(snapshot) {
    const revision = Number(snapshot && snapshot.revision);
    if (!Number.isFinite(revision) || revision <= controller.revision) return;
    const desired = snapshot.state || {};
    const previousVersionId = currentVersionId();
    const previousView = state.view;
    const previousLocateKey = stateRuleKey(frontendGroup(state.locateRule));
    const nextView = desired.view === "logic" ? "logic" : "gis";
    const locateRule = frontendGroup(desired.locate);
    window.clearTimeout(controller.publishTimer);
    controller.applyingRemote = true;
    try {
      await ensureVersion(desired.version_id);
      const versionChanged = previousVersionId !== currentVersionId();
      const viewChanged = previousView !== nextView;
      const locateChanged = previousLocateKey !== stateRuleKey(locateRule);
      state.filterRule = frontendGroup(desired.filter);
      state.highlightRule = frontendGroup(desired.highlight);
      state.highlightContrast = Number.isFinite(Number(desired.highlight_contrast))
        ? Number(desired.highlight_contrast)
        : DEFAULT_HIGHLIGHT_CONTRAST;
      applyStyleRules(desired.node_style_rules, desired.link_style_rules);
      state.locateRule = null;
      state.locatedNames = new Set();
      state.locatedLinkKeys = new Set();
      state.bulkQuery = null;
      state.selectedName = "";
      state.selectedLinkKey = "";
      state.selectedRouteKey = "";
      state.selectedCoordinateKey = "";
      if (el.bulkQueryInput) el.bulkQueryInput.value = "";
      if (el.highlightContrastInput) el.highlightContrastInput.value = state.highlightContrast;
      syncQuickControls("filter", state.filterRule);
      syncQuickControls("highlight", state.highlightRule);
      syncLocateControl(desired.locate);
      invalidateLogicLayout();
      updateRuleSummaries();
      switchPage("topo");
      switchTopoView(nextView, { render: false, publish: false });
      if (locateRule) {
        applyLocateRule(locateRule, false, {
          focus: versionChanged || viewChanged || locateChanged,
          render: false,
          publish: false
        });
      }
      await prepareTopoViewForRender();
      renderTopologies();
      const renderResult = await waitForRender();
      controller.revision = revision;
      if (snapshot.command_id) await acknowledge(snapshot.command_id, revision, true, renderResult);
      reportStatus(`已执行可视化指令（修订 ${revision}）`, "ok");
    } catch (error) {
      controller.revision = revision;
      if (snapshot.command_id) {
        await acknowledge(snapshot.command_id, revision, false, {}, error.message || String(error));
      }
      throw error;
    } finally {
      controller.applyingRemote = false;
    }
  }

  async function ensureVersion(versionId) {
    if (!versionId) return;
    const adapter = await waitForAdapter();
    while (adapter.isLoading()) await delay(80);
    if (adapter.getVersionId() !== versionId || !state.nodes.length) {
      await adapter.loadVersionById(versionId, { fromRemote: true, followLatest: false, silent: true });
      while (adapter.isLoading()) await delay(80);
    }
    if (adapter.getVersionId() !== versionId) throw new Error(`数据版本加载失败：${versionId}`);
  }

  async function waitForAdapter() {
    const started = Date.now();
    while (!window.topoBackendAdapter) {
      if (Date.now() - started > 10000) throw new Error("后端版本适配器尚未就绪");
      await delay(50);
    }
    return window.topoBackendAdapter;
  }

  function buildCurrentOperations() {
    const operations = [
      { op: "switch_version", version_id: currentVersionId() },
      { op: "switch_view", view: state.view === "logic" ? "logic" : "gis" },
      { op: "clear_visualization" }
    ];
    const filter = backendGroup(state.filterRule);
    const highlight = backendGroup(state.highlightRule);
    const locate = backendGroup(state.locateRule);
    if (filter) operations.push({ op: "set_filter", ...filter });
    if (highlight) operations.push({ op: "set_highlight", ...highlight, contrast: state.highlightContrast || 0.72 });
    if (locate) operations.push({ op: "locate", ...locate });
    const nodeStyleRules = backendNodeStyleRules(state.appliedNodeStyleRules);
    const linkStyleRules = backendLinkStyleRules(state.appliedLinkStyleRules);
    operations.push(nodeStyleRules.length
      ? { op: "set_node_style_rules", rules: nodeStyleRules }
      : { op: "clear_node_style_rules" });
    operations.push(linkStyleRules.length
      ? { op: "set_link_style_rules", rules: linkStyleRules }
      : { op: "clear_link_style_rules" });
    return operations;
  }

  function currentVersionId() {
    return window.topoBackendAdapter ? window.topoBackendAdapter.getVersionId() : "";
  }

  function backendGroup(rule) {
    const group = normalizeRuleGroup(rule);
    if (!group) return null;
    return {
      source: group.source || "nodes",
      mode: group.mode === "any" ? "any" : "all",
      conditions: group.conditions.map(condition => ({
        field: condition.field,
        op: backendOp(condition.op),
        value: condition.value == null ? "" : condition.value
      }))
    };
  }

  function backendNodeStyleRules(rules) {
    return (Array.isArray(rules) ? rules : []).map(rule => ({
      ...backendGroup(rule),
      color: rule.color,
      size: Number(rule.size),
      shape: rule.shape,
      label: rule.label || ""
    }));
  }

  function backendLinkStyleRules(rules) {
    return (Array.isArray(rules) ? rules : []).map(rule => ({
      ...backendGroup(rule),
      color: rule.color,
      line_style: rule.lineStyle,
      width: rule.width
    }));
  }

  function applyStyleRules(nodeRules, linkRules) {
    const report = { adjusted: 0, skipped: 0 };
    state.nodeStyleRules = sanitizeStyleRuleList(apiStyleRules(nodeRules, "node"), "node", report);
    state.appliedNodeStyleRules = cloneRuleList(state.nodeStyleRules);
    state.linkStyleRules = sanitizeStyleRuleList(apiStyleRules(linkRules, "link"), "link", report);
    state.appliedLinkStyleRules = cloneRuleList(state.linkStyleRules);
    clearStyleRuleMatchCache();
    renderNodeStyleRules();
    renderLinkStyleRules();
  }

  function apiStyleRules(rules, type) {
    return (Array.isArray(rules) ? rules : []).map(rule => ({
      ...rule,
      ...(frontendGroup(rule) || {}),
      lineStyle: type === "link" ? rule.line_style : rule.lineStyle
    }));
  }

  function frontendGroup(group) {
    if (!group || !Array.isArray(group.conditions) || !group.conditions.length) return null;
    return {
      source: ["nodes", "links", "ringChains"].includes(group.source) ? group.source : "nodes",
      mode: group.mode === "any" ? "any" : "all",
      conditions: group.conditions.map(condition => ({
        field: condition.field,
        op: frontendOp(condition.op),
        value: condition.value == null ? "" : condition.value
      }))
    };
  }

  function backendOp(op) {
    return ({ notContains: "not_contains", starts: "startswith", ends: "endswith", notEmpty: "not_empty" })[op]
      || op || "contains";
  }

  function frontendOp(op) {
    return ({ not_contains: "notContains", startswith: "starts", endswith: "ends", not_empty: "notEmpty" })[op]
      || op || "contains";
  }

  function stateRuleKey(rule) {
    return rule ? JSON.stringify(rule) : "";
  }

  function syncQuickControls(kind, group) {
    const field = el[`${kind}Field`];
    const op = el[`${kind}Op`];
    const value = el[`${kind}Value`];
    const condition = group && group.source === "nodes" ? group.conditions[0] : null;
    if (!field || !op || !value) return;
    if (!condition) {
      value.value = "";
      return;
    }
    if ([...field.options].some(option => option.value === condition.field)) field.value = condition.field;
    if ([...op.options].some(option => option.value === condition.op)) op.value = condition.op;
    value.value = condition.value;
  }

  function syncLocateControl(group) {
    if (!el.searchInput) return;
    const first = group && group.source === "nodes" && group.conditions ? group.conditions[0] : null;
    el.searchInput.value = first && first.field === "NE Name" ? first.value : "";
  }

  async function waitForRender() {
    const deadline = Date.now() + 30000;
    await nextFrame();
    while (state.view === "logic" && state.logic.layoutPending && Date.now() < deadline) {
      await delay(80);
    }
    const visible = getVisibleData();
    return {
      version_id: currentVersionId(),
      view: state.view,
      visible_nodes: visible.nodes.length,
      visible_links: visible.links.length,
      layout: {
        status: state.view !== "logic" ? "not_required" : (state.logic.layoutError ? "failed" : "rendered"),
        algorithm: state.logic.layoutAlgorithm || null,
        error: state.logic.layoutError || null
      },
      node_style_rule_count: state.appliedNodeStyleRules.length,
      link_style_rule_count: state.appliedLinkStyleRules.length
    };
  }

  async function acknowledge(commandId, revision, success, result, errorMessage) {
    if (!commandId || !controller.sessionId) return;
    try {
      await api(`/api/v1/ui/commands/${encodeURIComponent(commandId)}/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: controller.sessionId,
          revision,
          success,
          result: result || {},
          error_message: errorMessage || null
        })
      });
    } catch (error) {
      if (!String(error.message || error).includes("409")) throw error;
    }
  }

  async function reconcileState() {
    const value = await api(`/api/v1/ui/state?target=${encodeURIComponent(controller.sessionId)}`);
    if (value.ui_state) await enqueueSnapshot(value.ui_state);
  }

  async function api(path, options) {
    const response = await fetch(path, options);
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(`HTTP ${response.status}: ${payload.detail || payload.message || "请求失败"}`);
    }
    return payload.data;
  }

  function reportStatus(message, level) {
    const target = document.getElementById("agentCatalogStatus") || el.uploadMessage;
    if (target && typeof setMessage === "function") setMessage(target, message, level);
  }

  function getOrCreateClientId() {
    let value = sessionStorage.getItem(CLIENT_KEY);
    if (!value) {
      value = window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(CLIENT_KEY, value);
    }
    return value;
  }

  function delay(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
  }

  function nextFrame() {
    return new Promise(resolve => window.requestAnimationFrame(() => resolve()));
  }
})();
