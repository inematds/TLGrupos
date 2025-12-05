'use client';

import { useEffect, useState } from 'react';
import { Member } from '@/types';
import { UserMinus, Search, Trash2, AlertCircle, CheckCircle, Users, Layers } from 'lucide-react';

interface TelegramGroup {
  id: string;
  title: string;
  group_id: string;
  ativo: boolean;
}

export default function ExclusaoPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar membros ativos com Telegram
      const membersRes = await fetch('/api/members');
      const membersData = await membersRes.json();

      if (membersData.success) {
        // Filtrar apenas membros com telegram_user_id
        const membrosComTelegram = membersData.members.filter(
          (m: Member) => m.telegram_user_id && m.status === 'ativo'
        );
        setMembers(membrosComTelegram);
      }

      // Carregar grupos
      const groupsRes = await fetch('/api/telegram-groups');
      const groupsData = await groupsRes.json();

      if (groupsData.success) {
        setGroups(groupsData.groups.filter((g: TelegramGroup) => g.ativo));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    const groupName = selectedGroup === 'all'
      ? 'todos os grupos'
      : groups.find(g => g.id === selectedGroup)?.title || 'o grupo selecionado';

    if (!confirm(
      `⚠️ CONFIRMAR EXCLUSÃO\n\n` +
      `Membro: ${member.nome}\n` +
      `Username: @${member.telegram_username || 'sem username'}\n` +
      `Remover de: ${groupName}\n\n` +
      `Esta ação removerá o membro do(s) grupo(s) do Telegram.\n\n` +
      `Deseja continuar?`
    )) {
      return;
    }

    try {
      setProcessing(true);
      setResultado(null);

      const body: any = { member_id: member.id };
      if (selectedGroup !== 'all') {
        body.group_id = selectedGroup;
      }

      const response = await fetch('/api/telegram/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setResultado(data);

      if (data.success) {
        // Atualizar lista (remover da UI temporariamente)
        setTimeout(() => {
          loadData();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Erro ao remover membro:', error);
      setResultado({
        success: false,
        error: error.message || 'Erro ao processar exclusão',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.nome.toLowerCase().includes(searchLower) ||
      member.telegram_username?.toLowerCase().includes(searchLower) ||
      member.cpf?.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center ml-64">
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exclusão Manual de Membros</h1>
              <p className="text-sm text-gray-500 mt-1">
                Remover membros específicos dos grupos do Telegram
              </p>
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
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Membros com Telegram</p>
                <p className="text-3xl font-bold text-blue-600">{members.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <Layers className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Grupos Ativos</p>
                <p className="text-3xl font-bold text-green-600">{groups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resultado da operação */}
        {resultado && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              resultado.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start">
              {resultado.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    resultado.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {resultado.success ? '✅ Exclusão Concluída!' : '❌ Erro na Exclusão'}
                </h3>
                <p className="text-sm mt-1">{resultado.message}</p>
                {resultado.results && (
                  <div className="mt-3 space-y-1">
                    {resultado.results.map((r: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        {r.success ? (
                          <span className="text-green-700">✓ {r.group}</span>
                        ) : (
                          <span className="text-red-700">✗ {r.group}: {r.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {resultado.error && (
                  <p className="mt-1 text-sm text-red-700">{resultado.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Membro
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome, username ou CPF..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remover de qual grupo?
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">🌐 Todos os Grupos</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de membros */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Membros Ativos com Telegram
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredMembers.length} membro(s) encontrado(s)
            </p>
          </div>

          <div className="overflow-x-auto">
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
                    Telegram ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <UserMinus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Nenhum membro encontrado</p>
                      <p className="text-sm">
                        {searchTerm
                          ? 'Tente ajustar os filtros de busca'
                          : 'Não há membros ativos com Telegram cadastrado'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {member.telegram_username ? `@${member.telegram_username}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono">
                          {member.telegram_user_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.data_vencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={processing}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          {processing ? 'Removendo...' : 'Remover'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Informações</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>A exclusão remove o membro do grupo do Telegram <strong>imediatamente</strong></li>
            <li>O membro <strong>NÃO</strong> será desativado no sistema, apenas removido do grupo</li>
            <li>O membro poderá ser incluído novamente via página "Inclusão no Grupo"</li>
            <li>Não serão apagadas as mensagens enviadas pelo membro</li>
            <li>Use "Auto-Exclusão" para remover membros vencidos automaticamente</li>
          </ul>
        </div>

        {/* Aviso de Segurança */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-900 mb-1">⚠️ Atenção</h3>
              <p className="text-sm text-yellow-800">
                Esta é uma ação <strong>irreversível</strong>. O membro será removido do(s) grupo(s)
                imediatamente. Certifique-se de que está removendo o membro correto antes de confirmar.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
