#!/bin/bash

# Script para reiniciar todo o sistema TLGrupos (DESENVOLVIMENTO)
# Uso: ./dev-restart.sh
# Produção: use pm2 restart all

echo "🔄 Reiniciando TLGrupos (DEV)"
echo "═══════════════════════════════════════════════════"
echo ""

# Parar tudo
./dev-stop.sh

sleep 2

# Iniciar tudo
./dev-start.sh
