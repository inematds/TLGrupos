'use client';

import { useState, useEffect } from 'react';
import { Trash2, Play, Clock, AlertTriangle, CheckCircle, UserX, Layers } from 'lucide-react';

export default function AutoRemovalPage() {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [schedule, setSchedule] = useState({ hour: '00', minute: '00' });
  const [expiredMembers, setExpiredMembers] = useState<any[]>([]);

  // Estados para grupos
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Novos estados para membros não cadastrados
  const [loadingUnregistered, setLoadingUnregistered] = useState(false);
  const [executingUnregistered, setExecutingUnregistered] = useState(false);
  const [resultUnregistered, setResultUnregistered] = useState<any>(null);
  const [unregisteredMembers, setUnregisteredMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchGroups();
    fetchExpiredMembers();
    fetchUnregisteredMembers();
  }, []);

  async function fetchGroups() {
    try {
      const res = await fetch('/api/telegram-groups?ativo=true');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    } finally {
      setLoadingGroups(false);
    }
  }

  async function fetchExpiredMembers() {
    setLoading(true);
    try {
      const res = await fetch('/api/members?status=ativo');
      const data = await res.json();

      if (data.success) {
        // Filtrar membros vencidos
        const now = new Date();
        const expired = data.data.filter((m: any) => {
          const expiryDate = new Date(m.data_vencimento);
          return expiryDate < now;
        });
        setExpiredMembers(expired);
      }
    } catch (error) {
      console.error('Erro ao buscar membros vencidos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function executeRemoval() {
    if (!confirm(`Tem certeza que deseja remover ${expiredMembers.length} membros vencidos agora?`)) {
      return;
    }

    setExecuting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/remove-expired', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      setResult(data);

      // Atualizar lista
      await fetchExpiredMembers();
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setExecuting(false);
    }
  }

  async function fetchUnregisteredMembers() {
    setLoadingUnregistered(true);
    try {
      const res = await fetch('/api/admin/remove-unregistered');
      const data = await res.json();

      if (data.success) {
        setUnregisteredMembers(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar membros não cadastrados:', error);
    } finally {
      setLoadingUnregistered(false);
    }
  }

  async function executeUnregisteredRemoval() {
    if (!confirm('Tem certeza que deseja remover todos os membros não cadastrados do grupo?')) {
      return;
    }

    setExecutingUnregistered(true);
    setResultUnregistered(null);

    try {
      const res = await fetch('/api/admin/remove-unregistered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      setResultUnregistered(data);

      // Atualizar listas
      await fetchUnregisteredMembers();
      await fetchExpiredMembers();
    } catch (error: any) {
      setResultUnregistered({ success: false, error: error.message });
    } finally {
      setExecutingUnregistered(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 ml-64">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Auto-Exclusão por Vencimento</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gerenciar remoção automática de membros vencidos
                </p>
              </div>
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

      <main className="px-8 py-8">
        {/* Configuração de Horário Global */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Horário de Auto-Remoção (Todos os Grupos)
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure o horário diário em que o sistema removerá automaticamente os membros vencidos de todos os grupos.
          </p>

          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário diário
              </label>
              <input
                type="time"
                value={`${schedule.hour}:${schedule.minute}`}
                onChange={(e) => {
                  const [hour, minute] = e.target.value.split(':');
                  setSchedule({ hour, minute });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => alert('⚙️ Para aplicar o horário:\n\nConfigure o cron job no sistema ou use o Vercel Cron (já configurado no vercel.json).\n\nO sistema executará automaticamente neste horário todos os dias.')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Salvar Horário
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            💡 O sistema removerá automaticamente membros vencidos de <strong>todos os grupos</strong> neste horário, um após o outro.
          </p>
        </div>

        {/* Lista de Grupos */}
        {loadingGroups ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <p className="text-gray-500">Carregando grupos...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg border border-yellow-300 p-6 mb-6">
            <p className="text-yellow-800">
              ⚠️ Nenhum grupo Telegram configurado. Configure um grupo primeiro.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Grupos Ativos</h2>
              <p className="text-sm text-gray-500 mt-1">
                A auto-remoção será executada em todos estes grupos no horário configurado acima
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {groups.map((group) => (
                <div key={group.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-900">
                      {group.nome}
                    </h3>
                    {group.ativo ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>ID:</strong>{' '}
                      <code className="bg-white px-2 py-1 rounded border border-gray-300 text-xs">
                        {group.telegram_group_id}
                      </code>
                    </p>
                    {group.descricao && (
                      <p className="text-xs text-gray-500">{group.descricao}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-sm font-medium text-red-900">Membros Vencidos</h3>
            </div>
            <p className="text-4xl font-bold text-red-600">
              {loading ? '...' : expiredMembers.length}
            </p>
            <p className="text-sm text-red-700 mt-2">Aguardando remoção</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900">Próxima Execução</h3>
            </div>
            <p className="text-4xl font-bold text-blue-600">
              {schedule.hour}:{schedule.minute}
            </p>
            <p className="text-sm text-blue-700 mt-2">Horário configurado</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-sm font-medium text-green-900">Status</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {executing ? 'Executando...' : 'Pronto'}
            </p>
            <p className="text-sm text-green-700 mt-2">
              {executing ? 'Aguarde...' : 'Sistema operacional'}
            </p>
          </div>
        </div>

        {/* Execute Now Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Executar Remoção Agora</h2>
              <p className="text-sm text-gray-600">
                Remove imediatamente todos os membros com data de vencimento expirada.
              </p>
            </div>
            <button
              onClick={executeRemoval}
              disabled={executing || expiredMembers.length === 0}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              {executing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Executando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Executar Agora ({expiredMembers.length})
                </>
              )}
            </button>
          </div>

          {expiredMembers.length === 0 && !loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-green-800 text-sm">
                ✅ Nenhum membro vencido encontrado. Sistema em dia!
              </p>
            </div>
          )}

          {/* Expired Members List */}
          {expiredMembers.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Membros que serão removidos:
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {expiredMembers.map((member) => {
                    const daysExpired = Math.abs(
                      Math.ceil(
                        (new Date(member.data_vencimento).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{member.nome}</p>
                          <p className="text-xs text-gray-500">
                            {member.telegram_username && `@${member.telegram_username} • `}
                            Vencido há {daysExpired} dia{daysExpired !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                          Vencido
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg border p-6 mb-6 ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <h3
              className={`font-bold text-lg mb-3 ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {result.success ? '✅ Remoção Concluída' : '❌ Erro na Remoção'}
            </h3>

            {result.success && result.data && (
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>Total processados:</strong> {result.data.count}
                </p>
                {result.data.results && (
                  <>
                    <p className="text-green-700">
                      <strong>Removidos com sucesso:</strong> {result.data.results.success}
                    </p>
                    {result.data.results.failed > 0 && (
                      <p className="text-red-700">
                        <strong>Falhas:</strong> {result.data.results.failed}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {!result.success && (
              <p className="text-red-700 text-sm">{result.error}</p>
            )}
          </div>
        )}

        {/* Remove Unregistered Members Section - Not Available */}
        <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-300 p-6 mb-6">
          <div className="flex items-start gap-4">
            <UserX className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Remover Não Cadastrados (Limitação da API)
              </h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>⚠️ Funcionalidade indisponível:</strong> A API do Telegram Bot não permite listar todos os membros de um grupo regular por questões de privacidade.
                </p>
                <p>
                  A API só permite:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Listar administradores do grupo</li>
                  <li>Ver informações de um membro específico (se souber o ID dele)</li>
                  <li>Monitorar novos membros quando eles entram</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-semibold text-blue-900 mb-2">💡 Alternativas disponíveis:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-blue-800">
                    <li><strong>Auto-Exclusão por Vencimento</strong> (acima) - Remove automaticamente membros com cadastro vencido</li>
                    <li><strong>Bot de Monitoramento</strong> - Implemente um bot que verifica novos membros ao entrarem e remove se não estiverem cadastrados</li>
                    <li><strong>Telegram User API</strong> - Requer autenticação com conta de usuário real (não bot) para acessar lista completa</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Como Funciona</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Verificação Diária</h3>
                <p className="text-sm text-gray-600">
                  O sistema verifica diariamente (no horário configurado) quais membros têm data
                  de vencimento expirada.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Remoção do Telegram</h3>
                <p className="text-sm text-gray-600">
                  Cada membro vencido é removido automaticamente do grupo Telegram usando a API do
                  bot.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Atualização do Status</h3>
                <p className="text-sm text-gray-600">
                  O status do membro é alterado para "vencido" no banco de dados e um log da ação
                  é registrado.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Execução Manual</h3>
                <p className="text-sm text-gray-600">
                  Você pode executar a remoção manualmente a qualquer momento usando o botão
                  "Executar Agora" acima.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cron Configuration Guide */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-3">
            ⚙️ Configurar Execução Automática
          </h3>

          <div className="space-y-4 text-sm text-yellow-800">
            <div>
              <p className="font-semibold mb-2">Opção 1: Crontab (Linux/Mac)</p>
              <pre className="bg-white border border-yellow-300 rounded p-3 text-xs overflow-x-auto">
                {`# Editar crontab
crontab -e

# Adicionar linha (executa à meia-noite):
0 0 * * * cd /caminho/para/TLGrupos && npm run cron:check-expired`}
              </pre>
            </div>

            <div>
              <p className="font-semibold mb-2">Opção 2: Vercel Cron (Produção)</p>
              <p>
                Já configurado no arquivo <code className="bg-white px-2 py-1 rounded">vercel.json</code>.
                Quando fizer deploy na Vercel, funcionará automaticamente à meia-noite.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">Opção 3: Manual via Script</p>
              <pre className="bg-white border border-yellow-300 rounded p-3 text-xs">
                npm run cron:check-expired
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
