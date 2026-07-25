-- ============================================================
-- MIGRATION 009: Novos campos na tabela financeiro
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.financeiro
  ADD COLUMN IF NOT EXISTS forma_pagamento text,
  ADD COLUMN IF NOT EXISTS dados_pagamento text;
