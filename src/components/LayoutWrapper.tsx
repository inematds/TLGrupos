'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

const publicRoutes = [
  '/cadastro',
  '/register',
  '/register-pix',
  '/register-pix-auto',
  '/register-pix-banco',
  '/register-pix-email',
  '/register-pix-upload',
];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Verificar se é rota pública (não deve mostrar Sidebar)
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    // Página pública - sem Sidebar
    return <>{children}</>;
  }

  // Página privada - com Sidebar
  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
}
