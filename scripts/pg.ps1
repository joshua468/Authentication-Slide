param(
  [ValidateSet("start", "stop", "status")]
  [string]$Action
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

# Prefer a bundled portable binary set if present, else the installed PostgreSQL 17.
$pgBin = if (Test-Path "$root\.pg\pgsql\bin\postgres.exe") {
  "$root\.pg\pgsql\bin"
} elseif (Test-Path "C:\Program Files\PostgreSQL\17\bin\postgres.exe") {
  "C:\Program Files\PostgreSQL\17\bin"
} else {
  throw "PostgreSQL binaries not found. Install PostgreSQL 17 or drop portable binaries in .pg\pgsql."
}

$pgCtl = "$pgBin\pg_ctl.exe"
$pgIsReady = "$pgBin\pg_isready.exe"
$data = "$root\.pg\data"
$log = "$root\.pg\postgres.log"

switch ($Action) {
  "start" {
    if (-not (Test-Path "$data\PG_VERSION")) {
      throw "Cluster not initialized ($data). Run: & $pgBin\initdb.exe -D `"$data`" -U postgres -A scram-sha-256 -E UTF8 --locale=C"
    }
    $ready = & $pgIsReady -h 127.0.0.1 -p 5434 -t 2 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-Output "PostgreSQL already running on 127.0.0.1:5434."
      return
    }
    Start-Process -FilePath "$pgBin\postgres.exe" -ArgumentList "-D", "`"$data`"" -RedirectStandardOutput "$log" -RedirectStandardError "$root\.pg\postgres.err" -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 3
    & $pgIsReady -h 127.0.0.1 -p 5434 -t 10
    Write-Output "PostgreSQL started on 127.0.0.1:5434 (data: $data)."
  }
  "stop" {
    & $pgCtl -D $data -m fast stop 2>&1
    Write-Output "PostgreSQL stopped."
  }
  "status" {
    & $pgIsReady -h 127.0.0.1 -p 5434 -t 5
  }
}