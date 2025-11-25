#!/bin/bash

# Script para parar o Bot do Telegram
# Uso: ./stop-bot.sh

echo "🛑 Parando Bot do Telegram..."

# Encontrar processos do bot
PIDS=$(ps aux | grep -E "start-bot|telegraf" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "ℹ️  Nenhum processo do bot encontrado"
    exit 0
fi

# Matar processos
echo "   Processos encontrados: $PIDS"
for PID in $PIDS; do
    echo "   Matando processo $PID..."
    kill $PID 2>/dev/null
done

sleep 2

# Verificar se ainda existem processos
REMAINING=$(ps aux | grep -E "start-bot|telegraf" | grep -v grep | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo "⚠️  Alguns processos ainda estão rodando. Forçando..."
    pkill -9 -f "start-bot"
    pkill -9 -f "telegraf"
fi

echo "✅ Bot parado com sucesso!"
