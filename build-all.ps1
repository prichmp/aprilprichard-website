# Pulls, builds, and merges external site projects into ./dist for single-site deployment.
#
# Usage:
#   .\build-all.ps1                 # sync + build main site + all externals
#   .\build-all.ps1 -SkipMain       # skip main site build
#   .\build-all.ps1 -SkipExternal   # skip external projects
#   .\build-all.ps1 -Clean          # delete dist/ and external/ before building

[CmdletBinding()]
param(
    [switch]$SkipMain,
    [switch]$SkipExternal,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'

$Root = $PSScriptRoot
if (-not $Root) { $Root = Split-Path -Parent $MyInvocation.MyCommand.Path }

$ExternalDir = Join-Path $Root 'external'
$DistDir     = Join-Path $Root 'dist'

# Each entry: Repo URL, folder name under external/, and subpath under the final site.
$Projects = @(
    @{ Name = 'frank-stella-generative-art'; Repo = 'https://github.com/prichmp/frank-stella-generative-art.git'; Subpath = 'frank-stella-generative-art' }
    @{ Name = 'reggie';                      Repo = 'https://github.com/prichmp/reggie.git';                      Subpath = 'reggie' }
    @{ Name = 'diff-eq-generative-art';      Repo = 'https://github.com/prichmp/diff-eq-generative-art.git';      Subpath = 'diff-eq-generative-art' }
    @{ Name = 'bauhaus-solar-system';        Repo = 'https://github.com/prichmp/bauhaus-solar-system.git';        Subpath = 'bauhaus-solar-system' }
)

function Assert-ExitCode {
    param([string]$What)
    if ($LASTEXITCODE -ne 0) { throw "$What failed (exit $LASTEXITCODE)" }
}

function Sync-Repo {
    param([string]$Repo, [string]$Target)
    if (Test-Path (Join-Path $Target '.git')) {
        Write-Host "  pull: $Target"
        Push-Location $Target
        try { git pull --ff-only; Assert-ExitCode "git pull ($Repo)" } finally { Pop-Location }
    } else {
        if (Test-Path $Target) { throw "$Target exists but is not a git repo." }
        $parent = Split-Path -Parent $Target
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent | Out-Null }
        Write-Host "  clone: $Repo"
        git clone $Repo $Target; Assert-ExitCode "git clone ($Repo)"
    }
}

function Install-Deps {
    param([string]$Dir)
    Push-Location $Dir
    try {
        if (Test-Path (Join-Path $Dir 'package-lock.json')) {
            Write-Host "  npm ci"
            npm ci
            Assert-ExitCode "npm ci ($Dir)"
        } else {
            Write-Host "  npm install"
            npm install
            Assert-ExitCode "npm install ($Dir)"
        }
    } finally { Pop-Location }
}

function Build-Project {
    param([string]$Dir, [string]$BasePath)
    Push-Location $Dir
    try {
        Write-Host "  npm run build (base=$BasePath)"
        # Append --base to the underlying `vite build` via npm's `--` arg forwarding.
        npm run build -- "--base=$BasePath"
        Assert-ExitCode "npm run build ($Dir)"
    } finally { Pop-Location }
}

function Copy-Dist {
    param([string]$From, [string]$To)
    if (-not (Test-Path $From)) { throw "Expected build output at $From" }
    if (Test-Path $To) { Remove-Item -Recurse -Force $To }
    New-Item -ItemType Directory -Path $To | Out-Null
    Copy-Item -Path (Join-Path $From '*') -Destination $To -Recurse -Force
}

if ($Clean) {
    foreach ($p in @($DistDir, $ExternalDir)) {
        if (Test-Path $p) {
            Write-Host "Removing $p"
            Remove-Item -Recurse -Force $p
        }
    }
}

if (-not $SkipMain) {
    Write-Host "=== Main site ===" -ForegroundColor Cyan
    Install-Deps -Dir $Root
    Build-Project -Dir $Root -BasePath '/'
}

if (-not $SkipExternal) {
    if (-not (Test-Path $ExternalDir)) { New-Item -ItemType Directory -Path $ExternalDir | Out-Null }
    if (-not (Test-Path $DistDir))     { New-Item -ItemType Directory -Path $DistDir     | Out-Null }

    foreach ($proj in $Projects) {
        $target  = Join-Path $ExternalDir $proj.Name
        $base    = "/$($proj.Subpath)/"
        $dest    = Join-Path $DistDir $proj.Subpath

        Write-Host ""
        Write-Host "=== $($proj.Name) -> $base ===" -ForegroundColor Cyan

        Sync-Repo      -Repo $proj.Repo -Target $target
        Install-Deps   -Dir  $target
        Build-Project  -Dir  $target -BasePath $base
        Copy-Dist      -From (Join-Path $target 'dist') -To $dest
    }
}

Write-Host ""
Write-Host "Done. Combined site: $DistDir" -ForegroundColor Green
