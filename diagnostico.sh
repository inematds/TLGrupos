#!/bin/bash

echo "🔍 Diagnóstico TLGrupos"
echo "═══════════════════════════════════════════════════"
echo ""

# 1. Verificar .env.local
echo "📋 Verificando .env.local..."
if [ -f ".env.local" ]; then
    echo "   ✅ Arquivo existe"

    # Verificar variáveis importantes (sem mostrar valores sensíveis)
    VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "TELEGRAM_BOT_TOKEN"
        "TELEGRAM_GROUP_ID"
        "NEXTAUTH_URL"
    )

    for VAR in "${VARS[@]}"; do
        if grep -q "^${VAR}=" .env.local; then
            echo "   ✅ ${VAR} configurado"
        else
            echo "   ❌ ${VAR} FALTANDO"
        fi
    done
else
    echo "   ❌ Arquivo .env.local NÃO EXISTE"
fi

echo ""

# 2. Verificar Node.js
echo "🟢 Verificando Node.js..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Node.js ${NODE_VERSION}"
else
    echo "   ❌ Node.js não instalado"
fi

echo ""

# 3. Verificar dependências
echo "📦 Verificando node_modules..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules existe"
    PACKAGE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "   📊 ${PACKAGE_COUNT} pacotes instalados"
else
    echo "   ❌ node_modules NÃO EXISTE - Execute: npm install"
fi

echo ""

# 4. Verificar build
echo "🔨 Verificando build..."
if [ -d ".next" ]; then
    echo "   ✅ Diretório .next existe"
    BUILD_TIME=$(stat -c %y .next 2>/dev/null || stat -f "%Sm" .next 2>/dev/null)
    echo "   🕐 Último build: ${BUILD_TIME}"
else
    echo "   ❌ Diretório .next NÃO EXISTE - Execute: npm run build"
fi

echo ""

# 5. Verificar processos
echo "⚙️  Verificando processos..."
NEXT_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$NEXT_PID" ]; then
    echo "   ✅ Processo na porta 3000 (PID: $NEXT_PID)"
    ps -p $NEXT_PID -o pid,cmd --no-headers | sed 's/^/   /'
else
    echo "   ❌ Nenhum processo na porta 3000"
fi

echo ""

# 6. Verificar logs
echo "📝 Últimas linhas dos logs..."
if [ -f "logs/nextjs.log" ]; then
    echo "   --- logs/nextjs.log (últimas 10 linhas) ---"
    tail -10 logs/nextjs.log | sed 's/^/   /'
else
    echo "   ⚠️  logs/nextjs.log não existe"
fi

echo ""

# 7. Testar conexão Supabase
echo "🔌 Testando variáveis de ambiente..."
if [ -f ".env.local" ]; then
    source .env.local 2>/dev/null

    if [ ! -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo "   Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
    else
        echo "   ❌ NEXT_PUBLIC_SUPABASE_URL não definida"
    fi

    if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "   ✅ Service Role Key definida"
    else
        echo "   ❌ SUPABASE_SERVICE_ROLE_KEY não definida"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "💡 Comandos sugeridos:"
echo ""

# Sugerir comandos baseado nos problemas
if [ ! -d "node_modules" ]; then
    echo "   npm install"
fi

if [ ! -d ".next" ]; then
    echo "   npm run build"
fi

if [ -z "$NEXT_PID" ]; then
    echo "   ./start-all.sh"
else
    echo "   tail -f logs/nextjs.log    # Ver logs em tempo real"
fi

echo ""
