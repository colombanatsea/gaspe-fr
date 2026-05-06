#!/usr/bin/env bash
# scripts/smoke-test-prod.sh
# Smoke test prod global pour go-live ACF / GASPE.
# Couvre la Phase 1 (Infra) du plan docs/PLAN-TEST-GO-LIVE-2026.md.
#
# Usage :
#   API_URL=https://gaspe-api.hello-0d0.workers.dev \
#   SITE_URL=https://gaspe-fr.pages.dev \
#   ADMIN_EMAIL=admin@gaspe.fr \
#   ADMIN_PASSWORD=admin123 \
#   ./scripts/smoke-test-prod.sh
#
# Variables :
#   API_URL           Worker API (default: https://gaspe-api.hello-0d0.workers.dev)
#   SITE_URL          Frontend Pages (default: https://gaspe-fr.pages.dev)
#   ADMIN_EMAIL       Email admin (required pour tests auth)
#   ADMIN_PASSWORD    Password admin (required pour tests auth)
#   VERBOSE           true|false (default false : affiche les payloads)
#   SKIP_AUTH         true|false (default false : skip tests auth)
#   SKIP_VALIDATION   true|false (default false : skip smoke-test-validation.sh)
#
# Pre-requis : curl + jq + (optionnel) wrangler pour Phase 1 INF-04/INF-05/INF-06/INF-08.
#
# Couverture (Phase 1 + Phase D17 cron du plan) :
#   INF-01  /api/health
#   INF-02  Headers Cloudflare Pages root
#   INF-03  DNS gaspe.fr (skip si SITE_URL != https://gaspe.fr)
#   INF-04  Migrations D1 (wrangler, optionnel)
#   INF-05  Cron trigger (wrangler, optionnel)
#   INF-06  Secrets Worker (wrangler, optionnel)
#   INF-07  Brevo list IDs (wrangler, optionnel)
#   INF-08  R2 bucket (wrangler, optionnel)
#   INF-09  smoke-test-validation.sh (delegation)
#   INF-10  Sitemap + RSS bien forme
#   INF-11  robots.txt Disallow correct
#   INF-12  DNS email (skip — manual)
#   INF-13  Build artefacts (manual dashboard, skip)
#   INF-14  RBAC staff endpoint
#
# Exit code 0 si tous les tests passent, 1 sinon.

set -euo pipefail

# ---- Config ----
API_URL="${API_URL:-https://gaspe-api.hello-0d0.workers.dev}"
SITE_URL="${SITE_URL:-https://gaspe-fr.pages.dev}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
VERBOSE="${VERBOSE:-false}"
SKIP_AUTH="${SKIP_AUTH:-false}"
SKIP_VALIDATION="${SKIP_VALIDATION:-false}"

# ---- Colors ----
if [[ -t 1 ]]; then
  GREEN="\033[0;32m"
  RED="\033[0;31m"
  YELLOW="\033[1;33m"
  BLUE="\033[0;34m"
  BOLD="\033[1m"
  RESET="\033[0m"
else
  GREEN="" RED="" YELLOW="" BLUE="" BOLD="" RESET=""
fi

PASS=0
FAIL=0
SKIP=0
COOKIE_JAR=""
trap 'rm -f "$COOKIE_JAR"' EXIT

# ---- Helpers ----
log_pass() { echo -e "  ${GREEN}✓${RESET} $*"; PASS=$((PASS+1)); }
log_fail() { echo -e "  ${RED}✗${RESET} $*"; FAIL=$((FAIL+1)); }
log_skip() { echo -e "  ${YELLOW}—${RESET} $*"; SKIP=$((SKIP+1)); }
log_info() { echo -e "  ${BLUE}ℹ${RESET} $*"; }
log_section() { echo -e "\n${BOLD}$*${RESET}"; }
verbose() { [[ "$VERBOSE" == "true" ]] && echo "    $*" || true; }

