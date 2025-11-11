'use client';

import { useState } from 'react';
import { UserPlus, Mail, Phone, CheckCircle, Clock, Inbox } from 'lucide-react';
import QRCode from 'qrcode';

type Step = 'dados' | 'pagamento' | 'aguardando';

export default function RegisterPixBancoPage() {
  const [step, setStep] = useState<Step>('dados');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [pixKey] = useState('inemapix@gmail.com');

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
    generateQRCode();
  }

  async function generateQRCode() {
    const planoSelecionado = planos[formData.plano as keyof typeof planos];
    const pixPayload = `00020126580014br.gov.bcb.pix0136${pixKey}52040000530398654${planoSelecionado.preco.toFixed(2)}5802BR5925Inema Vip6009SAO PAULO62070503***6304`;

    try {
      const url = await QRCode.toDataURL(pixPayload);
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
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
          qr_code_pix: qrCodeUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
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

  const planoSelecionado = planos[formData.plano as keyof typeof planos];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <Inbox className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Email Automático do Banco</h1>
          </div>
          <p className="text-teal-100">
            Sistema processa emails do banco automaticamente
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full mt-8 px-6 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold text-lg"
              >
                Ver Dados de Pagamento →
              </button>
            </form>
          )}

          {/* Step 2: Pagamento */}
          {step === 'pagamento' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Dados para Pagamento PIX
              </h2>

              {qrCodeUrl && (
                <div className="bg-white border-4 border-teal-600 rounded-lg p-6 mb-6 text-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-64 h-64 mx-auto mb-4"
                  />
                  <p className="text-sm text-gray-600 mb-2">Valor a pagar:</p>
                  <p className="text-3xl font-bold text-teal-600 mb-4">
                    R$ {planoSelecionado.preco.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-teal-900 mb-3">Chave PIX:</h3>
                <div className="bg-white rounded p-3 border border-teal-300">
                  <p className="font-mono text-lg text-center">{pixKey}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Inbox className="w-5 h-5" />
                  Validação Automática
                </h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>✨ <strong>Processamento totalmente automático!</strong></p>
                  <p>• Quando você fizer o pagamento, o banco enviará um email de confirmação automaticamente</p>
                  <p>• Nosso sistema recebe e processa esse email do banco</p>
                  <p>• O pagamento é validado automaticamente</p>
                  <p>• Você receberá o link de acesso sem nenhuma ação manual</p>
                  <p className="pt-2 font-semibold">⏱️ Tempo estimado: 5 a 15 minutos após o pagamento</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('dados')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleConfirmarPagamento}
                  disabled={loading}
                  className="flex-2 px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Já Fiz o Pagamento →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Aguardando */}
          {step === 'aguardando' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-teal-600 animate-pulse" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Aguardando Email do Banco
              </h2>

              <p className="text-gray-600 mb-8">
                Nosso sistema está monitorando os emails do banco automaticamente. Assim que recebermos a confirmação do pagamento, você receberá o link de acesso.
              </p>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Inbox className="w-6 h-6 text-teal-600" />
                  <h3 className="font-bold text-teal-900">Como Funciona</h3>
                </div>
                <ol className="text-sm text-teal-800 space-y-2 text-left">
                  <li>1. Banco envia email de confirmação → <strong>Automático</strong></li>
                  <li>2. Sistema processa o email → <strong>Automático</strong></li>
                  <li>3. Pagamento é validado → <strong>Automático</strong></li>
                  <li>4. Link é gerado e enviado → <strong>Automático</strong></li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-800">
                  📧 Link será enviado para: <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-green-800 mt-2">
                  ⏱️ Tempo estimado: 5 a 15 minutos
                </p>
                <p className="text-sm text-green-800 mt-2">
                  🤖 Processo 100% automático - sem intervenção humana
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
