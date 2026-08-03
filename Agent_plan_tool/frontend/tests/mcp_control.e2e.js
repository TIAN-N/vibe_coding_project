const assert = require("node:assert/strict");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const { chromium } = require("playwright");


const execFileAsync = promisify(execFile);
const baseUrl = process.env.TOPO_BASE_URL || "http://127.0.0.1:8011";
const mcpUrl = process.env.TOPO_MCP_URL || "http://127.0.0.1:8013/mcp";
const edgeExecutable = process.env.EDGE_EXECUTABLE;
const mcpPython = process.env.TOPO_MCP_PYTHON;


async function main() {
  assert.ok(mcpPython, "缺少 TOPO_MCP_PYTHON");
  const browser = await chromium.launch({ executablePath: edgeExecutable, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  try {
    const versions = await (await page.request.get(`${baseUrl}/api/v1/versions`)).json();
    const version = versions.data[0];
    const values = await (await page.request.get(
      `${baseUrl}/api/v1/ui/field-values/${version.id}?source=nodes&field=Region`
    )).json();
    const region = values.data.values[0];
    const expected = await (await page.request.post(`${baseUrl}/api/v1/topology/query`, {
      data: {
        version_id: version.id,
        view: "logic",
        actions: [{
          type: "filter",
          source: "nodes",
          mode: "all",
          conditions: [{ field: "Region", op: "eq", value: region }]
        }]
      }
    })).json();

    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.topoUiController?.getSessionId()), null, { timeout: 15000 });
    const control = await execFileAsync(mcpPython, [
      "mcp_bridge/control_smoke_test.py",
      "--url", mcpUrl,
      "--version-id", version.id,
      "--region", region
    ], { cwd: process.cwd(), timeout: 45000, windowsHide: true });

    await page.waitForSelector("#logicCanvas:not(.hidden)");
    await page.waitForFunction(
      expectedCounts => !state.logic.layoutPending
        && Number(document.getElementById("statVisibleNodes")?.textContent) === expectedCounts.nodes
        && Number(document.getElementById("statVisibleLinks")?.textContent) === expectedCounts.links,
      { nodes: expected.data.devices.length, links: expected.data.links.length },
      { timeout: 30000 }
    );
    assert.match(control.stdout, /"status": "rendered"/);
    assert.deepEqual(pageErrors, []);
    process.stdout.write(JSON.stringify({
      versionId: version.id,
      region,
      visibleNodes: expected.data.devices.length,
      visibleLinks: expected.data.links.length,
      mcpRendered: true
    }, null, 2));
  } finally {
    await browser.close();
  }
}


main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
