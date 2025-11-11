-- Migration: Adicionar sistema de tokens de convite únicos
-- Data: 2025-01-10
-- Motivo: Permitir cadastro público com tokens únicos que só podem ser usados uma vez

-- Adicionar coluna de token único na tabela members
ALTER TABLE members ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS token_usado BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS token_usado_em TIMESTAMP WITH TIME ZONE;

-- Criar função para gerar token único
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sem caracteres confusos (I,O,0,1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar token automaticamente ao criar membro
CREATE OR REPLACE FUNCTION set_invite_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_token IS NULL THEN
    NEW.invite_token := generate_invite_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_set_invite_token
BEFORE INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION set_invite_token();

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_members_invite_token ON members(invite_token);

-- Comentários
COMMENT ON COLUMN members.invite_token IS 'Token único para entrada no grupo (gerado automaticamente)';
COMMENT ON COLUMN members.token_usado IS 'Indica se o token já foi utilizado para entrar no grupo';
COMMENT ON COLUMN members.token_usado_em IS 'Data e hora em que o token foi utilizado';
