'use client';

import { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export default function PagamentosPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cadastrosPendentes, setCadastrosPendentes] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();

    // Auto-refresh a cada 60 segundos
    const interval = setInterval(() => {
      fetchData(false);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  async function fetchData(showLoading = true) {
    if (showLoading) setLoading(true);

    try {
      const res = await fetch('/api/cadastro-pendente?status=aguardando_pagamento');
      const data = await res.json();

      if (data.success) {
        setCadastrosPendentes(data.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar cadastros:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function processarPagamentos() {
    if (!confirm('Deseja processar os pagamentos pendentes agora?')) {
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch('/api/processar-pagamentos', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Processado com sucesso!\n\nProcessados: ${data.results.processados}\nErros: ${data.results.erros}`);
        await fetchData();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }

  function getHorasRestantes(expiraEm: string) {
    const expira = new Date(expiraEm);
    const agora = new Date();
    const diff = expira.getTime() - agora.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    return horas;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Pagamentos</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Cadastros aguardando confirmação de pagamento
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
              <button
                onClick={processarPagamentos}
                disabled={processing || cadastrosPendentes.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Processar Pagamentos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-7xl">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              <h3 className="text-sm font-medium text-yellow-900">Aguardando Pagamento</h3>
            </div>
            <p className="text-4xl font-bold text-yellow-600">
              {cadastrosPendentes.length}
            </p>
            <p className="text-sm text-yellow-700 mt-2">Cadastros pendentes</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900">Valor Total</h3>
            </div>
            <p className="text-4xl font-bold text-blue-600">
              R$ {cadastrosPendentes.reduce((acc, c) => acc + parseFloat(c.valor_pago || 0), 0).toFixed(2)}
            </p>
            <p className="text-sm text-blue-700 mt-2">Em pagamentos pendentes</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-6 h-6 text-green-600" />
              <h3 className="text-sm font-medium text-green-900">Auto-Processamento</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              Ativo
            </p>
            <p className="text-sm text-green-700 mt-2">Verificação a cada 30min</p>
          </div>
        </div>

        {/* Aviso Importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Como Funciona:</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li><strong>1.</strong> Cliente realiza cadastro e faz pagamento via PIX</li>
            <li><strong>2.</strong> Você importa o extrato bancário na tabela `pagamentos_banco`</li>
            <li><strong>3.</strong> Sistema verifica automaticamente (a cada 30min) ou clique em "Processar Pagamentos"</li>
            <li><strong>4.</strong> Quando encontrar um pagamento compatível, cria o membro e envia o link por email</li>
          </ol>
        </div>

        {/* Lista de Cadastros Pendentes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Cadastros Aguardando Pagamento</h2>
          </div>

          {cadastrosPendentes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-semibold">Nenhum cadastro pendente!</p>
              <p className="text-sm mt-2">Todos os pagamentos foram processados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cadastrado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Expira em
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cadastrosPendentes.map((cadastro) => {
                    const horasRestantes = getHorasRestantes(cadastro.expira_em);
                    const urgente = horasRestantes < 6;

                    return (
                      <tr key={cadastro.id} className={urgente ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cadastro.nome}</div>
                          {cadastro.telegram_username && (
                            <div className="text-xs text-gray-500">@{cadastro.telegram_username}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cadastro.email}</div>
                          {cadastro.telefone && (
                            <div className="text-xs text-gray-500">{cadastro.telefone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cadastro.plano_dias} dias
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">
                            R$ {parseFloat(cadastro.valor_pago).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(cadastro.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {urgente && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            <span className={`text-sm ${urgente ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                              {horasRestantes}h restantes
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-3">
            📋 Como Importar Pagamentos do Banco
          </h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <p><strong>Opção 1: Via SQL (Supabase)</strong></p>
            <pre className="bg-white border border-yellow-300 rounded p-3 text-xs overflow-x-auto mt-2">
{`INSERT INTO pagamentos_banco (data_pagamento, valor, nome_pagador, descricao)
VALUES
  ('2025-01-10 14:30:00', 29.90, 'João Silva', 'PIX Recebido'),
  ('2025-01-10 15:45:00', 49.90, 'Maria Santos', 'PIX Recebido');`}
            </pre>

            <p className="mt-4"><strong>Opção 2: Importar CSV (em desenvolvimento)</strong></p>
            <p>Upload de arquivo CSV com colunas: data_pagamento, valor, nome_pagador, descricao</p>
          </div>
        </div>
      </main>
    </div>
  );
}
