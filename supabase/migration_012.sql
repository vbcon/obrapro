-- ============================================================
-- MIGRATION 012: Anexos do Financeiro
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.anexos_financeiro (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  financeiro_id uuid        NOT NULL REFERENCES public.financeiro(id) ON DELETE CASCADE,
  obra_id       uuid        NOT NULL REFERENCES public.obras(id)      ON DELETE CASCADE,
  nome          text        NOT NULL,
  url           text        NOT NULL,
  tamanho       bigint,
  criado_em     timestamptz DEFAULT now()
);

ALTER TABLE public.anexos_financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por obra" ON public.anexos_financeiro
  FOR ALL USING (user_has_obra_access(obra_id));
