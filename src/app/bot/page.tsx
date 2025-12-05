'use client';

import { useEffect, useState } from 'react';
import { Bot, Check, AlertCircle, RefreshCw, Users, MessageSquare } from 'lucide-react';

export default function BotPage() {
  const [botInfo, setBotInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchBotInfo();
    fetchStats();
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
    <div className="min-h-screen bg-gray-50 ml-64">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bot de Auto-Registro</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Sistema automático de cadastro de membros
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

      <main className="px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Auto-Cadastro</h3>
            </div>
            <p className="text-sm text-purple-700">Sistema ativo</p>
          </div>
        </div>

        {/* Aviso Importante */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ℹ️ Funcionamento Multi-Grupo
              </h3>
              <p className="text-blue-800 mb-2">
                <strong>Importante:</strong> O bot funciona simultaneamente em <strong>TODOS os grupos</strong> do Telegram onde ele foi adicionado como administrador.
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                <li>Cada grupo tem seu próprio controle de membros</li>
                <li>O cadastro é único no sistema (se a pessoa está em 2 grupos, é o mesmo cadastro)</li>
                <li>A data de vencimento é compartilhada entre todos os grupos</li>
                <li>Quando vence, é removido de TODOS os grupos automaticamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Como Funciona */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🎯 Como Funciona o Auto-Cadastro
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Quando alguém ENTRA em qualquer grupo
                </h3>
                <p className="text-sm text-gray-600">
                  O bot detecta automaticamente e cadastra a pessoa com 30 dias de acesso.
                  Uma mensagem de boas-vindas é enviada no grupo onde entrou.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Quando alguém ENVIA MENSAGEM em qualquer grupo
                </h3>
                <p className="text-sm text-gray-600">
                  Membros que já estavam no grupo são cadastrados automaticamente ao enviar
                  qualquer mensagem (silenciosamente, sem notificar). Funciona em todos os grupos.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Registro Voluntário com /registrar
                </h3>
                <p className="text-sm text-gray-600">
                  Membros podem usar o comando <code className="bg-gray-100 px-1 py-0.5 rounded">/registrar</code> em
                  qualquer grupo ou por mensagem privada com o bot para se cadastrar manualmente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comandos Disponíveis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💬 Comandos Disponíveis no Telegram
          </h2>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                  /registrar
                </code>
                <span className="text-sm text-gray-500">ou</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                  /register
                </code>
              </div>
              <p className="text-sm text-gray-600">
                Cadastra o usuário no sistema. Se já estiver cadastrado, mostra as informações.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                  /status
                </code>
              </div>
              <p className="text-sm text-gray-600">
                Mostra o status do cadastro: data de vencimento, dias restantes e situação atual.
              </p>
            </div>
          </div>
        </div>

        {/* Instruções para os Membros */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            📢 Mensagem para Enviar no Grupo
          </h2>
          <p className="text-sm text-blue-700 mb-4">
            Copie e envie esta mensagem no grupo para avisar os membros:
          </p>

          <div className="bg-white border border-blue-300 rounded-lg p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
{`🤖 Sistema de Gestão de Membros Ativo!

Nosso grupo agora possui um sistema automático de controle de acesso.

✅ O que você precisa fazer:
• NADA! Você já foi cadastrado automaticamente
• Use /status para ver seu tempo de acesso
• Use /registrar se ainda não estiver cadastrado

📅 Você terá 30 dias de acesso a partir do cadastro
⚠️ Será notificado antes do vencimento
🔄 Renovações podem ser feitas pelos administradores

Use /status para verificar sua situação!`}
            </pre>

            <button
              onClick={() => {
                const text = document.querySelector('pre')?.textContent || '';
                navigator.clipboard.writeText(text);
                alert('Mensagem copiada!');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Copiar Mensagem
            </button>
          </div>
        </div>

        {/* Informações Técnicas */}
        {botInfo && (
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              ℹ️ Informações Técnicas
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bot Username:</span>
                <span className="font-mono text-gray-900">@{botInfo.bot.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bot ID:</span>
                <span className="font-mono text-gray-900">{botInfo.bot.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status do Webhook:</span>
                <span className="text-green-600 font-semibold">
                  {botInfo.webhook.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vencimento Padrão:</span>
                <span className="font-semibold text-gray-900">30 dias</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
