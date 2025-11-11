'use client';

import { Bell, CheckCircle, Clock } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configurar alertas e lembretes
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-4xl">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-medium text-gray-500">Notificações Ativas</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">3</p>
            <p className="text-xs text-green-600 mt-1">Configuradas</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-500">Próxima Execução</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">09:00</p>
            <p className="text-xs text-blue-600 mt-1">Amanhã</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-medium text-gray-500">Enviadas Hoje</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs text-purple-600 mt-1">Mensagens</p>
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Alerta de Vencimento (7 dias)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Notifica membros 7 dias antes do vencimento
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600 font-semibold">Ativa</span>
                <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Horário:</strong> 09:00 (diariamente)
              </p>
              <p>
                <strong>Canal:</strong> Telegram (mensagem privada)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Alerta de Vencimento (3 dias)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Notifica membros 3 dias antes do vencimento
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600 font-semibold">Ativa</span>
                <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Horário:</strong> 09:00 (diariamente)
              </p>
              <p>
                <strong>Canal:</strong> Telegram (mensagem privada)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Alerta de Vencimento (1 dia)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Notifica membros 1 dia antes do vencimento
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600 font-semibold">Ativa</span>
                <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Horário:</strong> 09:00 (diariamente)
              </p>
              <p>
                <strong>Canal:</strong> Telegram (mensagem privada)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Remoção Automática</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Remove automaticamente membros vencidos do grupo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600 font-semibold">Ativa</span>
                <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Horário:</strong> 00:00 (meia-noite, diariamente)
              </p>
              <p>
                <strong>Ação:</strong> Remove do Telegram + Atualiza status
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">ℹ️ Sobre as Notificações</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • As notificações são enviadas automaticamente via <strong>Cron Jobs</strong>
            </li>
            <li>• Membros recebem até 3 alertas antes do vencimento (7, 3 e 1 dia)</li>
            <li>
              • A remoção automática ocorre à meia-noite de cada dia
            </li>
            <li>• Configure os cron jobs no sistema operacional ou Vercel para ativar</li>
            <li>
              • Documentação: <code className="bg-white px-2 py-1 rounded">README.md</code>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
