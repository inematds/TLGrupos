'use client';

import { useState } from 'react';
import { UserPlus, Mail, Phone, CreditCard, CheckCircle } from 'lucide-react';
import PlanSelector from '@/components/PlanSelector';
import { Plan } from '@/types';

type Step = 'dados' | 'pagamento' | 'concluido';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('dados');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    telegram_username: '',
    plan_id: '',
  });

  async function handleSubmitDados(e: React.FormEvent) {
    e.preventDefault();

    // Validação básica
    if (!formData.nome || !formData.email) {
      alert('Preencha nome e email');
      return;
    }

    if (!formData.plan_id) {
      alert('Selecione um plano de acesso');
      return;
    }

    setStep('pagamento');
  }

  function handlePlanSelect(planId: string, plan: Plan) {
    setSelectedPlan(plan);
    setFormData({ ...formData, plan_id: planId });
  }

  async function handlePagamento(metodoPagamento: 'pix' | 'cartao') {
    setLoading(true);

    try {
      // Criar membro no banco
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          telegram_username: formData.telegram_username,
          plan_id: formData.plan_id, // Envia plan_id ao invés de dias_acesso
          origem: 'registro_publico',
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Se a API já retornou um inviteLink, usar ele
        if (data.inviteLink) {
          setInviteLink(data.inviteLink);
          setStep('concluido');
        } else {
          // Gerar link único (member_limit = 1, mesmo sem telegram_user_id)
          try {
            const linkRes = await fetch('/api/telegram/invite-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                member_id: data.data.id,
              }),
            });
            const linkData = await linkRes.json();

            if (linkData.success && linkData.link) {
              setInviteLink(linkData.link);
            } else {
              throw new Error('Não foi possível gerar link de convite');
            }
          } catch (err) {
            console.error('Erro ao gerar link:', err);
            alert('Erro ao gerar link de convite. Por favor, entre em contato com o suporte.');
          }
          setStep('concluido');
        }
      } else {
        alert(`Erro no cadastro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Cadastro - TLGrupos</h1>
          </div>
          <p className="text-blue-100">
            Preencha seus dados e tenha acesso ao grupo exclusivo
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
                    : step === 'concluido'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                2
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === 'concluido'
                    ? 'bg-green-500 text-white'
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
                  <p className="text-xs text-gray-500 mt-1">
                    Facilita a identificação no grupo
                  </p>
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
                Avançar para Pagamento →
              </button>
            </form>
          )}

          {/* Step 2: Pagamento */}
          {step === 'pagamento' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Forma de Pagamento
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                {selectedPlan && (
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Plano selecionado:</strong> {selectedPlan.nome} - R$ {selectedPlan.valor.toFixed(2)}
                    <span className="ml-2 text-xs">({selectedPlan.duracao_dias} dias)</span>
                  </p>
                )}
                <p className="text-sm text-blue-800">
                  <strong>Nome:</strong> {formData.nome}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Email:</strong> {formData.email}
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handlePagamento('pix')}
                  disabled={loading}
                  className="w-full p-6 border-2 border-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-between group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">Pagar com PIX</h3>
                      <p className="text-sm text-gray-600">
                        Aprovação instantânea
                      </p>
                    </div>
                  </div>
                  <div className="text-blue-600 font-bold text-xl">
                    {loading ? '...' : '→'}
                  </div>
                </button>

                <button
                  onClick={() => handlePagamento('cartao')}
                  disabled={loading}
                  className="w-full p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">Cartão de Crédito</h3>
                      <p className="text-sm text-gray-600">
                        Aprovação em até 24h
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-600 font-bold text-xl">
                    {loading ? '...' : '→'}
                  </div>
                </button>
              </div>

              <button
                onClick={() => setStep('dados')}
                disabled={loading}
                className="w-full mt-6 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                ← Voltar
              </button>
            </div>
          )}

          {/* Step 3: Concluído */}
          {step === 'concluido' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Cadastro Concluído!
              </h2>

              <p className="text-gray-600 mb-8">
                Seu cadastro foi realizado com sucesso! Clique no botão abaixo para entrar no grupo Telegram.
              </p>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-8 mb-6 text-white shadow-xl">
                <div className="text-center mb-4">
                  <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold mb-2">Tudo pronto!</h3>
                  <p className="text-green-100">Seu acesso está ativo</p>
                </div>
              </div>

              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-8 py-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xl text-center mb-4 transition-all hover:scale-105 shadow-lg"
              >
                🚀 Entrar no Grupo Agora
              </a>

              <button
                onClick={async () => {
                  try {
                    // Tentar Clipboard API primeiro
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      await navigator.clipboard.writeText(inviteLink);
                      alert('✅ Link copiado com sucesso!');
                    } else {
                      // Fallback: criar input temporário
                      const textArea = document.createElement('textarea');
                      textArea.value = inviteLink;
                      textArea.style.position = 'fixed';
                      textArea.style.left = '-999999px';
                      textArea.style.top = '-999999px';
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();

                      try {
                        document.execCommand('copy');
                        alert('✅ Link copiado com sucesso!');
                      } catch (err) {
                        console.error('Fallback falhou:', err);
                        alert('❌ Não foi possível copiar automaticamente.\n\nLink: ' + inviteLink);
                      } finally {
                        document.body.removeChild(textArea);
                      }
                    }
                  } catch (error) {
                    console.error('Erro ao copiar:', error);
                    // Último recurso: mostrar em prompt
                    prompt('Copie este link manualmente:', inviteLink);
                  }
                }}
                className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
              >
                📋 Copiar Link
              </button>

              {/* Mostrar o link visualmente para cópia manual */}
              <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Ou copie o link manualmente:</p>
                <code className="block text-xs text-gray-800 break-all bg-white p-3 rounded border border-gray-200 select-all">
                  {inviteLink}
                </code>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">💡 Dica:</h3>
                <p className="text-sm text-blue-800">
                  Abra este link no seu celular onde está instalado o Telegram. O link irá abrir automaticamente no app.
                </p>
              </div>

              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Importante:</strong> Este link é único e pode ser usado apenas uma vez. Não compartilhe com outras pessoas!
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-2">Link direto:</p>
                <p className="text-xs text-gray-400 break-all font-mono bg-gray-50 p-2 rounded">
                  {inviteLink}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
