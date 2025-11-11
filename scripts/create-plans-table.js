#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const sql = `
-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    duracao_dias INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on ativo and ordem for faster queries
CREATE INDEX IF NOT EXISTS idx_plans_ativo_ordem ON public.plans(ativo, ordem);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policies (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'plans' AND policyname = 'Allow read access to all authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to all authenticated users"
            ON public.plans
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'plans' AND policyname = 'Allow full access to service role'
    ) THEN
        CREATE POLICY "Allow full access to service role"
            ON public.plans
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans
INSERT INTO public.plans (nome, descricao, valor, duracao_dias, ordem) VALUES
    ('Mensal', 'Acesso por 30 dias', 29.90, 30, 1),
    ('Trimestral', 'Acesso por 90 dias (economia de 15%)', 76.90, 90, 2),
    ('Semestral', 'Acesso por 180 dias (economia de 25%)', 134.90, 180, 3),
    ('Anual', 'Acesso por 365 dias (economia de 40%)', 215.00, 365, 4)
ON CONFLICT DO NOTHING;
`;

async function createPlansTable() {
  console.log('🔄 Criando tabela de planos...\n');

  try {
    // Execute SQL usando rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error.message);
      console.log('\n📋 Execute manualmente no Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/' + process.env.NEXT_PUBLIC_SUPABASE_URL.split('.')[0].split('//')[1] + '/editor');
      console.log('\n📝 SQL salvo em: /tmp/plans_migration.sql');
      const fs = require('fs');
      fs.writeFileSync('/tmp/plans_migration.sql', sql);
      process.exit(1);
    }

    console.log('✅ Tabela criada com sucesso!');

    // Verificar se foi criada
    const { data: plans, error: selectError } = await supabase
      .from('plans')
      .select('*');

    if (selectError) {
      console.error('⚠️  Erro ao verificar tabela:', selectError.message);
    } else {
      console.log(`\n📦 ${plans.length} planos inseridos:`);
      plans.forEach(p => console.log(`  - ${p.nome}: R$ ${p.valor} (${p.duracao_dias} dias)`));
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.log('\n📝 Execute este SQL manualmente no Supabase Dashboard > SQL Editor:\n');
    console.log(sql);
    process.exit(1);
  }
}

createPlansTable();
