const THAILAND_CENTER = [13.756331, 100.501765];

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
  "Carto Positron": L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  ),
};

let activeBaseName = "OSM Standard";
baseLayers[activeBaseName].addTo(map);
L.control.layers(baseLayers, null, { position: "topright" }).addTo(map);

for (const [name, layer] of Object.entries(baseLayers)) {
  layer.on("tileerror", () => {
    if (name !== activeBaseName) return;
    const fallback = name === "OSM Standard" ? "Carto Positron" : "OSM HOT";
    if (baseLayers[fallback] && fallback !== activeBaseName) {
      map.removeLayer(layer);
      activeBaseName = fallback;
      baseLayers[fallback].addTo(map);
      setStatus(`Base map switched to ${fallback}`);
    }
  });
}

map.whenReady(() => {
  setTimeout(() => map.invalidateSize(), 100);
});

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
    setStatus(`Loaded: ${data.nodes.toLocaleString()} nodes, ${data.edges.toLocaleString()} edges`);
  } else {
    setStatus("Network not loaded");
  }
}

uploadBtn.addEventListener("click", async () => {
  const fileInput = document.getElementById("csvFile");
  if (!fileInput.files.length) {
    setStatus("Please select a CSV file", true);
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  uploadBtn.disabled = true;
  setStatus("Uploading and loading road network...");

  try {
    const response = await fetch("/api/network/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to load road network");
    }
    setStatus(`Loaded: ${data.nodes.toLocaleString()} nodes, ${data.edges.toLocaleString()} edges`);
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
      throw new Error(data.detail || "Route calculation failed");
    }
    renderRoute(data);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    routeBtn.disabled = false;
  }
});

function renderRoute(data) {
  document.getElementById("distance").textContent = data.reachable ? `${data.distance_m.toFixed(1)} m` : "Unreachable";
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
    const latLngs = data.path.map(([lon, lat]) => [lat, lon]);
    routeLayer = L.polyline(latLngs, { color: "#1967d2", weight: 5, opacity: 0.85 }).addTo(map);
    map.fitBounds(routeLayer.getBounds().pad(0.2));
  } else {
    map.fitBounds(L.latLngBounds([start, end]).pad(0.2));
  }
}

refreshStatus().catch(() => setStatus("Cannot connect to backend service", true));
