#!/bin/bash

# Script para reiniciar o Bot do Telegram
# Uso: ./restart-bot.sh

echo "🔄 Reiniciando Bot do Telegram..."
echo ""

# Parar bot
./stop-bot.sh

echo ""
echo "⏳ Aguardando 3 segundos..."
sleep 3
echo ""

# Iniciar bot
./start-bot.sh
