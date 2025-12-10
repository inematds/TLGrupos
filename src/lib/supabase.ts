import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cliente público (frontend e API routes) - lazy initialization
let _supabase: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables');
      }
      _supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }
    return (_supabase as any)[prop];
  }
});

// Cliente com service role - lazy initialization via proxy
let _serviceSupabase: SupabaseClient | null = null;

const createServiceClient = (): SupabaseClient => {
  if (!_serviceSupabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
    }

    _serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _serviceSupabase;
};

// Proxy que permite "const supabase = getServiceSupabase()" no top-level sem falhar durante build
const serviceProxy = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (createServiceClient() as any)[prop];
  }
});

// getServiceSupabase() agora retorna um proxy que só inicializa quando usado
export const getServiceSupabase = (): SupabaseClient => serviceProxy;

// Export direto do proxy
export const serviceSupabase = serviceProxy;
