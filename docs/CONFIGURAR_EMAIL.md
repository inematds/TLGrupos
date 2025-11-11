# Configuração do Serviço de Email

O sistema usa o **Resend** para enviar emails de forma gratuita e confiável.

## Passo 1: Criar conta no Resend

1. Acesse https://resend.com
2. Clique em "Sign Up" (gratuito)
3. Confirme seu email

## Passo 2: Obter API Key

1. Faça login no Resend
2. Vá em **API Keys** no menu lateral
3. Clique em **Create API Key**
4. Dê um nome (ex: "TLGrupos")
5. Copie a API Key gerada

## Passo 3: Configurar domínio (Opcional mas recomendado)

### Opção A: Usar domínio próprio

1. No Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `seudominio.com`)
4. Configure os registros DNS conforme instruções
5. Aguarde verificação (pode levar até 24h)

**Email remetente exemplo:** `convites@seudominio.com`

### Opção B: Usar domínio do Resend (apenas para testes)

O Resend fornece um domínio de teste: `onboarding@resend.dev`

**⚠️ IMPORTANTE:** Este domínio só funciona para emails **de teste** e pode cair em spam.

## Passo 4: Adicionar no .env.local

Abra o arquivo `.env.local` e adicione:

```bash
# Configuração do Resend
RESEND_API_KEY=re_seu_api_key_aqui
EMAIL_FROM=convites@seudominio.com  # ou onboarding@resend.dev para testes
```

## Passo 5: Testar

Execute o servidor:

```bash
npm run dev
```

Teste enviando um convite:

1. Acesse http://localhost:3000/dashboard/inclusao
2. Clique em "Incluir Todos"
3. Verifique se o email foi enviado

## Limites do Plano Gratuito

- **100 emails/dia** no plano gratuito
- **3.000 emails/mês**
- Sem custo
- Sem cartão de crédito necessário

## Como funciona o fluxo híbrido

O sistema tenta enviar convites nesta ordem:

1. **Telegram** (primeiro)
   - Se o usuário já falou com o bot → ✅ Sucesso
   - Se não → ❌ Falha

2. **Email** (fallback)
   - Se Telegram falhou E tem email cadastrado → ✅ Tenta email
   - Se email enviado com sucesso → ✅ Sucesso

3. **Manual** (último recurso)
   - Se ambos falharam → Admin pode copiar link em `/dashboard/convites`
   - Enviar manualmente por WhatsApp, SMS, etc.

## Monitoramento

Acesse `/dashboard/convites` para ver:

- ✅ Convites enviados com sucesso via Telegram
- ✅ Convites enviados com sucesso via Email
- ❌ Falhas (com mensagem de erro)
- Status do convite (Ativo, Usado, Expirado)
- Botão para copiar link e enviar manualmente

## Problemas Comuns

### Email não está sendo enviado

1. Verifique se `RESEND_API_KEY` está configurada corretamente
2. Verifique se `EMAIL_FROM` está correto
3. Se usando domínio próprio, confirme que DNS está configurado
4. Veja os logs do servidor para erros específicos

### Email cai em spam

1. Configure SPF, DKIM e DMARC no seu domínio (Resend fornece instruções)
2. Use um domínio verificado (não use `resend.dev` em produção)
3. Evite palavras suspeitas no assunto/corpo do email

### API Key inválida

Erro comum: `RESEND_API_KEY não configurado`

**Solução:**
1. Abra `.env.local`
2. Verifique se a chave começa com `re_`
3. Não use aspas ao redor da chave
4. Reinicie o servidor após alterar

## Suporte

- Documentação Resend: https://resend.com/docs
- Comunidade Discord: https://resend.com/discord
