#!/bin/bash

# Script para iniciar todo o sistema TLGrupos em PRODUÇÃO
# Uso: ./prod-start.sh
# Desenvolvimento: use ./dev-start.sh

echo "🚀 Iniciando TLGrupos (PRODUÇÃO com PM2)"
echo "═══════════════════════════════════════════════════"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Verificar .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ Erro: Arquivo .env.local não encontrado"
    exit 1
fi

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ Erro: PM2 não está instalado"
    echo "   Instale com: npm install -g pm2"
    exit 1
fi

echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependências..."
    npm install
fi

echo ""
echo "🔨 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro no build! Corrija os erros antes de continuar."
    exit 1
fi

echo ""
echo "🌐 Iniciando Next.js com PM2..."
pm2 start npm --name "tlgrupos-dashboard" -- run start

if [ $? -eq 0 ]; then
    echo "   ✅ Dashboard iniciado com PM2"
else
    echo "   ❌ Erro ao iniciar dashboard"
    exit 1
fi

sleep 2

echo ""
echo "🤖 Iniciando Bot do Telegram com PM2..."
pm2 start npm --name "tlgrupos-bot" -- run start:bot

if [ $? -eq 0 ]; then
    echo "   ✅ Bot iniciado com PM2"
else
    echo "   ❌ Erro ao iniciar bot"
    exit 1
fi

echo ""
echo "💾 Salvando configuração do PM2..."
pm2 save

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Sistema iniciado em PRODUÇÃO com sucesso!"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "📋 Comandos úteis:"
echo "   pm2 status             - Ver status dos processos"
echo "   pm2 logs               - Ver logs em tempo real"
echo "   pm2 logs tlgrupos-dashboard  - Logs do dashboard"
echo "   pm2 logs tlgrupos-bot  - Logs do bot"
echo "   pm2 monit              - Monitoramento interativo"
echo "   ./prod-stop.sh         - Parar tudo"
echo "   ./prod-restart.sh      - Reiniciar tudo"
echo ""
echo "🌐 Dashboard: http://157.180.72.42"
echo ""
