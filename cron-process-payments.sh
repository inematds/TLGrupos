#!/bin/bash

# Script para processar pagamentos aprovados sem link (Cron Job)
# Executado automaticamente a cada 15 minutos

# Carregar variáveis de ambiente
source /var/www/TLGrupos/.env.local

# Verificar se CRON_SECRET existe
if [ -z "$CRON_SECRET" ]; then
    echo "[$(date)] ERRO: CRON_SECRET não configurado no .env.local"
    exit 1
fi

# Endpoint da aplicação
URL="http://localhost:3000/api/cron/process-approved-payments"

# Executar requisição
echo "[$(date)] Iniciando processamento de pagamentos sem link..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Verificar resultado
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "[$(date)] ✅ Sucesso - Status: $HTTP_CODE"
    echo "$BODY" | grep -o '"total":[0-9]*' | head -1
    echo "$BODY" | grep -o '"processados":[0-9]*' | head -1
else
    echo "[$(date)] ❌ Erro - Status: $HTTP_CODE"
    echo "$BODY"
fi

echo "---"
