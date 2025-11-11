'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, CheckCircle, Loader2, Copy } from 'lucide-react';
import Image from 'next/image';

type Step = 'dados' | 'pagamento' | 'aguardando' | 'concluido';

export default function RegisterPixAutoPage() {
  const [step, setStep] = useState<Step>('dados');
  const [loading, setLoading] = useState(false);
  const [cadastroId, setCadastroId] = useState('');
  const [pixData, setPixData] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [checking, setChecking] = useState(false);

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

  // Verificar pagamento a cada 5 segundos quando estiver aguardando
  useEffect(() => {
    if (step === 'aguardando' && cadastroId) {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [step, cadastroId]);

  async function handleSubmitDados(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.nome || !formData.email) {
      alert('Preencha nome e email');
      return;
    }

    setStep('pagamento');
  }

  async function generatePixPayment() {
    setLoading(true);

    try {
      const planoSelecionado = planos[formData.plano as keyof typeof planos];

      // Criar cadastro e gerar PIX
      const res = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          telegram_username: formData.telegram_username,
          plano_dias: planoSelecionado.dias,
          valor: planoSelecionado.preco,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCadastroId(data.data.cadastro_id);
        setPixData(data.data.pix);
        setStep('aguardando');
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function checkPaymentStatus() {
    if (checking) return;

    setChecking(true);

    try {
      const res = await fetch(`/api/verificar-pagamento/${cadastroId}`);
      const data = await res.json();

      if (data.success && data.data.pago) {
        setInviteLink(data.data.invite_link);
        setStep('concluido');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
    } finally {
      setChecking(false);
    }
  }

  function copyPixCode() {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      alert('Código PIX copiado!');
    }
  }

  const planoSelecionado = planos[formData.plano as keyof typeof planos];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Cadastro PIX Automático</h1>
          </div>
          <p className="text-green-100">
            Pagamento confirmado automaticamente em segundos!
          </p>
        </div>

        <div className="p-8">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="seu@email.com"
                    />
                  </div>
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full mt-8 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
              >
                Gerar PIX para Pagamento →
              </button>
            </form>
          )}

          {/* Step 2: Pagamento PIX - Gerar */}
          {step === 'pagamento' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Confirmar Pedido
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-green-900 mb-3">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm text-green-800">
                  <p><strong>Nome:</strong> {formData.nome}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Plano:</strong> {planoSelecionado.dias} dias</p>
                  <p className="text-2xl font-bold text-green-900 mt-4">
                    R$ {planoSelecionado.preco.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>✨ Pagamento Automático:</strong> Após gerar o PIX, basta pagar que o sistema
                  confirma automaticamente em poucos segundos e libera seu acesso!
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
                  onClick={generatePixPayment}
                  disabled={loading}
                  className="flex-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    'Gerar PIX Agora'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Aguardando Pagamento */}
          {step === 'aguardando' && pixData && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Escaneie o QR Code para Pagar
              </h2>

              {/* QR Code */}
              <div className="bg-white border-4 border-green-600 rounded-lg p-6 mb-6">
                {pixData.qr_code_base64 && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-64 h-64"
                    />
                  </div>
                )}

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Valor a pagar:</p>
                  <p className="text-3xl font-bold text-green-600 mb-4">
                    R$ {planoSelecionado.preco.toFixed(2)}
                  </p>
                </div>

                {/* PIX Copia e Cola */}
                {pixData.payload && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 text-center">
                      Ou copie o código PIX:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={pixData.payload}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                      />
                      <button
                        onClick={copyPixCode}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status de Verificação */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mx-auto mb-3" />
                <p className="text-yellow-900 font-semibold mb-2">
                  Aguardando Pagamento...
                </p>
                <p className="text-sm text-yellow-800">
                  Verificando automaticamente a cada 5 segundos
                </p>
              </div>

              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 text-center">
                  ✅ Após o pagamento, você receberá o link de acesso automaticamente aqui e no email <strong>{formData.email}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Concluído */}
          {step === 'concluido' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Pagamento Confirmado!
              </h2>

              <p className="text-gray-600 mb-8">
                Seu pagamento foi confirmado automaticamente! Clique no botão abaixo para entrar no grupo.
              </p>

              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-8 py-5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-xl text-center mb-4 transition-all hover:scale-105 shadow-lg"
              >
                🚀 Entrar no Grupo Agora
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert('Link copiado!');
                }}
                className="w-full px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-semibold"
              >
                📋 Copiar Link
              </button>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 O link também foi enviado para o seu email: <strong>{formData.email}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
