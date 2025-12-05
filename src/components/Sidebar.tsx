'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  UserPlus,
  UserMinus,
  RefreshCw,
  Settings,
  BarChart3,
  Bot,
  Trash2,
  UserCheck,
  DollarSign,
  CreditCard,
  UserCog,
  Link as LinkIcon,
  Tag,
  CheckCircle,
  FileText,
  Layers,
  FormInput,
  Wallet,
  Plus,
  Bell,
  Activity
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Início',
      icon: Home,
      href: '/',
      description: 'Guia e tutoriais',
    },
    {
      title: 'Dashboard',
      icon: BarChart3,
      href: '/dashboard',
      description: 'Estatísticas e métricas',
    },
    {
      title: 'Notificações',
      icon: Bell,
      href: '/notificacoes',
      description: 'Monitor de notificações',
    },
    {
      title: 'Membros',
      icon: Users,
      href: '/membros',
      description: 'Gerenciar membros e cadastros',
    },
    // Seção de Pagamentos (consolidada)
    {
      title: 'Pagamentos',
      icon: Wallet,
      href: '/pagamentos-new',
      description: 'Gerenciar pagamentos e planos',
    },
    // Seção de Grupos (consolidada)
    {
      title: 'Grupos',
      icon: Layers,
      href: '/grupos',
      description: 'Gerenciar grupos e convites',
      section: 'bottom',
    },
    {
      title: 'Bot',
      icon: Bot,
      href: '/bot',
      description: 'Sistema de auto-cadastro',
      section: 'bottom',
    },
    {
      title: 'Configurações',
      icon: Settings,
      href: '/configuracoes',
      description: 'Ajustes do sistema',
      section: 'bottom',
    },
    {
      title: 'Status',
      icon: Activity,
      href: '/status',
      description: 'Diagnóstico do sistema',
      section: 'bottom',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">🤖 TLGrupos</h1>
        <p className="text-sm text-gray-500 mt-1">Gerenciamento Telegram</p>
      </div>

      {/* Menu */}
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.filter((item) => !item.section).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              </li>
            );
          })}

          {/* Separator */}
          <li className="py-3">
            <div className="border-t border-gray-200"></div>
          </li>

          {/* Bottom Section */}
          {menuItems.filter((item) => item.section === 'bottom').map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-medium">TLGrupos v1.2.1</p>
          <p className="mt-1">Sistema de Gestão</p>
        </div>
      </div>
    </aside>
  );
}
// Component for sidebar navigation - updated
