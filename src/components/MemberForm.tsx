'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'EX'
];

interface MemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (memberId?: string) => void;
}

export default function MemberForm({ isOpen, onClose, onSuccess }: MemberFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telegram_username: '',
    telegram_user_id: '',
    email: '',
    telefone: '',
    cidade: '',
    uf: '',
    data_nascimento: '',
    data_vencimento: '2000-01-01',
    nicho: '',
    interesse: '',
    grupo_favorito: '',
    observacoes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; inviteLink?: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSend: any = {
        nome: formData.nome.trim(),
      };

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

      if (formData.cidade.trim()) {
        dataToSend.cidade = formData.cidade.trim();
      }

      if (formData.uf.trim()) {
        dataToSend.uf = formData.uf.trim().toUpperCase();
      }

      if (formData.data_nascimento.trim()) {
        dataToSend.data_nascimento = formData.data_nascimento.trim();
      }

      if (formData.nicho.trim()) {
        dataToSend.nicho = formData.nicho.trim();
      }

      if (formData.interesse.trim()) {
        dataToSend.interesse = formData.interesse.trim();
      }

      if (formData.grupo_favorito.trim()) {
        dataToSend.grupo_favorito = formData.grupo_favorito.trim();
      }

      if (formData.observacoes.trim()) {
        dataToSend.observacoes = formData.observacoes.trim();
      }

      // Adicionar data de vencimento (sempre envia, com valor padrão 01/01/2000)
      if (formData.data_vencimento) {
        dataToSend.data_vencimento = formData.data_vencimento;
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

      // Capturar ID do membro criado
      const memberId = result.member?.id || result.data?.id || result.id;

      // Limpar formulário
      setFormData({
        nome: '',
        telegram_username: '',
        telegram_user_id: '',
        email: '',
        telefone: '',
        cidade: '',
        uf: '',
        data_nascimento: '',
        data_vencimento: '2000-01-01',
        nicho: '',
        interesse: '',
        grupo_favorito: '',
        observacoes: '',
      });

      // Notificar componente pai com o ID do membro criado
      setTimeout(() => {
        onSuccess(memberId);
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
        email: '',
        telefone: '',
        cidade: '',
        uf: '',
        data_nascimento: '',
        data_vencimento: '2000-01-01',
        nicho: '',
        interesse: '',
        grupo_favorito: '',
        observacoes: '',
      });
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

            {/* Cidade e UF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label htmlFor="uf" className="block text-sm font-medium text-gray-700 mb-1">
                  UF
                </label>
                <select
                  id="uf"
                  name="uf"
                  value={formData.uf}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">--</option>
                  {UF_OPTIONS.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nicho */}
            <div>
              <label htmlFor="nicho" className="block text-sm font-medium text-gray-700 mb-1">
                Nicho / Área de Atuação
              </label>
              <input
                type="text"
                id="nicho"
                name="nicho"
                value={formData.nicho}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Marketing Digital, E-commerce..."
              />
            </div>

            {/* Interesse */}
            <div>
              <label htmlFor="interesse" className="block text-sm font-medium text-gray-700 mb-1">
                Principais Interesses
              </label>
              <textarea
                id="interesse"
                name="interesse"
                value={formData.interesse}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Conte sobre os principais interesses..."
              />
            </div>

            {/* Grupo Favorito */}
            <div>
              <label htmlFor="grupo_favorito" className="block text-sm font-medium text-gray-700 mb-1">
                Grupo Favorito
              </label>
              <input
                type="text"
                id="grupo_favorito"
                name="grupo_favorito"
                value={formData.grupo_favorito}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do grupo favorito no Telegram"
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
// Component for member form management
