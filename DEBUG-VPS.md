# 🔍 Debug VPS - Stats mostrando 40 em vez de 122

## Execute estes comandos NA VPS e me envie os resultados:

### 1. Verificar commit atual
```bash
cd /var/www/TLGrupos
git log --oneline -1
```
**Resultado esperado:** `2256f4f test: Update dashboard header to test deployment`

---

### 2. Verificar se o arquivo foi atualizado
```bash
grep "getStats.*Usando view" /var/www/TLGrupos/src/services/member-service.ts
```
**Resultado esperado:** Deve aparecer a linha com o log

---

### 3. Verificar título do dashboard (para confirmar deploy)
```bash
grep "Dashboard v1.1.0" /var/www/TLGrupos/src/app/dashboard/page.tsx
```
**Resultado esperado:** Deve aparecer a linha com "Dashboard v1.1.0"

---

### 4. Verificar se o build está atualizado
```bash
ls -lah /var/www/TLGrupos/.next/
```
**Resultado esperado:** Data/hora recente do build

---

### 5. Verificar processos PM2
```bash
pm2 status
```
**Resultado esperado:** Status "online" para ambos

---

### 6. Forçar rebuild
```bash
cd /var/www/TLGrupos
rm -rf .next
npm run build
./prod-restart.sh
```

---

### 7. Fazer requisição e ver logs
```bash
# Em um terminal, deixe os logs rodando:
pm2 logs tlgrupos-dashboard

# Em outro terminal, faça uma requisição:
curl http://localhost:3000/api/stats

# Volte para o primeiro terminal e veja o log [getStats]
```

---

### 8. Verificar se a view existe no Supabase

Acesse o Supabase e execute:
```sql
SELECT * FROM stats;
```

**Resultado esperado:**
- `total_cadastros: 122`
- Se aparecer `40`, a view está desatualizada
- Se aparecer `122`, o problema é no código da VPS

---

### 9. Verificar variáveis de ambiente
```bash
grep SUPABASE_URL /var/www/TLGrupos/.env.local
```

**Resultado esperado:** `https://xdvetjrrrifddoowuqhz.supabase.co`

---

## 🎯 Me envie os resultados de cada comando!

Especialmente importante:
- Comando 1 (commit)
- Comando 7 (logs do getStats)
- Comando 8 (query no Supabase)
