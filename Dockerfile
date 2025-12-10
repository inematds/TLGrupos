# Dockerfile para TLGrupos
# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependências da stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de ambiente necessárias para o build (valores dummy - serão sobrescritos em runtime)
ARG BASE_PATH=/TLGrupos
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
ARG SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
ARG TELEGRAM_BOT_TOKEN=placeholder-telegram-token
ARG TELEGRAM_GROUP_ID=-1234567890
ARG CRON_SECRET=placeholder-cron-secret
ARG NEXTAUTH_SECRET=placeholder-nextauth-secret
ARG RESEND_API_KEY=placeholder-resend-key
ENV BASE_PATH=$BASE_PATH
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
ENV TELEGRAM_GROUP_ID=$TELEGRAM_GROUP_ID
ENV CRON_SECRET=$CRON_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV RESEND_API_KEY=$RESEND_API_KEY

# Build da aplicação
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner (imagem final)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar scripts de automação
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
