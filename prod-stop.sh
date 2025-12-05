#!/bin/bash

# Script para parar todo o sistema TLGrupos em PRODUÇÃO
# Uso: ./prod-stop.sh

echo "🛑 Parando TLGrupos (PRODUÇÃO)"
echo "═══════════════════════════════════════════════════"
echo ""

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ Erro: PM2 não está instalado"
    exit 1
fi

echo "🌐 Parando Dashboard..."
pm2 stop tlgrupos-dashboard 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Dashboard parado"
else
    echo "   ℹ️  Dashboard não estava rodando"
fi

echo ""
echo "🤖 Parando Bot do Telegram..."
pm2 stop tlgrupos-bot 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Bot parado"
else
    echo "   ℹ️  Bot não estava rodando"
fi

echo ""
echo "💾 Salvando estado do PM2..."
pm2 save

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Sistema parado com sucesso!"
echo ""
echo "📊 Status atual:"
pm2 status
echo ""
echo "💡 Para iniciar novamente: ./prod-start.sh"
echo ""
