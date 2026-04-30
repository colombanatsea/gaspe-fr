#!/usr/bin/env bash
# scripts/smoke-test-validation.sh
# Smoke test post-merge de la feature validation annuelle (sessions 45-51).
#
# Usage :
#   API_URL=https://gaspe-api.hello-0d0.workers.dev \
#   ADMIN_EMAIL=admin@gaspe.fr \
#   ADMIN_PASSWORD=admin123 \
#   ./scripts/smoke-test-validation.sh
#
# Optionnel :
#   TEST_YEAR=2099 (annee bidon pour ne pas collisionner avec une vraie campagne)
#   CLEANUP=true|false (defaut true : supprime la campagne creee)
#   VERBOSE=true|false (defaut false : affiche les payloads)
#
# Pre-requis : curl + jq.
#
# Couverture :
#   1. Health check (anonyme)
#   2. Login admin -> JWT
#   3. GET /api/campaigns (admin)
#   4. POST /api/campaigns (creation campagne TEST_YEAR en draft)
#   5. PATCH /api/campaigns/:id (open)
#   6. GET /api/campaigns/:id/dashboard
#   7. GET /api/organizations/karu-ferry/validations (premiere org du seed)
#   8. PATCH /api/campaigns/:id (closed)
#   9. (Optionnel) DELETE manuelle via SQL si pas implemente cote API
#
# Exit code 0 si tous les tests passent, 1 sinon.

set -euo pipefail

API_URL="${API_URL:-https://gaspe-api.hello-0d0.workers.dev}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@gaspe.fr}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
TEST_YEAR="${TEST_YEAR:-2099}"
CLEANUP="${CLEANUP:-true}"
VERBOSE="${VERBOSE:-false}"
TEST_SLUG="${TEST_SLUG:-karu-ferry}"

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

check_dep() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ Dependance manquante : $1${NC}"
    exit 1
  fi
}

step() {
  echo ""
  echo -e "${YELLOW}━━━ $1 ━━━${NC}"
}

assert_status() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [ "$actual" -eq "$expected" ]; then
    echo -e "${GREEN}  ✓${NC} $label (HTTP $actual)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}  ✗${NC} $label (HTTP $actual, attendu $expected)"
    FAILED=$((FAILED + 1))
  fi
}

verbose() {
  if [ "$VERBOSE" = "true" ]; then
    echo "$@" | jq '.' 2>/dev/null || echo "$@"
  fi
}

# ─────────────────────────────────────────────────────────────────────
# Pre-requis
# ─────────────────────────────────────────────────────────────────────

check_dep curl
check_dep jq

echo "API : $API_URL"
echo "Admin : $ADMIN_EMAIL"
echo "Test year : $TEST_YEAR"
echo "Test slug : $TEST_SLUG"
echo "Cleanup : $CLEANUP"

# ─────────────────────────────────────────────────────────────────────
# 1. Health check
# ─────────────────────────────────────────────────────────────────────

step "1. Health check"
HTTP_CODE=$(curl -sS -o /tmp/health.json -w "%{http_code}" "$API_URL/api/health")
assert_status "GET /api/health" "$HTTP_CODE" 200
verbose "$(cat /tmp/health.json)"

# ─────────────────────────────────────────────────────────────────────
# 2. Login admin
# ─────────────────────────────────────────────────────────────────────

step "2. Login admin"
LOGIN_RESP=$(curl -sS -c /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -X POST "$API_URL/api/auth/login")
verbose "$LOGIN_RESP"
USER_ROLE=$(echo "$LOGIN_RESP" | jq -r '.user.role // "none"')
if [ "$USER_ROLE" = "admin" ]; then
  echo -e "${GREEN}  ✓${NC} login admin (role=admin)"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}  ✗${NC} login admin (role=$USER_ROLE)"
  FAILED=$((FAILED + 1))
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────
# 3. GET /api/campaigns (admin)
# ─────────────────────────────────────────────────────────────────────

step "3. GET /api/campaigns"
HTTP_CODE=$(curl -sS -b /tmp/cookies.txt -o /tmp/campaigns.json -w "%{http_code}" \
  "$API_URL/api/campaigns")
assert_status "GET /api/campaigns" "$HTTP_CODE" 200
verbose "$(cat /tmp/campaigns.json)"

# ─────────────────────────────────────────────────────────────────────
# 4. POST /api/campaigns (creation TEST_YEAR draft)
# ─────────────────────────────────────────────────────────────────────

step "4. POST /api/campaigns (TEST_YEAR=$TEST_YEAR, draft)"
CREATE_RESP=$(curl -sS -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"targetYear\":$TEST_YEAR,\"targetDate\":\"$TEST_YEAR-03-31\",\"notes\":\"Smoke test session 52\",\"status\":\"draft\"}" \
  -X POST "$API_URL/api/campaigns")
