-- Script para testar se o CASCADE está funcionando
-- Execute este script no SQL Editor do Supabase

-- 1. Criar um membro de teste
INSERT INTO members (nome, email, status)
VALUES ('TESTE DELETE', 'teste-delete@example.com', 'ativo')
RETURNING id, nome;

-- Anote o ID retornado e substitua abaixo

-- 2. Criar um log de teste para esse membro
-- SUBSTITUA 'ID_DO_MEMBRO_TESTE' pelo ID retornado acima
INSERT INTO logs (member_id, acao, detalhes, executado_por)
VALUES ('ID_DO_MEMBRO_TESTE', 'teste', '{"teste": true}', 'Admin');

-- 3. Criar um pagamento de teste para esse membro
-- SUBSTITUA 'ID_DO_MEMBRO_TESTE' pelo ID retornado acima
INSERT INTO payments (member_id, valor, dias_acesso, status)
VALUES ('ID_DO_MEMBRO_TESTE', 10.00, 30, 'pendente');

-- 4. Verificar que foi criado
SELECT 'Membro:', * FROM members WHERE email = 'teste-delete@example.com';
SELECT 'Logs:', COUNT(*) FROM logs WHERE member_id = 'ID_DO_MEMBRO_TESTE';
SELECT 'Payments:', COUNT(*) FROM payments WHERE member_id = 'ID_DO_MEMBRO_TESTE';

-- 5. TENTAR DELETAR o membro de teste
-- SUBSTITUA 'ID_DO_MEMBRO_TESTE' pelo ID retornado acima
DELETE FROM members WHERE id = 'ID_DO_MEMBRO_TESTE';

-- 6. Verificar se deletou tudo (CASCADE)
SELECT 'Após delete - Membro:', * FROM members WHERE email = 'teste-delete@example.com';
SELECT 'Após delete - Logs:', COUNT(*) FROM logs WHERE member_id = 'ID_DO_MEMBRO_TESTE';
SELECT 'Após delete - Payments:', COUNT(*) FROM payments WHERE member_id = 'ID_DO_MEMBRO_TESTE';
