# tests/load/proxy.ps1
# Controls Toxiproxy for the local load-test stack (tests/load/docker-compose.yml).
#
# Usage:
#   .\proxy.ps1 init              # create the postgres proxy entry (idempotent)
#   .\proxy.ps1 rtt -Ms 10        # set ~10ms round-trip latency (5ms each way + jitter)
#   .\proxy.ps1 rtt -Ms 100       # ~100ms RTT — mirrors Egypt->Frankfurt
#   .\proxy.ps1 clear             # remove all latency (0ms)
#   .\proxy.ps1 status            # show current toxics
#
# Requires the stack running:  docker compose -f tests/load/docker-compose.yml up -d

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("init", "rtt", "clear", "status")]
    [string]$Cmd,

    [Parameter(Position = 1)]
    [int]$Ms = 10
)

$ErrorActionPreference = "Stop"
$Api = "http://127.0.0.1:8474"
$ProxyName = "postgres_local"

function Invoke-Api {
    param($Method, $Uri, $Body)
    # Toxiproxy rejects requests without a User-Agent header
    if ($null -ne $Body) {
        Invoke-RestMethod -Method $Method -Uri $Uri -ContentType "application/json" -UserAgent "loadtest-proxy-helper" -Body ($Body | ConvertTo-Json -Compress -Depth 5)
    } else {
        Invoke-RestMethod -Method $Method -Uri $Uri -UserAgent "loadtest-proxy-helper"
    }
}

function Remove-Toxic {
    param([string]$Name)
    try { Invoke-Api -Method Delete -Uri "$Api/proxies/$ProxyName/toxics/$Name" | Out-Null } catch { }
}

switch ($Cmd) {

    "init" {
        # Idempotent: create the proxy entry if it doesn't exist yet
        $existing = Invoke-Api -Method Get -Uri "$Api/proxies"
        if ($existing.PSObject.Properties.Name -contains $ProxyName) {
            Write-Host "proxy '$ProxyName' already exists"
        } else {
            Invoke-Api -Method Post -Uri "$Api/proxies" -Body @{
                name    = $ProxyName
                listen  = "0.0.0.0:15432"
                upstream = "postgres:5432"
                enabled = $true
            } | Out-Null
            Write-Host "created proxy '$ProxyName' (15432 -> postgres:5432)"
        }
        Write-Host "connection string: postgresql://loadtest:loadtest@127.0.0.1:15432/ecommerce_loadtest"
    }

    "rtt" {
        if ($Ms -lt 2) { throw "Use 'clear' for zero latency. Minimum meaningful rtt is 2ms." }

        # Split RTT across both directions with ~20% jitter for realism
        $half   = [int][Math]::Floor($Ms / 2)
        $jitter = [int][Math]::Max(1, [Math]::Floor($half * 0.2))

        Remove-Toxic -Name "latency_upstream"
        Remove-Toxic -Name "latency_downstream"

        foreach ($dir in @("upstream", "downstream")) {
            Invoke-Api -Method Post -Uri "$Api/proxies/$ProxyName/toxics" -Body @{
                name       = "latency_$dir"
                type       = "latency"
                stream     = $dir
                toxicity   = 1.0
                attributes = @{ latency = $half; jitter = $jitter }
            } | Out-Null
        }
        Write-Host ("latency set: ~{0}ms RTT per query (+/- {1}ms jitter)" -f ($half * 2), ($jitter * 2))
    }

    "clear" {
        Remove-Toxic -Name "latency_upstream"
        Remove-Toxic -Name "latency_downstream"
        Write-Host "latency removed (direct local connection)"
    }

    "status" {
        $p = (Invoke-Api -Method Get -Uri "$Api/proxies").$ProxyName
        Write-Host "listen   : $($p.listen)"
        Write-Host "upstream : $($p.upstream)"
        if (-not $p.toxics -or $p.toxics.Count -eq 0) {
            Write-Host "toxics   : none (0ms added latency)"
        } else {
            Write-Host "toxics   :"
            $p.toxics.PSObject.Properties | ForEach-Object {
                $t = $_.Value
                Write-Host ("  {0}: type={1} latency={2}ms jitter={3}ms stream={4}" -f `
                    $_.Name, $t.type, $t.attributes.latency, $t.attributes.jitter, $t.stream)
            }
        }
    }
}
