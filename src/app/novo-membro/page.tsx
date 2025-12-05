'use client';

import { useState } from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import MemberForm from '@/components/MemberForm';

export default function NewMemberPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const [showForm, setShowForm] = useState(true);

  const handleBack = () => {
    if (redirectUrl) {
      router.push(redirectUrl);
    } else {
      router.push('/members');
    }
  };

  const handleSuccess = (memberId?: string) => {
    if (redirectUrl) {
      // Redireciona de volta com o ID do membro criado
      const url = memberId ? `${redirectUrl}?member_id=${memberId}` : redirectUrl;
      setTimeout(() => router.push(url), 1500);
    } else {
      setTimeout(() => router.push('/members'), 2000);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <UserPlus className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Membro</h1>
              <p className="text-sm text-gray-500 mt-1">
                {redirectUrl
                  ? 'Cadastre o membro e continue o cadastro de pagamento'
                  : 'Cadastrar manualmente um novo membro'
                }
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <MemberForm
            isOpen={showForm}
            onClose={handleBack}
            onSuccess={handleSuccess}
          />
        </div>
      </main>
    </div>
  );
}
