#!/bin/bash

# Script para configurar TODOS os cron jobs do TLGrupos de uma vez
# Uso: sudo ./setup-all-crons.sh

echo "🤖 Configurando Cron Jobs do TLGrupos"
echo "═════════════════════════════════════════"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Por favor, execute como root: sudo ./setup-all-crons.sh"
    exit 1
fi

# Diretório do projeto
PROJECT_DIR="/var/www/TLGrupos"

# Verificar se o projeto existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

echo "📁 Diretório do projeto: $PROJECT_DIR"
echo ""

# Verificar/Criar CRON_SECRET
echo "🔐 Verificando CRON_SECRET..."
if ! grep -q "CRON_SECRET" "$PROJECT_DIR/.env.local" 2>/dev/null; then
    echo "   Criando CRON_SECRET..."
    CRON_SECRET=$(openssl rand -hex 32)
    echo "CRON_SECRET=$CRON_SECRET" >> "$PROJECT_DIR/.env.local"
    echo "   ✅ CRON_SECRET criado: $CRON_SECRET"
else
    CRON_SECRET=$(grep CRON_SECRET "$PROJECT_DIR/.env.local" | cut -d'=' -f2)
    echo "   ✅ CRON_SECRET já existe"
fi
echo ""

# Criar diretórios de logs
echo "📋 Criando diretórios de logs..."
mkdir -p /var/log/tlgrupos
touch /var/log/tlgrupos/cron-payments.log
touch /var/log/tlgrupos/cron-expirations.log
touch /var/log/tlgrupos/cron-notifications.log
touch /var/log/tlgrupos/cron-removal.log
chmod 666 /var/log/tlgrupos/*.log
echo "   ✅ Logs criados em /var/log/tlgrupos/"
echo ""

# Dar permissão aos scripts
echo "🔓 Configurando permissões..."
chmod +x "$PROJECT_DIR/cron-process-payments.sh"
echo "   ✅ Permissões configuradas"
echo ""

# Backup do crontab atual
echo "💾 Fazendo backup do crontab..."
crontab -l > /tmp/crontab.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
echo "   ✅ Backup salvo em /tmp/"
echo ""

# Criar novo crontab
echo "⚙️  Configurando cron jobs..."

# Remover cron jobs antigos do TLGrupos (se existirem)
crontab -l 2>/dev/null | grep -v "tlgrupos" | grep -v "TLGrupos" > /tmp/crontab.new || true

# Adicionar novos cron jobs
cat >> /tmp/crontab.new <<EOF

# ═════════════════════════════════════════════════════════════
# TLGrupos - Processos Automáticos
# ═════════════════════════════════════════════════════════════

# 1. Processar Pagamentos sem Link (a cada 15 minutos)
*/15 * * * * $PROJECT_DIR/cron-process-payments.sh >> /var/log/tlgrupos/cron-payments.log 2>&1

# 2. Verificar Expirações (a cada 1 hora)
0 * * * * curl -s -X POST http://localhost:3000/api/cron/check-expirations -H "Authorization: Bearer $CRON_SECRET" >> /var/log/tlgrupos/cron-expirations.log 2>&1

# 3. Enviar Notificações de Vencimento (diariamente às 08:00)
0 8 * * * curl -s -X POST http://localhost:3000/api/cron/send-notifications -H "Authorization: Bearer $CRON_SECRET" >> /var/log/tlgrupos/cron-notifications.log 2>&1

# 4. Remover Membros Expirados (diariamente às 03:00 - madrugada)
0 3 * * * curl -s -X POST http://localhost:3000/api/cron/remove-expired -H "Authorization: Bearer $CRON_SECRET" >> /var/log/tlgrupos/cron-removal.log 2>&1

# Limpar logs antigos (todo domingo às 02:00)
0 2 * * 0 find /var/log/tlgrupos -name "*.log" -exec sh -c 'tail -n 1000 {} > {}.tmp && mv {}.tmp {}' \;

EOF

# Instalar novo crontab
crontab /tmp/crontab.new
rm /tmp/crontab.new

echo "   ✅ Cron jobs configurados!"
echo ""

# Mostrar cron jobs instalados
echo "📋 Cron jobs ativos:"
echo "─────────────────────────────────────────────────────────"
crontab -l | grep -A 20 "TLGrupos"
echo "─────────────────────────────────────────────────────────"
echo ""

# Verificar status do serviço cron
echo "🔍 Verificando serviço cron..."
if systemctl is-active --quiet cron 2>/dev/null; then
    echo "   ✅ Serviço cron está ativo"
elif systemctl is-active --quiet crond 2>/dev/null; then
    echo "   ✅ Serviço crond está ativo"
else
    echo "   ⚠️  Serviço cron não detectado, reiniciando..."
    systemctl restart cron 2>/dev/null || systemctl restart crond 2>/dev/null || true
fi
echo ""

# Resumo
echo "═════════════════════════════════════════════════════════"
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "═════════════════════════════════════════════════════════"
echo ""
echo "📊 Processos Configurados:"
echo ""
echo "  1️⃣  Pagamentos sem Link    → A cada 15 minutos"
echo "  2️⃣  Verificar Expirações   → A cada 1 hora"
echo "  3️⃣  Notificações Vencimento → Diariamente às 08:00"
echo "  4️⃣  Remover Expirados      → Diariamente às 03:00 🌙"
echo ""
echo "📋 Logs salvos em:"
echo "   /var/log/tlgrupos/cron-payments.log"
echo "   /var/log/tlgrupos/cron-expirations.log"
echo "   /var/log/tlgrupos/cron-notifications.log"
echo "   /var/log/tlgrupos/cron-removal.log"
echo ""
echo "🔍 Comandos úteis:"
echo "   Ver todos os logs:     tail -f /var/log/tlgrupos/*.log"
echo "   Ver cron jobs ativos:  crontab -l"
echo "   Editar manualmente:    crontab -e"
echo "   Testar processo:       $PROJECT_DIR/cron-process-payments.sh"
echo ""
echo "💡 Os processos começarão a rodar automaticamente!"
echo ""
