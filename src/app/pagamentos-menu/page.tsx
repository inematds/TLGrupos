'use client';

import Link from 'next/link';
import { CheckCircle, Upload, Zap, Settings, ArrowRight, Mail, Inbox as InboxIcon } from 'lucide-react';

export default function PagamentosMenuPage() {
  const opcoesPagamento = [
    {
      id: 1,
      titulo: 'Registro Direto',
      descricao: 'Acesso imediato sem necessidade de pagamento',
      icon: CheckCircle,
      cor: 'blue',
      link: '/register',
      recursos: [
        'Link de acesso instantâneo',
        'Sem validação de pagamento',
        'Ideal para testes ou convites',
        'Cadastro rápido'
      ]
    },
    {
      id: 2,
      titulo: 'PIX com Upload',
      descricao: 'Faça o pagamento e envie o comprovante via upload',
      icon: Upload,
      cor: 'yellow',
      link: '/register-pix-upload',
      recursos: [
        'Gera QR Code PIX',
        'Upload de comprovante no site',
        'Validação manual pelo admin',
        'Link enviado após aprovação'
      ]
    },
    {
      id: 3,
      titulo: 'PIX por Email',
      descricao: 'Envie o comprovante por email para validação',
      icon: Mail,
      cor: 'orange',
      link: '/register-pix-email',
      recursos: [
        'Gera QR Code PIX',
        'Cliente envia comprovante por email',
        'Email: inemapix@gmail.com',
        'Link enviado após validação'
      ]
    },
    {
      id: 4,
      titulo: 'PIX Automático via API',
      descricao: 'Confirmação instantânea via integração com banco',
      icon: Zap,
      cor: 'green',
      link: '/register-pix-auto',
      recursos: [
        'Confirmação em segundos',
        'Totalmente automatizado',
        'Sem intervenção manual',
        'Link liberado automaticamente'
      ],
      badge: 'Mais Rápido'
    },
    {
      id: 5,
      titulo: 'Email Automático do Banco',
      descricao: 'Sistema recebe emails do banco automaticamente',
      icon: InboxIcon,
      cor: 'teal',
      link: '/register-pix-banco',
      recursos: [
        'Banco envia email automático',
        'Sistema processa emails',
        'Valida e libera automaticamente',
        'Sem ação do cliente'
      ],
      badge: 'Automático'
    },
    {
      id: 6,
      titulo: 'Gerenciar Pagamentos',
      descricao: 'Dashboard para administradores validarem pagamentos',
      icon: Settings,
      cor: 'purple',
      link: '/dashboard/pagamentos',
      recursos: [
        'Validar comprovantes pendentes',
        'Visualizar extrato do banco',
        'Aprovar ou rejeitar pagamentos',
        'Enviar links manualmente'
      ]
    }
  ];

  const coresMap: any = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      icon: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700',
      badge: 'bg-orange-100 text-orange-800'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      badge: 'bg-green-100 text-green-800'
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-900',
      icon: 'text-teal-600',
      button: 'bg-teal-600 hover:bg-teal-700',
      badge: 'bg-teal-100 text-teal-800'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      icon: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      badge: 'bg-purple-100 text-purple-800'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💰 Opções de Cadastro e Pagamento
          </h1>
          <p className="text-gray-600">
            Escolha a melhor forma para cadastrar novos membros no grupo
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Cards de Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opcoesPagamento.map((opcao) => {
            const Icon = opcao.icon;
            const cores = coresMap[opcao.cor];

            return (
              <div
                key={opcao.id}
                className={`${cores.bg} ${cores.border} border-2 rounded-2xl p-8 transition-all hover:shadow-xl hover:scale-105 relative`}
              >
                {/* Badge (se tiver) */}
                {opcao.badge && (
                  <div className="absolute top-4 right-4">
                    <span className={`${cores.badge} text-xs font-bold px-3 py-1 rounded-full`}>
                      {opcao.badge}
                    </span>
                  </div>
                )}

                {/* Header do Card */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-4 ${cores.bg} rounded-xl`}>
                    <Icon className={`w-10 h-10 ${cores.icon}`} />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${cores.text}`}>
                      {opcao.titulo}
                    </h2>
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-gray-700 mb-6">
                  {opcao.descricao}
                </p>

                {/* Recursos */}
                <ul className="space-y-3 mb-8">
                  {opcao.recursos.map((recurso, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 ${cores.icon} flex-shrink-0 mt-0.5`} />
                      <span className="text-sm text-gray-700">{recurso}</span>
                    </li>
                  ))}
                </ul>

                {/* Botão */}
                <Link
                  href={opcao.link}
                  className={`${cores.button} text-white px-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors w-full`}
                >
                  {opcao.id === 6 ? 'Acessar Dashboard' : 'Iniciar Cadastro'}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Informações Adicionais */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            📋 Comparativo das Opções
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Método</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Velocidade</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Pagamento</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Automação</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Melhor Para</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-2 text-blue-700 font-medium">Direto</td>
                  <td className="py-3 px-2 text-center">⚡ Instantâneo</td>
                  <td className="py-3 px-2 text-center">❌ Não</td>
                  <td className="py-3 px-2 text-center">100%</td>
                  <td className="py-3 px-2 text-center">Testes/Convites</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 text-yellow-700 font-medium">PIX Upload</td>
                  <td className="py-3 px-2 text-center">🕐 Até 30min</td>
                  <td className="py-3 px-2 text-center">✅ Sim</td>
                  <td className="py-3 px-2 text-center">50%</td>
                  <td className="py-3 px-2 text-center">Controle Manual</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 text-orange-700 font-medium">PIX Email</td>
                  <td className="py-3 px-2 text-center">🕐 Até 1h</td>
                  <td className="py-3 px-2 text-center">✅ Sim</td>
                  <td className="py-3 px-2 text-center">40%</td>
                  <td className="py-3 px-2 text-center">Preferência Email</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 text-green-700 font-medium">PIX API</td>
                  <td className="py-3 px-2 text-center">⚡ Segundos</td>
                  <td className="py-3 px-2 text-center">✅ Sim</td>
                  <td className="py-3 px-2 text-center">100%</td>
                  <td className="py-3 px-2 text-center">Produção</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 text-teal-700 font-medium">Email Banco</td>
                  <td className="py-3 px-2 text-center">⚡ Minutos</td>
                  <td className="py-3 px-2 text-center">✅ Sim</td>
                  <td className="py-3 px-2 text-center">100%</td>
                  <td className="py-3 px-2 text-center">Scale</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 text-purple-700 font-medium">Dashboard</td>
                  <td className="py-3 px-2 text-center">⚙️ Manual</td>
                  <td className="py-3 px-2 text-center">➖ N/A</td>
                  <td className="py-3 px-2 text-center">0%</td>
                  <td className="py-3 px-2 text-center">Administração</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Guia Rápido */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-bold text-blue-900 mb-3">🎯 Para Clientes</h4>
            <p className="text-sm text-blue-800">
              Use <strong>PIX Automático</strong> para a melhor experiência! Pagamento confirmado em segundos
              e acesso liberado automaticamente.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h4 className="font-bold text-purple-900 mb-3">⚙️ Para Administradores</h4>
            <p className="text-sm text-purple-800">
              Use o <strong>Dashboard</strong> para validar pagamentos manualmente, visualizar comprovantes
              e gerenciar cadastros pendentes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
