'use client';

import { useEffect, useState } from 'react';
import { Member, Stats } from '@/types';
import { DollarSign, Users, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface PaymentStats {
  total: number;
  pendentes: number;
  aprovados: number;
  valorTotal: number;
  valorMesAtual: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('requer_atencao');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();

    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [filter]);

  async function fetchData(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      // Buscar estatísticas de membros
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Buscar estatísticas de pagamentos
      try {
        const paymentsRes = await fetch('/api/payments');
        const paymentsData = await paymentsRes.json();

        if (paymentsRes.ok && paymentsData.payments) {
          const payments = paymentsData.payments;
          const now = new Date();
          const mesAtual = now.getMonth();
          const anoAtual = now.getFullYear();

          setPaymentStats({
            total: payments.length,
            pendentes: payments.filter((p: any) => p.status === 'pendente').length,
            aprovados: payments.filter((p: any) => p.status === 'aprovado').length,
            valorTotal: payments
              .filter((p: any) => p.status === 'aprovado')
              .reduce((sum: number, p: any) => sum + parseFloat(p.valor), 0),
            valorMesAtual: payments
              .filter((p: any) => {
                if (p.status !== 'aprovado') return false;
                const dataAprovacao = new Date(p.data_aprovacao || p.created_at);
                return dataAprovacao.getMonth() === mesAtual && dataAprovacao.getFullYear() === anoAtual;
              })
              .reduce((sum: number, p: any) => sum + parseFloat(p.valor), 0),
          });
        }
      } catch (error) {
        console.log('Tabela de pagamentos ainda não existe');
      }

      // Buscar membros
      const membersRes = await fetch(`/api/members?status=${filter}&limit=100`);
      const membersData = await membersRes.json();
      if (membersData.success) {
        setMembers(membersData.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'removido':
        return 'bg-gray-100 text-gray-800';
      case 'pausado':
        return 'bg-purple-100 text-purple-800';
      case 'erro_remocao':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  function getDaysUntilExpiry(expiryDate: string) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Visão geral do sistema</p>
            </div>
          </div>
        </header>

        <main className="px-8 py-8">
        {/* Estatísticas Principais */}
        {stats && (
          <>
            {/* Linha 1: Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* Total de Cadastros */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Total de Cadastros</p>
                    <p className="mt-2 text-4xl font-bold">{stats.total_cadastros}</p>
                  </div>
                  <Users className="w-12 h-12 opacity-80" />
                </div>
              </div>

              {/* Ativos */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Membros Ativos</p>
                    <p className="mt-2 text-4xl font-bold text-green-600">{stats.total_ativos}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {stats.ativos_no_grupo || 0} no grupo • {stats.ativos_sem_grupo || 0} fora
                    </p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
                </div>
              </div>

              {/* Vencendo em 7 dias */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vencendo em 7 dias</p>
                    <p className="mt-2 text-4xl font-bold text-yellow-600">{stats.vencendo_7dias}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Requer renovação em breve
                    </p>
                  </div>
                  <Clock className="w-12 h-12 text-yellow-500 opacity-50" />
                </div>
              </div>

              {/* Vencidos */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vencidos</p>
                    <p className="mt-2 text-4xl font-bold text-red-600">{stats.total_vencidos}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Acesso expirado
                    </p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
                </div>
              </div>
            </div>

            {/* Linha 2: Estatísticas de Pagamentos */}
            {paymentStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {/* Receita Total */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Receita Total</p>
                      <p className="mt-2 text-3xl font-bold">
                        R$ {paymentStats.valorTotal.toFixed(2)}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {paymentStats.aprovados} pagamentos aprovados
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                {/* Receita do Mês */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Receita do Mês</p>
                      <p className="mt-2 text-3xl font-bold">
                        R$ {paymentStats.valorMesAtual.toFixed(2)}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                {/* Pagamentos Pendentes */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pendentes</p>
                      <p className="mt-2 text-4xl font-bold text-yellow-600">
                        {paymentStats.pendentes}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        <a href="/dashboard/pagamentos-gerenciar" className="text-yellow-600 hover:underline">
                          Aguardando aprovação →
                        </a>
                      </p>
                    </div>
                    <Clock className="w-12 h-12 text-yellow-500 opacity-50" />
                  </div>
                </div>

                {/* Total de Pagamentos */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Pagamentos</p>
                      <p className="mt-2 text-4xl font-bold text-blue-600">
                        {paymentStats.total}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Todos os registros
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-blue-500 opacity-50" />
                  </div>
                </div>
              </div>
            )}

            {/* Linha 3: Status Especiais e Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Erro Remoção */}
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
                <h3 className="text-sm font-medium text-gray-500">Erro Remoção</h3>
                <p className="mt-2 text-3xl font-bold text-orange-600">{stats.erro_remocao || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Vencidos ainda no grupo</p>
              </div>

              {/* Removidos */}
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-gray-500">
                <h3 className="text-sm font-medium text-gray-500">Removidos</h3>
                <p className="mt-2 text-3xl font-bold text-gray-600">{stats.total_removidos}</p>
                <p className="text-xs text-gray-500 mt-1">Acesso revogado</p>
              </div>

              {/* Pausados */}
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
                <h3 className="text-sm font-medium text-gray-500">Pausados</h3>
                <p className="mt-2 text-3xl font-bold text-purple-600">{stats.total_pausados || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Temporariamente suspensos</p>
              </div>

              {/* Requer Atenção */}
              {stats.ativos_mas_vencidos > 0 && (
                <div className="bg-red-50 rounded-xl shadow p-6 border-l-4 border-red-700">
                  <h3 className="text-sm font-medium text-red-700">Requer Atenção</h3>
                  <p className="mt-2 text-3xl font-bold text-red-700">{stats.ativos_mas_vencidos}</p>
                  <p className="text-xs text-red-600 mt-1">Ativos mas vencidos</p>
                </div>
              )}

              {/* Sem Telegram ID */}
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-cyan-500">
                <h3 className="text-sm font-medium text-gray-500">Sem Telegram ID</h3>
                <p className="mt-2 text-3xl font-bold text-cyan-600">{stats.ativos_sem_telegram || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Ativos sem vinculação</p>
              </div>
            </div>
          </>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4 items-center">
            <label className="font-medium text-gray-700">Filtrar membros:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="requer_atencao">⚠️ Requer Atenção</option>
              <option value="">📊 Todos</option>
              <option value="ativo">✅ Ativos</option>
              <option value="vencido">❌ Vencidos (data vencida)</option>
              <option value="erro_remocao">🔴 Erro Remoção</option>
              <option value="removido">🗑️ Removidos</option>
              <option value="pausado">⏸️ Pausados</option>
            </select>
            <span className="ml-auto text-sm text-gray-500">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Tabela de Membros */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Membros Recentes ({members.length})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data de Entrada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dias Restantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum membro encontrado com este filtro
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const daysLeft = getDaysUntilExpiry(member.data_vencimento);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {member.telegram_username ? `@${member.telegram_username}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.data_entrada)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.data_vencimento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.status === 'ativo' ? (
                          <span
                            className={`${
                              daysLeft < 0
                                ? 'text-red-600 font-semibold'
                                : daysLeft <= 7
                                ? 'text-yellow-600 font-semibold'
                                : 'text-green-600'
                            }`}
                          >
                            {daysLeft < 0 ? `${Math.abs(daysLeft)} dias vencido` : `${daysLeft} dias`}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            member.status
                          )}`}
                        >
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
