import { getServiceSupabase } from './supabase';

/**
 * Retorna a URL configurada para a página de pagamento PIX
 * Se payment_externo = true, usa a URL configurada
 * Caso contrário, usa a URL interna do sistema
 */
export async function getPaymentPixUrl(cadastroId?: string): Promise<string> {
  const supabase = getServiceSupabase();

  // Buscar configurações
  const { data: configs } = await supabase
    .from('system_config')
    .select('chave, valor')
    .in('chave', ['payment_pix_url', 'payment_externo']);

  const paymentExternoConfig = configs?.find((c) => c.chave === 'payment_externo');
  const paymentPixUrlConfig = configs?.find((c) => c.chave === 'payment_pix_url');

  // Se usar URL externa e tiver configurada
  if (paymentExternoConfig?.valor === 'true' && paymentPixUrlConfig?.valor) {
    const url = new URL(paymentPixUrlConfig.valor);
    if (cadastroId) {
      url.searchParams.set('cadastro_id', cadastroId);
    }
    return url.toString();
  }

  // Usar URL interna
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://157.180.72.42';
  const path = '/register-pix-upload';

  if (cadastroId) {
    return `${baseUrl}${path}?cadastro_id=${cadastroId}`;
  }

  return `${baseUrl}${path}`;
}

/**
 * Retorna a URL configurada para o menu de pagamentos
 */
export async function getPaymentMenuUrl(): Promise<string> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://157.180.72.42';
  return `${baseUrl}/pagamentos-menu`;
}

/**
 * Retorna a URL para registro direto (sem pagamento)
 */
export async function getRegisterDirectUrl(): Promise<string> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://157.180.72.42';
  return `${baseUrl}/register`;
}
