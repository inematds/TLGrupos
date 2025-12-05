# 🤖 Configuração de Cron Jobs na VPS

Este guia mostra como configurar os processos automáticos diretamente na VPS, sem depender de serviços externos.

---

## 📋 Pré-requisitos

1. Acesso SSH à VPS
2. PM2 rodando o TLGrupos
3. Variável `CRON_SECRET` no `.env.local`

---

## 🔧 Instalação

### 1️⃣ Verificar/Criar CRON_SECRET

```bash
# Conectar na VPS
ssh root@157.180.72.42

# Ir para o diretório do projeto
cd /var/www/TLGrupos

# Verificar se existe CRON_SECRET
grep CRON_SECRET .env.local

# Se NÃO existir, adicionar:
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env.local

# Ver o valor gerado
grep CRON_SECRET .env.local
```

---

### 2️⃣ Dar Permissão ao Script

```bash
chmod +x cron-process-payments.sh
```

---

### 3️⃣ Testar Manualmente

```bash
# Executar o script
./cron-process-payments.sh

# Resultado esperado:
# [DATA] Iniciando processamento de pagamentos sem link...
# [DATA] ✅ Sucesso - Status: 200
# "total":0
# "processados":0
```

---

### 4️⃣ Configurar no Crontab

```bash
# Editar crontab
crontab -e

# Adicionar no final:
*/15 * * * * /var/www/TLGrupos/cron-process-payments.sh >> /var/log/tlgrupos-cron.log 2>&1
```

**Salvar e sair**: `Ctrl+X` → `Y` → `Enter`

---

### 5️⃣ Verificar se Funcionou

```bash
# Ver tarefas agendadas
crontab -l

# Ver logs em tempo real
tail -f /var/log/tlgrupos-cron.log

# Ver últimas execuções
tail -n 50 /var/log/tlgrupos-cron.log
```

---

## ⏰ Frequências Disponíveis

Altere `*/15 * * * *` conforme necessário:

| Frequência | Cron Expression | Descrição |
|------------|----------------|-----------|
| A cada 5 min | `*/5 * * * *` | Mais rápido |
| A cada 15 min | `*/15 * * * *` | **Recomendado** |
| A cada 30 min | `*/30 * * * *` | Econômico |
| A cada 1 hora | `0 * * * *` | Processamento leve |
| Às 03:00 diariamente | `0 3 * * *` | Uma vez por dia |

---

## 🔍 Monitoramento

### Ver Logs Filtrados

```bash
# Apenas sucessos
grep "✅" /var/log/tlgrupos-cron.log

# Apenas erros
grep "❌" /var/log/tlgrupos-cron.log

# Últimas 20 execuções
tail -n 100 /var/log/tlgrupos-cron.log | grep "Iniciando"

# Contar execuções de hoje
grep "$(date +%Y-%m-%d)" /var/log/tlgrupos-cron.log | wc -l
```

### Limpar Logs Antigos

```bash
# Manter apenas últimos 1000 linhas
tail -n 1000 /var/log/tlgrupos-cron.log > /tmp/cron-temp.log
mv /tmp/cron-temp.log /var/log/tlgrupos-cron.log
```

---

## 🔄 Outros Cron Jobs Úteis

### Verificar Expirações (a cada 1 hora)

```bash
0 * * * * curl -X POST http://localhost:3000/api/cron/check-expirations -H "Authorization: Bearer $CRON_SECRET" >> /var/log/tlgrupos-check-expirations.log 2>&1
```

### Enviar Notificações de Vencimento (diariamente às 08:00)

```bash
0 8 * * * curl -X POST http://localhost:3000/api/cron/send-notifications -H "Authorization: Bearer $CRON_SECRET" >> /var/log/tlgrupos-notifications.log 2>&1
```

### Remover Membros Expirados (diariamente às 03:00)

