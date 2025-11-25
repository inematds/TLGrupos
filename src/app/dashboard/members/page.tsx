'use client';

import { useEffect, useState } from 'react';
import { Member } from '@/types';
import { Users, Search, Filter, Edit, Trash2, RefreshCw } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchMembers();
    fetchGroups();
  }, [filter]);

  async function fetchGroups() {
    try {
      const res = await fetch('/api/grupos');
      const data = await res.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    }
  }

  async function fetchMembers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.append('status', filter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/members?${params}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(member: Member) {
    setEditingMember(member);
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editingMember) return;

    try {
      // Garantir que as datas sejam enviadas no formato correto (sem conversão de timezone)
      // Adiciona horário meio-dia UTC para evitar mudança de data devido a timezone
      const formatDateForSave = (dateStr: string) => {
        if (!dateStr) return dateStr;
        // Se já tem horário, mantém como está
        if (dateStr.includes('T')) return dateStr;
        // Se é apenas data (YYYY-MM-DD), adiciona meio-dia UTC
        return `${dateStr}T12:00:00.000Z`;
      };

      const res = await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editingMember.nome,
          email: editingMember.email || null,
          telefone: editingMember.telefone || null,
          cidade: editingMember.cidade || null,
          uf: editingMember.uf || null,
          data_nascimento: editingMember.data_nascimento ? formatDateForSave(editingMember.data_nascimento) : null,
          nicho: editingMember.nicho || null,
          interesse: editingMember.interesse || null,
          grupo_favorito: editingMember.grupo_favorito || null,
          group_id: editingMember.group_id || null,
          telegram_username: editingMember.telegram_username || null,
          telegram_first_name: editingMember.telegram_first_name || null,
          telegram_last_name: editingMember.telegram_last_name || null,
          observacoes: editingMember.observacoes || null,
          data_entrada: formatDateForSave(editingMember.data_entrada),
          data_vencimento: formatDateForSave(editingMember.data_vencimento),
          status: editingMember.status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Membro atualizado com sucesso!');
        setShowEditModal(false);
        setEditingMember(null);
        fetchMembers();
      } else {
        alert(`Erro ao atualizar: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro ao atualizar: ${error.message}`);
    }
  }

  async function handleDelete(member: Member) {
    if (!confirm(`Tem certeza que deseja remover ${member.nome}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('Membro removido com sucesso!');
        fetchMembers();
      } else {
        alert(`Erro ao remover: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro ao remover: ${error.message}`);
    }
  }

  // Verifica se um membro está vencido (calculado dinamicamente)
  function isExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando membros...</p>
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
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Membros</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerenciar todos os membros cadastrados
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="vencido">Vencidos (data vencida)</option>
                <option value="removido">Removidos</option>
                <option value="pausado">Pausados</option>
                <option value="erro_remocao">Erro de Remoção</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchMembers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Total</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{members.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Ativos</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {members.filter((m) => m.status === 'ativo').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Vencidos</h3>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {members.filter((m) => m.status === 'ativo' && isExpired(m.data_vencimento)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Removidos</h3>
            <p className="mt-2 text-3xl font-bold text-gray-600">
              {members.filter((m) => m.status === 'removido').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Grupo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entrada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>Nenhum membro encontrado</p>
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const daysLeft = getDaysUntilExpiry(member.data_vencimento);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.nome}</div>
                        {member.email && (
                          <div className="text-xs text-gray-500">{member.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {member.grupo_nome || 'Sem grupo'}
                        </div>
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
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)} vencido`
                              : `${daysLeft} dias`}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="text-red-600 hover:text-red-900"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Membro</h2>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Informações Básicas
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={editingMember.nome}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, nome: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingMember.email || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={editingMember.telefone || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, telefone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={editingMember.cidade || ''}
                        onChange={(e) =>
                          setEditingMember({ ...editingMember, cidade: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        UF
                      </label>
                      <select
                        value={editingMember.uf || ''}
                        onChange={(e) =>
                          setEditingMember({ ...editingMember, uf: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">--</option>
                        {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={editingMember.data_nascimento ? editingMember.data_nascimento.split('T')[0] : ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, data_nascimento: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nicho / Área de Atuação
                    </label>
                    <input
                      type="text"
                      value={editingMember.nicho || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, nicho: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Marketing Digital, E-commerce..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Principais Interesses
                    </label>
                    <textarea
                      value={editingMember.interesse || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, interesse: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Conte sobre os principais interesses..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grupo Favorito
                    </label>
                    <input
                      type="text"
                      value={editingMember.grupo_favorito || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, grupo_favorito: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do grupo favorito no Telegram"
                    />
                  </div>
                </div>

                {/* Informações do Telegram */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Informações do Telegram
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grupo do Telegram
                    </label>
                    <select
                      value={editingMember.group_id || ''}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          group_id: e.target.value || null
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sem grupo</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.nome}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecione o grupo do Telegram ao qual o membro pertence
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram User ID
                    </label>
                    <input
                      type="text"
                      value={editingMember.telegram_user_id || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, telegram_user_id: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ID numérico do Telegram (somente leitura)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram Username
                    </label>
                    <input
                      type="text"
                      value={editingMember.telegram_username || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, telegram_username: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="username (sem @)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram First Name
                    </label>
                    <input
                      type="text"
                      value={editingMember.telegram_first_name || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, telegram_first_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram Last Name
                    </label>
                    <input
                      type="text"
                      value={editingMember.telegram_last_name || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, telegram_last_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Datas e Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Datas e Status
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Entrada *
                      </label>
                      <input
                        type="date"
                        value={editingMember.data_entrada.split('T')[0]}
                        onChange={(e) =>
                          setEditingMember({ ...editingMember, data_entrada: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Vencimento *
                      </label>
                      <input
                        type="date"
                        value={editingMember.data_vencimento.split('T')[0]}
                        onChange={(e) =>
                          setEditingMember({
                            ...editingMember,
                            data_vencimento: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editingMember.status}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          status: e.target.value as 'ativo' | 'removido' | 'pausado' | 'erro_remocao',
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="removido">Removido</option>
                      <option value="pausado">Pausado</option>
                      <option value="erro_remocao">Erro de Remoção</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Nota: 'Vencido' é calculado automaticamente pela data de vencimento
                    </p>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Observações
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={editingMember.observacoes || ''}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, observacoes: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notas adicionais sobre o membro..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Salvar Alterações
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
