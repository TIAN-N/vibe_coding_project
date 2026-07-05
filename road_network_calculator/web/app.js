const map = L.map("map").setView([39.0, 116.0], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let routeLayer = null;
let startMarker = null;
let endMarker = null;

const statusEl = document.getElementById("status");
const uploadBtn = document.getElementById("uploadBtn");
const routeBtn = document.getElementById("routeBtn");

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

async function refreshStatus() {
  const response = await fetch("/api/network/status");
  const data = await response.json();
  if (data.loaded) {
    setStatus(`已加载：${data.nodes.toLocaleString()} 个节点，${data.edges.toLocaleString()} 条边`);
  } else {
    setStatus("未加载路网");
  }
}

uploadBtn.addEventListener("click", async () => {
  const fileInput = document.getElementById("csvFile");
  if (!fileInput.files.length) {
    setStatus("请选择 CSV 文件", true);
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  uploadBtn.disabled = true;
  setStatus("正在上传并加载路网...");

  try {
    const response = await fetch("/api/network/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "路网加载失败");
    }
    setStatus(`已加载：${data.nodes.toLocaleString()} 个节点，${data.edges.toLocaleString()} 条边`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    uploadBtn.disabled = false;
  }
});

routeBtn.addEventListener("click", async () => {
  const payload = {
    start_lon: Number(document.getElementById("startLon").value),
    start_lat: Number(document.getElementById("startLat").value),
    end_lon: Number(document.getElementById("endLon").value),
    end_lat: Number(document.getElementById("endLat").value),
  };

  routeBtn.disabled = true;
  try {
    const response = await fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "路由计算失败");
    }
    renderRoute(data);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    routeBtn.disabled = false;
  }
});

function renderRoute(data) {
  document.getElementById("distance").textContent = data.reachable ? `${data.distance_m.toFixed(1)} m` : "不可达";
  document.getElementById("snapTime").textContent = `${data.timings_ms.snap.toFixed(2)} ms`;
  document.getElementById("searchTime").textContent = `${data.timings_ms.search.toFixed(2)} ms`;
  document.getElementById("totalTime").textContent = `${data.timings_ms.total.toFixed(2)} ms`;

  if (routeLayer) map.removeLayer(routeLayer);
  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);

  const start = [data.snapped_start[1], data.snapped_start[0]];
  const end = [data.snapped_end[1], data.snapped_end[0]];
  startMarker = L.marker(start).addTo(map).bindPopup("吸附起点");
  endMarker = L.marker(end).addTo(map).bindPopup("吸附终点");

  if (data.path.length > 0) {
    const latLngs = data.path.map(([lon, lat]) => [lat, lon]);
    routeLayer = L.polyline(latLngs, { color: "#1967d2", weight: 5, opacity: 0.85 }).addTo(map);
    map.fitBounds(routeLayer.getBounds().pad(0.2));
  } else {
    map.fitBounds(L.latLngBounds([start, end]).pad(0.2));
  }
}

refreshStatus().catch(() => setStatus("无法连接后端服务", true));

