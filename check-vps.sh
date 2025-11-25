#!/bin/bash

# Script de verificação da VPS antes do deploy
# Execute este script NA VPS antes de começar o deploy

echo "🔍 Verificando requisitos da VPS..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "📦 Node.js:"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Instalado: $NODE_VERSION${NC}"

    # Verificar se é versão 20+
    MAJOR_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 20 ]; then
        echo -e "${GREEN}   Versão adequada (20+)${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Recomendado atualizar para versão 20+${NC}"
    fi
else
    echo -e "${RED}❌ Node.js não instalado${NC}"
    echo "   Instale com: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi

echo ""

# Verificar npm
echo "📦 npm:"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ Instalado: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm não instalado${NC}"
fi

echo ""

# Verificar PM2
echo "⚙️  PM2:"
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅ Instalado: $PM2_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 não instalado${NC}"
    echo "   Instale com: sudo npm install -g pm2"
fi

echo ""

# Verificar Nginx
echo "🌐 Nginx:"
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    echo -e "${GREEN}✅ Instalado: $NGINX_VERSION${NC}"

    # Verificar status
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}   Serviço rodando${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Serviço parado${NC}"
        echo "   Inicie com: sudo systemctl start nginx"
    fi
else
    echo -e "${YELLOW}⚠️  Nginx não instalado${NC}"
    echo "   Instale com: sudo apt install nginx -y"
fi

echo ""

# Verificar Git
echo "🔧 Git:"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    echo -e "${GREEN}✅ Instalado: $GIT_VERSION${NC}"
else
    echo -e "${RED}❌ Git não instalado${NC}"
    echo "   Instale com: sudo apt install git -y"
fi

echo ""

# Verificar espaço em disco
echo "💾 Espaço em disco:"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')

if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ Espaço disponível: $DISK_AVAIL${NC}"
    echo "   Uso: ${DISK_USAGE}%"
else
    echo -e "${YELLOW}⚠️  Pouco espaço disponível: $DISK_AVAIL${NC}"
    echo "   Uso: ${DISK_USAGE}%"
fi

echo ""

# Verificar memória
echo "🧠 Memória RAM:"
TOTAL_MEM=$(free -h | awk 'NR==2 {print $2}')
USED_MEM=$(free -h | awk 'NR==2 {print $3}')
FREE_MEM=$(free -h | awk 'NR==2 {print $4}')

echo -e "${GREEN}   Total: $TOTAL_MEM${NC}"
echo "   Usado: $USED_MEM"
echo "   Livre: $FREE_MEM"

echo ""

# Verificar portas
echo "🔌 Portas:"

# Porta 80 (HTTP)
if sudo lsof -i :80 &> /dev/null; then
    echo -e "${GREEN}✅ Porta 80 (HTTP) em uso (Nginx)${NC}"
else
    echo -e "${YELLOW}⚠️  Porta 80 livre${NC}"
fi

# Porta 443 (HTTPS)
if sudo lsof -i :443 &> /dev/null; then
    echo -e "${GREEN}✅ Porta 443 (HTTPS) em uso${NC}"
else
    echo -e "${YELLOW}⚠️  Porta 443 livre${NC}"
fi

# Porta 3000 (Next.js)
if sudo lsof -i :3000 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Porta 3000 JÁ EM USO!${NC}"
    echo "   Algo já está usando a porta 3000"
    echo "   Execute: sudo lsof -i :3000 para ver o que é"
else
    echo -e "${GREEN}✅ Porta 3000 livre${NC}"
fi

echo ""

# Verificar firewall
echo "🔥 Firewall (UFW):"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | head -1 | awk '{print $2}')
    if [ "$UFW_STATUS" == "active" ]; then
        echo -e "${GREEN}✅ UFW ativo${NC}"

        # Verificar regras SSH
        if sudo ufw status | grep -q "22/tcp"; then
            echo -e "${GREEN}   SSH permitido${NC}"
        else
            echo -e "${RED}   ⚠️  SSH NÃO permitido! Configure antes de ativar UFW${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  UFW inativo${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  UFW não instalado${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Resumo
echo "📋 RESUMO:"
echo ""

READY=true

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Instale Node.js${NC}"
    READY=false
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Instale npm${NC}"
    READY=false
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Instale PM2 (recomendado)${NC}"
fi

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Instale Nginx (recomendado)${NC}"
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Instale Git${NC}"
    READY=false
fi

echo ""

if [ "$READY" = true ]; then
    echo -e "${GREEN}✅ Sistema pronto para deploy!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Clone o repositório"
    echo "2. Configure .env.local"
    echo "3. Execute npm install"
    echo "4. Execute npm run build"
    echo "5. Inicie com PM2"
else
    echo -e "${YELLOW}⚠️  Instale os requisitos faltantes antes de continuar${NC}"
fi

echo ""
