'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  DollarSign,
  User,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Tag,
} from 'lucide-react';

interface Member {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  data_vencimento?: string;
}

interface Plan {
  id: string;
  nome: string;
  valor: number;
  duracao_dias: number;
  descricao?: string;
}

export default function NovoPagamento() {
  const [emailSearch, setEmailSearch] = useState('');
  const [searchingMember, setSearchingMember] = useState(false);
  const [memberFound, setMemberFound] = useState<Member | null>(null);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [formData, setFormData] = useState({
    member_id: '',
    plan_id: '',
    valor: '',
    dias_acesso: '30',
    descricao: '',
  });

  // Carregar planos ao montar o componente
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        const response = await fetch('/api/plans');
        const data = await response.json();

        // Garantir que plans seja sempre um array
        let plansArray = [];
        if (Array.isArray(data)) {
          plansArray = data;
        } else if (data.plans && Array.isArray(data.plans)) {
          plansArray = data.plans;
        } else if (data.data && Array.isArray(data.data)) {
          plansArray = data.data;
        }

        setPlans(plansArray);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
        setPlans([]); // Garantir que seja array mesmo em caso de erro
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  const searchMemberByEmail = async () => {
    if (!emailSearch.trim()) {
      alert('Digite um email para buscar');
      return;
    }

    setSearchingMember(true);
    setMemberFound(null);
    setMemberNotFound(false);

    try {
      const response = await fetch(`/api/members?email=${encodeURIComponent(emailSearch)}`);
      const data = await response.json();

      if (data.members && data.members.length > 0) {
        const member = data.members[0];
        setMemberFound(member);
        setFormData(prev => ({ ...prev, member_id: member.id }));
      } else {
        setMemberNotFound(true);
      }
    } catch (error) {
      console.error('Erro ao buscar membro:', error);
      alert('Erro ao buscar membro');
    } finally {
      setSearchingMember(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    if (!planId) {
      setFormData({
        ...formData,
        plan_id: '',
      });
      return;
    }

    const plan = Array.isArray(plans) ? plans.find(p => p.id === planId) : null;
    if (plan) {
      setFormData({
        ...formData,
        plan_id: planId,
        valor: plan.valor?.toString() || '',
        dias_acesso: plan.duracao_dias?.toString() || '30',
      });
    } else {
      setFormData({
        ...formData,
        plan_id: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.member_id) {
      alert('❌ Erro: Busque um membro pelo email primeiro');
      return;
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      alert('❌ Erro: Informe um valor válido maior que zero');
      return;
    }

    if (!formData.dias_acesso || parseInt(formData.dias_acesso) <= 0) {
      alert('❌ Erro: Informe os dias de acesso (deve ser maior que zero)');
      return;
    }

    try {
      setLoading(true);

      const diasAcesso = parseInt(formData.dias_acesso) || 30;
      const valor = parseFloat(formData.valor);

      // Calcular data de vencimento para incluir nos detalhes
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + diasAcesso);
      const dataVencimentoFormatada = dataVencimento.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const observacoesComVencimento = `Data de Vencimento Prevista: ${dataVencimentoFormatada}\n${formData.descricao || ''}`.trim();

      const payload = {
        member_id: formData.member_id,
        plan_id: formData.plan_id || null,
        valor: valor,
        dias_acesso: diasAcesso,
        descricao: formData.descricao || `Pagamento - ${diasAcesso} dias`,
        observacoes: observacoesComVencimento,
        data_pagamento: new Date().toISOString(),
        status: 'pendente',
      };

      console.log('Enviando pagamento:', payload);

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Pagamento criado com sucesso!');
        // Resetar formulário
        setFormData({
          member_id: '',
          plan_id: '',
          valor: '',
          dias_acesso: '30',
          descricao: '',
        });
        setMemberFound(null);
        setEmailSearch('');
      } else {
        console.error('Erro na resposta:', data);
        alert('❌ Erro ao criar pagamento:\n' + (data.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      alert('❌ Erro ao criar pagamento:\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = Array.isArray(plans) ? plans.find(p => p.id === formData.plan_id) : null;

  // Calcular data de vencimento baseada nos dias de acesso
  const calcularDataVencimento = () => {
    const dias = parseInt(formData.dias_acesso) || 30;
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + dias);
    return dataVencimento.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        {/* Busca de Membro */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Buscar Membro
          </h2>

          <div className="flex gap-3">
            <input
              type="email"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchMemberByEmail()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite o email do membro"
            />
            <button
              type="button"
              onClick={searchMemberByEmail}
              disabled={searchingMember}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {searchingMember ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* Membro Encontrado */}
          {memberFound && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Membro encontrado!</p>
                <p className="text-sm text-green-700 mt-1">
                  <strong>Nome:</strong> {memberFound.nome}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Email:</strong> {memberFound.email}
                </p>
                {memberFound.telefone && (
                  <p className="text-sm text-green-700">
                    <strong>Telefone:</strong> {memberFound.telefone}
                  </p>
                )}
                {memberFound.data_vencimento && (
                  <p className="text-sm text-blue-700 font-semibold mt-1">
                    <strong>Data de Vencimento Atual:</strong> {new Date(memberFound.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Membro Não Encontrado */}
          {memberNotFound && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Membro não encontrado</p>
                  <p className="text-sm text-red-700 mt-1">
                    Não existe nenhum membro cadastrado com o email: <strong>{emailSearch}</strong>
                  </p>
                </div>
              </div>
              <a
                href={`/novo-membro?redirect=/pagamentos-new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Novo Membro
              </a>
            </div>
          )}
        </div>

        {/* Formulário de Pagamento */}
        {memberFound && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Dados do Pagamento
            </h2>

            <div className="space-y-4">
              {/* Plano de Acesso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Plano de Acesso (opcional)
                </label>
                <select
                  value={formData.plan_id}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingPlans}
                >
                  <option value="">Sem plano - Inserir valores manualmente</option>
                  {Array.isArray(plans) && plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nome} - R$ {plan.valor?.toFixed(2)} ({plan.duracao_dias} dias)
                    </option>
                  ))}
                </select>
                {selectedPlan && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Plano selecionado: {selectedPlan.nome} - Os valores foram preenchidos automaticamente
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias de Acesso
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-700 font-medium">
                    {formData.dias_acesso} dias
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-200 bg-blue-50 rounded-lg text-blue-700 font-medium text-sm">
                    📅 {calcularDataVencimento()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Pagamento mensal de janeiro"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={() => {
                  setMemberFound(null);
                  setEmailSearch('');
                  setFormData({
                    member_id: '',
                    plan_id: '',
                    valor: '',
                    dias_acesso: '30',
                    descricao: '',
                  });
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Salvando...' : 'Criar Pagamento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
