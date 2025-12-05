#!/bin/bash

# Carrega o CRON_SECRET do .env.local
if [ -f .env.local ]; then
  export $(grep CRON_SECRET .env.local | xargs)
fi

BASE_URL="http://localhost:3000"

echo "🧪 Testando todos os CRON jobs do TLGrupos v1.2.1"
echo "================================================"
echo ""

if [ -z "$CRON_SECRET" ]; then
  echo "❌ ERRO: CRON_SECRET não encontrado no .env.local"
  echo "   Adicione: CRON_SECRET=sua_chave_secreta"
  exit 1
fi

echo "🔐 Usando CRON_SECRET: ${CRON_SECRET:0:10}..."
echo ""

# Função para testar endpoint
test_endpoint() {
  local name=$1
  local endpoint=$2

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔹 $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  response=$(curl -X POST "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    -s -w "\nHTTP_CODE:%{http_code}")

  http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_CODE/d')

  if [ "$http_code" == "200" ]; then
    echo "✅ Status: $http_code OK"
    echo "$body" | jq . 2>/dev/null || echo "$body"
  else
    echo "❌ Status: $http_code ERRO"
    echo "$body" | jq . 2>/dev/null || echo "$body"
  fi
  echo ""
}

# Testa cada endpoint
test_endpoint "1️⃣  Send Notifications (Enviar Notificações)" "/api/cron/send-notifications"
test_endpoint "2️⃣  Check Expirations (Verificar Vencimentos)" "/api/cron/check-expirations"
test_endpoint "3️⃣  Remove Expired (Remover Vencidos)" "/api/cron/remove-expired"
test_endpoint "4️⃣  Process Approved Payments (Processar Pagamentos)" "/api/cron/process-approved-payments"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Todos os testes concluídos!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
