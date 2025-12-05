'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GerenciarMembros() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar automaticamente para a página /members
    router.push('/members');
  }, [router]);

  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para gerenciamento de membros...</p>
      </div>
    </div>
  );
}
