'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Bell, Trash2, CreditCard, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CronStats {
  last7Days: Array<{
    date: string;
    notifications: number;
    removals: number;
    payments: number;
    total: number;
  }>;
  totals: {
    notifications: number;
    removals: number;
    payments: number;
  };
  lastExecution: {
    notifications: string | null;
    removals: string | null;
    payments: string | null;
  };
}

export default function CronActivityChart() {
  const [stats, setStats] = useState<CronStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/cron-stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de CRON:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatLastExecution = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Agora';
      if (diffMins < 60) return `${diffMins} min atrás`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
      return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Erro';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Atividade dos CRON Jobs</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = stats.last7Days.map((day) => ({
    ...day,
    data: formatDate(day.date),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Atividade dos CRON Jobs</h2>
        </div>
        <span className="text-sm text-gray-500">Últimos 7 dias</span>
      </div>

      {/* Gráfico de Linha */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="data"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#9CA3AF' }}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="notifications"
              name="Notificações"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="removals"
              name="Remoções"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: '#EF4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="payments"
              name="Pagamentos"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Notificações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Notificações</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totals.notifications}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Clock className="w-3 h-3" />
            <span>{formatLastExecution(stats.lastExecution.notifications)}</span>
          </div>
        </div>

        {/* Remoções */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Remoções</p>
              <p className="text-2xl font-bold text-red-900">{stats.totals.removals}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-red-600">
            <Clock className="w-3 h-3" />
            <span>{formatLastExecution(stats.lastExecution.removals)}</span>
          </div>
        </div>

        {/* Pagamentos */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Pagamentos</p>
              <p className="text-2xl font-bold text-green-900">{stats.totals.payments}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Clock className="w-3 h-3" />
            <span>{formatLastExecution(stats.lastExecution.payments)}</span>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500">
          <strong>Notificações:</strong> Avisos de vencimento enviados aos membros |{' '}
          <strong>Remoções:</strong> Membros removidos automaticamente dos grupos |{' '}
          <strong>Pagamentos:</strong> Pagamentos processados e aprovados
        </p>
      </div>
    </div>
  );
}
