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
                Validação de PIX, aprovação automática, controle de vencimentos e relatórios financeiros.
              </p>
              <Link href="/pagamentos" className="text-green-600 hover:underline flex items-center gap-1">
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
                Cadastro, inclusão em grupos, histórico completo e status em tempo real.
              </p>
              <Link href="/members" className="text-purple-600 hover:underline flex items-center gap-1">
                Ver Membros <ArrowRight className="w-4 h-4" />
              </Link>
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
                <li><strong>Manual:</strong> Menu <Link href="/novo-membro" className="text-blue-600 hover:underline">Novo Membro</Link></li>
                <li><strong>Automático:</strong> Membros usam <code className="bg-gray-100 px-2 py-1 rounded">/registrar</code> no bot</li>
                <li><strong>Formulário:</strong> Compartilhe o <Link href="/cadastro" className="text-blue-600 hover:underline">link público</Link></li>
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
                <li><Link href="/planos" className="text-green-600 hover:underline">Planos de Acesso</Link> - Configure valores e duração (30, 60, 90 dias)</li>
                <li><Link href="/formas-pagamento" className="text-green-600 hover:underline">Formas de Pagamento</Link> - PIX, cartão, boleto, etc.</li>
                <li><Link href="/configuracoes" className="text-green-600 hover:underline">Chave PIX Global</Link> - Configure em Configurações → Pagamento</li>
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
                <li>Vá em <Link href="/validar-pagamentos" className="text-purple-600 hover:underline">Validar Pagamentos</Link></li>
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
              { title: 'Membros', icon: Users, href: '/members', color: 'purple', desc: 'Gerenciar cadastros' },
              { title: 'Pagamentos', icon: DollarSign, href: '/pagamentos', color: 'green', desc: 'CRUD completo' },
              { title: 'Validar Pagamentos', icon: CheckCircle, href: '/validar-pagamentos', color: 'emerald', desc: 'Aprovar comprovantes' },
              { title: 'Planos', icon: FileText, href: '/planos', color: 'indigo', desc: 'Criar planos de acesso' },
              { title: 'Grupos Telegram', icon: MessageSquare, href: '/grupos', color: 'cyan', desc: 'Gerenciar grupos' },
              { title: 'Inclusão', icon: LinkIcon, href: '/inclusao', color: 'teal', desc: 'Enviar convites' },
              { title: 'Configurações', icon: Settings, href: '/configuracoes', color: 'gray', desc: 'Sistema e notificações' },
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
            v1.0.0 - Desenvolvido com Next.js, TypeScript e Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