```bash
0 3 * * * curl -X POST http://localhost:3000/api/cron/remove-expired -H "Authorization: Bearer $CRON_SECRET" >> /var/log/tlgrupos-remove-expired.log 2>&1
```

---

## 🛑 Desativar Temporariamente

```bash
# Comentar linha no crontab (adiciona # na frente)
crontab -e

# De:
*/15 * * * * /var/www/TLGrupos/cron-process-payments.sh >> /var/log/tlgrupos-cron.log 2>&1

# Para:
# */15 * * * * /var/www/TLGrupos/cron-process-payments.sh >> /var/log/tlgrupos-cron.log 2>&1
```

---

## ❌ Remover Completamente

```bash
# Editar crontab
crontab -e

# Deletar a linha do cron job

# Ou remover tudo:
crontab -r
```

---

## 🐛 Troubleshooting

### Problema: Cron não executa

**Verificar se o serviço cron está rodando:**
```bash
systemctl status cron
# ou
systemctl status crond
```

**Reiniciar serviço:**
```bash
systemctl restart cron
```

### Problema: Erro "CRON_SECRET não configurado"

**Verificar arquivo:**
```bash
cat /var/www/TLGrupos/.env.local | grep CRON_SECRET
```

**Se não existir, adicionar:**
```bash
echo "CRON_SECRET=$(openssl rand -hex 32)" >> /var/www/TLGrupos/.env.local
```

### Problema: Permissão negada

**Dar permissão de execução:**
```bash
chmod +x /var/www/TLGrupos/cron-process-payments.sh
```

### Problema: Logs não aparecem

**Criar diretório de logs:**
```bash
touch /var/log/tlgrupos-cron.log
chmod 666 /var/log/tlgrupos-cron.log
```

---

## 📊 Exemplo de Configuração Completa

```bash
# /etc/crontab ou crontab -e

# Processar pagamentos sem link (a cada 15min)
*/15 * * * * /var/www/TLGrupos/cron-process-payments.sh >> /var/log/tlgrupos-cron.log 2>&1

# Verificar expirações (a cada 1h)
0 * * * * curl -X POST http://localhost:3000/api/cron/check-expirations -H "Authorization: Bearer $(grep CRON_SECRET /var/www/TLGrupos/.env.local | cut -d'=' -f2)" >> /var/log/tlgrupos-check-expirations.log 2>&1

# Enviar notificações (diariamente às 08:00)
0 8 * * * curl -X POST http://localhost:3000/api/cron/send-notifications -H "Authorization: Bearer $(grep CRON_SECRET /var/www/TLGrupos/.env.local | cut -d'=' -f2)" >> /var/log/tlgrupos-notifications.log 2>&1

# Remover expirados (diariamente às 03:00)
0 3 * * * curl -X POST http://localhost:3000/api/cron/remove-expired -H "Authorization: Bearer $(grep CRON_SECRET /var/www/TLGrupos/.env.local | cut -d'=' -f2)" >> /var/log/tlgrupos-remove-expired.log 2>&1
```

---

## ✅ Checklist Final

- [ ] CRON_SECRET criado no .env.local
- [ ] Script tem permissão de execução (chmod +x)
- [ ] Teste manual funcionou
- [ ] Cron job adicionado no crontab
- [ ] Logs sendo gerados corretamente
- [ ] Indicadores no Dashboard mostrando "0"

---

## 💡 Dicas

1. **Use localhost** em vez de IP/domínio (mais rápido e seguro)
2. **Separe logs** por tipo de cron job
3. **Monitore regularmente** os logs nos primeiros dias
4. **Configure alertas** se quiser ser notificado sobre erros
5. **Limpe logs antigos** mensalmente para economizar espaço

---

## 📞 Suporte

Se precisar de ajuda, verifique:
- Dashboard em `/dashboard` - Card "Aguardando Link"
- Notificações em `/notificacoes` - Card "Links Pendentes"
- Logs do sistema em `/var/log/tlgrupos-cron.log`
