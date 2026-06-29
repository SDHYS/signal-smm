# Docker Desktop "starting services / Secrets Engine ... engine.sock: The file cannot be accessed" 무한루프 해결 런처.
# 동작: 도커 완전 종료 → 깨진 소켓 디렉토리(rename으로 비활성화) → 묵은 .broken 정리 → Docker Desktop 기동 → 엔진 준비 대기.
# 사용: PowerShell에서  powershell -ExecutionPolicy Bypass -File scripts\fix-and-start-docker.ps1
#       (또는 이 파일 우클릭 → "PowerShell에서 실행")

$ErrorActionPreference = "SilentlyContinue"
$dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
$local = $env:LOCALAPPDATA

Write-Host "1) Docker 프로세스 종료..." -ForegroundColor Cyan
Get-Process "Docker Desktop","com.docker.backend","com.docker.build","com.docker.dev-envs","com.docker.extensions","com.docker.cli","vpnkit","dockerd" |
  Stop-Process -Force
Start-Sleep -Seconds 3

Write-Host "2) 깨진 AF_UNIX 소켓 디렉토리 비활성화..." -ForegroundColor Cyan
# 일반 삭제가 안 되는 reparse-point 소켓이라 부모 폴더를 rename → Docker가 새로 생성
$targets = @(
  (Join-Path $local "docker-secrets-engine"),
  (Join-Path $local "Docker\run")
)
foreach ($t in $targets) {
  if (Test-Path $t) {
    $bak = "$t.broken_" + (Get-Random)
    try { Move-Item -LiteralPath $t -Destination $bak -Force -ErrorAction Stop; Write-Host "   비활성화: $t" -ForegroundColor Green }
    catch { Write-Host "   rename 실패(무시 가능): $t" -ForegroundColor Yellow }
  }
}

Write-Host "3) 묵은 .broken 잔재 정리(폴더 rename 방식이라 안전)..." -ForegroundColor Cyan
Get-ChildItem $local -Directory -Filter "*.broken*" -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}
Get-ChildItem (Join-Path $local "Docker") -Directory -Filter "run.b*" -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "4) Docker Desktop 기동..." -ForegroundColor Cyan
Start-Process $dockerExe

Write-Host "5) 엔진 준비 대기(최대 3분)..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 36; $i++) {
  docker info *> $null
  if ($?) { $ready = $true; break }
  Start-Sleep -Seconds 5
}
if ($ready) {
  Write-Host "[OK] Docker 엔진 준비 완료 (약 $($i*5)초)" -ForegroundColor Green
  docker version --format "Server {{.Server.Version}}"
} else {
  Write-Host "[!] 3분 내 준비 안 됨. backend.error.json 확인:" -ForegroundColor Red
  Write-Host "    $local\Docker\backend.error.json"
}
