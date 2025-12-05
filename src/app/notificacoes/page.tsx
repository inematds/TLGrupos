'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

interface NotificationStats {
  summary: {
    total: number;
    emailsSent: number;
    telegramsSent: number;
    emailSuccessRate: number;
    telegramSuccessRate: number;
    pending: number;
    failed: number;
  };
  byType: Record<string, { total: number; email: number; telegram: number }>;
  dailyStats: Record<string, { total: number; email: number; telegram: number }>;
  pending: any[];
  failed: any[];
}

const notificationTypeLabels: Record<string, string> = {
  payment_approved: 'Pagamento Aprovado',
  payment_rejected: 'Pagamento Rejeitado',
  expiry_warning: 'Aviso de Vencimento',
  news: 'Notícias',
  removal: 'Remoção',
};

export default function NotificationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'failed'>('overview');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 ">
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  const last7Days = Object.entries(stats.dailyStats)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .reverse();

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Dashboard de Notificações
            </h1>
            <p className="text-gray-600 mt-2">
              Monitoramento completo de todas as notificações enviadas (últimos 30 dias)
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total de Notificações</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.summary.total}</p>
            <p className="text-xs text-gray-500 mt-2">Últimos 30 dias</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">
                {stats.summary.emailSuccessRate}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Taxa de Sucesso - Email</h3>
            <p className="text-sm text-gray-500 mt-2">
              {stats.summary.emailsSent} de {stats.summary.total} enviados
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {stats.summary.telegramSuccessRate}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Taxa de Sucesso - Telegram</h3>
            <p className="text-sm text-gray-500 mt-2">
              {stats.summary.telegramsSent} de {stats.summary.total} enviados
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Status</h3>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-xs text-gray-500">Pendentes</p>
                <p className="text-xl font-bold text-yellow-600">{stats.summary.pending}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Falhas</p>
                <p className="text-xl font-bold text-red-600">{stats.summary.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Pendentes ({stats.summary.pending})
              </button>
              <button
                onClick={() => setActiveTab('failed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'failed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <XCircle className="w-4 h-4 inline mr-2" />
                Falhas ({stats.summary.failed})
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Gráfico - Últimos 7 Dias */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Notificações por Dia (Últimos 7 Dias)
              </h2>
              <div className="space-y-4">
                {last7Days.map(([date, data]) => {
                  const maxValue = Math.max(...last7Days.map(([, d]) => d.total));
                  const percentage = (data.total / maxValue) * 100;

                  return (
                    <div key={date}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-green-600" />
                            {data.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-purple-600" />
                            {data.telegram}
                          </span>
                          <span className="font-medium text-gray-900">{data.total}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notificações por Tipo */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Notificações por Tipo</h2>
              <div className="space-y-4">
                {Object.entries(stats.byType).map(([type, data]) => (
                  <div key={type} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {notificationTypeLabels[type] || type}
                      </h3>
                      <span className="text-sm font-bold text-gray-700">{data.total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Mail className="w-4 h-4 text-green-600" />
                          Email
                        </span>
                        <span className="font-medium text-gray-900">
                          {data.email}/{data.total}
                          <span className="text-xs text-gray-500 ml-1">
                            ({Math.round((data.email / data.total) * 100)}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          Telegram
                        </span>
                        <span className="font-medium text-gray-900">
                          {data.telegram}/{data.total}
                          <span className="text-xs text-gray-500 ml-1">
                            ({Math.round((data.telegram / data.total) * 100)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Notificações Pendentes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Notificações que ainda não foram enviadas com sucesso
              </p>
            </div>
            {stats.pending.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma notificação pendente!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Membro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Telegram
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Tentativas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.pending.map((notif) => (
                      <tr key={notif.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {notif.member_name}
                          </div>
                          <div className="text-xs text-gray-500">{notif.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {notificationTypeLabels[notif.notification_type] ||
                            notif.notification_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {notif.email_sent ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {notif.telegram_sent ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          <div className="text-xs">
                            Email: {notif.email_attempts}/3
                            <br />
                            TG: {notif.telegram_attempts}/3
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'failed' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Notificações Falhadas
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Notificações que falharam após 3 tentativas
              </p>
            </div>
            {stats.failed.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma falha registrada!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Membro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Erro Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Erro Telegram
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.failed.map((notif) => (
                      <tr key={notif.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {notif.member_name}
                          </div>
                          <div className="text-xs text-gray-500">{notif.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {notificationTypeLabels[notif.notification_type] ||
                            notif.notification_type}
                        </td>
                        <td className="px-6 py-4">
                          {!notif.email_sent && notif.email_error ? (
                            <div className="text-xs text-red-600 max-w-xs truncate">
                              {notif.email_error}
                            </div>
                          ) : (
                            <span className="text-xs text-green-600">OK</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!notif.telegram_sent && notif.telegram_error ? (
                            <div className="text-xs text-red-600 max-w-xs truncate">
                              {notif.telegram_error}
                            </div>
                          ) : (
                            <span className="text-xs text-green-600">OK</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
