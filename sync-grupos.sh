#!/bin/bash

# Script para sincronizar grupos do banco com .env.local
# Uso: ./sync-grupos.sh

echo "🔄 Sincronizando grupos do banco de dados..."
echo ""

# Executar script de sincronização
node scripts/sync-grupos-to-env.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sincronização concluída!"
    echo ""

    # Perguntar se quer reiniciar o bot
    read -p "Deseja reiniciar o bot agora? (s/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        ./restart-bot.sh
    else
        echo "ℹ️  Lembre-se de reiniciar o bot manualmente: ./restart-bot.sh"
    fi
else
    echo ""
    echo "❌ Erro ao sincronizar grupos"
    exit 1
fi
