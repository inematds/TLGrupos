'use client';

import { useEffect, useState } from 'react';
import { Member, Stats } from '@/types';
import MemberForm from '@/components/MemberForm';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('requer_atencao');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();

    // Atualizar estatísticas a cada 30 segundos (sem mostrar loading)
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
      // Buscar estatísticas
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Buscar membros
      const membersRes = await fetch(`/api/members?status=${filter}&limit=100`);
      const membersData = await membersRes.json();
      if (membersData.success) {
        setMembers(membersData.data);
      }

      // Atualizar timestamp da última atualização
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Visão geral do sistema</p>
              </div>
              <div className="flex gap-3">
                <a
                  href="/dashboard/formas-pagamento"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  💳 Pagamentos
                </a>
                <a
                  href="/dashboard/convites"
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                >
                  🔗 Convites
                </a>
                <a
                  href="/dashboard/inclusao"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  Inclusão no Grupo
                </a>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Novo Membro
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-8 py-8">
        {/* Estatísticas */}
        {stats && (
          <>
            {/* Linha 1: Total e Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
                <h3 className="text-sm font-medium opacity-90">📊 Total de Cadastros</h3>
                <p className="mt-2 text-4xl font-bold">{stats.total_cadastros}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-500">✅ Ativos</h3>
                <p className="mt-2 text-3xl font-bold text-green-600">{stats.total_ativos}</p>
                <p className="text-xs text-gray-500 mt-1">
                  No grupo: {stats.ativos_no_grupo || 0} | Fora: {stats.ativos_sem_grupo || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <h3 className="text-sm font-medium text-gray-500">⚠️ Vencendo em 7 dias</h3>
                <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.vencendo_7dias}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <h3 className="text-sm font-medium text-gray-500">❌ Vencidos</h3>
                <p className="mt-2 text-3xl font-bold text-red-600">{stats.total_vencidos}</p>
              </div>
            </div>

            {/* Linha 2: Status Especiais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <h3 className="text-sm font-medium text-gray-500">🔴 Erro Remoção</h3>
                <p className="mt-2 text-3xl font-bold text-orange-600">{stats.erro_remocao || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Vencidos ainda no grupo</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
                <h3 className="text-sm font-medium text-gray-500">🗑️ Removidos</h3>
                <p className="mt-2 text-3xl font-bold text-gray-600">{stats.total_removidos}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <h3 className="text-sm font-medium text-gray-500">⏸️ Pausados</h3>
                <p className="mt-2 text-3xl font-bold text-purple-600">{stats.total_pausados || 0}</p>
              </div>
              {stats.ativos_mas_vencidos > 0 && (
                <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-700">
                  <h3 className="text-sm font-medium text-red-700">🚨 Requer Atenção</h3>
                  <p className="mt-2 text-3xl font-bold text-red-700">{stats.ativos_mas_vencidos}</p>
                  <p className="text-xs text-red-600 mt-1">Ativos mas vencidos</p>
                </div>
              )}
            </div>

            {/* Linha 3: Telegram User ID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500">👤 Sem Telegram ID</h3>
                <p className="mt-2 text-3xl font-bold text-blue-600">{stats.sem_telegram_user_id || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Total de membros</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-cyan-500">
                <h3 className="text-sm font-medium text-gray-500">👤 Ativos sem Telegram ID</h3>
                <p className="mt-2 text-3xl font-bold text-cyan-600">{stats.ativos_sem_telegram || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Apenas ativos</p>
              </div>
            </div>
          </>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4 items-center">
            <label className="font-medium text-gray-700">Filtrar por status:</label>
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
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Nenhum membro encontrado
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

        {/* Informações de ajuda */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Próximos Passos</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Configure as variáveis de ambiente no arquivo .env.local</li>
            <li>Execute as migrations no Supabase</li>
            <li>Configure o bot Telegram e adicione-o como admin do grupo</li>
            <li>Configure os cron jobs para automação</li>
            <li>Adicione seus primeiros membros através da API</li>
          </ul>
        </div>
      </main>

      {/* Modal do Formulário */}
      <MemberForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          fetchData();
          setTimeout(() => setIsFormOpen(false), 2000);
        }}
      />
    </div>
  );
}
