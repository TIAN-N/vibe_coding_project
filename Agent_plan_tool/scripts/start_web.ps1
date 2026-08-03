param(
    [int]$Port = 8011
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot "backend"
Set-Location -LiteralPath $backendRoot
python -m uvicorn app.main:app --host 127.0.0.1 --port $Port
