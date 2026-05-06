# scripts/run-local-tests.ps1
# Script PowerShell pour exécuter la suite de tests locale du repo GASPE / ACF
# en vue du go-live (Phase 7 du plan docs/PLAN-TEST-GO-LIVE-2026.md).
#
# Usage (depuis la racine du repo, dans PowerShell) :
#   .\scripts\run-local-tests.ps1
#
# Si l'exécution est bloquée par la politique de sécurité PowerShell :
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\scripts\run-local-tests.ps1
#
# Couverture :
#   1. Vérification environnement (node, npm, git)
#   2. npm install (si node_modules manquant)
#   3. ESLint
#   4. TypeScript --noEmit
#   5. Vitest (npm test)
#   6. Build production (npm run build)
#   7. Récap pass/fail
#
# Les tests e2e Playwright nécessitent 2 terminaux (un pour `npm run dev`,
# un pour `npm run test:e2e`) — ils ne sont pas inclus ici. Voir l'Annexe B
# du plan pour la procédure manuelle.

[CmdletBinding()]
param(
  [switch]$SkipInstall,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

function Write-Section {
  param([string]$Title)
  Write-Host "`n=== $Title ===" -ForegroundColor Cyan
}

function Write-Pass { param($Msg) Write-Host "  [OK]   $Msg" -ForegroundColor Green }
function Write-Fail { param($Msg) Write-Host "  [FAIL] $Msg" -ForegroundColor Red }
function Write-Info { param($Msg) Write-Host "  [INFO] $Msg" -ForegroundColor Blue }
function Write-Skip { param($Msg) Write-Host "  [SKIP] $Msg" -ForegroundColor Yellow }

$results = @{}

# --- Étape 0 : vérifs ---
Write-Section "0. Vérification environnement"

if (-not (Test-Path ".\package.json")) {
  Write-Fail "package.json introuvable. Place-toi à la racine du repo gaspe-fr."
  exit 1
}
Write-Pass "package.json trouvé"

foreach ($tool in @("node", "npm", "git")) {
  $cmd = Get-Command $tool -ErrorAction SilentlyContinue
  if ($cmd) {
    $version = & $tool --version 2>&1 | Select-Object -First 1
    Write-Pass "$tool présent ($version)"
  } else {
    Write-Fail "$tool ABSENT — installe-le avant de continuer"
    exit 1
  }
}

# --- Étape 1 : npm install ---
Write-Section "1. npm install"
if ($SkipInstall) {
  Write-Skip "npm install skipped (-SkipInstall)"
  $results["install"] = "skipped"
} elseif (Test-Path ".\node_modules") {
  Write-Info "node_modules existe — npm ci pour reproductibilité"
  npm ci 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Pass "npm ci OK"; $results["install"] = "pass" }
  else { Write-Fail "npm ci a échoué (exit $LASTEXITCODE)"; $results["install"] = "fail" }
} else {
  Write-Info "node_modules absent — npm install"
  npm install 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Pass "npm install OK"; $results["install"] = "pass" }
  else { Write-Fail "npm install a échoué (exit $LASTEXITCODE)"; $results["install"] = "fail" }
}

# --- Étape 2 : ESLint ---
Write-Section "2. ESLint"
npm run lint 2>&1 | Tee-Object -Variable lintOut | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Pass "ESLint 0/0 (exit 0)"
  $results["lint"] = "pass"
} else {
  Write-Fail "ESLint a échoué (exit $LASTEXITCODE)"
  $lintOut | Select-Object -Last 20 | ForEach-Object { Write-Host "    $_" }
  $results["lint"] = "fail"
}

# --- Étape 3 : TypeScript ---
Write-Section "3. TypeScript --noEmit"
# Clean .next/dev avant tsc pour éviter le cache stale
if (Test-Path ".\.next\dev") {
  Remove-Item -Recurse -Force ".\.next\dev" -ErrorAction SilentlyContinue
}
npx tsc --noEmit 2>&1 | Tee-Object -Variable tscOut | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Pass "tsc 0 erreur"
  $results["tsc"] = "pass"
} else {
  Write-Fail "tsc a trouvé des erreurs (exit $LASTEXITCODE)"
  $tscOut | Select-Object -Last 20 | ForEach-Object { Write-Host "    $_" }
  $results["tsc"] = "fail"
}

# --- Étape 4 : Vitest ---
Write-Section "4. Vitest (npm test)"
npm test 2>&1 | Tee-Object -Variable testOut | Out-Null
if ($LASTEXITCODE -eq 0) {
  $line = $testOut | Where-Object { $_ -match "Tests\s+\d+ passed" } | Select-Object -First 1
  if ($line) { Write-Pass "Vitest $line".Trim() } else { Write-Pass "Vitest OK" }
  $results["test"] = "pass"
} else {
  Write-Fail "Vitest a échoué (exit $LASTEXITCODE)"
  $testOut | Select-Object -Last 25 | ForEach-Object { Write-Host "    $_" }
  $results["test"] = "fail"
}

# --- Étape 5 : Build ---
Write-Section "5. Build production (npm run build)"
if ($SkipBuild) {
  Write-Skip "Build skipped (-SkipBuild)"
  $results["build"] = "skipped"
} else {
  npm run build 2>&1 | Tee-Object -Variable buildOut | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Pass "Build OK"
    $results["build"] = "pass"
  } else {
    Write-Fail "Build a échoué (exit $LASTEXITCODE)"
    $buildOut | Select-Object -Last 25 | ForEach-Object { Write-Host "    $_" }
    $results["build"] = "fail"
  }
}

# --- Récap ---
Write-Section "Récap"
$elapsed = (Get-Date) - $startTime
$pass = ($results.Values | Where-Object { $_ -eq "pass" }).Count
$fail = ($results.Values | Where-Object { $_ -eq "fail" }).Count
$skip = ($results.Values | Where-Object { $_ -eq "skipped" }).Count

foreach ($key in $results.Keys) {
  $status = $results[$key]
  switch ($status) {
    "pass"    { Write-Host "  [OK]   $key" -ForegroundColor Green }
    "fail"    { Write-Host "  [FAIL] $key" -ForegroundColor Red }
    "skipped" { Write-Host "  [SKIP] $key" -ForegroundColor Yellow }
  }
}

Write-Host ""
Write-Host "Pass : $pass" -ForegroundColor Green
Write-Host "Fail : $fail" -ForegroundColor Red
Write-Host "Skip : $skip" -ForegroundColor Yellow
Write-Host "Durée : $([math]::Round($elapsed.TotalSeconds, 1))s"

if ($fail -eq 0) {
  Write-Host "`n[OK] Validation locale OK" -ForegroundColor Green
  Write-Host "Étapes suivantes (cf. docs/PLAN-TEST-GO-LIVE-2026.md Annexe B) :"
  Write-Host "  - e2e Playwright : 2 terminaux (npm run dev + npm run test:e2e)"
  Write-Host "  - Lighthouse     : npx lighthouse http://localhost:3001 --view"
  Write-Host "  - Smoke prod     : bash scripts/smoke-test-prod.sh (Git Bash ou WSL)"
  exit 0
} else {
  Write-Host "`n[FAIL] $fail tests ont échoué — voir détails ci-dessus" -ForegroundColor Red
  exit 1
}
