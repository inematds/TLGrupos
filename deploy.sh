#!/bin/bash

# Script de Deploy/Atualização do TLGrupos
# Uso: ./deploy.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do TLGrupos..."
echo ""

# 1. Puxar últimas mudanças
echo "📥 Puxando últimas mudanças do GitHub..."
git pull origin main

# 2. Instalar/atualizar dependências
echo "📦 Instalando dependências..."
npm install

# 3. Build do projeto Next.js
echo "🔨 Fazendo build do Next.js..."
npm run build

# 4. Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado!"
    echo "   Instale com: npm install -g pm2"
    exit 1
fi

# 5. Reiniciar serviços com PM2
echo "🔄 Reiniciando serviços..."

# Verificar se já existe processo rodando
if pm2 list | grep -q "tlgrupos-web"; then
    echo "   Reiniciando dashboard web..."
    pm2 restart tlgrupos-web
else
    echo "   Iniciando dashboard web..."
    pm2 start npm --name "tlgrupos-web" -- start
fi

if pm2 list | grep -q "tlgrupos-bot"; then
    echo "   Reiniciando bot do Telegram..."
    pm2 restart tlgrupos-bot
else
    echo "   Iniciando bot do Telegram..."
    pm2 start npm --name "tlgrupos-bot" -- run start:bot
fi

# 6. Salvar configuração PM2
pm2 save

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📊 Status dos serviços:"
pm2 status

echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs web:  pm2 logs tlgrupos-web"
echo "   Ver logs bot:  pm2 logs tlgrupos-bot"
echo "   Parar tudo:    pm2 stop all"
echo "   Status:        pm2 status"
echo ""
