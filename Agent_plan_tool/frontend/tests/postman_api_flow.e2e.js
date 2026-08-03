const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { chromium } = require("playwright");


const baseUrl = process.env.TOPO_BASE_URL || "http://127.0.0.1:8011";
const edgeExecutable = process.env.EDGE_EXECUTABLE;
const dataRoot = process.env.TOPO_TEST_DATA_ROOT
  || "D:\\vibe_coding_project\\topo_visual_tool\\test_data";


async function waitForCommand(page, commandId) {
  await page.waitForFunction(
    async id => {
      const payload = await (await fetch(`/api/v1/ui/commands/${id}`)).json();
      return payload.success && payload.data.status === "rendered";
    },
    commandId,
    { timeout: 30000 }
  );
}


function uploadPart(fileName) {
  return {
    name: fileName,
    mimeType: "text/csv",
    buffer: fs.readFileSync(path.join(dataRoot, fileName))
  };
}


async function main() {
  const browser = await chromium.launch({ executablePath: edgeExecutable, headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.topoUiController?.getSessionId()), null, { timeout: 15000 });

    const uploadPayload = await (await page.request.post(`${baseUrl}/api/v1/uploads/topology`, {
      multipart: {
        device_file: uploadPart("logic_layout_mid_device.csv"),
        link_file: uploadPart("logic_layout_mid_link.csv"),
        ring_chain_file: uploadPart("logic_layout_mid_ring_chain.csv"),
        version_name: "Postman API 全流程测试",
        apply_to_view: "true",
        target: "active",
        view: "gis"
      }
    })).json();
    assert.equal(uploadPayload.success, true);
    const versionId = uploadPayload.data.version_id;
    const uploadCommand = uploadPayload.data.ui_command;
    assert.ok(versionId && uploadCommand?.id);
    await waitForCommand(page, uploadCommand.id);
    await page.waitForFunction(
      expected => window.topoBackendAdapter?.getVersionId() === expected.versionId
        && Number(document.getElementById("statVisibleNodes")?.textContent) === expected.nodes
        && Number(document.getElementById("statVisibleLinks")?.textContent) === expected.links,
      {
        versionId,
        nodes: uploadPayload.data.summary.devices,
        links: uploadPayload.data.summary.links
      },
      { timeout: 30000 }
    );

    const nodeRules = [{
      source: "nodes",
      mode: "all",
      conditions: [{ field: "Role", op: "eq", value: "ASG" }],
      color: "#ff0066",
      size: 20,
      shape: "diamond",
      label: "ASG API style"
    }];
    const linkRules = [{
      source: "links",
      mode: "all",
      conditions: [{ field: "Link Type", op: "eq", value: "Access-Ring" }],
      color: "#00aa55",
      line_style: "dash",
      width: "thick"
    }];
    const savedStyle = await (await page.request.post(`${baseUrl}/api/v1/styles/templates`, {
      data: {
        name: "Postman ASG 与接入环样式",
        scope: "version",
        version_id: versionId,
        template: {
          schema: "topo_visual_tool_style_template",
          version: 1,
          styles: {
            nodeStyleRules: nodeRules,
            appliedNodeStyleRules: nodeRules,
            linkStyleRules: linkRules.map(rule => ({ ...rule, lineStyle: rule.line_style })),
            appliedLinkStyleRules: linkRules.map(rule => ({ ...rule, lineStyle: rule.line_style }))
          }
        }
      }
    })).json();
    assert.equal(savedStyle.success, true);

    const expectedPayload = await (await page.request.post(`${baseUrl}/api/v1/topology/query`, {
      data: {
        version_id: versionId,
        view: "logic",
        actions: [{
          type: "filter",
          source: "nodes",
          mode: "all",
          conditions: [{ field: "Region", op: "eq", value: "Bangkok" }]
        }]
      }
    })).json();
    assert.equal(expectedPayload.success, true);

    const commandPayload = await (await page.request.post(`${baseUrl}/api/v1/ui/commands`, {
      data: {
        target: "active",
        requested_by: "postman-flow-e2e",
        operations: [
          { op: "switch_version", version_id: versionId },
          { op: "switch_view", view: "logic" },
          { op: "clear_visualization" },
          {
            op: "set_filter",
            source: "nodes",
            mode: "all",
            conditions: [{ field: "Region", op: "eq", value: "Bangkok" }]
          },
          {
            op: "set_highlight",
            source: "nodes",
            mode: "all",
            conditions: [{ field: "Role", op: "eq", value: "ASG" }],
            contrast: 0.72
          },
          { op: "set_node_style_rules", rules: nodeRules },
          { op: "set_link_style_rules", rules: linkRules }
        ]
      }
    })).json();
    assert.equal(commandPayload.success, true);
    await waitForCommand(page, commandPayload.data.id);
    await page.waitForFunction(
      expected => !state.logic.layoutPending
        && document.querySelectorAll("#logicCanvas .logic-node").length === expected.nodes
        && document.querySelectorAll("#logicCanvas .logic-link").length === expected.links,
      {
        nodes: expectedPayload.data.devices.length,
        links: expectedPayload.data.links.length
      },
      { timeout: 30000 }
    );

    const visual = await page.evaluate(() => {
      const asg = state.nodes.find(node => node.Role === "ASG" && node.Region === "Bangkok");
      const group = [...document.querySelectorAll("#logicCanvas .logic-node")]
        .find(item => item.getAttribute("data-node") === asg?.["NE Name"]);
      const core = group?.querySelector(".core");
      const styledLinks = [...document.querySelectorAll("#logicCanvas .logic-link")]
        .filter(item => item.getAttribute("style")?.includes("stroke:#00aa55"));
      return {
        nodeTag: core?.tagName.toLowerCase() || "",
        nodeFill: core?.getAttribute("fill") || "",
        styledLinks: styledLinks.length,
        firstLinkStyle: styledLinks[0]?.getAttribute("style") || "",
        highlightedNodes: document.querySelectorAll("#logicCanvas .logic-node.highlight").length
      };
    });
    assert.equal(visual.nodeTag, "polygon");
    assert.equal(visual.nodeFill, "#ff0066");
    assert.ok(visual.styledLinks > 0);
    assert.match(visual.firstLinkStyle, /stroke-dasharray:8 6/);
    assert.ok(visual.highlightedNodes > 0);

    const clearStyles = await (await page.request.post(`${baseUrl}/api/v1/ui/commands`, {
      data: {
        target: "active",
        requested_by: "postman-flow-e2e",
        operations: [
          { op: "clear_node_style_rules" },
          { op: "clear_link_style_rules" }
        ]
      }
    })).json();
    assert.equal(clearStyles.success, true);
    await waitForCommand(page, clearStyles.data.id);

    const appliedTemplate = await (await page.request.post(
      `${baseUrl}/api/v1/styles/templates/${savedStyle.data.id}/apply`,
      { data: { target: "active", requested_by: "postman-flow-e2e" } }
    )).json();
    assert.equal(appliedTemplate.success, true);
    await waitForCommand(page, appliedTemplate.data.ui_command.id);
    await page.waitForFunction(() => {
      const nodeStyled = [...document.querySelectorAll("#logicCanvas .logic-node .core")]
        .some(item => item.getAttribute("fill") === "#ff0066");
      const linkStyled = [...document.querySelectorAll("#logicCanvas .logic-link")]
        .some(item => item.getAttribute("style")?.includes("stroke:#00aa55"));
      return nodeStyled && linkStyled;
    }, null, { timeout: 15000 });
    assert.deepEqual(pageErrors, []);

    process.stdout.write(JSON.stringify({
      uploadRendered: true,
      versionId,
      visibleNodes: expectedPayload.data.devices.length,
      visibleLinks: expectedPayload.data.links.length,
      highlightedNodes: visual.highlightedNodes,
      nodeStyleRendered: true,
      linkStyleRendered: true,
      styleTemplateId: savedStyle.data.id,
      styleTemplateAppliedByApi: true
    }, null, 2));
  } finally {
    await browser.close();
  }
}


main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
