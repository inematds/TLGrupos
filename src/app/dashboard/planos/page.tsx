'use client';

import { useEffect, useState } from 'react';
import { Plan, CreatePlanInput, UpdatePlanInput } from '@/types';
import { Plus, Edit2, Trash2, Save, X, DollarSign, Calendar, Check } from 'lucide-react';

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<CreatePlanInput>({
    nome: '',
    descricao: '',
    valor: 0,
    duracao_dias: 30,
    ativo: true,
    ordem: 0,
    chave_pix: '',
  });

  useEffect(() => {
    buscarPlanos();
  }, []);

  async function buscarPlanos() {
    setLoading(true);
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.success) {
        setPlanos(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      alert('Erro ao buscar planos');
    } finally {
      setLoading(false);
    }
  }

  function abrirFormularioNovo() {
    setEditingPlan(null);
    setFormData({
      nome: '',
      descricao: '',
      valor: 0,
      duracao_dias: 30,
      ativo: true,
      ordem: planos.length,
      chave_pix: '',
    });
    setShowForm(true);
  }

  function abrirFormularioEdicao(plano: Plan) {
    setEditingPlan(plano);
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao || '',
      valor: plano.valor,
      duracao_dias: plano.duracao_dias,
      ativo: plano.ativo,
      ordem: plano.ordem,
      chave_pix: plano.chave_pix || '',
    });
    setShowForm(true);
  }

  function fecharFormulario() {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      nome: '',
      descricao: '',
      valor: 0,
      duracao_dias: 30,
      ativo: true,
      ordem: 0,
      chave_pix: '',
    });
  }

  async function salvarPlano(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.nome || formData.valor <= 0 || formData.duracao_dias <= 0) {
      alert('Preencha todos os campos obrigatórios corretamente');
      return;
    }

    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || (editingPlan ? 'Plano atualizado!' : 'Plano criado!'));
        fecharFormulario();
        buscarPlanos();
      } else {
        alert(data.error || 'Erro ao salvar plano');
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano');
    }
  }

  async function removerPlano(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja remover o plano "${nome}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('Plano removido com sucesso!');
        buscarPlanos();
      } else {
        alert(data.error || 'Erro ao remover plano');
      }
    } catch (error) {
      console.error('Erro ao remover plano:', error);
      alert('Erro ao remover plano');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos de Acesso</h1>
          <p className="text-gray-600 mt-1">Gerencie os planos disponíveis para seus membros</p>
        </div>
        <button
          onClick={abrirFormularioNovo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </h2>
            <button
              onClick={fecharFormulario}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={salvarPlano} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Mensal, Trimestral, Anual"
                  required
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Duração */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (dias) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duracao_dias}
                  onChange={(e) => setFormData({ ...formData, duracao_dias: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="30"
                  required
                />
              </div>

              {/* Ordem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição do plano..."
                rows={3}
              />
            </div>

            {/* Chave PIX */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave PIX (opcional)
              </label>
              <input
                type="text"
                value={formData.chave_pix}
                onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@exemplo.com ou CPF ou telefone"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se não preenchida, será usada a chave PIX global configurada nas configurações do sistema
              </p>
            </div>

            {/* Ativo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="ativo" className="ml-2 text-sm font-medium text-gray-700">
                Plano ativo (disponível para compra)
              </label>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
              <button
                type="button"
                onClick={fecharFormulario}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Planos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando planos...</div>
        ) : planos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhum plano cadastrado ainda.</p>
            <button
              onClick={abrirFormularioNovo}
              className="mt-4 text-blue-600 hover:underline"
            >
              Criar primeiro plano
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planos.map((plano) => (
                  <tr key={plano.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plano.ordem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plano.nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-md truncate">
                        {plano.descricao || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <DollarSign className="w-4 h-4" />
                        R$ {plano.valor.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="w-4 h-4" />
                        {plano.duracao_dias} dias
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {plano.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <Check className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => abrirFormularioEdicao(plano)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removerPlano(plano.id, plano.nome)}
                          className="text-red-600 hover:text-red-900"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
