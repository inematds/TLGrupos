'use client';

import Link from 'next/link';
import {
  BookOpen,
  Zap,
  Shield,
  Users,
  DollarSign,
  Bell,
  Settings,
  CheckCircle,
  ArrowRight,
  Play,
  FileText,
  Bot,
  Mail,
  MessageSquare,
  BarChart3,
  Clock,
  Link as LinkIcon
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="px-8 py-16">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">
              🤖 TLGrupos
            </h1>
            <p className="text-2xl opacity-90 mb-2">
              Sistema Completo de Gerenciamento de Grupos Telegram
            </p>
            <p className="text-lg opacity-75">
              Automatize pagamentos, controle acessos e gerencie membros com facilidade
            </p>

            <div className="flex gap-4 justify-center mt-8">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Ir para Dashboard
              </Link>
              <a
                href="#guia-rapido"
                className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-lg flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Guia Rápido
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-12 max-w-7xl mx-auto">
        {/* Recursos Principais */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ⚡ Recursos Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recurso 1 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-blue-500">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Automação Completa
              </h3>
              <p className="text-gray-600 mb-4">
                Envio automático de links, notificações de vencimento e remoção de membros vencidos.
              </p>
              <Link href="/configuracoes" className="text-blue-600 hover:underline flex items-center gap-1">
                Configurar <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Recurso 2 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-green-500">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Gestão de Pagamentos
              </h3>
              <p className="text-gray-600 mb-4">
                Gerenciamento completo: Validar, Planos e Histórico em abas organizadas.
              </p>
              <Link href="/pagamentos-new" className="text-green-600 hover:underline flex items-center gap-1">
                Gerenciar <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Recurso 3 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-purple-500">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Controle de Membros
              </h3>
              <p className="text-gray-600 mb-4">
                Cadastro em 3 abas: Todos Membros, Novo Membro e Cadastro Público.
              </p>
              <Link href="/membros" className="text-purple-600 hover:underline flex items-center gap-1">
                Gerenciar Membros <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Instalação e Deploy */}
        <section id="instalacao" className="mb-16">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-8 border-2 border-green-500">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Play className="w-8 h-8 text-green-600" />
              🚀 Instalação e Deploy na VPS
            </h2>

            {/* Requisitos */}
            <div className="mb-8 bg-white rounded-lg p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Pré-requisitos</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>VPS com acesso SSH (Ubuntu 20.04+ recomendado)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Node.js 18+ instalado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Git configurado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Conta Supabase (banco de dados)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Bot do Telegram criado (@BotFather)</span>
                </li>
              </ul>
            </div>

            {/* Passos de Instalação */}
            <div className="space-y-6">
              {/* Passo 1 - Clonar */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                  <h3 className="text-xl font-bold text-gray-900">Clonar o Repositório</h3>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                  <code>{`# Conectar na VPS
ssh seu-usuario@seu-ip

# Criar diretório e clonar o projeto
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/inematds/TLGrupos.git
cd TLGrupos`}</code>
                </pre>
              </div>

              {/* Passo 2 - Configurar .env.local */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                  <h3 className="text-xl font-bold text-gray-900">Configurar Variáveis de Ambiente</h3>
                </div>
                <p className="text-gray-600 mb-3">Crie o arquivo <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> com:</p>
                <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Telegram
TELEGRAM_BOT_TOKEN=seu-token-do-bot
TELEGRAM_GROUP_ID=-1002242190548,-1002466217981

# Email (Resend)
RESEND_API_KEY=sua-chave-resend

# URLs
NEXT_PUBLIC_APP_URL=http://seu-ip-vps`}</code>
                </pre>
              </div>

              {/* Passo 3 - Instalar PM2 */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                  <h3 className="text-xl font-bold text-gray-900">Instalar PM2 (Gerenciador de Processos)</h3>
                </div>
                <pre className="bg-gray-900 text-purple-400 p-4 rounded-lg overflow-x-auto">
                  <code>{`npm install -g pm2`}</code>
                </pre>
                <p className="text-sm text-gray-600 mt-3">
                  <strong>PM2</strong> mantém o sistema rodando 24/7 e reinicia automaticamente em caso de erros.
                </p>
              </div>

              {/* Passo 4 - Startar o Sistema */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
                  <h3 className="text-xl font-bold text-gray-900">Startar o Sistema em Produção</h3>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                  <code>{`# Dar permissão de execução
chmod +x prod-start.sh

# Iniciar tudo (Dashboard + Bot)
./prod-start.sh`}</code>
                </pre>
                <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <p className="text-sm text-green-800">
                    ✅ <strong>O script irá:</strong> Instalar dependências → Fazer build → Iniciar com PM2 → Salvar configuração
                  </p>
                </div>
              </div>

              {/* Passo 5 - Verificar Status */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
                  <h3 className="text-xl font-bold text-gray-900">Verificar se está Rodando</h3>
                </div>
                <pre className="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-x-auto">
                  <code>{`# Ver processos ativos
pm2 status

# Ver logs em tempo real
pm2 logs

# Acessar no navegador
http://seu-ip-vps`}</code>
                </pre>
              </div>

              {/* Passo 6 - Auto-Start */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</span>
                  <h3 className="text-xl font-bold text-gray-900">Configurar Auto-Start no Boot</h3>
                </div>
                <pre className="bg-gray-900 text-orange-400 p-4 rounded-lg overflow-x-auto">
                  <code>{`pm2 startup
pm2 save`}</code>
                </pre>
                <p className="text-sm text-gray-600 mt-3">
                  Isso garante que o sistema reinicie automaticamente se a VPS reiniciar.
                </p>
              </div>
            </div>

            {/* Comandos Úteis */}
            <div className="mt-8 bg-gray-900 text-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                🛠️ Comandos Úteis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-2">Gerenciamento:</p>
                  <code className="block bg-gray-800 p-2 rounded mb-1">./prod-restart.sh</code>
                  <code className="block bg-gray-800 p-2 rounded mb-1">./prod-stop.sh</code>
                  <code className="block bg-gray-800 p-2 rounded">./prod-status.sh</code>
                </div>
                <div>
                  <p className="text-gray-400 mb-2">PM2:</p>
                  <code className="block bg-gray-800 p-2 rounded mb-1">pm2 logs</code>
                  <code className="block bg-gray-800 p-2 rounded mb-1">pm2 monit</code>
                  <code className="block bg-gray-800 p-2 rounded">pm2 restart all</code>
                </div>
              </div>
            </div>

            {/* Atualizar Sistema */}
            <div className="mt-8 bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔄 Como Atualizar o Sistema</h3>
              <p className="text-gray-700 mb-3">Sempre que houver atualizações no GitHub:</p>
              <pre className="bg-gray-900 text-cyan-400 p-4 rounded-lg overflow-x-auto">
                <code>{`cd /var/www/TLGrupos
git pull origin main
npm install
./prod-restart.sh`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Guia Rápido */}
        <section id="guia-rapido" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Guia Rápido de Uso
            </h2>

            {/* Passo 1 */}
            <div className="mb-8 border-l-4 border-blue-500 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  1
                </span>
                Cadastrar um Novo Membro
              </h3>
              <p className="text-gray-600 mb-3">
                Cadastre membros manualmente ou deixe que se auto-cadastrem via Telegram:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><strong>Manual:</strong> Menu <Link href="/membros" className="text-blue-600 hover:underline">Membros → Novo Membro</Link></li>
                <li><strong>Automático:</strong> Membros usam <code className="bg-gray-100 px-2 py-1 rounded">/registrar</code> no bot</li>
                <li><strong>Formulário:</strong> Compartilhe o <Link href="/cadastro" className="text-blue-600 hover:underline">link público</Link> (disponível em Membros → Cadastro Público)</li>
              </ul>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm text-blue-800">
                  💡 <strong>Dica:</strong> Configure auto-cadastro em <Link href="/configuracoes" className="text-blue-600 hover:underline">Configurações → Bot</Link>
                </p>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="mb-8 border-l-4 border-green-500 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  2
                </span>
                Configurar Planos e Pagamentos
              </h3>
              <p className="text-gray-600 mb-3">
                Crie planos de acesso e configure formas de pagamento:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><Link href="/pagamentos-new" className="text-green-600 hover:underline">Pagamentos → Planos</Link> - Configure valores e duração (30, 60, 90 dias)</li>
                <li><Link href="/configuracoes" className="text-green-600 hover:underline">Chave PIX Global</Link> - Configure em Configurações → Pagamento</li>
                <li>Formas de pagamento integradas no sistema de validação</li>
              </ul>
            </div>

            {/* Passo 3 */}
            <div className="mb-8 border-l-4 border-purple-500 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  3
                </span>
                Aprovar Pagamentos e Enviar Acessos
              </h3>
              <p className="text-gray-600 mb-3">
                Quando um membro efetuar o pagamento:
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-4">
                <li>Vá em <Link href="/pagamentos-new" className="text-purple-600 hover:underline">Pagamentos → Validar</Link></li>
                <li>Visualize o comprovante PIX enviado</li>
                <li>Clique em <strong className="text-green-600">✅ Aprovar</strong></li>
                <li><strong className="text-blue-600">Automático:</strong> Sistema gera link e envia por Email + Telegram!</li>
              </ol>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                <p className="text-sm text-purple-800">
                  🎉 <strong>Importante:</strong> Tudo é automático! O membro recebe o link de acesso instantaneamente.
                </p>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="mb-8 border-l-4 border-yellow-500 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  4
                </span>
                Configurar Notificações Automáticas
              </h3>
              <p className="text-gray-600 mb-3">
                Configure avisos de vencimento em <Link href="/configuracoes" className="text-yellow-600 hover:underline">Configurações → Notificações</Link>:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><strong>3 avisos configuráveis</strong> - Ex: 5, 7 e 30 dias antes</li>
                <li><strong>Canais:</strong> Telegram e/ou Email</li>
                <li><strong>Mensagem customizável</strong> com variáveis <code className="bg-gray-100 px-2 py-1 rounded">{'{nome}'}</code> e <code className="bg-gray-100 px-2 py-1 rounded">{'{dias}'}</code></li>
                <li><strong>Remoção automática</strong> de membros vencidos</li>
              </ul>
            </div>

            {/* Passo 5 */}
            <div className="border-l-4 border-orange-500 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  5
                </span>
                Monitorar no Dashboard
              </h3>
              <p className="text-gray-600 mb-3">
                Acompanhe tudo em tempo real no <Link href="/dashboard" className="text-orange-600 hover:underline">Dashboard</Link>:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>📊 Estatísticas de membros (ativos, vencidos, vencendo)</li>
                <li>💰 Receita total e do mês</li>
                <li>⚠️ Alertas de membros que precisam de atenção</li>
                <li>📈 Métricas de pagamentos pendentes e aprovados</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Menus Principais */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🗂️ Navegação do Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Dashboard', icon: BarChart3, href: '/dashboard', color: 'blue', desc: 'Estatísticas em tempo real' },
              { title: 'Notificações', icon: Bell, href: '/notificacoes', color: 'yellow', desc: 'Monitor de alertas' },
              { title: 'Membros', icon: Users, href: '/membros', color: 'purple', desc: '3 abas organizadas' },
              { title: 'Pagamentos', icon: DollarSign, href: '/pagamentos-new', color: 'green', desc: 'Validar, Planos e Histórico' },
              { title: 'Grupos', icon: MessageSquare, href: '/grupos', color: 'cyan', desc: 'Grupos e convites' },
              { title: 'Bot', icon: Bot, href: '/bot', color: 'indigo', desc: 'Auto-cadastro Telegram' },
              { title: 'Configurações', icon: Settings, href: '/configuracoes', color: 'gray', desc: 'Sistema e notificações' },
              { title: 'Status', icon: Clock, href: '/status', color: 'orange', desc: 'Diagnóstico do sistema' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`bg-white rounded-lg shadow p-6 hover:shadow-xl transition-all border-t-4 border-${item.color}-500 group`}
                >
                  <Icon className={`w-10 h-10 text-${item.color}-600 mb-3 group-hover:scale-110 transition-transform`} />
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                  <div className={`mt-3 text-${item.color}-600 flex items-center gap-1 text-sm font-medium`}>
                    Acessar <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FAQ / Dicas */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            💡 Dicas e Perguntas Frequentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dica 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Como configurar o envio de emails?
              </h3>
              <p className="text-gray-700 text-sm">
                Vá em <strong>Configurações → Email</strong> e escolha um provedor (Gmail, Resend ou SendGrid). Para Gmail, você precisa gerar uma <strong>Senha de App</strong> (não use a senha normal!).
              </p>
            </div>

            {/* Dica 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-500">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-600" />
                Como ativar o bot do Telegram?
              </h3>
              <p className="text-gray-700 text-sm">
                Configure em <strong>Configurações → Bot</strong>. Você pode ativar 3 modos: auto-cadastro ao entrar, ao enviar mensagem, ou via comando <code className="bg-white px-1 rounded">/registrar</code>.
              </p>
            </div>

            {/* Dica 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-500">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Como funciona a remoção automática?
              </h3>
              <p className="text-gray-700 text-sm">
                Configure em <strong>Configurações → Bot</strong>. Escolha o horário (ex: 03:00) e o sistema remove automaticamente membros vencidos dos grupos diariamente.
              </p>
            </div>

            {/* Dica 4 */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-l-4 border-yellow-500">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                Como enviar avisos de vencimento?
              </h3>
              <p className="text-gray-700 text-sm">
                Em <strong>Configurações → Notificações</strong>, ative até 3 avisos (ex: 5, 7, 30 dias antes). Personalize a mensagem e escolha os canais (Telegram/Email).
              </p>
            </div>
          </div>
        </section>

        {/* Processos Automáticos */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ⚙️ Processos Automáticos (Cron Jobs)
          </h2>
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-lg p-8 border-2 border-cyan-500">
            <p className="text-gray-700 mb-6">
              O sistema executa processos periódicos automaticamente. Configure-os usando serviços como <strong>cron-job.org</strong> ou <strong>EasyCron</strong> (gratuitos).
            </p>

            <div className="space-y-4">
              {/* Processo 1 - Validação de Links */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                    <LinkIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Validação de Links de Convite
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Verifica pagamentos aprovados que não receberam link de convite e tenta gerar novamente, enviando notificações por email e Telegram.
                    </p>
                    <div className="bg-blue-50 rounded p-3 text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-700">Frequência:</span>
                        <code className="bg-white px-2 py-1 rounded text-blue-600">A cada 15 minutos</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-700">Endpoint:</span>
                        <code className="bg-white px-2 py-1 rounded text-xs">POST /api/cron/process-approved-payments</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processo 2 - Notificações de Vencimento */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 rounded-full p-3 flex-shrink-0">
                    <Bell className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Notificações de Vencimento
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Envia avisos para membros que estão próximos do vencimento (configurável em 3 períodos: ex. 5, 7 e 30 dias).
                    </p>
                    <div className="bg-yellow-50 rounded p-3 text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-gray-700">Frequência:</span>
                        <code className="bg-white px-2 py-1 rounded text-yellow-600">1x por dia (ex: 08:00)</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-gray-700">Endpoint:</span>
                        <code className="bg-white px-2 py-1 rounded text-xs">POST /api/cron/send-notifications</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processo 3 - Remoção de Expirados */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-red-500">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 rounded-full p-3 flex-shrink-0">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Remoção de Membros Expirados
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Remove automaticamente membros com acesso vencido dos grupos do Telegram (horário configurável).
                    </p>
                    <div className="bg-red-50 rounded p-3 text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-gray-700">Frequência:</span>
                        <code className="bg-white px-2 py-1 rounded text-red-600">1x por dia (ex: 03:00)</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-gray-700">Endpoint:</span>
                        <code className="bg-white px-2 py-1 rounded text-xs">POST /api/cron/remove-expired</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processo 4 - Verificação de Expirações */}
              <div className="bg-white rounded-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Verificação de Expirações
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Atualiza status de membros que venceram, marcando-os como "expirado" no banco de dados.
                    </p>
                    <div className="bg-purple-50 rounded p-3 text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-700">Frequência:</span>
                        <code className="bg-white px-2 py-1 rounded text-purple-600">A cada 1 hora</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-700">Endpoint:</span>
                        <code className="bg-white px-2 py-1 rounded text-xs">POST /api/cron/check-expirations</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Como Configurar */}
            <div className="mt-8 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Como Configurar os Cron Jobs
              </h3>
              <p className="text-sm mb-4 opacity-90">
                Use serviços gratuitos como <strong>cron-job.org</strong> ou <strong>EasyCron</strong>:
              </p>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-white text-cyan-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <span>Crie uma conta em <strong>cron-job.org</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-white text-cyan-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <span>Adicione cada endpoint acima como um novo cron job</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-white text-cyan-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <span>Configure a frequência recomendada para cada um</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-white text-cyan-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <span>Use método <strong>POST</strong> e adicione o header <code className="bg-cyan-700 px-2 py-0.5 rounded">Authorization: Bearer SEU_CRON_SECRET</code></span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Documentação */}
        <section>
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-2xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              📚 Documentação Completa
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Quer saber mais detalhes sobre o sistema de notificações, cron jobs e configurações avançadas?
            </p>
            <a
              href="/docs/SISTEMA_NOTIFICACOES.md"
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Ver Documentação Técnica
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="px-8 max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} TLGrupos - Sistema de Gerenciamento de Grupos Telegram
          </p>
          <p className="text-sm text-gray-500 mt-2">
            v1.2.1 - Desenvolvido com Next.js, TypeScript e Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
