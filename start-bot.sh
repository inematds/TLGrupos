#!/bin/bash

# Script para iniciar o Bot do Telegram
# Uso: ./start-bot.sh

echo "🤖 Iniciando Bot do Telegram..."
echo ""

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "❌ Erro: Arquivo .env.local não encontrado!"
    echo "   Crie o arquivo .env.local com as variáveis de ambiente necessárias"
    exit 1
fi

# Verificar se TELEGRAM_BOT_TOKEN está configurado
if ! grep -q "TELEGRAM_BOT_TOKEN=" .env.local; then
    echo "❌ Erro: TELEGRAM_BOT_TOKEN não configurado no .env.local"
    exit 1
fi

# Verificar se TELEGRAM_GROUP_ID está configurado
if ! grep -q "TELEGRAM_GROUP_ID=" .env.local; then
    echo "❌ Erro: TELEGRAM_GROUP_ID não configurado no .env.local"
    exit 1
fi

# Mostrar configuração
echo "📋 Configuração:"
GROUPS=$(grep "TELEGRAM_GROUP_ID=" .env.local | cut -d'=' -f2)
NUM_GROUPS=$(echo "$GROUPS" | tr ',' '\n' | wc -l)
echo "   Grupos monitorados: $NUM_GROUPS"
echo "   IDs: $GROUPS"
echo ""

# Iniciar bot
npm run start:bot
