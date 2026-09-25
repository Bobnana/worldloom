$worldloomPidFile = Join-Path $PSScriptRoot 'server.pid'
if (Test-Path -LiteralPath $worldloomPidFile) {
    $worldloomServerId = [int](Get-Content -LiteralPath $worldloomPidFile)
    $worldloomProcess = Get-Process -Id $worldloomServerId -ErrorAction SilentlyContinue
    $worldloomExpected = Join-Path $PSScriptRoot 'runtime\node.exe'
    if (-not (Test-Path -LiteralPath $worldloomExpected)) {
        $worldloomExpected = (Get-Command node -ErrorAction SilentlyContinue).Source
    }
    if ($worldloomProcess -and $worldloomProcess.Path -eq $worldloomExpected) {
        Stop-Process -Id $worldloomServerId
        Wait-Process -Id $worldloomServerId -ErrorAction SilentlyContinue
        Write-Output 'Worldloom stopped.'
    } elseif ($worldloomProcess) {
        throw 'The stored process ID does not match the Worldloom Node runtime. No process was stopped.'
    }
}
