'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  UserPlus,
  RefreshCw,
  Settings,
  BarChart3,
  Bot,
  Bell,
  Trash2,
  UserCheck,
  DollarSign,
  CreditCard,
  UserCog,
  Link as LinkIcon,
  Tag,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      description: 'Visão geral',
    },
    {
      title: 'Membros',
      icon: Users,
      href: '/dashboard/members',
      description: 'Gerenciar membros',
    },
    {
      title: 'Novo Membro',
      icon: UserPlus,
      href: '/dashboard/new',
      description: 'Cadastrar manualmente',
    },
    {
      title: 'Inclusão no Grupo',
      icon: UserCog,
      href: '/dashboard/inclusao',
      description: 'Incluir membros no grupo',
    },
    {
      title: 'Convites',
      icon: LinkIcon,
      href: '/dashboard/convites',
      description: 'Histórico de convites',
    },
    {
      title: 'Planos de Acesso',
      icon: Tag,
      href: '/dashboard/planos',
      description: 'Gerenciar planos',
    },
    {
      title: 'Formas de Pagamento',
      icon: CreditCard,
      href: '/dashboard/formas-pagamento',
      description: 'Configurar pagamentos',
    },
    {
      title: 'Validar Pagamentos',
      icon: CheckCircle,
      href: '/dashboard/validar-pagamentos',
      description: 'Aprovar comprovantes PIX',
    },
    {
      title: 'Histórico de Cadastros',
      icon: FileText,
      href: '/dashboard/cadastros',
      description: 'Ver todos os cadastros',
    },
    {
      title: 'Estatísticas de Pagamento',
      icon: DollarSign,
      href: '/dashboard/pagamentos',
      description: 'Gerenciar e relatórios',
    },
    {
      title: 'Sincronização',
      icon: RefreshCw,
      href: '/dashboard/sync',
      description: 'Sincronizar com Telegram',
    },
    {
      title: 'Bot Auto-Registro',
      icon: Bot,
      href: '/dashboard/bot',
      description: 'Sistema de auto-cadastro',
    },
    {
      title: 'Auto-Exclusão',
      icon: Trash2,
      href: '/dashboard/auto-removal',
      description: 'Remover vencidos',
    },
    {
      title: 'Estatísticas',
      icon: BarChart3,
      href: '/dashboard/stats',
      description: 'Relatórios e gráficos',
    },
    {
      title: 'Notificações',
      icon: Bell,
      href: '/dashboard/notifications',
      description: 'Configurar alertas',
    },
    {
      title: 'Configurações',
      icon: Settings,
      href: '/dashboard/settings',
      description: 'Ajustes do sistema',
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
          {menuItems.map((item) => {
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
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-medium">TLGrupos v1.0</p>
          <p className="mt-1">Sistema de Gestão</p>
        </div>
      </div>
    </aside>
  );
}
