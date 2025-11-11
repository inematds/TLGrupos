'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, TrendingUp, Calendar } from 'lucide-react';

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [statsRes, membersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/members'),
      ]);

      const statsData = await statsRes.json();
      const membersData = await membersRes.json();

      if (statsData.success) setStats(statsData.data);
      if (membersData.success) setMembers(membersData.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Estatísticas</h1>
              <p className="text-sm text-gray-500 mt-1">
                Relatórios e análises do sistema
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-medium text-gray-500">Membros Ativos</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.total_ativos || 0}
            </p>
            <p className="text-xs text-green-600 mt-1">Em dia com pagamento</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-yellow-600" />
              <h3 className="text-sm font-medium text-gray-500">Vencendo em 7 dias</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.vencendo_7dias || 0}
            </p>
            <p className="text-xs text-yellow-600 mt-1">Necessitam atenção</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-medium text-gray-500">Vencidos</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.total_vencidos || 0}
            </p>
            <p className="text-xs text-red-600 mt-1">Requerem ação</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-500">Total Geral</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{members.length}</p>
            <p className="text-xs text-gray-600 mt-1">Todos os membros</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Distribuição por Status
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Ativos</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats?.total_ativos || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        members.length > 0
                          ? ((stats?.total_ativos || 0) / members.length) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Vencidos</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats?.total_vencidos || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{
                      width: `${
                        members.length > 0
                          ? ((stats?.total_vencidos || 0) / members.length) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Removidos</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats?.total_removidos || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full"
                    style={{
                      width: `${
                        members.length > 0
                          ? ((stats?.total_removidos || 0) / members.length) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Membros Recentes
            </h3>
            <div className="space-y-3">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.nome}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(member.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      member.status === 'ativo'
                        ? 'bg-green-100 text-green-800'
                        : member.status === 'vencido'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">📊 Sobre as Estatísticas</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• As estatísticas são atualizadas em tempo real</li>
            <li>• Membros ativos: Com data de vencimento futura</li>
            <li>• Vencendo em 7 dias: Próximos de expirar</li>
            <li>• Vencidos: Ultrapassaram a data de vencimento</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
