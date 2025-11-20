'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, CheckCircle } from 'lucide-react';

interface TelegramGroup {
  id: string;
  nome: string;
  telegram_group_id: string;
  descricao: string;
  ativo: boolean;
  auto_removal_enabled: boolean;
  removal_schedule_hour: number;
  removal_schedule_minute: number;
  total_membros: number;
  created_at: string;
}

export default function GruposPage() {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    telegram_group_id: '',
    descricao: '',
    ativo: true,
    auto_removal_enabled: true,
    removal_schedule_hour: 0,
    removal_schedule_minute: 0,
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram-groups');
      const data = await res.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      nome: '',
      telegram_group_id: '',
      descricao: '',
      ativo: true,
      auto_removal_enabled: true,
      removal_schedule_hour: 0,
      removal_schedule_minute: 0,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(group: TelegramGroup) {
    setFormData({
      nome: group.nome,
      telegram_group_id: group.telegram_group_id,
      descricao: group.descricao || '',
      ativo: group.ativo,
      auto_removal_enabled: group.auto_removal_enabled,
      removal_schedule_hour: group.removal_schedule_hour || 0,
      removal_schedule_minute: group.removal_schedule_minute || 0,
    });
    setEditingId(group.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = '/api/telegram-groups';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        await fetchGroups();
        resetForm();
        alert(editingId ? '✅ Grupo atualizado com sucesso!' : '✅ Grupo criado com sucesso!');
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${nome}"?\n\nIsso não afetará os membros no banco de dados.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/telegram-groups?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        await fetchGroups();
        alert('✅ Grupo excluído com sucesso!');
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Erro: ${error.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Grupos Telegram</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Configure os grupos que serão gerenciados pelo sistema
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

      <main className="px-8 py-8 max-w-7xl mx-auto">
        {/* Botão Adicionar */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
          >
            {showForm ? (
              <>
                <X className="w-5 h-5" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Adicionar Grupo
              </>
            )}
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? 'Editar Grupo' : 'Novo Grupo'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Grupo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Grupo VIP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID do Grupo Telegram *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.telegram_group_id}
                    onChange={(e) => setFormData({ ...formData, telegram_group_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: -1002414487357"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Obtenha o ID usando o bot @getidsbot no Telegram
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrição opcional do grupo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                    Grupo Ativo
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="auto_removal"
                    checked={formData.auto_removal_enabled}
                    onChange={(e) => setFormData({ ...formData, auto_removal_enabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="auto_removal" className="text-sm font-medium text-gray-700">
                    Auto-Remoção Habilitada
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Auto-Remoção
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hora</label>
                    <select
                      value={formData.removal_schedule_hour}
                      onChange={(e) => setFormData({ ...formData, removal_schedule_hour: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minuto</label>
                    <select
                      value={formData.removal_schedule_minute}
                      onChange={(e) => setFormData({ ...formData, removal_schedule_minute: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingId ? 'Atualizar' : 'Criar Grupo'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Grupos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Grupos Cadastrados</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Carregando grupos...
            </div>
          ) : groups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum grupo cadastrado. Adicione um grupo para começar.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {groups.map((group) => (
                <div key={group.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {group.nome}
                        </h3>
                        {group.ativo ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                            Inativo
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>ID Telegram:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{group.telegram_group_id}</code>
                        </p>
                        {group.descricao && (
                          <p>
                            <strong>Descrição:</strong> {group.descricao}
                          </p>
                        )}
                        <p>
                          <strong>Auto-Remoção:</strong> {group.auto_removal_enabled ? '✅ Habilitada' : '❌ Desabilitada'}
                          {group.auto_removal_enabled && (
                            <span className="ml-2">
                              às {String(group.removal_schedule_hour).padStart(2, '0')}:{String(group.removal_schedule_minute).padStart(2, '0')}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Criado em: {new Date(group.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(group)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id, group.nome)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">
            💡 Como obter o ID do grupo Telegram
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Adicione o bot <strong>@getidsbot</strong> ao seu grupo Telegram</li>
            <li>O bot enviará uma mensagem com o ID do grupo (ex: -1002414487357)</li>
            <li>Copie o ID completo (incluindo o sinal de menos)</li>
            <li>Cole o ID no campo "ID do Grupo Telegram" acima</li>
            <li>Remova o bot do grupo após obter o ID</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
