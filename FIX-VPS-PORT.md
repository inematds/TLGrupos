# 🔧 Fix: Porta 3000 em uso na VPS

## ❗ Problema

```
Error: listen EADDRINUSE: address already in use :::3000
```

A porta 3000 está ocupada e o PM2 não consegue iniciar o dashboard.

---

## ✅ Solução Rápida

### Passo 1: Parar TUDO no PM2

```bash
pm2 delete all
pm2 status
```

### Passo 2: Matar qualquer processo na porta 3000

```bash
lsof -ti:3000 | xargs kill -9
```

### Passo 3: Verificar se a porta está livre

```bash
lsof -i:3000
```

Se não retornar nada, a porta está livre! ✅

### Passo 4: Iniciar novamente

```bash
./prod-start.sh
```

### Passo 5: Verificar status

```bash
pm2 status
```

Você deve ver:
```
┌────┬──────────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id │ name                 │ mode    │ status  │ cpu     │ memory   │
├────┼──────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0  │ tlgrupos-dashboard   │ fork    │ online  │ 0%      │ 150 MB   │
│ 1  │ tlgrupos-bot         │ fork    │ online  │ 0%      │ 50 MB    │
└────┴──────────────────────┴─────────┴─────────┴─────────┴──────────┘
```

---

## 🔍 Ver os logs agora

```bash
pm2 logs tlgrupos-dashboard | grep getStats
```

Ou logs completos:
```bash
pm2 logs
```

---

## 🎯 Após iniciar, testar

Acesse no navegador:
```
http://157.180.72.42/dashboard
```

E verifique os logs para ver:
```
[getStats] Usando view stats do Supabase: XX membros
```

---

## ⚠️ Se o problema persistir

Execute todo o processo de uma vez:

```bash
cd /var/www/TLGrupos
pm2 delete all
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2
./prod-start.sh
pm2 logs
```