verbose "$CREATE_RESP"
CAMPAIGN_ID=$(echo "$CREATE_RESP" | jq -r '.campaign.id // empty')
CREATED_STATUS=$(echo "$CREATE_RESP" | jq -r '.campaign.status // empty')
if [ -n "$CAMPAIGN_ID" ] && [ "$CREATED_STATUS" = "draft" ]; then
  echo -e "${GREEN}  ✓${NC} creation campagne id=$CAMPAIGN_ID, status=draft"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}  ✗${NC} creation campagne (id=$CAMPAIGN_ID, status=$CREATED_STATUS)"
  FAILED=$((FAILED + 1))
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────
# 5. PATCH /api/campaigns/:id (open)
# ─────────────────────────────────────────────────────────────────────

step "5. PATCH /api/campaigns/$CAMPAIGN_ID (open)"
PATCH_RESP=$(curl -sS -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"open\"}" \
  -X PATCH "$API_URL/api/campaigns/$CAMPAIGN_ID")
verbose "$PATCH_RESP"
NEW_STATUS=$(echo "$PATCH_RESP" | jq -r '.campaign.status // empty')
if [ "$NEW_STATUS" = "open" ]; then
  echo -e "${GREEN}  ✓${NC} bascule en open OK"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}  ✗${NC} bascule en open (status=$NEW_STATUS)"
  FAILED=$((FAILED + 1))
fi

# ─────────────────────────────────────────────────────────────────────
# 6. GET /api/campaigns/:id/dashboard
# ─────────────────────────────────────────────────────────────────────

step "6. GET /api/campaigns/$CAMPAIGN_ID/dashboard"
HTTP_CODE=$(curl -sS -b /tmp/cookies.txt -o /tmp/dashboard.json -w "%{http_code}" \
  "$API_URL/api/campaigns/$CAMPAIGN_ID/dashboard")
assert_status "GET dashboard" "$HTTP_CODE" 200
ORG_COUNT=$(jq -r '.summary.orgsTotal // 0' /tmp/dashboard.json)
echo "  → orgsTotal=$ORG_COUNT (attendu : > 0 si organizations seedees)"
verbose "$(cat /tmp/dashboard.json)"

# ─────────────────────────────────────────────────────────────────────
# 7. GET /api/organizations/:slug/validations
# ─────────────────────────────────────────────────────────────────────

step "7. GET /api/organizations/$TEST_SLUG/validations"
HTTP_CODE=$(curl -sS -b /tmp/cookies.txt -o /tmp/validations.json -w "%{http_code}" \
  "$API_URL/api/organizations/$TEST_SLUG/validations")
assert_status "GET validations $TEST_SLUG" "$HTTP_CODE" 200
HISTORY_COUNT=$(jq -r '.history | length' /tmp/validations.json)
echo "  → history.length=$HISTORY_COUNT"
verbose "$(cat /tmp/validations.json)"

# ─────────────────────────────────────────────────────────────────────
# 8. PATCH /api/campaigns/:id (closed) – cleanup
# ─────────────────────────────────────────────────────────────────────

if [ "$CLEANUP" = "true" ]; then
  step "8. PATCH /api/campaigns/$CAMPAIGN_ID (closed) – cleanup"
  CLOSE_RESP=$(curl -sS -b /tmp/cookies.txt \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"closed\",\"notes\":\"Smoke test - cloturee automatiquement\"}" \
    -X PATCH "$API_URL/api/campaigns/$CAMPAIGN_ID")
  CLOSE_STATUS=$(echo "$CLOSE_RESP" | jq -r '.campaign.status // empty')
  if [ "$CLOSE_STATUS" = "closed" ]; then
    echo -e "${GREEN}  ✓${NC} cloture OK"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}  ✗${NC} cloture (status=$CLOSE_STATUS)"
    FAILED=$((FAILED + 1))
  fi
  echo ""
  echo -e "${YELLOW}Note${NC} : la campagne id=$CAMPAIGN_ID reste en DB (status=closed)."
  echo "Pour la supprimer completement :"
  echo "  wrangler d1 execute gaspe-db --remote \\"
  echo "    --command=\"DELETE FROM fleet_validation_campaigns WHERE id=$CAMPAIGN_ID\""
else
  echo ""
  echo -e "${YELLOW}Cleanup desactive${NC} : campagne id=$CAMPAIGN_ID laissee en status=open."
fi

# ─────────────────────────────────────────────────────────────────────
# Bilan
# ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "${YELLOW}━━━ BILAN ━━━${NC}"
echo "  ✓ $PASSED passes"
echo "  ✗ $FAILED echecs"
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}Tous les smoke tests sont passes.${NC}"
  exit 0
else
  echo -e "${RED}Certains smoke tests ont echoue. Voir les logs ci-dessus.${NC}"
  exit 1
fi
