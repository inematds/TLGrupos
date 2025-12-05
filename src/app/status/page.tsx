'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, Users, Bot, CreditCard, Settings, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function StatusPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    runHealthCheck();
  }, []);

  async function runHealthCheck() {
    setLoading(true);
    const results: HealthCheck[] = [];

    try {
      // 1. Verificar Stats
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();

      if (statsData.success) {
        results.push({
          name: 'Estatísticas',
          status: 'success',
          message: `${statsData.data.total_cadastros} cadastros, ${statsData.data.total_ativos} ativos`,
          details: statsData.data
        });

        // Avisar se há membros ativos vencidos
        if (statsData.data.ativos_mas_vencidos > 0) {
          results.push({
            name: 'Membros Ativos Vencidos',
            status: 'warning',
            message: `${statsData.data.ativos_mas_vencidos} membros ativos mas vencidos`,
            details: { count: statsData.data.ativos_mas_vencidos }
          });
        }
      } else {
        results.push({
          name: 'Estatísticas',
          status: 'error',
          message: 'Erro ao buscar estatísticas'
        });
      }

      // 2. Verificar Membros
      const membersRes = await fetch('/api/members?limit=1');
      const membersData = await membersRes.json();

      if (membersData.success) {
        results.push({
          name: 'API de Membros',
          status: 'success',
          message: 'Respondendo corretamente'
        });
      } else {
        results.push({
          name: 'API de Membros',
          status: 'error',
          message: 'Erro ao acessar membros'
        });
      }

      // 3. Verificar Pagamentos
      const paymentsRes = await fetch('/api/payments?limit=1');
      const paymentsData = await paymentsRes.json();

      if (paymentsRes.ok && paymentsData.payments) {
        const pendingRes = await fetch('/api/payments?status=pendente');
        const pendingData = await pendingRes.json();
        const pendingCount = pendingData.payments?.length || 0;

        results.push({
          name: 'Sistema de Pagamentos',
          status: pendingCount > 0 ? 'warning' : 'success',
          message: pendingCount > 0
            ? `${pendingCount} pagamentos pendentes de aprovação`
            : 'Nenhum pagamento pendente',
          details: { pending: pendingCount }
        });
      } else {
        results.push({
          name: 'Sistema de Pagamentos',
          status: 'error',
          message: 'Erro ao acessar pagamentos'
        });
      }

      // 4. Verificar Grupos Telegram
      const groupsRes = await fetch('/api/telegram-groups');
      const groupsData = await groupsRes.json();

      if (groupsData.success) {
        results.push({
          name: 'Grupos Telegram',
          status: 'success',
          message: `${groupsData.data.length} grupos configurados`,
          details: { count: groupsData.data.length }
        });
      } else {
        results.push({
          name: 'Grupos Telegram',
          status: 'error',
          message: 'Erro ao buscar grupos'
        });
      }

      // 5. Verificar variáveis de ambiente (client-side check)
      const envVars = [
        { name: 'SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
      ];

      const missingEnv = envVars.filter(v => !v.value);
      if (missingEnv.length === 0) {
        results.push({
          name: 'Variáveis de Ambiente',
          status: 'success',
          message: 'Configurações OK'
        });
      } else {
        results.push({
          name: 'Variáveis de Ambiente',
          status: 'error',
          message: `${missingEnv.length} variáveis não configuradas`
        });
      }

    } catch (error: any) {
      results.push({
        name: 'Sistema',
        status: 'error',
        message: `Erro geral: ${error.message}`
      });
    }

    setChecks(results);
    setLastUpdate(new Date());
    setLoading(false);
  }

  const successCount = checks.filter(c => c.status === 'success').length;
  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;

  const overallStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Status do Sistema</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Diagnóstico de saúde da aplicação
                </p>
              </div>
            </div>
            <button
              onClick={runHealthCheck}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Verificando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-6xl mx-auto">
        {/* Status Geral */}
        <div className={`rounded-xl shadow-lg p-8 mb-8 ${
          overallStatus === 'success' ? 'bg-gradient-to-br from-green-500 to-green-600' :
          overallStatus === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
          'bg-gradient-to-br from-red-500 to-red-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {overallStatus === 'success' ? '🟢 Sistema Operacional' :
                 overallStatus === 'warning' ? '🟡 Sistema com Avisos' :
                 '🔴 Sistema com Problemas'}
              </h2>
              <p className="text-lg opacity-90">
                {successCount} testes OK • {warningCount} avisos • {errorCount} erros
              </p>
              {lastUpdate && (
                <p className="text-sm opacity-75 mt-2">
                  Última verificação: {lastUpdate.toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            {overallStatus === 'success' ? (
              <CheckCircle className="w-20 h-20 opacity-80" />
            ) : overallStatus === 'warning' ? (
              <AlertTriangle className="w-20 h-20 opacity-80" />
            ) : (
              <XCircle className="w-20 h-20 opacity-80" />
            )}
          </div>
        </div>

        {/* Checks Detalhados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {checks.map((check, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                check.status === 'success' ? 'border-green-500' :
                check.status === 'warning' ? 'border-yellow-500' :
                'border-red-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {check.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <h3 className="font-semibold text-gray-900">{check.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{check.message}</p>

                  {check.details && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-xs font-mono">
                      <pre className="text-gray-700 overflow-x-auto">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && checks.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Executando verificações...</p>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Sobre este Diagnóstico</h3>
          <p className="text-sm text-blue-800">
            Este painel verifica a saúde de todos os componentes críticos do sistema:
            estatísticas, APIs, pagamentos, grupos Telegram e configurações.
            Clique em "Atualizar" para executar uma nova verificação.
          </p>
        </div>
      </main>
    </div>
  );
}
