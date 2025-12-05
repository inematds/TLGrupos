#!/bin/bash

# Script para verificar status do sistema em PRODUÇÃO
# Uso: ./prod-status.sh

echo "📊 Status do TLGrupos (PRODUÇÃO)"
echo "═══════════════════════════════════════════════════"
echo ""

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ Erro: PM2 não está instalado"
    echo "   Instale com: npm install -g pm2"
    exit 1
fi

# Status dos processos PM2
echo "🔧 Processos PM2:"
pm2 status

echo ""
echo "═══════════════════════════════════════════════════"
echo ""

# Verificar Dashboard
echo "🌐 Dashboard (tlgrupos-dashboard):"
DASHBOARD_STATUS=$(pm2 jlist | grep -o '"name":"tlgrupos-dashboard","pm2_env":{"status":"[^"]*"' | grep -o 'status":"[^"]*"' | cut -d'"' -f3)
if [ "$DASHBOARD_STATUS" = "online" ]; then
    echo "   ✅ Status: ONLINE"
    DASHBOARD_PID=$(pm2 jlist | grep -A20 '"name":"tlgrupos-dashboard"' | grep -o '"pid":[0-9]*' | head -1 | cut -d':' -f2)
    echo "   🔢 PID: $DASHBOARD_PID"

    # Verificar porta 3000
    PORT_3000=$(lsof -Pi :3000 -sTCP:LISTEN -t 2>/dev/null)
    if [ ! -z "$PORT_3000" ]; then
        echo "   ✅ Porta 3000: ATIVA"
        echo "   🌐 URL: http://157.180.72.42"
    else
        echo "   ⚠️  Porta 3000: NÃO ATIVA"
    fi
elif [ "$DASHBOARD_STATUS" = "stopped" ]; then
    echo "   🛑 Status: STOPPED"
elif [ -z "$DASHBOARD_STATUS" ]; then
    echo "   ❌ Status: NÃO CONFIGURADO"
else
    echo "   ⚠️  Status: $DASHBOARD_STATUS"
fi

echo ""

# Verificar Bot
echo "🤖 Bot do Telegram (tlgrupos-bot):"
BOT_STATUS=$(pm2 jlist | grep -o '"name":"tlgrupos-bot","pm2_env":{"status":"[^"]*"' | grep -o 'status":"[^"]*"' | cut -d'"' -f3)
if [ "$BOT_STATUS" = "online" ]; then
    echo "   ✅ Status: ONLINE"
    BOT_PID=$(pm2 jlist | grep -A20 '"name":"tlgrupos-bot"' | grep -o '"pid":[0-9]*' | head -1 | cut -d':' -f2)
    echo "   🔢 PID: $BOT_PID"
elif [ "$BOT_STATUS" = "stopped" ]; then
    echo "   🛑 Status: STOPPED"
elif [ -z "$BOT_STATUS" ]; then
    echo "   ❌ Status: NÃO CONFIGURADO"
else
    echo "   ⚠️  Status: $BOT_STATUS"
fi

echo ""

# Verificar grupos configurados
echo "👥 Grupos do Telegram:"
if [ -f ".env.local" ]; then
    GROUPS=$(grep "TELEGRAM_GROUP_ID=" .env.local | cut -d'=' -f2)
    NUM_GROUPS=$(echo "$GROUPS" | tr ',' '\n' | wc -l)
    echo "   📋 Total: $NUM_GROUPS grupo(s)"
    echo "   🆔 IDs: $GROUPS"
else
    echo "   ⚠️  Arquivo .env.local não encontrado"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo "💡 Comandos úteis:"
echo "   pm2 logs                        - Ver logs em tempo real"
echo "   pm2 logs tlgrupos-dashboard     - Logs do dashboard"
echo "   pm2 logs tlgrupos-bot           - Logs do bot"
echo "   pm2 monit                       - Monitor interativo"
echo "   ./prod-restart.sh               - Reiniciar sistema"
echo "   ./prod-stop.sh                  - Parar sistema"
echo ""
