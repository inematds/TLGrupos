#!/bin/bash

# Script para reiniciar todo o sistema TLGrupos
# Uso: ./restart-all.sh

echo "🔄 Reiniciando TLGrupos"
echo "═══════════════════════════════════════════════════"
echo ""

# Parar tudo
./stop-all.sh

sleep 2

# Iniciar tudo
./start-all.sh
