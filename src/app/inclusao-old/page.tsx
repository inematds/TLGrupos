'use client';

import { useEffect, useState } from 'react';
import { Member } from '@/types';
import { UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function InclusaoPage() {
  const [membrosElegiveis, setMembrosElegiveis] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [horarioAgendado, setHorarioAgendado] = useState('09:00');

  useEffect(() => {
    buscarMembrosElegiveis();
    buscarConfiguracao();
  }, []);

  async function buscarMembrosElegiveis() {
    setLoading(true);
    try {
      const res = await fetch('/api/inclusao/elegiveis');
      const data = await res.json();
      if (data.success) {
        setMembrosElegiveis(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  }

  async function buscarConfiguracao() {
    try {
      const res = await fetch('/api/inclusao/config');
      const data = await res.json();
      if (data.success && data.data?.horario) {
        setHorarioAgendado(data.data.horario);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    }
  }

  async function incluirTodos() {
    if (!confirm(`Confirma a inclusão de ${membrosElegiveis.length} membros no grupo?`)) {
      return;
    }

    setProcessando(true);
    setResultado(null);

    try {
      const res = await fetch('/api/inclusao/executar', {
        method: 'POST',
      });
      const data = await res.json();
      setResultado(data);

      // Atualizar lista
      await buscarMembrosElegiveis();
    } catch (error) {
      console.error('Erro ao incluir membros:', error);
      setResultado({
        success: false,
        error: 'Erro ao processar inclusão',
      });
    } finally {
      setProcessando(false);
    }
  }

  async function salvarHorario() {
    try {
      const res = await fetch('/api/inclusao/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horario: horarioAgendado }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Horário agendado salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      alert('Erro ao salvar horário');
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ml-64">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inclusão no Grupo</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerenciar inclusão automática de membros no Telegram
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
        {/* Aviso - API não disponível */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                ⚠️ Funcionalidade Temporariamente Indisponível
              </h3>
              <p className="text-yellow-800 mb-3">
                Esta funcionalidade requer a tabela <code className="bg-yellow-100 px-2 py-1 rounded text-sm">configs</code> no banco de dados, que ainda não foi criada.
              </p>
              <div className="bg-yellow-100 border border-yellow-300 rounded p-4 mt-3">
                <p className="text-sm text-yellow-900 font-semibold mb-2">Para habilitar esta funcionalidade:</p>
                <ol className="text-sm text-yellow-800 space-y-1 ml-4">
                  <li>1. Crie a tabela <code className="bg-yellow-200 px-1 rounded">configs</code> no Supabase</li>
                  <li>2. Adicione os campos necessários para configuração de horários</li>
                  <li>3. Recarregue esta página</li>
                </ol>
              </div>
              <p className="text-xs text-yellow-700 mt-3">
                <strong>Nota:</strong> Por enquanto, use a página <a href="/dashboard/grupos" className="underline hover:text-yellow-900">Grupos Telegram</a> para gerenciar membros manualmente.
              </p>
            </div>
          </div>
        </div>
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <UserPlus className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Prontos para Inclusão</p>
                <p className="text-3xl font-bold text-blue-600">{membrosElegiveis.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Horário Agendado</p>
                <p className="text-2xl font-bold text-green-600">{horarioAgendado}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={incluirTodos}
              disabled={processando || membrosElegiveis.length === 0}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {processando ? 'Processando...' : `Incluir Todos (${membrosElegiveis.length})`}
            </button>
          </div>
        </div>

        {/* Resultado da operação */}
        {resultado && (
          <div className={`mb-6 p-4 rounded-lg ${resultado.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start">
              {resultado.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              )}
              <div className="flex-1">
                <h3 className={`font-medium ${resultado.success ? 'text-green-900' : 'text-red-900'}`}>
                  {resultado.success ? 'Inclusão Concluída!' : 'Erro na Inclusão'}
                </h3>
                {resultado.results && (
                  <div className="mt-2 text-sm">
                    <p className="text-green-700">✓ Incluídos com sucesso: {resultado.results.success}</p>
                    <p className="text-red-700">✗ Falhas: {resultado.results.failed}</p>
                    {resultado.results.errors?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-800">Erros:</p>
                        <ul className="list-disc list-inside">
                          {resultado.results.errors.map((err: any, idx: number) => (
                            <li key={idx} className="text-red-600 text-xs">
                              {err.nome}: {err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {resultado.error && (
                  <p className="mt-1 text-sm text-red-700">{resultado.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Configuração de horário */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⏰ Agendamento Automático</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário diário para inclusão automática
              </label>
              <input
                type="time"
                value={horarioAgendado}
                onChange={(e) => setHorarioAgendado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={salvarHorario}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Salvar Horário
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            O sistema incluirá automaticamente os membros elegíveis todos os dias neste horário.
          </p>
        </div>

        {/* Tabela de membros elegíveis */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Membros Elegíveis para Inclusão
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Membros ativos com Telegram que ainda não entraram no grupo
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telegram ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data de Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {membrosElegiveis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Nenhum membro elegível</p>
                      <p className="text-sm">Todos os membros ativos já estão no grupo!</p>
                    </td>
                  </tr>
                ) : (
                  membrosElegiveis.map((membro) => (
                    <tr key={membro.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{membro.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {membro.telegram_username ? `@${membro.telegram_username}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{membro.telegram_user_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(membro.data_entrada)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(membro.data_vencimento)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Critérios de Inclusão</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Membro com status <strong>ativo</strong></li>
            <li>Possui Telegram User ID cadastrado</li>
            <li>Ainda não está no grupo (sem histórico de entrada)</li>
            <li>Data de vencimento não expirada</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
