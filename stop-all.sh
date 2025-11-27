#!/bin/bash

# Script para parar todo o sistema TLGrupos
# Uso: ./stop-all.sh

echo "🛑 Parando TLGrupos"
echo "═══════════════════════════════════════════════════"
echo ""

# Parar processos nas portas 3000 e 3001
echo "🔌 Parando portas 3000 e 3001..."
for PORT in 3000 3001; do
    PORT_PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$PORT_PID" ]; then
        echo "   Matando processo na porta $PORT (PID: $PORT_PID)"
        kill -9 $PORT_PID 2>/dev/null
        sleep 1
        # Verificar se matou
        if lsof -ti:$PORT >/dev/null 2>&1; then
            echo "   ⚠️  Tentando novamente..."
            fuser -k ${PORT}/tcp 2>/dev/null
        fi
        echo "   ✅ Porta $PORT liberada"
    else
        echo "   ℹ️  Porta $PORT já estava livre"
    fi
done

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