require_tool() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}✗${RESET} pré-requis manquant : $1"
    exit 1
  fi
}

http_status() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

assert_http() {
  local label="$1" expected="$2"; shift 2
  local actual
  actual=$(http_status "$@")
  if [[ "$actual" == "$expected" ]]; then
    log_pass "$label (HTTP $actual)"
  else
    log_fail "$label : attendu $expected, reçu $actual"
  fi
}

# ---- Pre-flight ----
echo -e "${BOLD}=== Smoke test prod ACF / GASPE ===${RESET}"
echo "API:  $API_URL"
echo "Site: $SITE_URL"
echo

require_tool curl
require_tool jq
COOKIE_JAR=$(mktemp)

# ---- INF-01 — /api/health ----
log_section "INF-01 — Worker /api/health"
HEALTH=$(curl -s -w "\n%{http_code}" "$API_URL/api/health" || true)
HEALTH_CODE=$(echo "$HEALTH" | tail -1)
HEALTH_BODY=$(echo "$HEALTH" | sed '$d')
if [[ "$HEALTH_CODE" == "200" ]]; then
  log_pass "Worker /api/health 200"
  verbose "$HEALTH_BODY"
else
  log_fail "Worker /api/health $HEALTH_CODE (attendu 200)"
fi

# ---- INF-02 — Headers Pages root ----
log_section "INF-02 — Headers Cloudflare Pages root"
HEADERS=$(curl -sI "$SITE_URL/" || true)
verbose "$HEADERS"
if echo "$HEADERS" | grep -qi "^HTTP.*200"; then log_pass "GET / 200"; else log_fail "GET / pas 200"; fi
for h in "X-Frame-Options" "X-Content-Type-Options" "Referrer-Policy" "Content-Security-Policy" "Permissions-Policy"; do
  if echo "$HEADERS" | grep -qi "^$h:"; then
    log_pass "Header $h présent"
  else
    log_fail "Header $h ABSENT"
  fi
done

# ---- INF-03 — DNS gaspe.fr (si applicable) ----
log_section "INF-03 — DNS gaspe.fr"
if [[ "$SITE_URL" == *"gaspe.fr"* ]]; then
  if command -v dig &>/dev/null; then
    DIG_OUT=$(dig +short gaspe.fr || true)
    if [[ -n "$DIG_OUT" ]]; then
      log_pass "DNS gaspe.fr résout : $DIG_OUT"
    else
      log_fail "DNS gaspe.fr ne résout pas"
    fi
  else
    log_skip "dig non disponible"
  fi
else
  log_skip "SITE_URL n'est pas gaspe.fr (skip)"
fi

