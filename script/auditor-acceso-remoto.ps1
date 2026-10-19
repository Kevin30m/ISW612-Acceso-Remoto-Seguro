# ============================================================
# auditor-acceso-remoto.ps1
# Proyecto ISW-612
# Tema 6: Acceso remoto seguro
# Integrantes: Kevin Urbina / Luis Alonso Huertas
# ============================================================

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Auditor de acceso remoto seguro - ISW-612" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# Funcion auxiliar:
# Obtiene el valor que aparece despues de ":" en una linea
# ------------------------------------------------------------
function Obtener-ValorDespuesDosPuntos {
    param (
        [string]$Linea
    )

    if ([string]::IsNullOrWhiteSpace($Linea)) {
        return "No disponible"
    }

    $partes = $Linea -split ":", 2

    if ($partes.Count -ge 2) {
        return $partes[1].Trim()
    }

    return $Linea.Trim()
}

# ============================================================
# 1. RDP
# ============================================================

$rdpPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server"

$rdpValue = (
    Get-ItemProperty `
        -Path $rdpPath `
        -Name fDenyTSConnections `
        -ErrorAction SilentlyContinue
).fDenyTSConnections

$rdpEnabled = $rdpValue -eq 0

# Puerto real configurado para RDP
$rdpTcpPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp"

$rdpPort = (
    Get-ItemProperty `
        -Path $rdpTcpPath `
        -Name PortNumber `
        -ErrorAction SilentlyContinue
).PortNumber

if ($null -eq $rdpPort) {
    $rdpPort = 3389
}

# ============================================================
# 2. NLA
# ============================================================

$nlaValue = (
    Get-ItemProperty `
        -Path $rdpTcpPath `
        -Name UserAuthentication `
        -ErrorAction SilentlyContinue
).UserAuthentication

$nlaEnabled = $nlaValue -eq 1

if ($nlaEnabled) {
    $rdpAuthentication = "NLA habilitado"
}
else {
    $rdpAuthentication = "NLA deshabilitado"
}

# ============================================================
# 3. WinRM
# ============================================================

$winRMService = Get-Service WinRM -ErrorAction SilentlyContinue

if ($null -ne $winRMService) {
    $winRMEnabled = $winRMService.Status -eq "Running"
}
else {
    $winRMEnabled = $false
}

# ============================================================
# 4. OpenSSH
# ============================================================

$sshService = Get-Service sshd -ErrorAction SilentlyContinue

if ($null -ne $sshService) {
    $sshEnabled = $sshService.Status -eq "Running"
}
else {
    $sshEnabled = $false
}

# ============================================================
# 5. Firewall general
# ============================================================

$firewallProfiles = Get-NetFirewallProfile |
    ForEach-Object {

        [PSCustomObject]@{
            nombre = $_.Name
            habilitado = [bool]$_.Enabled
        }
    }

# ============================================================
# 6. Reglas de firewall relacionadas con acceso remoto
# ============================================================

$firewallRules = Get-NetFirewallRule -ErrorAction SilentlyContinue |
    Where-Object {

        $_.DisplayName -match "Remote Desktop|Escritorio remoto|WinRM|OpenSSH|SSH"

    }

$rdpFirewallRules = @(
    $firewallRules |
        Where-Object {
            $_.DisplayName -match "Remote Desktop|Escritorio remoto"
        } |
        Select-Object DisplayName, Enabled, Direction, Action
)

$winRMFirewallRules = @(
    $firewallRules |
        Where-Object {
            $_.DisplayName -match "WinRM"
        } |
        Select-Object DisplayName, Enabled, Direction, Action
)

$sshFirewallRules = @(
    $firewallRules |
        Where-Object {
            $_.DisplayName -match "OpenSSH|SSH"
        } |
        Select-Object DisplayName, Enabled, Direction, Action
)

# ============================================================
# 7. Politica de bloqueo de cuentas
# ============================================================

$netAccounts = net accounts

$thresholdLine = $netAccounts |
    Where-Object {
        $_ -match "^\s*Umbral de bloqueo"
    } |
    Select-Object -First 1

$durationLine = $netAccounts |
    Where-Object {
        $_ -match "^\s*Duraci.n de bloqueo"
    } |
    Select-Object -First 1

$windowLine = $netAccounts |
    Where-Object {
        $_ -match "^\s*Ventana de obs\. de bloqueo"
    } |
    Select-Object -First 1

$lockoutThreshold = Obtener-ValorDespuesDosPuntos $thresholdLine
$lockoutDuration = Obtener-ValorDespuesDosPuntos $durationLine
$lockoutWindow = Obtener-ValorDespuesDosPuntos $windowLine

$politicaBloqueo = [PSCustomObject]@{

    umbral_bloqueo = $lockoutThreshold

    duracion_bloqueo_minutos = $lockoutDuration

    ventana_observacion_minutos = $lockoutWindow
}

# ============================================================
# 8. Crear objeto final
# ============================================================

$resultado = [PSCustomObject]@{

    equipo = $env:COMPUTERNAME

    fecha = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

    servicios = @(

        # ---------------- RDP ----------------
        [PSCustomObject]@{

            servicio = "RDP"

            habilitado = $rdpEnabled

            puerto = $rdpPort

            autenticacion = $rdpAuthentication

            reglas_firewall = $rdpFirewallRules
        },

        # ---------------- WinRM ----------------
        [PSCustomObject]@{

            servicio = "WinRM"

            habilitado = $winRMEnabled

            puerto = "5985/5986"

            autenticacion = "Configuracion pendiente de analisis"

            reglas_firewall = $winRMFirewallRules
        },

        # ---------------- OpenSSH ----------------
        [PSCustomObject]@{

            servicio = "OpenSSH"

            habilitado = $sshEnabled

            puerto = 22

            autenticacion = "Configuracion pendiente de analisis"

            reglas_firewall = $sshFirewallRules
        }
    )

    firewall = $firewallProfiles

    politica_bloqueo = $politicaBloqueo
}

# ============================================================
# 9. Guardar resultado en JSON
# ============================================================

$rutaSalida = Join-Path `
    $PSScriptRoot `
    "..\datos\ejemplo.json"

$resultado |
    ConvertTo-Json -Depth 8 |
    Set-Content `
        -Path $rutaSalida `
        -Encoding UTF8

# ============================================================
# 10. Mostrar resultado
# ============================================================

Write-Host "Auditoria terminada correctamente." -ForegroundColor Green
Write-Host ""
Write-Host "Equipo auditado:" $env:COMPUTERNAME
Write-Host "JSON generado en:"
Write-Host $rutaSalida -ForegroundColor Yellow
Write-Host ""