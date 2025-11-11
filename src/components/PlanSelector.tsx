'use client';

import { useEffect, useState } from 'react';
import { Plan } from '@/types';
import { Check, Calendar, Tag } from 'lucide-react';

interface PlanSelectorProps {
  selectedPlanId?: string;
  onSelect: (planId: string, plan: Plan) => void;
  showLabel?: boolean;
  required?: boolean;
}

export default function PlanSelector({
  selectedPlanId,
  onSelect,
  showLabel = true,
  required = false
}: PlanSelectorProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarPlanos();
  }, []);

  async function buscarPlanos() {
    try {
      const res = await fetch('/api/plans?ativos=true');
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);

        // Se não houver plano selecionado e houver planos, selecionar o primeiro automaticamente
        if (!selectedPlanId && data.data.length > 0) {
          onSelect(data.data[0].id, data.data[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-sm font-medium text-gray-700">
            Selecione o Plano {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="text-center py-4 text-gray-500">Carregando planos...</div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-sm font-medium text-gray-700">
            Selecione o Plano {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="text-center py-4 text-red-500">
          Nenhum plano ativo disponível. Configure os planos primeiro.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700">
          Selecione o Plano {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id, plan)}
              className={`
                relative p-4 rounded-lg border-2 transition-all text-left
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h3 className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {plan.nome}
                  </h3>
                </div>

                <div className="text-2xl font-bold text-gray-900">
                  R$ {plan.valor.toFixed(2)}
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {plan.duracao_dias} dias
                </div>

                {plan.descricao && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {plan.descricao}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedPlanId && (
        <div className="text-xs text-gray-500 mt-2">
          <strong>Selecionado:</strong> {plans.find(p => p.id === selectedPlanId)?.nome}
        </div>
      )}
    </div>
  );
}
// Component for plan selection
