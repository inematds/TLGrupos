'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import PlanSelector from './PlanSelector';
import { Plan } from '@/types';

interface MemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MemberForm({ isOpen, onClose, onSuccess }: MemberFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telegram_username: '',
    telegram_user_id: '',
    data_vencimento: '',
    plan_id: '',
    email: '',
    telefone: '',
    observacoes: '',
  });
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; inviteLink?: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePlanSelect = (planId: string, plan: Plan) => {
    setSelectedPlan(plan);
    setFormData((prev) => ({ ...prev, plan_id: planId }));

    // Calcular data de vencimento baseada no plano
    const hoje = new Date();
    const dataVencimento = new Date(hoje);
    dataVencimento.setDate(dataVencimento.getDate() + plan.duracao_dias);

    // Formatar como YYYY-MM-DD para o input date
    const dataFormatada = dataVencimento.toISOString().split('T')[0];
    setFormData((prev) => ({ ...prev, data_vencimento: dataFormatada }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Preparar dados para envio
      // Adiciona horário meio-dia UTC para evitar mudança de data devido a timezone
      const formatDateForSave = (dateStr: string) => {
        if (!dateStr) return dateStr;
        // Se já tem horário, mantém como está
        if (dateStr.includes('T')) return dateStr;
        // Se é apenas data (YYYY-MM-DD), adiciona meio-dia UTC
        return `${dateStr}T12:00:00.000Z`;
      };

      const dataToSend: any = {
        nome: formData.nome.trim(),
        data_vencimento: formatDateForSave(formData.data_vencimento),
      };

      // Adicionar plan_id se selecionado
      if (formData.plan_id) {
        dataToSend.plan_id = formData.plan_id;
      }

      // Adicionar campos opcionais se preenchidos
      if (formData.telegram_username.trim()) {
        dataToSend.telegram_username = formData.telegram_username.trim().replace('@', '');
      }

      if (formData.telegram_user_id.trim()) {
        dataToSend.telegram_user_id = parseInt(formData.telegram_user_id.trim());
      }

      if (formData.email.trim()) {
        dataToSend.email = formData.email.trim();
      }

      if (formData.telefone.trim()) {
        dataToSend.telefone = formData.telefone.trim();
      }

      if (formData.observacoes.trim()) {
        dataToSend.observacoes = formData.observacoes.trim();
      }

      // Enviar para API
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar membro');
      }

      // Sucesso
      setSuccess({
        message: result.message || 'Membro criado com sucesso!',
        inviteLink: result.inviteLink,
      });

      // Limpar formulário
      setFormData({
        nome: '',
        telegram_username: '',
        telegram_user_id: '',
        data_vencimento: '',
        plan_id: '',
        email: '',
        telefone: '',
        observacoes: '',
      });
      setSelectedPlan(null);

      // Notificar componente pai
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        nome: '',
        telegram_username: '',
        telegram_user_id: '',
        data_vencimento: '',
        plan_id: '',
        email: '',
        telefone: '',
        observacoes: '',
      });
      setSelectedPlan(null);
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Cadastrar Novo Membro</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-semibold mb-2">{success.message}</h3>
              {success.inviteLink && (
                <div className="mt-3">
                  <p className="text-sm text-green-700 mb-2">Link de convite gerado:</p>
                  <div className="bg-white border border-green-300 rounded p-3 flex items-center gap-2">
                    <code className="text-sm text-green-900 flex-1 break-all">
                      {success.inviteLink}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(success.inviteLink!)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Envie este link para o usuário entrar no grupo!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Campos Obrigatórios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informações Básicas *
            </h3>

            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="João Silva"
              />
            </div>

            {/* Seletor de Planos */}
            <div>
              <PlanSelector
                selectedPlanId={formData.plan_id}
                onSelect={handlePlanSelect}
                required
              />
              {selectedPlan && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Plano selecionado:</strong> {selectedPlan.nome} - R$ {selectedPlan.valor.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Data de vencimento calculada automaticamente: {formData.data_vencimento}
                  </p>
                </div>
              )}
            </div>

            {/* Data de Vencimento */}
            <div>
              <label
                htmlFor="data_vencimento"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Data de Vencimento {formData.plan_id ? '(calculada automaticamente)' : '*'}
              </label>
              <input
                type="date"
                id="data_vencimento"
                name="data_vencimento"
                value={formData.data_vencimento}
                onChange={handleChange}
                required
                readOnly={!!formData.plan_id}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.plan_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {formData.plan_id && (
                <p className="text-xs text-gray-500 mt-1">
                  Ajustada automaticamente baseada no plano selecionado. Para alterar, mude o plano ou desmarque-o.
                </p>
              )}
            </div>
          </div>

          {/* Campos do Telegram */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informações do Telegram
            </h3>
            <p className="text-sm text-gray-600">
              Preencha pelo menos um dos campos abaixo para gerar o link de convite
            </p>

            {/* Telegram User ID */}
            <div>
              <label
                htmlFor="telegram_user_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telegram User ID (numérico)
              </label>
              <input
                type="text"
                id="telegram_user_id"
                name="telegram_user_id"
                value={formData.telegram_user_id}
                onChange={handleChange}
                pattern="[0-9]*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123456789"
              />
              <p className="text-xs text-gray-500 mt-1">
                Necessário para gerar link de convite personalizado
              </p>
            </div>

            {/* Telegram Username */}
            <div>
              <label
                htmlFor="telegram_username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telegram Username
              </label>
              <input
                type="text"
                id="telegram_username"
                name="telegram_username"
                value={formData.telegram_username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="joaosilva (sem @)"
              />
            </div>
          </div>

          {/* Campos Opcionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informações Adicionais (opcional)
            </h3>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="joao@example.com"
              />
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+55 11 99999-9999"
              />
            </div>

            {/* Observações */}
            <div>
              <label
                htmlFor="observacoes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Observações
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas adicionais sobre o membro..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Cadastrando...
                </span>
              ) : (
                'Cadastrar Membro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