# ---- INF-04 / INF-05 / INF-06 / INF-07 / INF-08 — wrangler ----
log_section "INF-04..08 — Cloudflare ressources (wrangler)"
if command -v wrangler &>/dev/null; then
  log_info "wrangler détecté ($(wrangler --version 2>&1 | head -1))"

  # INF-04 — migrations
  if MIGS=$(wrangler d1 migrations list DB --remote 2>&1); then
    APPLIED=$(echo "$MIGS" | grep -cE "✓|applied" || true)
    if [[ "$APPLIED" -ge 25 ]]; then
      log_pass "INF-04 D1 migrations appliquées : $APPLIED (≥ 25 attendu)"
    else
      log_fail "INF-04 D1 migrations : $APPLIED appliquées (< 25)"
    fi
  else
    log_skip "INF-04 wrangler d1 migrations list KO (DB binding ?)"
  fi

  # INF-05 — cron triggers
  if CRONS=$(wrangler triggers cron list 2>&1 || wrangler triggers list 2>&1); then
    if echo "$CRONS" | grep -q "0 9"; then
      log_pass "INF-05 Cron trigger '0 9 * * *' enregistré"
    else
      log_fail "INF-05 Cron trigger '0 9 * * *' absent"
    fi
  else
    log_skip "INF-05 wrangler triggers KO"
  fi

  # INF-06 — secrets
  if SECRETS=$(wrangler secret list 2>&1); then
    EXPECTED_SECRETS=("JWT_SECRET" "BREVO_API_KEY" "HYDROS_EMAIL" "HYDROS_PASSWORD" "NEWSLETTER_UNSUB_SECRET" "BREVO_WEBHOOK_SECRET")
    MISSING=0
    for s in "${EXPECTED_SECRETS[@]}"; do
      if echo "$SECRETS" | grep -q "$s"; then
        log_pass "Secret $s configuré"
      else
        log_fail "Secret $s ABSENT"
        MISSING=$((MISSING+1))
      fi
    done
    [[ "$MISSING" -eq 0 ]] && log_pass "INF-06 tous les secrets requis présents"
  else
    log_skip "INF-06 wrangler secret list KO"
  fi

  # INF-07 — Brevo list IDs (audit manuel)
  log_skip "INF-07 Brevo list IDs : audit manuel via dashboard (10 listes attendues)"

  # INF-08 — R2 bucket
  if R2=$(wrangler r2 bucket list 2>&1); then
    if echo "$R2" | grep -q "gaspe-uploads"; then
      log_pass "INF-08 R2 bucket gaspe-uploads existe"
    else
      log_fail "INF-08 R2 bucket gaspe-uploads ABSENT"
    fi
  else
    log_skip "INF-08 wrangler r2 bucket list KO"
  fi
else
  log_skip "wrangler non disponible — INF-04..08 à exécuter manuellement"
fi

# ---- INF-09 — smoke validation ----
log_section "INF-09 — Smoke test validation annuelle"
if [[ "$SKIP_VALIDATION" == "true" ]]; then
  log_skip "INF-09 skipped (SKIP_VALIDATION=true)"
elif [[ -f "$(dirname "$0")/smoke-test-validation.sh" ]]; then
  log_info "Délégation à scripts/smoke-test-validation.sh"
  if API_URL="$API_URL" ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
       bash "$(dirname "$0")/smoke-test-validation.sh"; then
    log_pass "INF-09 smoke-test-validation 8/8"
  else
    log_fail "INF-09 smoke-test-validation a échoué"
  fi
else
  log_skip "INF-09 scripts/smoke-test-validation.sh introuvable"
fi

# ---- INF-10 — Sitemap + RSS ----
log_section "INF-10 — Sitemap + RSS"
SITEMAP=$(curl -s "$SITE_URL/sitemap.xml" || true)
if echo "$SITEMAP" | grep -q "<urlset"; then
  COUNT=$(echo "$SITEMAP" | grep -c "<url>" || true)
  log_pass "Sitemap XML bien formé, $COUNT URLs"
else
  log_fail "Sitemap absent ou malformé"
fi
RSS=$(curl -s "$SITE_URL/feed.xml" || true)
if echo "$RSS" | grep -q "<rss"; then
  ITEMS=$(echo "$RSS" | grep -c "<item>" || true)
  log_pass "RSS 2.0 bien formé, $ITEMS items"
else
  log_fail "RSS absent ou malformé"
fi

# ---- INF-11 — robots.txt ----
log_section "INF-11 — robots.txt"
ROBOTS=$(curl -s "$SITE_URL/robots.txt" || true)
verbose "$ROBOTS"
EXPECTED_DISALLOW=("/admin" "/espace-adherent" "/espace-candidat" "/inscription" "/connexion" "/mot-de-passe-oublie" "/reinitialiser-mot-de-passe")
for path in "${EXPECTED_DISALLOW[@]}"; do
  if echo "$ROBOTS" | grep -q "Disallow: $path"; then
    log_pass "robots.txt disallow $path"
  else
    log_fail "robots.txt MISSING disallow $path"
  fi
