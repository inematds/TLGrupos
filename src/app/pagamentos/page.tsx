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

export default function GerenciarPagamentosPage() {
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gerenciar Pagamentos
            </h1>
            <p className="text-gray-600">
              Aprove, rejeite ou visualize todos os pagamentos do sistema
            </p>
          </div>
          <Link
            href="/novo-pagamento"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Novo Pagamento
          </Link>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalhes do Pagamento
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-6">
                {getStatusBadge(selectedPayment.status)}
              </div>

              {/* Informações */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Membro</label>
                  <p className="text-lg text-gray-900 font-semibold">{selectedPayment.member?.nome}</p>
                  {selectedPayment.member?.email && (
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <span className="font-medium">Email:</span> {selectedPayment.member.email}
                    </p>
                  )}
                  {selectedPayment.member?.telegram_username && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <span className="font-medium">Telegram:</span> @{selectedPayment.member.telegram_username}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor</label>
                    <p className="text-lg text-green-600 font-semibold">
                      R$ {parseFloat(selectedPayment.valor.toString()).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Dias de Acesso</label>
                    <p className="text-lg text-gray-900">{selectedPayment.dias_acesso} dias</p>
                  </div>
                </div>

                {selectedPayment.plan && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plano</label>
                    <p className="text-lg text-gray-900">{selectedPayment.plan.nome}</p>
                  </div>
                )}

                {selectedPayment.descricao && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <p className="text-gray-900">{selectedPayment.descricao}</p>
                  </div>
                )}

                {selectedPayment.observacoes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Detalhes</label>
                    <p className="text-gray-900 whitespace-pre-line">{selectedPayment.observacoes}</p>
                  </div>
                )}

                {selectedPayment.comprovante_url && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Comprovante</label>
                    <a
                      href={selectedPayment.comprovante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      Ver comprovante
                    </a>
                  </div>
                )}

                {selectedPayment.pix_chave && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chave PIX</label>
                    <p className="text-gray-900 font-mono">{selectedPayment.pix_chave}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data do Pagamento</label>
                    <p className="text-gray-900">
                      {selectedPayment.data_pagamento
                        ? new Date(selectedPayment.data_pagamento).toLocaleString('pt-BR')
                        : '-'}
                    </p>
                  </div>

                  {selectedPayment.data_aprovacao && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Aprovação</label>
                      <p className="text-gray-900">
                        {new Date(selectedPayment.data_aprovacao).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {selectedPayment.aprovado_por && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Aprovado por</label>
                      <p className="text-gray-900">{selectedPayment.aprovado_por}</p>
                    </div>
                  )}

                  {selectedPayment.data_expiracao && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vencimento do Acesso</label>
                      <p className="text-gray-900">
                        {new Date(selectedPayment.data_expiracao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {selectedPayment.motivo_rejeicao && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-red-500">Motivo da Rejeição</label>
                      <p className="text-gray-900 bg-red-50 p-3 rounded border border-red-200">
                        {selectedPayment.motivo_rejeicao}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações */}
              {selectedPayment.status === 'pendente' && (
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    onClick={() => handleApprove(selectedPayment)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {actionLoading ? 'Aprovando...' : 'Aprovar Pagamento'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPayment)}
                    disabled={actionLoading}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Excluir
                  </button>
                </div>
              )}

              {/* Botão de Excluir para outros status */}
              {selectedPayment.status !== 'pendente' && (
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPayment)}
                    disabled={actionLoading}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Rejeitar Pagamento
            </h3>
            <p className="text-gray-600 mb-4">
              Informe o motivo da rejeição:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              placeholder="Ex: Comprovante ilegível, valor incorreto, etc."
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulário - Novo Pagamento */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitPayment} className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Novo Pagamento
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                {/* Membro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membro *
                  </label>
                  <select
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um membro</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.nome} {member.telegram_username ? `(@${member.telegram_username})` : ''}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sem plano específico</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nome} - R$ {plan.valor} ({plan.duracao_dias} dias)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Dias de Acesso */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dias de Acesso *
                    </label>
                    <input
                      type="number"
                      value={formData.dias_acesso}
                      onChange={(e) => setFormData({ ...formData, dias_acesso: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30"
                      required
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento (opcional)
                  </label>
                  <select
                    value={formData.payment_method_id}
                    onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione a forma de pagamento</option>
                    {formasPagamento.map((forma) => (
                      <option key={forma.id} value={forma.id}>
                        {forma.nome} ({forma.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chave PIX */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.pix_chave}
                    onChange={(e) => setFormData({ ...formData, pix_chave: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                  />
                </div>

                {/* URL do Comprovante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Comprovante (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.comprovante_url}
                    onChange={(e) => setFormData({ ...formData, comprovante_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Pagamento mensal de janeiro"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {actionLoading ? 'Salvando...' : 'Criar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
