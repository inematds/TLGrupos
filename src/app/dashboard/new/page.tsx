'use client';

import { useState } from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MemberForm from '@/components/MemberForm';

export default function NewMemberPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <UserPlus className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Membro</h1>
              <p className="text-sm text-gray-500 mt-1">
                Cadastrar manualmente um novo membro
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <MemberForm
            isOpen={showForm}
            onClose={() => router.push('/dashboard/members')}
            onSuccess={() => {
              setTimeout(() => router.push('/dashboard/members'), 2000);
            }}
          />
        </div>
      </main>
    </div>
  );
}
