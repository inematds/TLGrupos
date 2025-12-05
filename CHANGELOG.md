# Changelog - TLGrupos

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.1.0] - 2025-12-05

### ✨ Adicionado
- **Nova estrutura de menu consolidada**
  - Menu "Grupos" unificado com 3 abas: Gerenciar, Inclusão e Convites
  - Menu "Pagamentos" unificado com 4 abas: Formas, Validar, Gerenciar e Novo
  - Separador visual no menu lateral para destacar seções consolidadas
  - Highlight verde para itens da seção consolidada

- **Sistema de rastreamento de notificações**
  - Tabela `notification_history` para tracking completo de envios
  - Tracking individual por canal (Email e Telegram)
  - Contador de tentativas e armazenamento de erros
  - Views para análise: `notification_success_rate`, `pending_notifications`, `failed_notifications`
  - Função SQL `check_notification_already_sent()` para evitar duplicatas
  - Dashboard de notificações em `/notificacoes`

- **Componentes modulares para Grupos**
  - `GerenciarGrupos.tsx` - CRUD completo de grupos Telegram
  - `InclusaoGrupos.tsx` - Inclusão de membros nos grupos
  - `ConvitesGrupos.tsx` - Histórico e status de convites

### 🔄 Modificado
- **Sidebar reorganizada**
  - Removidos itens individuais: "Grupos Telegram", "Inclusão no Grupo", "Convites"
  - Removidos itens individuais: "Formas de Pagamento", "Validar Pagamentos", "Gerenciar Pagamentos", "Novo Pagamento"
  - Menu mais limpo e organizado com menos itens visíveis

- **Rotas consolidadas**
  - `/grupos` → Interface com tabs (antes 3 páginas separadas)
  - `/pagamentos-new` → Interface com tabs (antes 4 páginas separadas)

- **Serviço de notificações aprimorado**
  - Verificação de canais ativos antes de enviar
  - Registro de todas as tentativas de envio
  - Prevenção de duplicatas
  - Melhor tratamento de erros

### 📁 Arquivado
- Páginas antigas movidas para backup:
  - `/grupos-old` (anteriormente `/grupos`)
  - `/inclusao-old` (anteriormente `/inclusao`)
  - `/convites-old` (anteriormente `/convites`)

### 🗂️ Estrutura de Arquivos
```
src/
├── app/
│   ├── grupos/              # Nova página consolidada
│   ├── pagamentos-new/      # Nova página consolidada
│   ├── notificacoes/        # Dashboard de notificações
│   ├── grupos-old/          # Backup
│   ├── inclusao-old/        # Backup
│   └── convites-old/        # Backup
└── components/
    ├── grupos/
    │   ├── GerenciarGrupos.tsx
    │   ├── InclusaoGrupos.tsx
    │   └── ConvitesGrupos.tsx
    └── pagamentos/
        ├── FormasPagamento.tsx
        ├── ValidarPagamentos.tsx
        ├── GerenciarPagamentos.tsx
        └── NovoPagamento.tsx
```

### 📊 Scripts SQL
- `scripts/create-notification-tracking-clean.sql` - Sistema completo de tracking de notificações

### 🎯 Melhorias de UX
- Interface mais limpa com menos itens no menu
- Navegação por tabs similar ao padrão de Configurações
- Separação visual clara entre seções principais e consolidadas
- Estados ativos com cores diferentes (azul para principal, verde para consolidado)

---

## [1.0.0] - 2025-11-27

### Lançamento Inicial
- Sistema completo de gerenciamento de membros Telegram
- Controle de vencimentos e auto-remoção
- Integração com Supabase
- Bot Telegram para auto-cadastro
- Sistema de planos e pagamentos
- Dashboard com estatísticas
- Scripts de automação (cron jobs)