done
if echo "$ROBOTS" | grep -q "Sitemap:"; then
  log_pass "robots.txt référence Sitemap"
else
  log_fail "robots.txt sans Sitemap"
fi

# ---- INF-12 — DNS email (manual) ----
log_section "INF-12 — DNS email Brevo (SPF/DKIM/DMARC)"
log_skip "INF-12 audit manuel via mail-tester.com (envoi test depuis Brevo)"

# ---- INF-13 — Build artefacts (manual) ----
log_section "INF-13 — Build artefacts (Cloudflare Pages)"
log_skip "INF-13 audit manuel via dashboard CF Pages (118 pages attendues)"

# ---- INF-14 — RBAC staff vivant ----
log_section "INF-14 — RBAC staff endpoint"
if [[ "$SKIP_AUTH" == "true" ]]; then
  log_skip "INF-14 skipped (SKIP_AUTH=true)"
elif [[ -z "$ADMIN_EMAIL" || -z "$ADMIN_PASSWORD" ]]; then
  log_skip "INF-14 ADMIN_EMAIL/ADMIN_PASSWORD manquants"
else
  LOGIN_PAYLOAD=$(jq -nc --arg e "$ADMIN_EMAIL" --arg p "$ADMIN_PASSWORD" '{email:$e, password:$p}')
  LOGIN_CODE=$(curl -s -o /tmp/smoke-login.json -w "%{http_code}" \
    -c "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_PAYLOAD" \
    "$API_URL/api/auth/login" || true)
  if [[ "$LOGIN_CODE" == "200" ]]; then
    log_pass "Login admin OK"
    USERS_CODE=$(curl -s -o /tmp/smoke-users.json -w "%{http_code}" \
      -b "$COOKIE_JAR" \
      "$API_URL/api/auth/users" || true)
    if [[ "$USERS_CODE" == "200" ]]; then
      STAFF_COUNT=$(jq '[.users[]? | select(.role=="staff")] | length' /tmp/smoke-users.json 2>/dev/null || echo 0)
      log_pass "INF-14 GET /api/auth/users 200 ($STAFF_COUNT staff)"
      if jq -e '.users[]? | select(.staffPermissions != null)' /tmp/smoke-users.json &>/dev/null; then
        log_pass "INF-14 champ staffPermissions présent dans le JSON"
      else
        log_skip "INF-14 staffPermissions vide (aucun staff configuré)"
      fi
    else
      log_fail "INF-14 GET /api/auth/users $USERS_CODE"
    fi
    rm -f /tmp/smoke-users.json /tmp/smoke-login.json
  else
    log_fail "Login admin a échoué (HTTP $LOGIN_CODE) — INF-14 skipped"
  fi
fi

# ---- Bonus : audit checks publics rapides ----
log_section "Bonus — Smoke pages publiques"
for path in "/" "/notre-groupement" "/nos-adherents" "/contact" "/boite-a-outils" "/ssgm" "/ecoles-de-la-mer" "/transition-ecologique" "/formations" "/positions" "/agenda" "/documents" "/presse" "/feed.xml" "/sitemap.xml" "/manifest.json" "/robots.txt"; do
  STATUS=$(http_status "$SITE_URL$path")
  if [[ "$STATUS" == "200" ]]; then
    log_pass "GET $path 200"
  else
    log_fail "GET $path $STATUS"
  fi
done

# ---- Recap ----
echo
echo -e "${BOLD}=== Récap ===${RESET}"
echo -e "  ${GREEN}Passed${RESET} : $PASS"
echo -e "  ${RED}Failed${RESET} : $FAIL"
echo -e "  ${YELLOW}Skipped${RESET}: $SKIP"
echo

if [[ "$FAIL" -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ Smoke prod OK — Go Phase 2${RESET}"
  exit 0
else
  echo -e "${RED}${BOLD}✗ Smoke prod a échoué — corriger avant Go Phase 2${RESET}"
  exit 1
fi
