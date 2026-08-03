const assert = require("node:assert/strict");

const { chromium } = require("playwright");


const baseUrl = process.env.TOPO_BASE_URL || "http://127.0.0.1:8012";
const edgeExecutable = process.env.EDGE_EXECUTABLE;
const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);


async function waitForCommand(page, commandId) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const payload = await (await page.request.get(
      `${baseUrl}/api/v1/ui/commands/${commandId}`
    )).json();
    if (payload.data?.status === "rendered") return payload.data;
    if (payload.data?.status === "failed") {
      throw new Error(payload.data.error_message || "可视化命令执行失败");
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`等待命令渲染超时: ${commandId}`);
}


async function submitCommand(page, sessionId, operations) {
  const payload = await (await page.request.post(`${baseUrl}/api/v1/ui/commands`, {
    data: {
      target: sessionId,
      requested_by: "gis-resilience-e2e",
      operations
    }
  })).json();
  assert.equal(payload.success, true);
  return waitForCommand(page, payload.data.id);
}


async function main() {
  let tileMode = "slow-success";
  const browser = await chromium.launch({ executablePath: edgeExecutable, headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.route("https://*.tile.openstreetmap.org/**", async route => {
    if (tileMode === "error") {
      await route.fulfill({ status: 503, contentType: "text/plain", body: "tile unavailable" });
      return;
    }
    if (tileMode === "slow-success") {
      await new Promise(resolve => setTimeout(resolve, 3500));
    }
    await route.fulfill({ status: 200, contentType: "image/png", body: transparentPng });
  });

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => Boolean(window.L && state.map && state.tileLayer)
        && Boolean(window.topoUiController?.getSessionId())
        && Boolean(window.topoBackendAdapter?.getVersionId())
        && state.nodes.some(node => hasCoord(node)),
      null,
      { timeout: 30000 }
    );
    await page.waitForTimeout(4200);

    const initial = await page.evaluate(() => ({
      sessionId: window.topoUiController.getSessionId(),
      versionId: window.topoBackendAdapter.getVersionId(),
      nodeName: state.nodes.find(node => hasCoord(node))["NE Name"],
      mapWidth: state.map.getSize().x,
      mapHeight: state.map.getSize().y,
      hasTileLayer: Boolean(state.tileLayer),
      tileDegraded: state.tileDegraded,
      hasLegacyClass: el.map.classList.contains("light-basemap")
    }));
    assert.ok(initial.mapWidth > 0 && initial.mapHeight > 0);
    assert.equal(initial.hasTileLayer, true);
    assert.equal(initial.tileDegraded, false);
    assert.equal(initial.hasLegacyClass, false);

    await submitCommand(page, initial.sessionId, [
      { op: "switch_version", version_id: initial.versionId },
      { op: "switch_view", view: "gis" },
      {
        op: "locate",
        source: "nodes",
        mode: "all",
        conditions: [{ field: "NE Name", op: "eq", value: initial.nodeName }]
      }
    ]);
    await page.evaluate(() => {
      window.__gisMoveCount = 0;
      window.__gisRenderCount = 0;
      state.map.on("moveend", () => { window.__gisMoveCount += 1; });
      const originalRender = renderTopologies;
      renderTopologies = function () {
        window.__gisRenderCount += 1;
        return originalRender();
      };
    });

    for (let index = 0; index < 12; index += 1) {
      await submitCommand(page, initial.sessionId, [{ op: "switch_view", view: "gis" }]);
    }
    const afterCommands = await page.evaluate(() => ({
      moveCount: window.__gisMoveCount,
      renderCount: window.__gisRenderCount,
      hasTileLayer: Boolean(state.tileLayer && state.map.hasLayer(state.tileLayer)),
      tileDegraded: state.tileDegraded,
      hasLegacyClass: el.map.classList.contains("light-basemap"),
      renderedNodes: state.mapLayers.nodes.length
    }));
    assert.ok(afterCommands.moveCount <= 1, `重复 API 命令触发地图移动 ${afterCommands.moveCount} 次`);
    assert.ok(afterCommands.renderCount <= 16, `12 个 API 命令触发渲染 ${afterCommands.renderCount} 次`);
    assert.equal(afterCommands.hasTileLayer, true);
    assert.equal(afterCommands.tileDegraded, false);
    assert.equal(afterCommands.hasLegacyClass, false);
    assert.ok(afterCommands.renderedNodes > 0);

    tileMode = "error";
    await page.evaluate(() => { state.tileLayer.redraw(); });
    await page.waitForFunction(
      () => state.tileDegraded && el.map.classList.contains("tile-degraded"),
      null,
      { timeout: 15000 }
    );
    const degraded = await page.evaluate(() => ({
      hasTileLayer: Boolean(state.tileLayer && state.map.hasLayer(state.tileLayer)),
      hasLegacyClass: el.map.classList.contains("light-basemap")
    }));
    assert.equal(degraded.hasTileLayer, true);
    assert.equal(degraded.hasLegacyClass, false);

    tileMode = "success";
    await page.evaluate(() => { state.tileLayer.redraw(); });
    await page.waitForFunction(
      () => !state.tileDegraded && !el.map.classList.contains("tile-degraded"),
      null,
      { timeout: 15000 }
    );
    assert.deepEqual(pageErrors, []);
    process.stdout.write(JSON.stringify({ initial, afterCommands, degraded }, null, 2));
  } finally {
    await browser.close();
  }
}


const timeout = setTimeout(() => {
  console.error("GIS 连续 API 渲染回归超时");
  process.exit(1);
}, 90000);

main().then(() => {
  clearTimeout(timeout);
  process.exit(0);
}).catch(error => {
  clearTimeout(timeout);
  console.error(error);
  process.exit(1);
});
