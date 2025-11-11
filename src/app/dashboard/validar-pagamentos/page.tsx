'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, DollarSign, Calendar } from 'lucide-react';

interface CadastroPendente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  telegram_username?: string;
  plan_id?: string;
  plano_dias: number;
  valor_pago: number;
  status: string;
  comprovante_url?: string;
  comprovante_enviado_em?: string;
  created_at: string;
  plan?: {
    nome: string;
    valor: number;
  };
}

export default function ValidarPagamentosPage() {
  const [cadastros, setCadastros] = useState<CadastroPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprovanteModal, setComprovanteModal] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    buscarCadastrosPendentes();
  }, []);

  async function buscarCadastrosPendentes() {
    setLoading(true);
    try {
      const res = await fetch('/api/cadastro-pendente?status=comprovante_enviado');
      const data = await res.json();

      if (data.success) {
        setCadastros(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar cadastros:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAprovar(cadastro: CadastroPendente) {
    if (!confirm(`Aprovar pagamento de ${cadastro.nome}?`)) return;

    setProcessingId(cadastro.id);

    try {
      const res = await fetch('/api/validar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cadastro_id: cadastro.id,
          aprovado: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const mensagem = [
          data.message,
          data.data?.invite_link ? `\n\n🔗 Link: ${data.data.invite_link}` : '',
          data.data?.email_enviado ? '\n\n📧 Email enviado com sucesso!' : '\n\n⚠️ Erro ao enviar email, mas o link foi salvo.',
        ].join('');

        alert(mensagem);
        buscarCadastrosPendentes();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReprovar(cadastro: CadastroPendente) {
    const motivo = prompt('Motivo da reprovação:');
    if (!motivo) return;

    setProcessingId(cadastro.id);

    try {
      const res = await fetch('/api/validar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cadastro_id: cadastro.id,
          aprovado: false,
          motivo_reprovacao: motivo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const mensagem = [
          '❌ ' + data.message,
          data.data?.email_enviado ? '\n\n📧 Email de notificação enviado' : '\n\n⚠️ Erro ao enviar email de notificação',
        ].join('');

        alert(mensagem);
        buscarCadastrosPendentes();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('pt-BR');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Validar Pagamentos</h1>
        <p className="text-gray-600 mt-2">
          Aprovar ou reprovar comprovantes de pagamento PIX
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      ) : cadastros.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum comprovante pendente
          </h3>
          <p className="text-gray-600">
            Não há comprovantes aguardando validação no momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {cadastros.map((cadastro) => (
            <div
              key={cadastro.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {cadastro.nome}
                    </h3>
                    <p className="text-gray-600">{cadastro.email}</p>
                    {cadastro.telefone && (
                      <p className="text-gray-500 text-sm">{cadastro.telefone}</p>
                    )}
                    {cadastro.telegram_username && (
                      <p className="text-blue-600 text-sm">
                        @{cadastro.telegram_username}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 text-green-600 font-bold text-2xl">
                      <DollarSign className="w-6 h-6" />
                      R$ {cadastro.valor_pago.toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {cadastro.plano_dias} dias de acesso
                    </p>
                    {cadastro.plan && (
                      <p className="text-xs text-gray-500 mt-1">
                        Plano: {cadastro.plan.nome}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Cadastrado em:</p>
                    <p className="font-semibold">{formatDate(cadastro.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Comprovante enviado:</p>
                    <p className="font-semibold">
                      {cadastro.comprovante_enviado_em
                        ? formatDate(cadastro.comprovante_enviado_em)
                        : '-'}
                    </p>
                  </div>
                </div>

                {cadastro.comprovante_url && (
                  <div className="mb-4">
                    <button
                      onClick={() => setComprovanteModal(cadastro.comprovante_url!)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Comprovante
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAprovar(cadastro)}
                    disabled={processingId === cadastro.id}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {processingId === cadastro.id ? 'Processando...' : 'Aprovar'}
                  </button>
                  <button
                    onClick={() => handleReprovar(cadastro)}
                    disabled={processingId === cadastro.id}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Reprovar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para visualizar comprovante */}
      {comprovanteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setComprovanteModal(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Comprovante de Pagamento</h3>
              <button
                onClick={() => setComprovanteModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {comprovanteModal.endsWith('.pdf') ? (
                <iframe
                  src={comprovanteModal}
                  className="w-full h-[600px]"
                  title="Comprovante PDF"
                />
              ) : (
                <img
                  src={comprovanteModal}
                  alt="Comprovante"
                  className="max-w-full h-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
