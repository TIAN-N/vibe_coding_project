const assert = require("node:assert/strict");

const { chromium } = require("playwright");


const baseUrl = process.env.TOPO_BASE_URL || "http://127.0.0.1:8012";
const edgeExecutable = process.env.EDGE_EXECUTABLE;
const screenshotPath = process.env.TOPO_SCREENSHOT_PATH || "ui-command-e2e.png";


async function waitForVisibleCounts(page, nodes, links) {
  await page.waitForFunction(
    expected => {
      const nodeText = document.getElementById("statVisibleNodes")?.textContent;
      const linkText = document.getElementById("statVisibleLinks")?.textContent;
      return Number(nodeText) === expected.nodes && Number(linkText) === expected.links;
    },
    { nodes, links },
    { timeout: 30000 }
  );
}


async function waitForCommandStatus(page, commandId, expectedStatus) {
  await page.waitForFunction(
    async expected => {
      const response = await fetch(`/api/v1/ui/commands/${expected.commandId}`);
      const payload = await response.json();
      return payload.success && payload.data.status === expected.status;
    },
    { commandId, status: expectedStatus },
    { timeout: 30000 }
  );
}


async function queryTopology(page, versionId, actions) {
  const response = await page.request.post(`${baseUrl}/api/v1/topology/query`, {
    data: { version_id: versionId, view: "gis", actions }
  });
  const payload = await response.json();
  assert.equal(payload.success, true);
  return payload.data;
}


