'use client';

import { useState } from 'react';
import { Users, UserPlus, FormInput, List } from 'lucide-react';
import GerenciarMembros from '@/components/membros/GerenciarMembros';
import NovoMembro from '@/components/membros/NovoMembro';
import CadastroPublico from '@/components/membros/CadastroPublico';

type Tab = 'gerenciar' | 'novo' | 'cadastro';

export default function MembrosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('novo');

  const tabs = [
    {
      id: 'gerenciar' as Tab,
      label: 'Gerenciar Membros',
      icon: List,
      description: 'Ver e gerenciar membros',
    },
    {
      id: 'novo' as Tab,
      label: 'Novo Membro',
      icon: UserPlus,
      description: 'Cadastrar manualmente',
    },
    {
      id: 'cadastro' as Tab,
      label: 'Cadastro Público',
      icon: FormInput,
      description: 'Formulário de cadastro',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 ml-64">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Membros</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gerenciar membros, cadastros e formulários
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
                        ? 'border-blue-600 text-blue-600 font-semibold'
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
      <main className="px-8 py-8">
        {activeTab === 'gerenciar' && <GerenciarMembros />}
        {activeTab === 'novo' && <NovoMembro />}
        {activeTab === 'cadastro' && <CadastroPublico />}
      </main>
    </div>
  );
}
