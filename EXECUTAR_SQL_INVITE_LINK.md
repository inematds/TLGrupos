# 📋 EXECUTAR SQL PARA ADICIONAR RASTREAMENTO DE INVITE LINKS

## ⚠️ IMPORTANTE

Estas colunas são necessárias para a revogação automática de links genéricos.

## 🔗 ACESSE O SUPABASE

1. Abra: https://supabase.com/dashboard/project/xetowlvhhnxewvglxklo/editor
2. Clique em **SQL Editor** no menu lateral
3. Clique em **+ New Query**
4. Cole o SQL abaixo e clique em **Run**

---

## 📝 SQL PARA EXECUTAR

```sql
-- Add invite link tracking to members table

-- Add invite_link column to store the generated Telegram invite link
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS invite_link TEXT;

-- Add invite_link_revoked column to track if link was revoked
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS invite_link_revoked BOOLEAN DEFAULT false;

-- Add invite_link_type column to differentiate between unique and generic links
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS invite_link_type TEXT CHECK (invite_link_type IN ('unique', 'generic'));

-- Add index for faster queries on invite links
CREATE INDEX IF NOT EXISTS idx_members_invite_link ON public.members(invite_link) WHERE invite_link IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.members.invite_link IS 'Link de convite do Telegram gerado para este membro';
COMMENT ON COLUMN public.members.invite_link_revoked IS 'Indica se o link de convite foi revogado após uso';
COMMENT ON COLUMN public.members.invite_link_type IS 'Tipo do link: unique (1 uso) ou generic (múltiplos usos)';
```

---

## ✅ APÓS EXECUTAR

O sistema poderá:
- Rastrear links gerados para cada membro
- Revogar automaticamente links genéricos após primeiro uso
- Diferenciar entre links únicos e genéricos

---

## 🔍 VERIFICAR SE FUNCIONOU

Execute no SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name IN ('invite_link', 'invite_link_revoked', 'invite_link_type');
```

Deve mostrar as 3 novas colunas.
