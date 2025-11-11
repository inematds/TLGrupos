'use client';

import { useState } from 'react';
import { RefreshCw, Users, Download, Upload } from 'lucide-react';

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function syncAdmins() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'admins',
          defaultExpiryDays: 30,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sincronização</h1>
              <p className="text-sm text-gray-500 mt-1">
                Importar membros do grupo Telegram
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-4xl">
        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sync Admins */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Sincronizar Administradores</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Importa automaticamente todos os administradores do grupo Telegram.
            </p>
            <button
              onClick={syncAdmins}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Sincronizar Agora
                </>
              )}
            </button>
          </div>

          {/* Manual Import */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Importar Lista</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Importar membros de um arquivo CSV ou lista de IDs.
            </p>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
            >
              Em Breve
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg border p-6 ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <h3
              className={`font-bold mb-4 ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {result.success ? '✅ Sincronização Concluída' : '❌ Erro na Sincronização'}
            </h3>

            {result.success && result.data && (
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>Total processados:</strong> {result.data.total}
                </p>
                <p className="text-green-700">
                  <strong>Criados:</strong> {result.data.created}
                </p>
                <p className="text-gray-700">
                  <strong>Já existiam:</strong> {result.data.skipped}
                </p>
                {result.data.errors > 0 && (
                  <p className="text-red-700">
                    <strong>Erros:</strong> {result.data.errors}
                  </p>
                )}
              </div>
            )}

            {!result.success && (
              <p className="text-red-700 text-sm">{result.error}</p>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">ℹ️ Informações</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• A sincronização busca apenas <strong>administradores</strong> do grupo</li>
            <li>
              • Membros regulares são cadastrados automaticamente quando interagem no grupo
            </li>
            <li>• Membros já cadastrados não serão duplicados</li>
            <li>• O vencimento padrão é <strong>30 dias</strong> a partir do cadastro</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
