Write-Host "Verificando o Docker..." -ForegroundColor Cyan
$dockerRunning = docker info 2>$null
if (-not $?) {
    Write-Host "Docker não está rodando. Abrindo o Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "Aguardando o Docker iniciar (isso pode levar até 1 minuto)..." -ForegroundColor Yellow
    do {
        Start-Sleep -Seconds 3
        docker info 2>$null | Out-Null
    } while (-not $?)
    Write-Host "Docker pronto!" -ForegroundColor Green
}

Write-Host "Subindo o banco de dados..." -ForegroundColor Cyan
docker compose up -d

Write-Host "Ativando ambiente virtual..." -ForegroundColor Cyan
& "$PSScriptRoot\backend\venv\Scripts\Activate.ps1"

Write-Host "Iniciando o servidor..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend\app"
python -m uvicorn main:app --reload