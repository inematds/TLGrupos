'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MemberForm from '@/components/MemberForm';
import { UserPlus } from 'lucide-react';

function NovoMembroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleSuccess = (memberId?: string) => {
    if (redirectUrl) {
      const url = memberId ? `${redirectUrl}?member_id=${memberId}` : redirectUrl;
      setTimeout(() => router.push(url), 1500);
    } else {
      setTimeout(() => router.push('/membros'), 2000);
    }
  };

  return (
    <>
      {/* Header Info */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Cadastrar Novo Membro</h2>
        </div>
        <p className="text-gray-600">
          {redirectUrl
            ? 'Cadastre o membro e continue o cadastro de pagamento'
            : 'Preencha os dados para cadastrar um novo membro manualmente'
          }
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <MemberForm
          isOpen={true}
          onClose={() => router.push('/membros')}
          onSuccess={handleSuccess}
        />
      </div>
    </>
  );
}

export default function NovoMembro() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    }>
      <NovoMembroContent />
    </Suspense>
  );
}
