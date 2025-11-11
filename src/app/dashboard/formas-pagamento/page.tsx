'use client';

import { useState, useEffect } from 'react';
import { CreditCard, QrCode, Mail, Upload, CheckCircle, UserPlus, Tag, Calendar, DollarSign } from 'lucide-react';
import { Plan } from '@/types';

export default function PagamentosPage() {
  const [pixKey, setPixKey] = useState('inemapix@gmail.com');
  const [saved, setSaved] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    buscarPlanos();
  }, []);

  async function buscarPlanos() {
    try {
      const res = await fetch('/api/plans?ativos=true');
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoadingPlans(false);
    }
  }

  const formasPagamento = [
    {
      id: 'registro-direto',
      nome: 'Registro Direto',
      icone: UserPlus,
      descricao: 'Acesso imediato sem necessidade de pagamento. Ideal para testes ou convites.',
      status: 'ativo',
      link: '/register',
      cor: 'green',
    },
    {
      id: 'pix-qrcode',
      nome: 'PIX com Envio por Email',
      icone: QrCode,
      descricao: 'Cliente paga e envia comprovante para um email específico',
      status: 'ativo',
      link: '/register-pix-email',
      cor: 'blue',
    },
    {
      id: 'pix-automatico',
      nome: 'PIX Automático (API)',
      icone: CheckCircle,
      descricao: 'Integração com API do banco valida pagamento automaticamente',
      status: 'em-breve',
      link: '/cadastro/pix-automatico',
      cor: 'green',
    },
    {
      id: 'pix-upload',
      nome: 'PIX com Upload',
      icone: Upload,
      descricao: 'Cliente anexa comprovante diretamente no formulário',
      status: 'ativo',
      link: '/register-pix-upload',
      cor: 'purple',
    },
    {
      id: 'email-manual',
      nome: 'Email Manual',
      icone: Mail,
      descricao: 'Cliente envia comprovante por email e admin valida manualmente',
      status: 'ativo',
      link: '#',
      cor: 'orange',
    },
  ];

  function getStatusBadge(status: string) {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'em-breve':
        return 'bg-yellow-100 text-yellow-800';
      case 'inativo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  function getIconColor(cor: string) {
    const cores: any = {
      green: 'text-green-500',
      blue: 'text-blue-500',
      purple: 'text-purple-500',
      orange: 'text-orange-500',
    };
    return cores[cor] || 'text-gray-500';
  }

  function salvarConfiguracao() {
    // Aqui você salvaria no banco via API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Formas de Pagamento</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerencie as opções de pagamento disponíveis para cadastro
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar ao Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-7xl mx-auto">
        {/* Planos Disponíveis */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Tag className="w-6 h-6 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Planos Disponíveis</h2>
            </div>
            <a
              href="/dashboard/planos"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Gerenciar Planos →
            </a>
          </div>

          {loadingPlans ? (
            <div className="text-center py-8 text-gray-500">Carregando planos...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum plano ativo cadastrado.
              <a href="/dashboard/planos" className="ml-2 text-blue-600 hover:underline">
                Criar primeiro plano
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 transition-colors bg-purple-50"
                >
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{plan.nome}</h3>
                  <div className="flex items-baseline mb-3">
                    <span className="text-3xl font-bold text-purple-600">
                      R$ {plan.valor.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                      {plan.duracao_dias} dias de acesso
                    </div>
                    {plan.descricao && (
                      <p className="text-xs text-gray-500">{plan.descricao}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 text-center pt-2 border-t border-purple-200">
                    Use este valor no pagamento
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configuração PIX */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Configuração PIX</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX (Email)
              </label>
              <input
                type="email"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="seuemail@exemplo.com"
              />
            </div>
            <button
              onClick={salvarConfiguracao}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar Configuração
            </button>
            {saved && (
              <div className="text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Configuração salva com sucesso!
              </div>
            )}
          </div>
        </div>

        {/* Grid de Formas de Pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {formasPagamento.map((forma) => {
            const Icon = forma.icone;
            return (
              <div
                key={forma.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4"
                style={{ borderColor: `var(--${forma.cor}-500)` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Icon className={`w-8 h-8 ${getIconColor(forma.cor)} mr-3`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{forma.nome}</h3>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getStatusBadge(
                          forma.status
                        )}`}
                      >
                        {forma.status === 'ativo' ? '✓ Ativo' : '⏳ Em Breve'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{forma.descricao}</p>

                {forma.status === 'ativo' ? (
                  <div className="flex gap-2">
                    <a
                      href={forma.link}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Acessar
                    </a>
                    {forma.id !== 'email-manual' && (
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        Configurar
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm"
                  >
                    Em Desenvolvimento
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Informações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-900 mb-3">
            💡 Como funcionam as formas de pagamento
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>1. PIX com QR Code:</strong>
              <p className="ml-4">
                Cliente visualiza QR Code e chave PIX na tela, realiza o pagamento e envia
                comprovante por email. Admin valida e libera acesso.
              </p>
            </div>
            <div>
              <strong>2. PIX Automático (API):</strong>
              <p className="ml-4">
                Integração direta com API do banco. Pagamento validado automaticamente e
                acesso liberado instantaneamente.
              </p>
            </div>
            <div>
              <strong>3. PIX com Upload:</strong>
              <p className="ml-4">
                Cliente anexa comprovante diretamente no formulário de cadastro. Admin
                valida e libera acesso.
              </p>
            </div>
            <div>
              <strong>4. Email Manual:</strong>
              <p className="ml-4">
                Cliente realiza pagamento e envia comprovante para o email configurado. Admin
                valida manualmente.
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pagamentos Pendentes</p>
            <p className="text-2xl font-bold text-orange-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Aprovados Hoje</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total do Mês</p>
            <p className="text-2xl font-bold text-blue-600">R$ 0,00</p>
          </div>
        </div>
      </main>
    </div>
  );
}
