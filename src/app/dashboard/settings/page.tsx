'use client';

import { Settings, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-500 mt-1">Ajustes gerais do sistema</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-4xl">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Configurações Gerais</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias de Vencimento Padrão
              </label>
              <input
                type="number"
                defaultValue={30}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tempo padrão de acesso para novos membros
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Grupo
              </label>
              <input
                type="text"
                defaultValue="INEMA.Teste"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID do Grupo Telegram
              </label>
              <input
                type="text"
                defaultValue="-1002414487357"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Definido em .env.local</p>
            </div>
          </div>
        </div>

        {/* Bot Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Configurações do Bot</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Auto-Cadastro ao Entrar</h3>
                <p className="text-sm text-gray-600">
                  Cadastra automaticamente quando alguém entra no grupo
                </p>
              </div>
              <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Auto-Cadastro por Mensagem</h3>
                <p className="text-sm text-gray-600">
                  Cadastra quando membro envia mensagem no grupo
                </p>
              </div>
              <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Mensagem de Boas-Vindas</h3>
                <p className="text-sm text-gray-600">Envia mensagem ao cadastrar novo membro</p>
              </div>
              <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Comando /registrar</h3>
                <p className="text-sm text-gray-600">
                  Permite cadastro voluntário via comando
                </p>
              </div>
              <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informações do Sistema</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Versão:</span>
              <span className="font-mono text-gray-900">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Banco de Dados:</span>
              <span className="font-mono text-gray-900">Supabase</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bot Status:</span>
              <span className="text-green-600 font-semibold">✅ Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bot Username:</span>
              <span className="font-mono text-gray-900">@INEMATLGrupobot</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Node.js:</span>
              <span className="font-mono text-gray-900">v18.19.1</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            Salvar Alterações
          </button>
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Resetar
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Nota:</strong> Algumas configurações requerem reiniciar o bot para
            aplicar mudanças. Alterações em variáveis de ambiente (.env.local) requerem
            reiniciar o servidor também.
          </p>
        </div>
      </main>
    </div>
  );
}
