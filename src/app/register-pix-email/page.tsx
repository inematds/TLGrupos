'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, CheckCircle, Clock, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import { createStaticPix } from 'pix-utils';
import PlanSelector from '@/components/PlanSelector';
import { Plan } from '@/types';

type Step = 'dados' | 'pagamento' | 'aguardando';

export default function RegisterPixEmailPage() {
  const [step, setStep] = useState<Step>('dados');
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [cadastroId, setCadastroId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [emailComprovantes, setEmailComprovantes] = useState('');
  const [codigoReferencia, setCodigoReferencia] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    telegram_username: '',
    plan_id: '',
  });

  // Buscar planos disponíveis e configuração PIX
  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar planos
        const plansRes = await fetch('/api/plans?ativos=true');
        const plansData = await plansRes.json();
        if (plansData.success) {
          setPlans(plansData.data);
        }

        // Buscar configuração PIX
        const configRes = await fetch('/api/forma-pagamentos?tipo=pix&ativo=true');
        const configData = await configRes.json();
        if (configData.success && configData.data.length > 0) {
          const config = configData.data[0];
          setPixKey(config.chave_pix || '');
          setEmailComprovantes(config.email_comprovantes || '');
          setCodigoReferencia(config.codigo_referencia || '');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchData();
  }, []);

  function handlePlanSelect(planId: string, plan: Plan) {
    setSelectedPlan(plan);
    setFormData({ ...formData, plan_id: planId });
  }

  async function handleSubmitDados(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.nome || !formData.email) {
      alert('Preencha nome e email');
      return;
    }

    if (!formData.plan_id || !selectedPlan) {
      alert('Selecione um plano de acesso');
      return;
    }

    console.log('🔍 Dados ao submeter:', {
      pixKey,
      emailComprovantes,
      codigoReferencia,
      selectedPlan,
      plano_valor: selectedPlan?.valor
    });

    setStep('pagamento');
    generateQRCode();
  }

  async function generateQRCode() {
    if (!selectedPlan || !pixKey) {
      console.log('❌ Faltam dados:', { selectedPlan, pixKey });
      return;
    }

    const valor = selectedPlan.valor;
    const referencia = codigoReferencia || 'TLGRUPOS';

    console.log('📊 Gerando QR Code PIX com pix-utils:', {
      pixKey,
      valor,
      referencia,
      merchantName: 'TLGrupos',
      merchantCity: 'SAO PAULO'
    });

    try {
      // Usar biblioteca pix-utils para gerar payload correto
      const pixPayload = createStaticPix({
        merchantName: 'TLGrupos',
        merchantCity: 'SAO PAULO',
        pixKey: pixKey,
        infoAdicional: referencia,
        transactionAmount: valor,
      });

      if ('toBRCode' in pixPayload) {
        console.log('✅ Payload PIX gerado pela lib:', pixPayload.toBRCode());
        console.log('📱 Testando no app do banco - deve aparecer:');
        console.log('   Chave:', pixKey);
        console.log('   Valor: R$', valor.toFixed(2));

        const url = await QRCode.toDataURL(pixPayload.toBRCode());
        setQrCodeUrl(url);
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  }

  async function handleGerarPix() {
    if (!selectedPlan) return;

    setLoading(true);

    try {
      // Criar cadastro pendente
      const res = await fetch('/api/cadastro-pendente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          telegram_username: formData.telegram_username,
          plan_id: formData.plan_id,
          valor_pago: selectedPlan.valor,
          metodo_pagamento: 'pix',
          qr_code_pix: qrCodeUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCadastroId(data.data.id);
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

  async function copiarTexto(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      alert('Copiado!');
    } catch (error) {
      alert('Erro ao copiar');
    }
  }

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden p-8">
          <div className="text-center py-8 text-gray-500">Carregando configurações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-10 h-10" />
            <h1 className="text-3xl font-bold">PIX com Email</h1>
          </div>
          <p className="text-blue-100">
            Pague via PIX e envie o comprovante por email
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

                <div className="mt-6">
                  <PlanSelector
                    selectedPlanId={formData.plan_id}
                    onSelect={handlePlanSelect}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-8 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg"
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

              {qrCodeUrl && selectedPlan && (
                <div className="bg-white border-4 border-blue-600 rounded-lg p-6 mb-6 text-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-64 h-64 mx-auto mb-4"
                  />
                  <p className="text-sm text-gray-600 mb-2">Plano selecionado:</p>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedPlan.nome} ({selectedPlan.duracao_dias} dias)
                  </p>
                  <p className="text-sm text-gray-600 mb-2">Valor a pagar:</p>
                  <p className="text-3xl font-bold text-blue-600 mb-4">
                    R$ {selectedPlan.valor.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-3">Chave PIX:</h3>
                <div className="bg-white rounded p-3 border border-blue-300 flex justify-between items-center">
                  <p className="font-mono text-lg">{pixKey}</p>
                  <button
                    onClick={() => copiarTexto(pixKey)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </button>
                </div>
              </div>

              {/* Instruções para envio por email */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Mail className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-purple-900 mb-2">Envie o Comprovante por Email</h3>
                    <p className="text-sm text-purple-800 mb-3">
                      Após fazer o pagamento, envie o comprovante para:
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-3 border border-purple-200">
                  <label className="block text-xs font-medium text-purple-700 mb-2">
                    📧 Email para envio:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emailComprovantes}
                      readOnly
                      className="flex-1 px-3 py-2 bg-purple-50 border border-purple-300 rounded font-semibold text-purple-900"
                    />
                    <button
                      onClick={() => copiarTexto(emailComprovantes)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <label className="block text-xs font-medium text-purple-700 mb-2">
                    📝 Código de referência (mencione no email):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cadastroId ? cadastroId.slice(0, 8).toUpperCase() : 'Aguardando...'}
                      readOnly
                      className="flex-1 px-3 py-2 bg-purple-50 border border-purple-300 rounded font-mono font-bold text-purple-900"
                    />
                    {cadastroId && (
                      <button
                        onClick={() => copiarTexto(cadastroId.slice(0, 8).toUpperCase())}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs text-purple-700">
                  <p className="mb-1">✓ Anexe a imagem ou PDF do comprovante</p>
                  <p className="mb-1">✓ Envie do email: <strong>{formData.email}</strong></p>
                  <p>✓ Mencione seu código no assunto</p>
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
                  onClick={handleGerarPix}
                  disabled={loading}
                  className="flex-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Já Fiz o Pagamento →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Aguardando Email */}
          {step === 'aguardando' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-blue-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Cadastro Criado!
              </h2>

              <p className="text-gray-600 mb-8">
                Agora envie o comprovante de pagamento por email.
              </p>

              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-purple-900 mb-3 flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Próximos Passos:
                </h3>
                <ol className="text-left text-sm text-purple-800 space-y-2">
                  <li>1. Salve o comprovante de pagamento PIX</li>
                  <li>2. Envie por email para: <strong className="font-mono">{emailComprovantes}</strong></li>
                  <li>3. No assunto, coloque: <strong className="font-mono">{cadastroId.slice(0, 8).toUpperCase()}</strong></li>
                  <li>4. Envie do email: <strong>{formData.email}</strong></li>
                  <li>5. Nossa equipe irá validar em até 24 horas</li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  📧 Link de acesso será enviado para:
                </p>
                <p className="font-bold text-blue-900 text-lg">{formData.email}</p>
                <p className="text-xs text-blue-700 mt-3">
                  ⏱️ Aguarde a validação do comprovante (até 24 horas)
                </p>
              </div>

              <a
                href="/"
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
              >
                Voltar ao Início
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