async function main() {
  const browser = await chromium.launch({ executablePath: edgeExecutable, headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  try {
    const versionsPayload = await (await page.request.get(`${baseUrl}/api/v1/versions`)).json();
    assert.equal(versionsPayload.success, true);
    const version = versionsPayload.data[0];
    assert.ok(version && version.id, "测试数据库中缺少数据版本");
    const regionPayload = await (await page.request.get(
      `${baseUrl}/api/v1/ui/field-values/${version.id}?source=nodes&field=Region`
    )).json();
    const regionValue = regionPayload.data?.values?.[0];
    assert.ok(regionValue, "测试版本中没有可用 Region 字段值");

    const filterAction = {
      type: "filter",
      source: "nodes",
      mode: "all",
      conditions: [{ field: "Region", op: "eq", value: regionValue }]
    };
    const filtered = await queryTopology(page, version.id, [filterAction]);
    assert.ok(filtered.devices.length > 0, `测试版本中没有 ${regionValue} 网元`);
    const locateNode = filtered.devices[0];
    const highlightRole = locateNode.Role;
    const externalActions = [
      filterAction,
      {
        type: "highlight",
        source: "nodes",
        mode: "all",
        conditions: [{ field: "Role", op: "eq", value: highlightRole }],
        contrast: 0.72
      },
      {
        type: "locate",
        source: "nodes",
        mode: "all",
        conditions: [{ field: "NE Name", op: "eq", value: locateNode["NE Name"] }]
      }
    ];
    const externalExpected = await queryTopology(page, version.id, externalActions);
    const expectedHighlightNodes = externalExpected.devices.filter(row => row.Role === highlightRole).length;
    const styledNode = externalExpected.devices.find(row => row.Role === highlightRole);
    const linkStatus = externalExpected.links[0]?.Status;
    assert.ok(styledNode && linkStatus, "测试数据缺少可验证的网元或链路样式字段");

    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await waitForVisibleCounts(page, version.summary.devices, version.summary.links);
    await page.waitForFunction(() => Boolean(window.topoUiController?.getSessionId()), null, { timeout: 15000 });

    await page.selectOption("#filterField", "Region");
    await page.selectOption("#filterOp", "eq");
    await page.fill("#filterValue", regionValue);
    await page.click("#applyFilterBtn");
    await waitForVisibleCounts(page, filtered.devices.length, filtered.links.length);
    await page.waitForFunction(
      async expected => {
        const response = await fetch("/api/v1/ui/state?target=active");
        const payload = await response.json();
        return payload.data?.ui_state?.state?.filter?.conditions?.[0]?.value === expected;
      },
      regionValue,
      { timeout: 15000 }
    );
    await page.click("#clearFilterBtn");
    await waitForVisibleCounts(page, version.summary.devices, version.summary.links);

    const commandResponse = await page.request.post(`${baseUrl}/api/v1/ui/commands`, {
      data: {
        target: "active",
        requested_by: "playwright-e2e",
        operations: [
          { op: "switch_version", version_id: version.id },
          { op: "switch_view", view: "logic" },
          { op: "clear_visualization" },
          { op: "set_filter", ...filterAction },
          { op: "set_highlight", ...externalActions[1] },
          { op: "locate", ...externalActions[2] },
          {
            op: "set_node_style_rules",
            rules: [{
              source: "nodes",
              mode: "all",
              conditions: [{ field: "Role", op: "eq", value: highlightRole }],
              color: "#ff0066",
              size: 20,
              shape: "diamond",
              label: "API node style"
            }]
          },
          {
            op: "set_link_style_rules",
            rules: [{
              source: "links",
              mode: "all",
              conditions: [{ field: "Status", op: "eq", value: linkStatus }],
              color: "#00aa55",
              line_style: "dash",
              width: "thick"
            }]
          }
        ]
      }
    });
    const commandPayload = await commandResponse.json();
    assert.equal(commandPayload.success, true);
    const command = commandPayload.data;

    await waitForVisibleCounts(page, externalExpected.devices.length, externalExpected.links.length);
    await page.waitForSelector("#logicCanvas:not(.hidden)");
    await page.waitForFunction(
      expected => document.querySelectorAll("#logicCanvas .logic-node").length === expected,
      externalExpected.devices.length,
      { timeout: 30000 }
    );
    await waitForCommandStatus(page, command.id, "rendered");

    const externalSnapshot = await page.evaluate(styledNodeName => {
      const styledNodeGroup = [...document.querySelectorAll("#logicCanvas .logic-node")]
        .find(item => item.getAttribute("data-node") === styledNodeName);
      const styledNodeCore = styledNodeGroup?.querySelector(".core");
      const styledLinks = [...document.querySelectorAll("#logicCanvas .logic-link")]
        .filter(item => item.getAttribute("style")?.includes("stroke:#00aa55"));
      return ({
      logicNodes: document.querySelectorAll("#logicCanvas .logic-node").length,
      logicLinks: document.querySelectorAll("#logicCanvas .logic-link").length,
      highlightedNodes: document.querySelectorAll("#logicCanvas .logic-node.highlight").length,
      locatedNodes: document.querySelectorAll("#logicCanvas .logic-node.located").length,
      styledNodeTag: styledNodeCore?.tagName.toLowerCase() || "",
      styledNodeFill: styledNodeCore?.getAttribute("fill") || "",
      styledLinkCount: styledLinks.length,
      styledLinkStyle: styledLinks[0]?.getAttribute("style") || "",
      legend: document.getElementById("nodeLegend")?.textContent || "",
      metrics: document.getElementById("agentMetricCards")?.textContent || "",
      tableNote: document.getElementById("agentTableNote")?.textContent || ""
      });
    }, styledNode["NE Name"]);
    assert.equal(externalSnapshot.logicNodes, externalExpected.devices.length);
    assert.equal(externalSnapshot.logicLinks, externalExpected.links.length);
    assert.equal(externalSnapshot.highlightedNodes, expectedHighlightNodes);
    assert.equal(externalSnapshot.locatedNodes, 1);
    assert.equal(externalSnapshot.styledNodeTag, "polygon");
    assert.equal(externalSnapshot.styledNodeFill, "#ff0066");
    assert.ok(externalSnapshot.styledLinkCount > 0);
    assert.match(externalSnapshot.styledLinkStyle, /stroke-dasharray:8 6/);
    assert.match(externalSnapshot.styledLinkStyle, /stroke-width:4\.2/);
    assert.ok(externalSnapshot.metrics.includes(`${externalExpected.devices.length} / ${version.summary.devices}`));
    assert.ok(externalSnapshot.tableNote.includes(String(externalExpected.devices.length)));

    await page.click("#agentMetricsToggle");
    await page.waitForSelector("#agentMetricsDrawer.open");
    await page.waitForFunction(
      expected => !state.logic.layoutPending
        && document.querySelectorAll("#logicCanvas .logic-node").length === expected,
      externalExpected.devices.length,
      { timeout: 30000 }
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await page.click("#agentMetricsToggle");

    const clearPayload = await (await page.request.post(`${baseUrl}/api/v1/ui/commands`, {
      data: {
        target: "active",
        requested_by: "playwright-e2e",
        operations: [{ op: "clear_visualization" }]
      }
    })).json();
    assert.equal(clearPayload.success, true);
    await waitForVisibleCounts(page, version.summary.devices, version.summary.links);
    await waitForCommandStatus(page, clearPayload.data.id, "rendered");

    await page.selectOption("#highlightField", "Region");
    await page.selectOption("#highlightOp", "eq");
    await page.fill("#highlightValue", regionValue);
    await page.click("#applyHighlightBtn");
    await page.waitForFunction(
      expected => document.querySelectorAll("#logicCanvas .logic-node.highlight").length === expected,
      filtered.devices.length
    );
    await page.fill("#searchInput", locateNode["NE Name"]);
    await page.click("#locateBtn");
    await page.waitForFunction(() => document.querySelectorAll("#logicCanvas .logic-node.located").length === 1);

    assert.deepEqual(pageErrors, []);
    process.stdout.write(JSON.stringify({
      versionId: version.id,
      totalNodes: version.summary.devices,
      expectedNodes: externalExpected.devices.length,
      expectedLinks: externalExpected.links.length,
      commandStatus: "rendered",
      externalSnapshot,
      manualFilterSynced: true,
      manualHighlight: true,
      manualLocate: true,
      screenshotPath
    }, null, 2));
  } finally {
    await browser.close();
  }
}


main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
