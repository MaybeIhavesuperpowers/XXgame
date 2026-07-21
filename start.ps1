$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $projectRoot
$python = 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (-not (Test-Path -LiteralPath $python)) { $python = 'python' }
$server = Start-Process -FilePath $python -ArgumentList @('-m', 'http.server', '4173', '--bind', '127.0.0.1') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
try {
    Start-Sleep -Milliseconds 700
    Start-Process 'http://127.0.0.1:4173'
    Write-Host '像素纪元已启动：http://127.0.0.1:4173'
    Write-Host '关闭此窗口即可停止本地游戏服务。'
    Wait-Process -Id $server.Id
}
finally {
    if (-not $server.HasExited) { Stop-Process -Id $server.Id }
}
