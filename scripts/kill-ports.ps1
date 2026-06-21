# Stops processes listening on dev ports (Windows)
$ports = 8000, 8080, 8081, 8082, 8083
$freed = @()

foreach ($port in $ports) {
  try {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $listeners) {
      $processId = $conn.OwningProcess
      if ($processId -and $processId -gt 0) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        $freed += "port $port (PID $processId)"
      }
    }
  } catch {
    netstat -ano | Select-String ":$port\s" | ForEach-Object {
      if ($_ -match '\s+(\d+)\s*$') {
        $processId = [int]$Matches[1]
        if ($processId -gt 0) {
          Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
          $freed += "port $port (PID $processId)"
        }
      }
    }
  }
}

if ($freed.Count -gt 0) {
  Write-Host "Freed: $($freed -join ', ')"
} else {
  Write-Host "No listeners found on ports 8000-8083."
}
