param([switch]$NoOpen)
$ErrorActionPreference = 'Stop'
$worldloomRoot = $PSScriptRoot
$worldloomUrl = 'http://127.0.0.1:43127'
$worldloomReady = $false
try {
    $worldloomResponse = Invoke-RestMethod -Uri "$worldloomUrl/api/world" -TimeoutSec 2
    $worldloomReady = $worldloomResponse.world.format -eq 'worldloom'
} catch {}
if (-not $worldloomReady) {
    $worldloomNode = Join-Path $worldloomRoot 'runtime\node.exe'
    if (-not (Test-Path -LiteralPath $worldloomNode)) {
        $worldloomNode = (Get-Command node -ErrorAction SilentlyContinue).Source
    }
    if (-not $worldloomNode) { throw 'Node.js is missing. Restore the runtime folder or install Node.js 22 or newer.' }
    $worldloomProcess = Start-Process -FilePath $worldloomNode -ArgumentList '"server.mjs"' -WorkingDirectory $worldloomRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $worldloomRoot 'server.log') -RedirectStandardError (Join-Path $worldloomRoot 'server-error.log') -PassThru
    Set-Content -LiteralPath (Join-Path $worldloomRoot 'server.pid') -Value $worldloomProcess.Id
    for ($worldloomAttempt = 0; $worldloomAttempt -lt 40; $worldloomAttempt++) {
        Start-Sleep -Milliseconds 200
        try {
            $worldloomResponse = Invoke-RestMethod -Uri "$worldloomUrl/api/world" -TimeoutSec 1
            if ($worldloomResponse.world.format -eq 'worldloom') { $worldloomReady = $true; break }
        } catch {}
    }
    if (-not $worldloomReady) { throw 'Worldloom could not start. See server-error.log in this folder.' }
}
if ($NoOpen) { Write-Output 'Worldloom is ready.'; return }
$worldloomEdgePaths = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe")
$worldloomEdge = $worldloomEdgePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if ($worldloomEdge) {
    Start-Process -FilePath $worldloomEdge -ArgumentList "--app=$worldloomUrl"
} else {
    Start-Process $worldloomUrl
}
