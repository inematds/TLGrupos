# 🔧 Como Atualizar as Estatísticas do Dashboard

## Problema Identificado

A view de estatísticas está retornando apenas 5 campos quando deveria retornar 10 campos.

### Campos que estão faltando:
- ❌ `total_cadastros` - Total de todos os cadastros no sistema
- ❌ `erro_remocao` - Membros vencidos que não puderam ser removidos
- ❌ `total_pausados` - Membros com status pausado
- ❌ `ativos_no_grupo` - **Membros ativos que ESTÃO no grupo Telegram** (6 atualmente)
- ❌ `ativos_sem_grupo` - **Membros ativos que NÃO entraram no grupo ainda** (3 atualmente)

## 📋 Passo a Passo para Corrigir

### 1. Acesse o Supabase Dashboard

Vá para: https://supabase.com/dashboard

### 2. Entre no seu projeto TLGrupos

Clique no projeto TLGrupos para abrir.

### 3. Abra o SQL Editor

- No menu lateral esquerdo, clique em **"SQL Editor"**
- Ou use este atalho: pressione `/` e digite "sql"

### 4. Crie uma Nova Query

- Clique no botão **"New Query"** (ou pressione `Ctrl+K` e selecione "New Query")

### 5. Cole o SQL

Abra o arquivo `UPDATE_STATS_VIEW.sql` que está na raiz do projeto e cole todo o conteúdo no editor.

Ou copie daqui:

```sql
-- Remover a view antiga
DROP VIEW IF EXISTS stats CASCADE;

-- Criar nova view com TODOS os campos
CREATE OR REPLACE VIEW stats AS
SELECT
  -- Total geral de cadastros
  (SELECT COUNT(*) FROM members)::bigint AS total_cadastros,

  -- Estatísticas por status
  (SELECT COUNT(*) FROM members WHERE status = 'ativo')::bigint AS total_ativos,
  (SELECT COUNT(*) FROM members WHERE status = 'vencido')::bigint AS total_vencidos,
  (SELECT COUNT(*) FROM members WHERE status = 'removido')::bigint AS total_removidos,
  (SELECT COUNT(*) FROM members WHERE status = 'erro_remocao')::bigint AS erro_remocao,
  (SELECT COUNT(*) FROM members WHERE status = 'pausado')::bigint AS total_pausados,

  -- Membros ativos que ESTÃO no grupo (têm telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NOT NULL)::bigint AS ativos_no_grupo,

  -- Membros ativos que NÃO ESTÃO no grupo (sem telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL)::bigint AS ativos_sem_grupo,

  -- Membros que vencem nos próximos 7 dias
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < (CURRENT_DATE + INTERVAL '7 days')
   AND data_vencimento >= CURRENT_DATE)::bigint AS vencendo_7dias,

  -- Membros ativos mas com data vencida (precisa atenção)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < CURRENT_DATE)::bigint AS ativos_mas_vencidos;

-- Verificar se funcionou
SELECT * FROM stats;
```

### 6. Execute o SQL

- Clique no botão **"Run"** (canto superior direito)
- Ou pressione **`Ctrl+Enter`** (Windows/Linux) ou **`Cmd+Enter`** (Mac)

### 7. Verifique o Resultado

Após executar, você deve ver uma tabela com **10 colunas** e **1 linha** de resultado:

| Campo | Valor Esperado |
|-------|----------------|
| total_cadastros | 11 |
| total_ativos | 9 |
| total_vencidos | 1 |
| total_removidos | 1 |
| erro_remocao | 0 |
| total_pausados | 0 |
| ativos_no_grupo | 6 |
| ativos_sem_grupo | 3 |
| vencendo_7dias | 1 |
| ativos_mas_vencidos | 0 |

### 8. Atualize o Dashboard

Volte para o dashboard da aplicação (http://localhost:3000) e clique no botão **"Atualizar"** ou recarregue a página.

Agora você deve ver:

- 📊 **Total de Cadastros: 11**
- ✅ **Ativos: 9** (com breakdown "No grupo: 6 | Fora: 3")
- E todos os outros cards com estatísticas completas!

## ✅ Resultado Final

Após a atualização, o dashboard vai mostrar:

**Linha 1 (Principais métricas):**
- 📊 Total de Cadastros: **11**
- ✅ Ativos: **9** (No grupo: 6 | Fora: 3)
- ⚠️ Vencendo em 7 dias: **1**
- ❌ Vencidos: **1**

**Linha 2 (Status especiais):**
- 🔴 Erro Remoção: **0**
- 🗑️ Removidos: **1**
- ⏸️ Pausados: **0**

## 🆘 Problemas?

Se algo der errado:

1. Verifique se você está logado no projeto correto no Supabase
2. Verifique se tem permissões de admin no projeto
3. Se aparecer erro de sintaxe, copie o SQL novamente do arquivo `UPDATE_STATS_VIEW.sql`
4. Se o erro persistir, me avise que eu ajudo!
