param(
    [switch]$SkipFrontend,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$migrationDir = Join-Path $backendDir "src/main/resources/db/migration"

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "== $Title =="
}

function Run-Step {
    param(
        [string]$Title,
        [scriptblock]$Command
    )

    Write-Section $Title
    & $Command
    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
        throw "Falha na etapa: $Title"
    }
}

Set-Location $repoRoot

Write-Host "Homologacao local Menfi's Burger"
Write-Host "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Repositorio: $repoRoot"
Write-Host "Escopo: local apenas; sem deploy, sem push, sem alteracao remota."

Run-Step "Git status" {
    git status -sb
}

Run-Step "Migrations Flyway duplicadas" {
    if (-not (Test-Path $migrationDir)) {
        throw "Diretorio de migrations nao encontrado: $migrationDir"
    }

    $duplicates = Get-ChildItem $migrationDir -File |
        Group-Object { if ($_.Name -match '^V([^_]+)__') { $Matches[1] } else { $_.Name } } |
        Where-Object Count -gt 1

    if ($duplicates) {
        $duplicates | ForEach-Object {
            Write-Host "Versao duplicada: $($_.Name)"
            $_.Group | ForEach-Object { Write-Host " - $($_.Name)" }
        }
        throw "Existem migrations Flyway duplicadas."
    }

    Write-Host "OK: nenhuma migration duplicada encontrada."
}

Run-Step "Busca de possiveis secrets" {
    if (Get-Command rg -ErrorAction SilentlyContinue) {
        $patterns = "MERCADO_PAGO_ACCESS_TOKEN=.+|JWT_SECRET=.+|DATABASE_URL=.+|WHATSAPP_ACCESS_TOKEN=.+|password=.+"
        $result = & rg -n $patterns . -g '!node_modules/**' -g '!backend/target/**' -g '!frontend/.next/**' -g '!scripts/homologation-local-check.ps1'
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Atencao: revisar ocorrencias abaixo. Placeholders em docs/env examples sao aceitaveis; secrets reais nao."
            $result
        } elseif ($LASTEXITCODE -eq 1) {
            Write-Host "OK: nenhum padrao sensivel encontrado."
            $global:LASTEXITCODE = 0
        } else {
            throw "rg falhou ao buscar possiveis secrets."
        }
    } else {
        Write-Host "rg nao encontrado; etapa de busca textual pulada."
    }
}

if (-not $SkipBackend) {
    Run-Step "Build backend" {
        Push-Location $backendDir
        try {
            mvn -q -DskipTests package
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Section "Build backend"
    Write-Host "Pulado por parametro -SkipBackend."
}

if (-not $SkipFrontend) {
    Run-Step "Build frontend" {
        Push-Location $frontendDir
        try {
            npm run build
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Section "Build frontend"
    Write-Host "Pulado por parametro -SkipFrontend."
}

Write-Section "Resultado"
Write-Host "Validacao local concluida com sucesso."
Write-Host "Producao nao foi alterada."
