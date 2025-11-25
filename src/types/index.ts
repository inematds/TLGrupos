// Types e Interfaces do TLGrupos

// Status do membro no sistema (não confundir com vencimento)
// 'vencido' é calculado dinamicamente baseado em data_vencimento < NOW()
export type MemberStatus = 'ativo' | 'removido' | 'pausado' | 'erro_remocao';

export type LogAction =
  | 'adicao'
  | 'remocao'
  | 'notificacao'
  | 'renovacao'
  | 'edicao'
  | 'pause'
  | 'resume';

export interface Member {
  id: string;
  telegram_user_id: number;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  nome: string;
  email?: string;
  telefone?: string;
  data_entrada: string;
  data_vencimento: string;
  notificado_7dias: boolean;
  notificado_3dias: boolean;
  notificado_1dia: boolean;
  status: MemberStatus;
  observacoes?: string;
  plan_id?: string;
  group_id?: string | null;
  invite_link?: string;
  invite_link_revoked?: boolean;
  invite_link_type?: 'unique' | 'generic';
  created_at: string;
  updated_at: string;
  // Joined data from plan
  plan?: Plan;
  // Joined data from telegram_groups
  grupo_nome?: string;
}

export interface Log {
  id: string;
  member_id?: string;
  acao: LogAction;
  detalhes?: any;
  telegram_user_id?: number;
  telegram_username?: string;
  executado_por: string;
  created_at: string;
}

export interface Config {
  id: string;
  chave: string;
  valor: any;
  descricao?: string;
  updated_at: string;
}

export interface MemberExpiringSoon extends Member {
  dias_restantes: number;
}

export interface MemberExpired extends Member {
  dias_vencidos: number;
}

export interface Stats {
  total_cadastros: number;
  total_ativos: number;
  total_vencidos: number;
  total_removidos: number;
  erro_remocao: number;
  total_pausados: number;
  ativos_no_grupo: number;
  ativos_sem_grupo: number;
  vencendo_7dias: number;
  ativos_mas_vencidos: number;
  sem_telegram_user_id: number;
  ativos_sem_telegram: number;
}

// Tipos para formulários e requisições
export interface CreateMemberInput {
  telegram_user_id?: number;
  telegram_username?: string;
  nome: string;
  email?: string;
  telefone?: string;
  data_vencimento?: string; // Opcional agora - pode ser calculado do plano
  plan_id?: string; // Plano selecionado
  observacoes?: string;
}

export interface UpdateMemberInput {
  nome?: string;
  email?: string;
  telefone?: string;
  data_vencimento?: string;
  status?: MemberStatus;
  plan_id?: string;
  group_id?: string | null;
  observacoes?: string;
}

export interface NotificationTemplate {
  texto: string;
}

export interface TelegramGroupInfo {
  id?: number;
  nome?: string;
}

export interface Invite {
  id: string;
  member_id: string;
  invite_link: string;
  telegram_sent: boolean;
  telegram_sent_at?: string;
  telegram_error?: string;
  email_sent: boolean;
  email_sent_at?: string;
  email_error?: string;
  used: boolean;
  used_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined data from member
  member?: Member;
}

export interface Plan {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
  duracao_dias: number;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanInput {
  nome: string;
  descricao?: string;
  valor: number;
  duracao_dias: number;
  ativo?: boolean;
  ordem?: number;
}

export interface UpdatePlanInput {
  nome?: string;
  descricao?: string;
  valor?: number;
  duracao_dias?: number;
  ativo?: boolean;
  ordem?: number;
}

// Tipos para respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Tipos para Pagamentos
export type PaymentStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';

export interface Payment {
  id: string;
  member_id: string;
  plan_id?: string;
  payment_method_id?: string;
  valor: number;
  status: PaymentStatus;
  comprovante_url?: string;
  comprovante_hash?: string;
  descricao?: string;
  observacoes?: string;
  pix_chave?: string;
  pix_txid?: string;
  pix_e2eid?: string;
  data_pagamento?: string;
  data_vencimento?: string;
  data_aprovacao?: string;
  data_expiracao?: string;
  dias_acesso: number;
  aprovado_por?: string;
  rejeitado_por?: string;
  motivo_rejeicao?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  member?: Member;
  plan?: Plan;
}

export interface CreatePaymentInput {
  member_id: string;
  plan_id?: string;
  payment_method_id?: string;
  valor: number;
  descricao?: string;
  observacoes?: string;
  comprovante_url?: string;
  pix_chave?: string;
  data_pagamento?: string;
  data_vencimento?: string;
  dias_acesso?: number;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  comprovante_url?: string;
  descricao?: string;
  observacoes?: string;
  data_pagamento?: string;
  data_aprovacao?: string;
  aprovado_por?: string;
  rejeitado_por?: string;
  motivo_rejeicao?: string;
}
