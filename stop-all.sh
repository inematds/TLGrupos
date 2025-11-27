#!/bin/bash

# Script para parar todo o sistema TLGrupos
# Uso: ./stop-all.sh

echo "🛑 Parando TLGrupos"
echo "═══════════════════════════════════════════════════"
echo ""

# Parar processos na porta 3000
echo "🔌 Parando porta 3000..."
PORT_3000=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000" ]; then
    echo "   Matando processo na porta 3000 (PID: $PORT_3000)"
    kill -9 $PORT_3000 2>/dev/null
    echo "   ✅ Porta 3000 liberada"
else
    echo "   ℹ️  Porta 3000 já estava livre"
fi

echo ""
echo "🤖 Parando Bot do Telegram..."
BOT_PIDS=$(ps aux | grep "start-bot\|telegram-webhook\|node.*bot" | grep -v grep | awk '{print $2}')
if [ ! -z "$BOT_PIDS" ]; then
    echo "   Matando bot (PIDs: $BOT_PIDS)"
    kill -9 $BOT_PIDS 2>/dev/null
    echo "   ✅ Bot parado"
else
    echo "   ℹ️  Bot já estava parado"
fi

echo ""
echo "🌐 Parando Next.js..."
NEXT_PIDS=$(ps aux | grep "next\|npm.*dev" | grep -v grep | awk '{print $2}')
if [ ! -z "$NEXT_PIDS" ]; then
    echo "   Matando Next.js (PIDs: $NEXT_PIDS)"
    kill -9 $NEXT_PIDS 2>/dev/null
    echo "   ✅ Next.js parado"
else
    echo "   ℹ️  Next.js já estava parado"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Sistema parado com sucesso!"
echo ""
