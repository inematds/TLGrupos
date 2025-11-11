'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Upload as UploadIcon, CheckCircle, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import PlanSelector from '@/components/PlanSelector';
import { Plan } from '@/types';

type Step = 'dados' | 'pagamento' | 'upload' | 'aguardando';

export default function RegisterPixUploadPage() {
  const [step, setStep] = useState<Step>('dados');
  const [loading, setLoading] = useState(false);
  const [cadastroId, setCadastroId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [pixKey] = useState('inemapix@gmail.com');
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    telegram_username: '',
    plan_id: '',
  });

  // Buscar planos disponíveis
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans?ativos=true');
        const data = await res.json();
        if (data.success) {
          setPlans(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
      }
    }
    fetchPlans();
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

    setStep('pagamento');
    generateQRCode();
  }

  async function generateQRCode() {
    if (!selectedPlan) return;

    // Gerar QR Code PIX (simplificado - idealmente usar biblioteca específica)
    const valor = selectedPlan.valor.toFixed(2);
    const pixPayload = `00020126580014br.gov.bcb.pix0136${pixKey}52040000530398654${valor}5802BR5925TLGrupos6009SAO PAULO62070503***6304`;

    try {
      const url = await QRCode.toDataURL(pixPayload);
      setQrCodeUrl(url);
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
        setStep('upload');
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadComprovante() {
    if (!comprovante) {
      alert('Selecione um comprovante');
      return;
    }

    setLoading(true);

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.readAsDataURL(comprovante);

      reader.onload = async () => {
        const base64 = reader.result as string;

        // Enviar comprovante
        const res = await fetch('/api/enviar-comprovante', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cadastro_id: cadastroId,
            comprovante_base64: base64,
            filename: comprovante.name,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setStep('aguardando');
        } else {
          alert(`Erro: ${data.error}`);
        }

        setLoading(false);
      };

      reader.onerror = () => {
        alert('Erro ao ler arquivo');
        setLoading(false);
      };
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-600 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <UploadIcon className="w-10 h-10" />
            <h1 className="text-3xl font-bold">PIX com Upload</h1>
          </div>
          <p className="text-yellow-100">
            Pague via PIX e envie o comprovante
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full mt-8 px-6 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold text-lg"
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
                <div className="bg-white border-4 border-yellow-600 rounded-lg p-6 mb-6 text-center">
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
                  <p className="text-3xl font-bold text-yellow-600 mb-4">
                    R$ {selectedPlan.valor.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-yellow-900 mb-3">Chave PIX:</h3>
                <div className="bg-white rounded p-3 border border-yellow-300">
                  <p className="font-mono text-lg text-center">{pixKey}</p>
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
                  className="flex-2 px-8 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Já Fiz o Pagamento →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload */}
          {step === 'upload' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Enviar Comprovante
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <p className="text-yellow-900">
                  <strong>⚠️ Importante:</strong> Envie uma foto ou print do comprovante de pagamento PIX.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
                <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setComprovante(e.target.files?.[0] || null)}
                  className="hidden"
                  id="comprovante-upload"
                />
                <label
                  htmlFor="comprovante-upload"
                  className="cursor-pointer inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold"
                >
                  Selecionar Arquivo
                </label>
                {comprovante && (
                  <p className="mt-4 text-sm text-gray-600">
                    ✓ Arquivo selecionado: {comprovante.name}
                  </p>
                )}
              </div>

              <button
                onClick={handleUploadComprovante}
                disabled={loading || !comprovante}
                className="w-full px-8 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Comprovante'}
              </button>
            </div>
          )}

          {/* Step 4: Aguardando */}
          {step === 'aguardando' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Comprovante Enviado!
              </h2>

              <p className="text-gray-600 mb-8">
                Seu comprovante foi recebido e está em análise. Você receberá o link de acesso por email em até 30 minutos.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-sm text-yellow-800">
                  📧 Link será enviado para: <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  ⏱️ Tempo estimado: até 30 minutos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
