-- Migration: Add invite link tracking to members table
-- Created: 2025-01-10
-- Description: Adds columns to track generated invite links and their revocation status

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
