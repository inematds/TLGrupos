# Guia: Atualizar Banco Supabase

## ✅ O que já foi feito:

1. **Credenciais atualizadas** em `.env.local`:
   - URL: `https://xdvetjrrrifddoowuqhz.supabase.co`
   - Anon Key: Atualizada
   - Service Role Key: Atualizada

2. **Arquivo de migrações consolidado** criado: `EXECUTAR_MIGRACOES_CORRIGIDO.sql`
   - Contém TODAS as 17 migrações com ordem corrigida
   - ✅ Corrigido problema de dependências (coluna `no_grupo`)
   - Pronto para executar no Supabase

## 📋 Próximos Passos:

### 1. Executar as Migrações no Supabase

Acesse o SQL Editor do seu projeto Supabase:

🔗 **https://supabase.com/dashboard/project/xdvetjrrrifddoowuqhz/sql/new**

#### Opção A: Arquivo Consolidado CORRIGIDO (RECOMENDADO) ✅

```bash
# 1. Abra o arquivo EXECUTAR_MIGRACOES_CORRIGIDO.sql
# 2. Copie TODO o conteúdo
# 3. Cole no SQL Editor do Supabase
# 4. Clique em "Run" ou pressione Ctrl+Enter
```

**IMPORTANTE:** Use o arquivo `EXECUTAR_MIGRACOES_CORRIGIDO.sql`, NÃO o `EXECUTAR_TODAS_MIGRACOES.sql` (que tinha problema de ordem)

#### Opção B: Migração por Migração

Execute na **ordem correta** (respeitando dependências):
1. `001_initial_schema.sql`
2. `002_make_telegram_user_id_nullable.sql`
3. `003_add_invite_tokens.sql`
4. `004_pagamentos_sistema.sql`
5. `005_sistema_comprovantes.sql`
6. **`010_add_no_grupo_column.sql`** ⚠️ EXECUTAR ANTES das próximas!
7. `006_status_erro_remocao.sql`
8. `007_remove_vencido_status.sql`
9. `008_add_sem_telegram_stats.sql`
10. `009_create_invites_table.sql`
11. `011_create_plans_table.sql`
12. `012_add_plan_id_to_members.sql`
13. `013_add_invite_link_tracking.sql`
14. `014_add_plan_id_to_cadastros_pendentes.sql`
15. `015_create_forma_pagamentos_table.sql`
16. `016_create_telegram_groups_table.sql`
17. `017_add_group_to_members.sql`

### 2. Verificar Tabelas Criadas

Após executar, verifique se estas tabelas foram criadas:

- ✅ `members`
- ✅ `logs`
- ✅ `config`
- ✅ `invite_tokens`
- ✅ `pagamentos`
- ✅ `comprovantes`
- ✅ `cadastros_pendentes`
- ✅ `invites`
- ✅ `plans`
- ✅ `forma_pagamentos`
- ✅ `telegram_groups`

Você pode verificar com esta query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 3. Testar Aplicação

```bash
# Reinicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` e verifique se:
- A conexão com o banco está funcionando
- Não há erros no console
- As páginas carregam normalmente

### 4. Verificar Políticas RLS (Row Level Security)

As migrações já criam as políticas necessárias, mas verifique:

1. Acesse: **Authentication > Policies**
2. Confirme que as políticas estão ativas para cada tabela

### 5. (Opcional) Migrar Dados do Banco Antigo

Se você tinha dados no banco antigo que precisa migrar:

```bash
# Use o Supabase CLI para fazer dump/restore
# Ou exporte/importe manualmente via Dashboard
```

## 🔧 Troubleshooting

### Erro: "relation already exists"

É normal se você já executou parte das migrações. Pode ignorar ou:

```sql
-- Dropar todas as tabelas e recomeçar (CUIDADO: apaga tudo!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Erro de permissão

Certifique-se de estar usando a **Service Role Key**, não a Anon Key.

### Tabelas não aparecem na interface

1. Atualize a página do Dashboard
2. Verifique a aba **Table Editor**
3. Execute a query de verificação acima

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no Supabase Dashboard
2. Confira se as credenciais em `.env.local` estão corretas
3. Teste a conexão com:

```bash
node scripts/test-connection.js
```

---

**Banco Antigo:** `xetowlvhhnxewvglxklo.supabase.co`
**Banco Novo:** `xdvetjrrrifddoowuqhz.supabase.co` ✅

**Status:** Credenciais atualizadas, aguardando execução das migrações
