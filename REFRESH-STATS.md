# 🔄 Como Atualizar a View de Estatísticas

## ❗ Problema

O dashboard mostra **40 membros** mas existem **122 membros** no banco de dados.

Isso acontece porque a **view `stats`** do Supabase está desatualizada ou com cache.

---

## ✅ Solução Rápida

### Passo 1: Acessar o Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione o projeto: **xdvetjrrrifddoowuqhz**

### Passo 2: Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query** (ou "Nova consulta")

### Passo 3: Executar Script

Copie e cole o conteúdo do arquivo `scripts/refresh-stats-view.sql`:

```sql
-- 1. Deletar a view antiga
DROP VIEW IF EXISTS stats CASCADE;

-- 2. Recriar a view com a estrutura correta
CREATE OR REPLACE VIEW stats AS
SELECT
  COUNT(*) AS total_cadastros,
  COUNT(*) FILTER (WHERE status = 'ativo') AS total_ativos,
  COUNT(*) FILTER (WHERE status = 'vencido') AS total_vencidos,
  COUNT(*) FILTER (WHERE status = 'removido') AS total_removidos,
  COUNT(*) FILTER (WHERE status = 'erro_remocao') AS erro_remocao,
  COUNT(*) FILTER (WHERE status = 'pausado') AS total_pausados,
  COUNT(*) FILTER (WHERE status = 'ativo' AND no_grupo = true) AS ativos_no_grupo,
  COUNT(*) FILTER (WHERE status = 'ativo' AND no_grupo = false) AS ativos_sem_grupo,
  COUNT(*) FILTER (WHERE status = 'ativo' AND telegram_user_id IS NULL) AS ativos_sem_telegram,
  COUNT(*) FILTER (WHERE status = 'ativo' AND telegram_user_id IS NULL) AS sem_telegram_user_id,
  COUNT(*) FILTER (
    WHERE status = 'ativo'
    AND data_vencimento >= NOW()
    AND data_vencimento <= NOW() + INTERVAL '7 days'
  ) AS vencendo_7dias,
  COUNT(*) FILTER (
    WHERE status = 'ativo'
    AND data_vencimento < NOW()
  ) AS ativos_mas_vencidos
FROM members;

-- 3. Dar permissões
GRANT SELECT ON stats TO anon;
GRANT SELECT ON stats TO authenticated;

-- 4. Verificar se funcionou
SELECT * FROM stats;
```

### Passo 4: Executar

1. Clique em **Run** (ou "Executar") no canto inferior direito
2. Aguarde alguns segundos
3. Você verá os resultados com **122** no campo `total_cadastros`

### Passo 5: Verificar no Dashboard

1. Acesse o dashboard: http://157.180.72.42/dashboard
2. Pressione **Ctrl+Shift+R** (ou **Cmd+Shift+R** no Mac) para limpar o cache do navegador
3. Agora deve mostrar **122 membros**

---

## 🔍 Por que isso aconteceu?

A view `stats` do Supabase pode ficar desatualizada quando:
- Há muitas atualizações simultâneas na tabela `members`
- O cache do Supabase não foi invalidado
- A view foi criada com uma estrutura antiga

---

## 📊 Como Verificar Direto no Supabase

No SQL Editor, execute:

```sql
-- Ver total de membros na tabela
SELECT COUNT(*) FROM members;

-- Ver estatísticas na view
SELECT * FROM stats;
```

Se os números forem diferentes, execute o script de refresh novamente.

---

## 🚀 Prevenção Futura

A view é recalculada automaticamente a cada consulta, então esse problema não deveria acontecer. Mas se acontecer novamente:

1. Execute o script `refresh-stats-view.sql`
2. Limpe o cache do navegador
3. Reinicie o sistema na VPS:
   ```bash
   ./prod-restart.sh
   ```

---

## ✅ Resultado Esperado

Após executar o script, você deve ver:

**Local:**
- Total de Cadastros: 122

**Produção (VPS):**
- Total de Cadastros: 122

Ambos devem mostrar o **mesmo número** porque usam o **mesmo banco Supabase**.
