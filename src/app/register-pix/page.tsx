'use client';

import { useState } from 'react';
import { UserPlus, Mail, Phone, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';

type Step = 'dados' | 'pagamento' | 'aguardando';

export default function RegisterPixPage() {
  const [step, setStep] = useState<Step>('dados');
  const [loading, setLoading] = useState(false);
  const [cadastroId, setCadastroId] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    telegram_username: '',
    plano: '30',
  });

  const planos = {
    '30': { dias: 30, preco: 29.90 },
    '60': { dias: 60, preco: 49.90 },
    '90': { dias: 90, preco: 69.90 },
    '365': { dias: 365, preco: 199.90 },
  };

  async function handleSubmitDados(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.nome || !formData.email) {
      alert('Preencha nome e email');
      return;
    }

    setStep('pagamento');
  }

  async function handleConfirmarPagamento() {
    setLoading(true);

    try {
      const planoSelecionado = planos[formData.plano as keyof typeof planos];

      // Criar cadastro pendente
      const res = await fetch('/api/cadastro-pendente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          telegram_username: formData.telegram_username,
          plano_dias: planoSelecionado.dias,
          valor_pago: planoSelecionado.preco,
          metodo_pagamento: 'pix',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCadastroId(data.data.id);
        setStep('aguardando');
      } else {
        alert(`Erro no cadastro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const planoSelecionado = planos[formData.plano as keyof typeof planos];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Cadastro com PIX</h1>
          </div>
          <p className="text-blue-100">
            Acesso ao grupo após confirmação de pagamento
          </p>
        </div>

        <div className="p-8">
          {/* Progress Bar */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === 'dados'
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-500 text-white'
                }`}
              >
                1
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === 'pagamento'
                    ? 'bg-blue-600 text-white'
                    : step === 'aguardando'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                2
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === 'aguardando'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                3
              </div>
            </div>
          </div>

          {/* Step 1: Dados */}
          {step === 'dados' && (
            <form onSubmit={handleSubmitDados}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Seus Dados
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    O link de acesso será enviado para este email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuário do Telegram (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.telegram_username}
                    onChange={(e) => setFormData({ ...formData, telegram_username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="@seuusuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plano de Acesso
                  </label>
                  <select
                    value={formData.plano}
                    onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">30 dias - R$ 29,90</option>
                    <option value="60">60 dias - R$ 49,90</option>
                    <option value="90">90 dias - R$ 69,90</option>
                    <option value="365">1 ano - R$ 199,90</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-8 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg"
              >
                Avançar para Pagamento →
              </button>
            </form>
          )}

          {/* Step 2: Pagamento PIX */}
          {step === 'pagamento' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Pagamento via PIX
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-3">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Nome:</strong> {formData.nome}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Plano:</strong> {planoSelecionado.dias} dias</p>
                  <p className="text-2xl font-bold text-blue-900 mt-4">
                    R$ {planoSelecionado.preco.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Dados para Pagamento PIX
                </h3>
                <div className="space-y-3 text-sm text-yellow-800">
                  <div className="bg-white rounded p-3 border border-yellow-300">
                    <p className="font-semibold mb-1">Chave PIX (Email):</p>
                    <p className="font-mono text-lg">pagamentos@seusite.com.br</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-yellow-300">
                    <p className="font-semibold mb-1">Valor exato:</p>
                    <p className="font-mono text-xl font-bold">R$ {planoSelecionado.preco.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-yellow-300">
                    <p className="font-semibold mb-1">Favorecido:</p>
                    <p>Sua Empresa LTDA</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Importante:</strong> Após realizar o pagamento, aguarde até 30 minutos
                  para a confirmação. O link de acesso será enviado automaticamente para o seu email
                  <strong> {formData.email}</strong>
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('dados')}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleConfirmarPagamento}
                  disabled={loading}
                  className="flex-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Já realizei o pagamento
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Aguardando Confirmação */}
          {step === 'aguardando' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Aguardando Confirmação
              </h2>

              <p className="text-gray-600 mb-8">
                Seu cadastro foi registrado! Assim que confirmarmos o pagamento, você receberá o link de acesso no email:
              </p>

              <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-6 mb-6">
                <p className="text-blue-900 font-semibold mb-2">Email cadastrado:</p>
                <p className="text-2xl font-bold text-blue-600">{formData.email}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Próximos Passos
                </h3>
                <ol className="space-y-3 text-sm text-yellow-800">
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">1.</span>
                    <span>Confira se o pagamento foi realizado corretamente</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">2.</span>
                    <span>Aguarde até 30 minutos para a confirmação automática</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">3.</span>
                    <span>Verifique sua caixa de entrada e spam no email</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">4.</span>
                    <span>Clique no link recebido para entrar no grupo</span>
                  </li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p><strong>ID do Cadastro:</strong> {cadastroId.substring(0, 8)}...</p>
                <p className="mt-2">Guarde este ID caso precise de suporte</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
