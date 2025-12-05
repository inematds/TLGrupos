#!/bin/bash

# Script para iniciar todo o sistema TLGrupos (DESENVOLVIMENTO)
# Uso: ./dev-start.sh
# Produção: use pm2 start all

echo "🚀 Iniciando TLGrupos"
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

echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependências..."
    npm install
fi

echo ""
echo "🛑 Parando processos anteriores..."

# Parar processos na porta 3000
PORT_3000=$(lsof -ti:3000)
if [ ! -z "$PORT_3000" ]; then
    echo "   Matando processo na porta 3000 (PID: $PORT_3000)"
    kill -9 $PORT_3000 2>/dev/null
fi

# Parar bot do Telegram
BOT_PIDS=$(ps aux | grep "start-bot\|telegram-webhook" | grep -v grep | awk '{print $2}')
if [ ! -z "$BOT_PIDS" ]; then
    echo "   Matando bot do Telegram (PIDs: $BOT_PIDS)"
    kill -9 $BOT_PIDS 2>/dev/null
fi

# Parar Next.js
NEXT_PIDS=$(ps aux | grep "next\|npm run dev" | grep -v grep | awk '{print $2}')
if [ ! -z "$NEXT_PIDS" ]; then
    echo "   Matando Next.js (PIDs: $NEXT_PIDS)"
    kill -9 $NEXT_PIDS 2>/dev/null
fi

sleep 2

echo ""
echo "🔨 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro no build! Verifique os erros acima."
    echo "   Tentando iniciar em modo dev mesmo assim..."
    echo ""
fi

echo ""
echo "🌐 Iniciando Next.js (Dashboard)..."
nohup npm run dev > logs/nextjs.log 2>&1 &
NEXT_PID=$!
echo "   ✅ Next.js iniciado (PID: $NEXT_PID)"

sleep 3

# Verificar se subiu
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ Dashboard disponível em http://157.180.72.42"
else
    echo "   ⚠️  Dashboard pode não ter iniciado. Verifique logs/nextjs.log"
fi

echo ""
echo "🤖 Iniciando Bot do Telegram..."
nohup npm run start:bot > logs/bot.log 2>&1 &
BOT_PID=$!
echo "   ✅ Bot iniciado (PID: $BOT_PID)"

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "📊 Status:"
echo "   Dashboard: http://157.180.72.42"
echo "   Logs Next.js: tail -f logs/nextjs.log"
echo "   Logs Bot: tail -f logs/bot.log"
echo ""
echo "💡 Comandos úteis:"
echo "   ./status.sh        - Ver status do sistema"
echo "   ./stop-all.sh      - Parar tudo"
echo "   ./restart-all.sh   - Reiniciar tudo"
echo ""
