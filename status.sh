#!/bin/bash

# Script para verificar status do sistema
# Uso: ./status.sh

echo "📊 Status do TLGrupos"
echo "═══════════════════════════════════════════════════"
echo ""

# Verificar processo do bot
echo "🤖 Bot do Telegram:"
BOT_PIDS=$(ps aux | grep -E "start-bot" | grep -v grep | awk '{print $2}')
if [ -z "$BOT_PIDS" ]; then
    echo "   ❌ Bot NÃO está rodando"
else
    echo "   ✅ Bot está rodando (PID: $BOT_PIDS)"
fi
echo ""

# Verificar processo do Next.js
echo "🌐 Next.js (Dashboard):"
NEXT_PIDS=$(ps aux | grep -E "next|npm run dev" | grep -v grep | awk '{print $2}')
if [ -z "$NEXT_PIDS" ]; then
    echo "   ❌ Next.js NÃO está rodando"
else
    echo "   ✅ Next.js está rodando (PID: $NEXT_PIDS)"
fi
echo ""

# Verificar grupos configurados
echo "👥 Grupos do Telegram:"
if [ -f ".env.local" ]; then
    GROUPS=$(grep "TELEGRAM_GROUP_ID=" .env.local | cut -d'=' -f2)
    NUM_GROUPS=$(echo "$GROUPS" | tr ',' '\n' | wc -l)
    echo "   📋 Total: $NUM_GROUPS grupo(s)"
    echo "   IDs: $GROUPS"
else
    echo "   ⚠️  Arquivo .env.local não encontrado"
fi
echo ""

# Verificar portas 3000 e 3001
echo "🔌 Portas:"
PORT_3000=$(lsof -Pi :3000 -sTCP:LISTEN -t 2>/dev/null)
PORT_3001=$(lsof -Pi :3001 -sTCP:LISTEN -t 2>/dev/null)

if [ ! -z "$PORT_3000" ]; then
    echo "   ✅ Porta 3000 em uso (PID: $PORT_3000)"
    echo "   🌐 http://157.180.72.42"
elif [ ! -z "$PORT_3001" ]; then
    echo "   ⚠️  Porta 3001 em uso (PID: $PORT_3001)"
    echo "   🌐 http://157.180.72.42 (se Nginx configurado para 3001)"
    echo "   💡 Recomendação: execute ./restart-all.sh para usar porta 3000"
else
    echo "   ❌ Portas 3000 e 3001 livres (Dashboard não está rodando)"
fi
echo ""

echo "═══════════════════════════════════════════════════"
echo ""
echo "💡 Comandos úteis:"
echo "   ./start-bot.sh     - Iniciar bot"
echo "   ./stop-bot.sh      - Parar bot"
echo "   ./restart-bot.sh   - Reiniciar bot"
echo "   ./sync-grupos.sh   - Sincronizar grupos"
echo "   npm run dev        - Iniciar dashboard"
echo ""
