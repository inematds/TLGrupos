'use client';

import { useEffect, useState } from 'react';
import { Bot, Check, AlertCircle, RefreshCw, Users, MessageSquare, Settings, Layers, ChevronRight } from 'lucide-react';

interface TelegramGroup {
  id: string;
  nome: string;
  telegram_group_id: string;
  chat_id?: string;
  ativo: boolean;
}

export default function BotPage() {
  const [botInfo, setBotInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [telegramGroups, setTelegramGroups] = useState<TelegramGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'grupos' | 'auto-cadastro'>('status');

  // Configurações do Bot
  const [botWebhookUrl, setBotWebhookUrl] = useState('');
  const [botGrupoPrincipal, setBotGrupoPrincipal] = useState('-1002429706589');
  const [botAutoCadastroEntrar, setBotAutoCadastroEntrar] = useState(true);
  const [botAutoCadastroMensagem, setBotAutoCadastroMensagem] = useState(true);
  const [diasAcessoPadrao, setDiasAcessoPadrao] = useState(30);
  const [saving, setSaving] = useState(false);

  // Mensagens personalizadas
  const [msgBoasVindas, setMsgBoasVindas] = useState(
    `🎉 Bem-vindo(a) ao grupo, {nome}!\n\n✅ Você foi cadastrado automaticamente no sistema.\n📅 Seu acesso é válido por {dias} dias.\n\nUse /status para verificar sua situação a qualquer momento.`
  );
  const [msgCadastroMensagem, setMsgCadastroMensagem] = useState(
    `✅ {nome}, você foi cadastrado no sistema!\n📅 Acesso válido por {dias} dias.\n\nUse /status para ver detalhes.`
  );
  const [msgRegistrar, setMsgRegistrar] = useState(
    `✅ Cadastro realizado com sucesso, {nome}!\n\n📅 Seu acesso é válido por {dias} dias.\n📆 Vencimento: {data_vencimento}\n\nUse /status para acompanhar seu cadastro.`
  );

  useEffect(() => {
    fetchBotInfo();
    fetchStats();
    fetchTelegramGroups();
    loadConfigs();
  }, []);

  async function fetchBotInfo() {
    try {
      const res = await fetch('/api/webhook');
      const data = await res.json();
      if (data.success) {
        setBotInfo(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar info do bot:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    }
  }

  async function fetchTelegramGroups() {
    try {
      const res = await fetch('/api/telegram-groups');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTelegramGroups(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  }

  async function loadConfigs() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success && data.data) {
        setBotWebhookUrl(data.data.bot_webhook_url || '');
        setBotGrupoPrincipal(data.data.bot_grupo_principal || '-1002429706589');
        setBotAutoCadastroEntrar(data.data.bot_auto_cadastro_entrar !== false);
        setBotAutoCadastroMensagem(data.data.bot_auto_cadastro_mensagem !== false);
        setDiasAcessoPadrao(data.data.dias_acesso_padrao || 30);
        // Mensagens personalizadas
        if (data.data.msg_boas_vindas) setMsgBoasVindas(data.data.msg_boas_vindas);
        if (data.data.msg_cadastro_mensagem) setMsgCadastroMensagem(data.data.msg_cadastro_mensagem);
        if (data.data.msg_registrar) setMsgRegistrar(data.data.msg_registrar);
      }
    } catch (error) {
      console.error('Erro ao carregar configs:', error);
    }
  }

  async function saveConfigs() {
    setSaving(true);
    try {
      // API espera formato: { configs: [{chave, valor}, ...] }
      const configs = [
        { chave: 'bot_webhook_url', valor: botWebhookUrl },
        { chave: 'bot_grupo_principal', valor: botGrupoPrincipal },
        { chave: 'bot_auto_cadastro_entrar', valor: String(botAutoCadastroEntrar) },
        { chave: 'bot_auto_cadastro_mensagem', valor: String(botAutoCadastroMensagem) },
        { chave: 'dias_acesso_padrao', valor: String(diasAcessoPadrao) },
        { chave: 'msg_boas_vindas', valor: msgBoasVindas },
        { chave: 'msg_cadastro_mensagem', valor: msgCadastroMensagem },
        { chave: 'msg_registrar', valor: msgRegistrar },
      ];

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar: ' + data.error);
      }
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bot Telegram</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gerenciamento do bot e auto-cadastro
                </p>
              </div>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar ao Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'status'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>Status & Info</span>
            </button>
            <button
              onClick={() => setActiveTab('grupos')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'grupos'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span>Grupos ({telegramGroups.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('auto-cadastro')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'auto-cadastro'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Auto-Cadastro</span>
            </button>
          </div>
        </div>
      </div>

      <main className="px-8 py-8">
        {/* Tab: Status & Info */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Bot Ativo</h3>
                </div>
                {botInfo && (
                  <p className="text-sm text-green-700">
                    @{botInfo.bot.username}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Membros Ativos</h3>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {stats?.total_ativos || 0}
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Grupos</h3>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {telegramGroups.length}
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Auto-Cadastro</h3>
                </div>
                <p className="text-sm text-orange-700">
                  {botAutoCadastroEntrar ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>

            {/* Aviso Multi-Grupo */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Funcionamento Multi-Grupo
                  </h3>
                  <p className="text-blue-800 mb-2">
                    O bot funciona em <strong>TODOS os {telegramGroups.length} grupos</strong> cadastrados simultaneamente.
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                    <li>Cada grupo tem seu próprio controle de membros</li>
                    <li>O cadastro é único no sistema (mesma pessoa em 2 grupos = 1 cadastro)</li>
                    <li>Data de vencimento compartilhada entre todos os grupos</li>
                    <li>Quando vence, é removido de TODOS os grupos automaticamente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Informações Técnicas */}
            {botInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Informações Técnicas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Bot Username:</span>
                      <span className="font-mono text-gray-900">@{botInfo.bot.username}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Bot ID:</span>
                      <span className="font-mono text-gray-900">{botInfo.bot.id}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Status do Webhook:</span>
                      <span className="text-green-600 font-semibold">
                        {botInfo.webhook.status}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Acesso Padrão:</span>
                      <span className="font-semibold text-gray-900">{diasAcessoPadrao} dias</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comandos do Bot */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Comandos Disponíveis no Telegram
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                    /registrar
                  </code>
                  <p className="text-sm text-gray-600 mt-2">
                    Cadastra o usuario no sistema manualmente.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                    /status
                  </code>
                  <p className="text-sm text-gray-600 mt-2">
                    Mostra status do cadastro (enviado no privado).
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                    /cadastro
                  </code>
                  <p className="text-sm text-gray-600 mt-2">
                    Envia link para completar cadastro com dados pessoais.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                    /entrar TOKEN
                  </code>
                  <p className="text-sm text-gray-600 mt-2">
                    Valida codigo de acesso e gera link de convite.
                  </p>
                </div>
              </div>
            </div>

            {/* Como Funciona */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Como o Bot Funciona
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="font-semibold text-green-900">Auto-Cadastro ao Entrar</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Quando alguem entra no grupo, o bot automaticamente cadastra a pessoa no sistema com {diasAcessoPadrao} dias de acesso.
                      Uma mensagem de boas-vindas e enviada (configuravel na aba Auto-Cadastro).
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Auto-Cadastro por Mensagem</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Se o membro nao foi cadastrado ao entrar, ao enviar a primeira mensagem no grupo ele e cadastrado silenciosamente.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Notificacoes de Vencimento</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      O sistema envia notificacoes automaticas 7, 3 e 1 dia antes do vencimento avisando o membro.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                  <div>
                    <h3 className="font-semibold text-red-900">Remocao Automatica</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Apos o vencimento, o membro e removido automaticamente de TODOS os grupos. Se entrar novamente, e reativado com nova data.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
                  <div>
                    <h3 className="font-semibold text-orange-900">Entrada via Pagamento</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Links de convite gerados por pagamento sao rastreados. Quando o membro entra, o sistema atualiza automaticamente
                      os dados de pagamento, acesso e vencimento.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fluxo de Pagamento */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Fluxo de Pagamento
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="px-3 py-2 bg-gray-100 rounded-lg">Pagamento Aprovado</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">Link Gerado</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg">Email Enviado</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg">Membro Entra</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg">Banco Atualizado</span>
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                Todo o processo e automatico. O bot rastreia o link usado e vincula ao pagamento.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Grupos */}
        {activeTab === 'grupos' && (
          <div className="space-y-6">
            {/* Contador Grande */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 uppercase">Total de Grupos Telegram</p>
                  <p className="text-5xl font-bold mt-1">{telegramGroups.length}</p>
                  <p className="text-sm opacity-80 mt-2">
                    {telegramGroups.filter(g => g.ativo).length} ativos | {telegramGroups.filter(g => !g.ativo).length} inativos
                  </p>
                </div>
                <Bot className="w-16 h-16 opacity-30" />
              </div>
            </div>

            {/* Grupo Principal */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Grupo Principal (Convites)</h2>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-500">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-bold text-green-900">GRUPO PRINCIPAL</p>
                  </div>
                  <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                    CONVITES ATIVOS
                  </span>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-green-900 mb-1">
                    ID do Grupo (para geração de convites)
                  </label>
                  <input
                    type="text"
                    value={botGrupoPrincipal}
                    onChange={(e) => setBotGrupoPrincipal(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-green-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="-1002242190548"
                  />
                </div>

                <div className="bg-white bg-opacity-50 p-3 rounded border border-green-300">
                  <p className="text-xs text-green-700 mb-1">
                    ✅ Todos os links de acesso pagos serão gerados para este grupo
                  </p>
                  <p className="text-xs text-green-700">
                    ✅ Auto-cadastro ativo para novos membros
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={saveConfigs}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Grupo Principal'}
                </button>
              </div>
            </div>

            {/* Lista de Grupos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Todos os Grupos</h2>
                <a
                  href="/grupos"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Gerenciar Grupos <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {telegramGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum grupo cadastrado</p>
                  <a href="/grupos" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    Adicionar grupo
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {telegramGroups.map((grupo) => (
                    <div
                      key={grupo.id}
                      className={`p-4 rounded-lg border-2 ${
                        (grupo.telegram_group_id || grupo.chat_id) === botGrupoPrincipal
                          ? 'bg-green-50 border-green-400'
                          : grupo.ativo
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-100 border-gray-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {grupo.nome || 'Sem nome'}
                          </p>
                          <p className="text-xs font-mono text-gray-500 mt-1">
                            {grupo.telegram_group_id || grupo.chat_id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {(grupo.telegram_group_id || grupo.chat_id) === botGrupoPrincipal && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-medium">
                              Principal
                            </span>
                          )}
                          {grupo.ativo ? (
                            <span className="w-3 h-3 bg-green-500 rounded-full" title="Ativo"></span>
                          ) : (
                            <span className="w-3 h-3 bg-gray-400 rounded-full" title="Inativo"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                <p className="text-xs text-blue-800">
                  <strong>Funcionamento:</strong> Todos os grupos recebem cadastro automático de novos membros.
                  Apenas o grupo principal recebe links de convite pagos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Auto-Cadastro */}
        {activeTab === 'auto-cadastro' && (
          <div className="space-y-6">
            {/* Configurações Gerais */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Configurações Gerais</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block font-medium text-gray-900 mb-2">
                    Dias de Acesso Padrão
                  </label>
                  <input
                    type="number"
                    value={diasAcessoPadrao}
                    onChange={(e) => setDiasAcessoPadrao(parseInt(e.target.value) || 30)}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Quantidade de dias de acesso para novos membros
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block font-medium text-gray-700 mb-2">
                    URL do Webhook
                  </label>
                  <input
                    type="url"
                    value={botWebhookUrl}
                    onChange={(e) => setBotWebhookUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="https://seudominio.com/api/webhook"
                  />
                </div>
              </div>
            </div>

            {/* Auto-Cadastro ao Entrar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Auto-Cadastro ao Entrar</h2>
                  <p className="text-sm text-gray-600">Cadastra automaticamente quando alguém entra no grupo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBotAutoCadastroEntrar(!botAutoCadastroEntrar)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    botAutoCadastroEntrar ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      botAutoCadastroEntrar ? 'right-1' : 'left-1'
                    }`}
                  ></div>
                </button>
              </div>

              <div className={botAutoCadastroEntrar ? '' : 'opacity-50 pointer-events-none'}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Boas-Vindas
                </label>
                <textarea
                  value={msgBoasVindas}
                  onChange={(e) => setMsgBoasVindas(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={5}
                  placeholder="Mensagem enviada quando alguém entra no grupo"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Variáveis disponíveis: <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{dias}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{data_vencimento}'}</code>
                </p>
              </div>
            </div>

            {/* Auto-Cadastro por Mensagem */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Auto-Cadastro por Mensagem</h2>
                  <p className="text-sm text-gray-600">Cadastra quando membro envia primeira mensagem no grupo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBotAutoCadastroMensagem(!botAutoCadastroMensagem)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    botAutoCadastroMensagem ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      botAutoCadastroMensagem ? 'right-1' : 'left-1'
                    }`}
                  ></div>
                </button>
              </div>

              <div className={botAutoCadastroMensagem ? '' : 'opacity-50 pointer-events-none'}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Cadastro (silenciosa)
                </label>
                <textarea
                  value={msgCadastroMensagem}
                  onChange={(e) => setMsgCadastroMensagem(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={4}
                  placeholder="Mensagem enviada em privado quando cadastrado por mensagem"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Variáveis disponíveis: <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{dias}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{data_vencimento}'}</code>
                </p>
              </div>
            </div>

            {/* Comando /registrar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Comando /registrar</h2>
                  <p className="text-sm text-gray-600">Permite cadastro voluntário via comando no grupo</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  Sempre Ativo
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Confirmação
                </label>
                <textarea
                  value={msgRegistrar}
                  onChange={(e) => setMsgRegistrar(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={5}
                  placeholder="Mensagem enviada quando usa /registrar"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Variáveis disponíveis: <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{dias}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{data_vencimento}'}</code>
                </p>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <button
                onClick={saveConfigs}
                disabled={saving}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg"
              >
                {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
