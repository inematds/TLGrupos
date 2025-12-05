#!/bin/bash

# Script para reiniciar todo o sistema TLGrupos em PRODUÇÃO
# Uso: ./prod-restart.sh

echo "🔄 Reiniciando TLGrupos (PRODUÇÃO)"
echo "═══════════════════════════════════════════════════"
echo ""

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ Erro: PM2 não está instalado"
    exit 1
fi

echo "🌐 Reiniciando Dashboard..."
pm2 restart tlgrupos-dashboard
if [ $? -eq 0 ]; then
    echo "   ✅ Dashboard reiniciado"
else
    echo "   ⚠️  Erro ao reiniciar dashboard - tentando iniciar..."
    pm2 start npm --name "tlgrupos-dashboard" -- run start
fi

echo ""
echo "🤖 Reiniciando Bot do Telegram..."
pm2 restart tlgrupos-bot
if [ $? -eq 0 ]; then
    echo "   ✅ Bot reiniciado"
else
    echo "   ⚠️  Erro ao reiniciar bot - tentando iniciar..."
    pm2 start npm --name "tlgrupos-bot" -- run start:bot
fi

echo ""
echo "💾 Salvando estado do PM2..."
pm2 save

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Sistema reiniciado com sucesso!"
echo ""
echo "📊 Status atual:"
pm2 status
echo ""
echo "💡 Comandos úteis:"
echo "   pm2 logs               - Ver logs em tempo real"
echo "   pm2 monit              - Monitoramento interativo"
echo "   ./prod-status.sh       - Ver status detalhado"
echo ""
