# 🔧 Como Corrigir as Estatísticas do Dashboard

## Problema Identificado

✅ **Encontrei os 2 membros!** Eles estão na tabela `members`:
1. **Pintinhos** (Telegram ID: 7852460115)
2. **INEMA** (Telegram ID: 7388953786, @INEMAtds)

Ambos estão ativos e com vencimento em 30 dias (21/12/2025).

❌ **O problema**: A view `stats` do banco de dados não está retornando os dados corretamente para a API. Ela precisa ser recriada no Supabase.

## Solução - Execute este SQL no Supabase

### Passo 1: Acesse o Supabase SQL Editor

1. Abra o Supabase: https://supabase.com/dashboard
2. Selecione seu projeto TLGrupos
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### Passo 2: Execute o Script de Atualização

Copie e cole o conteúdo do arquivo `sql/ATUALIZAR_STATS_VIEW.sql` no editor SQL:

```sql
DROP VIEW IF EXISTS stats CASCADE;

CREATE OR REPLACE VIEW stats AS
SELECT
  -- Total geral
  (SELECT COUNT(*) FROM members) AS total_cadastros,

  -- Por status
  (SELECT COUNT(*) FROM members WHERE status = 'ativo') AS total_ativos,
  (SELECT COUNT(*) FROM members WHERE status = 'vencido') AS total_vencidos,
  (SELECT COUNT(*) FROM members WHERE status = 'removido') AS total_removidos,
  (SELECT COUNT(*) FROM members WHERE status = 'erro_remocao') AS erro_remocao,
  (SELECT COUNT(*) FROM members WHERE status = 'pausado') AS total_pausados,

  -- Ativos que estão no grupo (tem telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NOT NULL) AS ativos_no_grupo,

  -- Ativos que NÃO estão no grupo (sem telegram_user_id)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL) AS ativos_sem_grupo,

  -- Ativos sem telegram_user_id (mesmo campo, nome diferente para compatibilidade)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL) AS ativos_sem_telegram,

  -- Ativos sem telegram_user_id (campo adicional)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo' AND telegram_user_id IS NULL) AS sem_telegram_user_id,

  -- Membros que vencem nos próximos 7 dias
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento <= (CURRENT_TIMESTAMP + INTERVAL '7 days')
   AND data_vencimento >= CURRENT_TIMESTAMP) AS vencendo_7dias,

  -- Membros ativos mas com data de vencimento passada (precisa remover)
  (SELECT COUNT(*) FROM members
   WHERE status = 'ativo'
   AND data_vencimento < CURRENT_TIMESTAMP) AS ativos_mas_vencidos;

-- Verificar a view
SELECT * FROM stats;
```

### Passo 3: Execute e Verifique

1. Clique em **Run** (ou pressione Ctrl+Enter)
2. Você verá o resultado da query `SELECT * FROM stats;` no final
3. Deve mostrar algo como:
   ```
   total_cadastros: 2
   total_ativos: 2
   ativos_no_grupo: 2
   vencendo_7dias: 0
   ```

### Passo 4: Recarregue o Dashboard

1. Volte para o dashboard: http://192.168.1.91:3000/dashboard
2. Pressione **Ctrl+Shift+R** (hard refresh) para limpar o cache
3. As estatísticas devem agora mostrar **2 cadastros** e **2 ativos**!

## O que Foi Alterado

Atualizei a view `stats` para incluir campos adicionais que estavam faltando:
- `ativos_sem_telegram` - Membros ativos sem Telegram ID vinculado
- `sem_telegram_user_id` - Campo adicional para compatibilidade

Também ajustei as queries de data para usar `CURRENT_TIMESTAMP` em vez de `CURRENT_DATE`, garantindo maior precisão nas comparações de vencimento.

## Se Ainda Não Funcionar

Se após executar o SQL as estatísticas ainda mostrarem 0:

1. **Verifique os dados**:
   ```sql
   SELECT COUNT(*) FROM members;
   SELECT COUNT(*) FROM members WHERE status = 'ativo';
   ```
   Deve retornar 2 para ambas as queries.

2. **Verifique permissões**:
   ```sql
   SELECT * FROM members LIMIT 5;
   ```
   Se der erro de permissão, precisamos ajustar as policies do Supabase.

3. **Reinicie o servidor Next.js**:
   ```bash
   # Pare o servidor (Ctrl+C)
   # Inicie novamente
   npm run dev
   ```

4. **Limpe o cache do Supabase**:
   - No Supabase, vá em Settings → Database → Connection Pooling
   - Clique em "Restart Pooler"

## Resultado Esperado

Após executar o SQL, o dashboard deve mostrar:

| Métrica | Valor Esperado |
|---------|----------------|
| Total de Cadastros | **2** |
| Membros Ativos | **2** |
| Ativos no Grupo | **2** |
| Vencendo em 7 dias | **0** |
| Vencidos | **0** |

---

**Última atualização:** 21/11/2025
**Status:** ✅ Solução pronta para execução
