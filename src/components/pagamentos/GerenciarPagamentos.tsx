'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Payment, Member, Plan } from '@/types';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  FileText,
  Eye,
  Ban,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Upload,
  Tag,
  Save,
  X,
} from 'lucide-react';

interface FormaPagamento {
  id: string;
  nome: string;
  tipo: string;
  chave_pix?: string;
  ativo: boolean;
}

interface PaymentFormData {
  member_id: string;
  plan_id: string;
  payment_method_id: string;
  valor: string;
  dias_acesso: string;
  descricao: string;
  observacoes: string;
  comprovante_url: string;
  pix_chave: string;
}

export default function GerenciarPagamentos() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [formData, setFormData] = useState<PaymentFormData>({
    member_id: '',
    plan_id: '',
    payment_method_id: '',
    valor: '',
    dias_acesso: '30',
    descricao: '',
    observacoes: '',
    comprovante_url: '',
    pix_chave: '',
  });

  useEffect(() => {
    loadPayments();
    loadMembers();
    loadPlans();
    loadFormasPagamento();
  }, [selectedStatus]);

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/members?limit=1000');
      const data = await response.json();
      if (response.ok) {
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      if (response.ok) {
        setPlans(data.plans || data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadFormasPagamento = async () => {
    try {
      const response = await fetch('/api/formas-pagamento');
      const data = await response.json();
      if (response.ok) {
        setFormasPagamento(data.formas || data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const url = selectedStatus === 'todos'
        ? '/api/payments'
        : `/api/payments?status=${selectedStatus}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setPayments(data.payments || []);
      } else {
        alert('Erro ao carregar pagamentos: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      alert('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payment: Payment) => {
    if (!confirm(`Aprovar pagamento de ${payment.member?.nome}?\n\nValor: R$ ${payment.valor}\nDias de acesso: ${payment.dias_acesso}`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: payment.id,
          action: 'approve',
          approved_by: 'Admin',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Pagamento aprovado!\n\nNova data de vencimento: ${new Date(data.new_expiry_date).toLocaleDateString('pt-BR')}`);
        setShowModal(false);
        loadPayments();
      } else {
        alert('Erro ao aprovar: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao aprovar pagamento:', error);
      alert('Erro ao aprovar pagamento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    if (!rejectReason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: selectedPayment.id,
          action: 'reject',
          rejected_by: 'Admin',
          motivo_rejeicao: rejectReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('❌ Pagamento rejeitado');
        setShowRejectModal(false);
        setShowModal(false);
        setRejectReason('');
        loadPayments();
      } else {
        alert('Erro ao rejeitar: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao rejeitar pagamento:', error);
      alert('Erro ao rejeitar pagamento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (payment: Payment) => {
    if (!confirm(`⚠️ ATENÇÃO: Deseja realmente EXCLUIR permanentemente este pagamento?\n\nMembro: ${payment.member?.nome}\nValor: R$ ${payment.valor}\n\nEsta ação NÃO pode ser desfeita!`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/payments?id=${payment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Pagamento excluído permanentemente do banco de dados');
        setShowModal(false);
        loadPayments();
      } else {
        const data = await response.json();
        alert('❌ Erro ao excluir: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      alert('❌ Erro ao excluir pagamento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações detalhadas
    if (!formData.member_id) {
      alert('❌ Erro: Selecione um membro');
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
      setActionLoading(true);

      // Buscar dados do plano se selecionado
      let diasAcesso = parseInt(formData.dias_acesso) || 30;
      let valor = parseFloat(formData.valor);

      if (formData.plan_id) {
        const plan = plans.find(p => p.id === formData.plan_id);
        if (plan) {
          diasAcesso = plan.duracao_dias || diasAcesso;
          valor = plan.valor || valor;
        }
      }

      // Calcular data de vencimento
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + diasAcesso);

      const payload = {
        member_id: formData.member_id,
        plan_id: formData.plan_id || null,
        payment_method_id: formData.payment_method_id || null,
        valor: valor,
        dias_acesso: diasAcesso,
        data_vencimento: dataVencimento.toISOString(),
        descricao: formData.descricao || `Pagamento - ${diasAcesso} dias`,
        observacoes: formData.observacoes || '',
        comprovante_url: formData.comprovante_url || null,
        pix_chave: formData.pix_chave || null,
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
        setShowFormModal(false);
        setFormData({
          member_id: '',
          plan_id: '',
          payment_method_id: '',
          valor: '',
          dias_acesso: '30',
          descricao: '',
          observacoes: '',
          comprovante_url: '',
          pix_chave: '',
        });
        loadPayments();
      } else {
        console.error('Erro na resposta:', data);
        alert('❌ Erro ao criar pagamento:\n' + (data.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      alert('❌ Erro ao criar pagamento:\n' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment) return;

    // Validações
    if (!formData.member_id) {
      alert('❌ Erro: Selecione um membro');
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
      setActionLoading(true);

      const payload = {
        id: selectedPayment.id,
        member_id: formData.member_id,
        plan_id: formData.plan_id || null,
        payment_method_id: formData.payment_method_id || null,
        valor: parseFloat(formData.valor),
        dias_acesso: parseInt(formData.dias_acesso),
        descricao: formData.descricao || '',
        observacoes: formData.observacoes || '',
        comprovante_url: formData.comprovante_url || null,
        pix_chave: formData.pix_chave || null,
      };

      console.log('Atualizando pagamento:', payload);

      const response = await fetch(`/api/payments?id=${selectedPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Pagamento atualizado com sucesso!');
        setEditMode(false);
        setShowModal(false);
        setSelectedPayment(null);
        setFormData({
          member_id: '',
          plan_id: '',
          payment_method_id: '',
          valor: '',
          dias_acesso: '30',
          descricao: '',
          observacoes: '',
          comprovante_url: '',
          pix_chave: '',
        });
        loadPayments();
      } else {
        console.error('Erro na resposta:', data);
        alert('❌ Erro ao atualizar pagamento:\n' + (data.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('Erro ao atualizar pagamento:', error);
      alert('❌ Erro ao atualizar pagamento:\n' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const startEditPayment = (payment: Payment) => {
    setFormData({
      member_id: payment.member_id,
      plan_id: payment.plan_id || '',
      payment_method_id: payment.payment_method_id || '',
      valor: payment.valor.toString(),
      dias_acesso: payment.dias_acesso.toString(),
      descricao: payment.descricao || '',
      observacoes: payment.observacoes || '',
      comprovante_url: payment.comprovante_url || '',
      pix_chave: payment.pix_chave || '',
    });
    setEditMode(true);
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      aprovado: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprovado' },
      rejeitado: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejeitado' },
      cancelado: { color: 'bg-gray-100 text-gray-800', icon: Ban, label: 'Cancelado' },
    };

    const badge = badges[status as keyof typeof badges] || badges.pendente;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const filteredPayments = payments;

  const stats = {
    total: payments.length,
    pendentes: payments.filter(p => p.status === 'pendente').length,
    aprovados: payments.filter(p => p.status === 'aprovado').length,
    rejeitados: payments.filter(p => p.status === 'rejeitado').length,
    valorTotal: payments
      .filter(p => p.status === 'aprovado')
      .reduce((sum, p) => sum + parseFloat(p.valor.toString()), 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Gerenciar Pagamentos
            </h2>
            <p className="text-gray-600">
              Aprove, rejeite ou visualize todos os pagamentos do sistema
            </p>
          </div>
          <button
            onClick={() => setShowFormModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Novo Pagamento
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{stats.aprovados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejeitados}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {stats.valorTotal.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="aprovado">Aprovados</option>
              <option value="rejeitado">Rejeitados</option>
              <option value="cancelado">Cancelados</option>
            </select>

            <button
              onClick={loadPayments}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Lista de Pagamentos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando pagamentos...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Membro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dias de Acesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {payment.member?.nome}
                            </div>
                            {payment.member?.email && (
                              <div className="text-sm text-gray-600">
                                {payment.member.email}
                              </div>
                            )}
                            {payment.member?.telegram_username && (
                              <div className="text-sm text-gray-500">
                                @{payment.member.telegram_username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {payment.plan?.nome || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          R$ {parseFloat(payment.valor.toString()).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {payment.dias_acesso} dias
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(() => {
                          // Extrair data de vencimento das observações
                          const match = payment.observacoes?.match(/Data de Vencimento Prevista: (\d{2}\/\d{2}\/\d{4})/);
                          if (match) {
                            return <span className="text-blue-600 font-medium">📅 {match[1]}</span>;
                          }
                          // Calcular data de vencimento baseada nos dias de acesso
                          const dataVenc = new Date();
                          dataVenc.setDate(dataVenc.getDate() + (payment.dias_acesso || 30));
                          return <span className="text-gray-500">~{dataVenc.toLocaleDateString('pt-BR')}</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              startEditPayment(payment);
                              setShowModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
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

      {/* Modal de Detalhes do Pagamento */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editMode ? 'Editar Pagamento' : 'Detalhes do Pagamento'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPayment(null);
                  setEditMode(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            {editMode ? (
              // Modo de Edição - Formulário
              <form onSubmit={handleUpdatePayment} className="p-6 space-y-6">
                {/* Membro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membro *
                  </label>
                  <select
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione um membro</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.nome} - @{member.telegram_username}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plano */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plano (opcional)
                  </label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sem plano específico</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nome} - R$ {plan.valor} ({plan.duracao_dias} dias)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formData.payment_method_id}
                    onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma forma</option>
                    {formasPagamento.filter(f => f.ativo).map((forma) => (
                      <option key={forma.id} value={forma.id}>
                        {forma.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valor e Dias */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dias de Acesso *
                    </label>
                    <input
                      type="number"
                      value={formData.dias_acesso}
                      onChange={(e) => setFormData({ ...formData, dias_acesso: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Pagamento mensal"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações adicionais..."
                  />
                </div>

                {/* Comprovante URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Comprovante
                  </label>
                  <input
                    type="url"
                    value={formData.comprovante_url}
                    onChange={(e) => setFormData({ ...formData, comprovante_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                {/* Chave PIX */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX Utilizada
                  </label>
                  <input
                    type="text"
                    value={formData.pix_chave}
                    onChange={(e) => setFormData({ ...formData, pix_chave: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>

                {/* Botões do Formulário */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            ) : (
              // Modo de Visualização
              <>
                <div className="p-6 space-y-6">
                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                  </div>

                  {/* Informações do Membro */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Membro
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Nome:</span> {selectedPayment.member?.nome}</p>
                      {selectedPayment.member?.email && (
                        <p><span className="font-medium">Email:</span> {selectedPayment.member.email}</p>
                      )}
                      {selectedPayment.member?.telegram_username && (
                        <p><span className="font-medium">Telegram:</span> @{selectedPayment.member.telegram_username}</p>
                      )}
                      {selectedPayment.member?.telefone && (
                        <p><span className="font-medium">Telefone:</span> {selectedPayment.member.telefone}</p>
                      )}
                    </div>
                  </div>

                  {/* Informações do Pagamento */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Valor</label>
                      <p className="mt-1 text-lg font-semibold text-green-600">
                        R$ {parseFloat(selectedPayment.valor.toString()).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Dias de Acesso</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {selectedPayment.dias_acesso} dias
                      </p>
                    </div>
                  </div>

                  {/* Plano */}
                  {selectedPayment.plan && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Plano</label>
                      <p className="mt-1 text-gray-900">{selectedPayment.plan.nome}</p>
                    </div>
                  )}

                  {/* Descrição */}
                  {selectedPayment.descricao && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Descrição</label>
                      <p className="mt-1 text-gray-900">{selectedPayment.descricao}</p>
                    </div>
                  )}

                  {/* Observações */}
                  {selectedPayment.observacoes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Observações</label>
                      <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedPayment.observacoes}</p>
                    </div>
                  )}

                  {/* Comprovante */}
                  {selectedPayment.comprovante_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Comprovante</label>
                      <img
                        src={selectedPayment.comprovante_url}
                        alt="Comprovante"
                        className="w-full max-w-md rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  {/* Datas */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data do Pagamento</label>
                      <p className="mt-1 text-gray-900">
                        {new Date(selectedPayment.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data de Vencimento</label>
                      <p className="mt-1 text-gray-900">
                        {(() => {
                          const match = selectedPayment.observacoes?.match(/Data de Vencimento Prevista: (\d{2}\/\d{2}\/\d{4})/);
                          if (match) return match[1];
                          const dataVenc = new Date();
                          dataVenc.setDate(dataVenc.getDate() + (selectedPayment.dias_acesso || 30));
                          return dataVenc.toLocaleDateString('pt-BR');
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Informações de Aprovação/Rejeição */}
                  {selectedPayment.status === 'aprovado' && selectedPayment.approved_by && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Aprovado por:</span> {selectedPayment.approved_by}
                      </p>
                      {selectedPayment.approved_at && (
                        <p className="text-sm text-green-800 mt-1">
                          <span className="font-medium">Data:</span> {new Date(selectedPayment.approved_at).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedPayment.status === 'rejeitado' && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      {selectedPayment.rejected_by && (
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Rejeitado por:</span> {selectedPayment.rejected_by}
                        </p>
                      )}
                      {selectedPayment.motivo_rejeicao && (
                        <p className="text-sm text-red-800 mt-1">
                          <span className="font-medium">Motivo:</span> {selectedPayment.motivo_rejeicao}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer com Ações */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedPayment(null);
                      setEditMode(false);
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Fechar
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditPayment(selectedPayment)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>

                    {selectedPayment.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => {
                            setShowRejectModal(true);
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Rejeitar
                        </button>
                        <button
                          onClick={() => handleApprove(selectedPayment)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading ? 'Aprovando...' : 'Aprovar'}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(selectedPayment)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Rejeição */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Rejeitar Pagamento</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Informe o motivo da rejeição do pagamento de <strong>{selectedPayment.member?.nome}</strong>:
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo da rejeição..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Pagamento */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Novo Pagamento</h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-6">
              {/* Membro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membro *
                </label>
                <select
                  value={formData.member_id}
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione um membro</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.nome} - @{member.telegram_username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Plano */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plano (opcional)
                </label>
                <select
                  value={formData.plan_id}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sem plano específico</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nome} - R$ {plan.valor} ({plan.duracao_dias} dias)
                    </option>
                  ))}
                </select>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={formData.payment_method_id}
                  onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione uma forma</option>
                  {formasPagamento.filter(f => f.ativo).map((forma) => (
                    <option key={forma.id} value={forma.id}>
                      {forma.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor e Dias */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias de Acesso *
                  </label>
                  <input
                    type="number"
                    value={formData.dias_acesso}
                    onChange={(e) => setFormData({ ...formData, dias_acesso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Pagamento mensal"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Observações adicionais..."
                />
              </div>

              {/* Comprovante URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Comprovante
                </label>
                <input
                  type="url"
                  value={formData.comprovante_url}
                  onChange={(e) => setFormData({ ...formData, comprovante_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="https://..."
                />
              </div>

              {/* Chave PIX */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave PIX Utilizada
                </label>
                <input
                  type="text"
                  value={formData.pix_chave}
                  onChange={(e) => setFormData({ ...formData, pix_chave: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {actionLoading ? 'Salvando...' : 'Salvar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
