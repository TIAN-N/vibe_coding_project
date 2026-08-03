param(
    [int]$Port = 8013,
    [string]$ApiBaseUrl = "http://127.0.0.1:8011",
    [ValidateSet("streamable-http", "stdio")]
    [string]$Transport = "streamable-http"
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot ".venv-mcp\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "MCP 虚拟环境不存在，请先执行：py -3.10 -m venv .venv-mcp"
}

$env:TOPO_API_BASE_URL = $ApiBaseUrl
$env:TOPO_MCP_PORT = [string]$Port
$env:TOPO_MCP_TRANSPORT = $Transport
Set-Location -LiteralPath $projectRoot
& $pythonPath "mcp_bridge\server.py"
