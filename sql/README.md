# 📁 Migrações SQL - TLGrupos

Este diretório contém todas as migrações SQL necessárias para o sistema funcionar.

## 🚀 Como Executar as Migrações

### Opção 1: Migração Completa (RECOMENDADO)

Execute o arquivo **`EXECUTAR_MIGRACOES_COMPLETA.sql`** no Supabase SQL Editor.

Este arquivo cria:
- ✅ Tabela `formas_pagamento` (formas de pagamento como PIX, boleto, etc)
- ✅ Tabela `payments` (pagamentos dos membros)
- ✅ Função `approve_payment()` (aprovar pagamento e estender acesso automaticamente)
- ✅ Função `reject_payment()` (rejeitar pagamento)
- ✅ Índices para performance
- ✅ 4 formas de pagamento padrão (PIX com diferentes chaves)

**Passos:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **"SQL Editor"** no menu lateral
4. Clique em **"New query"**
5. Copie todo o conteúdo de: `sql/EXECUTAR_MIGRACOES_COMPLETA.sql`
6. Cole no editor
7. Clique em **"Run"** (ou pressione `Ctrl+Enter`)
8. Aguarde a confirmação: "Success. No rows returned"

### Opção 2: Migrações Individuais

Se preferir executar por partes:

1. **`EXECUTAR_MIGRACOES_PAGAMENTOS.sql`** - Somente tabela payments e funções (SEM formas_pagamento)
2. **`EXECUTAR_MIGRACOES_FORMULARIO.sql`** - Tabela de cadastros públicos
3. **`EXECUTAR_MIGRACOES_CORRIGIDO.sql`** - Outras migrações do sistema

## ⚠️ Importante

- **Use a migração completa** se é a primeira vez executando
- As migrações usam `IF NOT EXISTS` - é seguro executar múltiplas vezes
- Após executar, atualize a chave PIX padrão em: `/dashboard/formas-pagamento`

## 📋 Ordem de Execução (se executar manualmente)

1. Primeiro: Criar tabela `formas_pagamento`
2. Depois: Criar tabela `payments` (depende de `formas_pagamento`)
3. Por último: Criar funções `approve_payment()` e `reject_payment()`

## ✅ Verificar se Funcionou

Execute no SQL Editor:

```sql
-- Verificar se as tabelas foram criadas
SELECT * FROM formas_pagamento;
SELECT * FROM payments LIMIT 10;

-- Verificar se as funções foram criadas
SELECT proname FROM pg_proc WHERE proname IN ('approve_payment', 'reject_payment');
```

## 🔧 Personalizar Formas de Pagamento

Após executar a migração, você pode:

1. Ir em `/dashboard/formas-pagamento`
2. Editar as chaves PIX padrão
3. Ativar/desativar formas de pagamento
4. Adicionar novas formas

## 📝 Outros Arquivos SQL

- `fix-stats-view.sql` - Corrige view de estatísticas
- `UPDATE_STATS_VIEW.sql` - Atualiza view de estatísticas

## 🆘 Problemas Comuns

### Erro: "relation formas_pagamento does not exist"
**Solução:** Execute `EXECUTAR_MIGRACOES_COMPLETA.sql`

### Erro: "relation payments does not exist"
**Solução:** Execute `EXECUTAR_MIGRACOES_COMPLETA.sql`

### Erro: "duplicate key value"
**Solução:** Normal se executar múltiplas vezes. As tabelas já existem.

### Erro: "permission denied"
**Solução:** Use a Service Role Key no Supabase (não a anon key)

## 📞 Suporte

Se tiver problemas, verifique:
1. Você está usando o **SQL Editor** do Supabase (não o código)
2. Você copiou **TODO** o conteúdo do arquivo SQL
3. Seu projeto Supabase está ativo e conectado
