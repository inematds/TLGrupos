'use client';

import { useState } from 'react';
import { Wallet, CreditCard, CheckCircle, List, Plus } from 'lucide-react';
import FormasPagamento from '@/components/pagamentos/FormasPagamento';
import ValidarPagamentos from '@/components/pagamentos/ValidarPagamentos';
import GerenciarPagamentos from '@/components/pagamentos/GerenciarPagamentos';
import NovoPagamento from '@/components/pagamentos/NovoPagamento';

type Tab = 'formas' | 'validar' | 'gerenciar' | 'novo';

export default function PagamentosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('gerenciar');

  const tabs = [
    {
      id: 'formas' as Tab,
      label: 'Formas de Pagamento',
      icon: CreditCard,
      description: 'Configurar métodos de pagamento',
    },
    {
      id: 'validar' as Tab,
      label: 'Validar Pagamentos',
      icon: CheckCircle,
      description: 'Aprovar comprovantes PIX',
    },
    {
      id: 'gerenciar' as Tab,
      label: 'Gerenciar Pagamentos',
      icon: List,
      description: 'CRUD completo de pagamentos',
    },
    {
      id: 'novo' as Tab,
      label: 'Novo Pagamento',
      icon: Plus,
      description: 'Cadastrar novo pagamento',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 ml-64">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Pagamentos</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gerenciar formas de pagamento, validações e registros
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 border-b-2 transition-colors
                    ${
                      isActive
                        ? 'border-green-600 text-green-600 font-semibold'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-sm">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="px-8 py-8 max-w-7xl mx-auto">
        {activeTab === 'formas' && <FormasPagamento />}
        {activeTab === 'validar' && <ValidarPagamentos />}
        {activeTab === 'gerenciar' && <GerenciarPagamentos />}
        {activeTab === 'novo' && <NovoPagamento />}
      </main>
    </div>
  );
}
