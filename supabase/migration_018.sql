-- ============================================================
-- MIGRATION 018: Garante as colunas da tabela tarefas
-- (a tabela existia numa versão antiga, sem algumas colunas)
-- ============================================================

ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS descricao     TEXT;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS responsavel   TEXT;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS prioridade    TEXT DEFAULT 'normal';
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS data_prevista DATE;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS concluida     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS concluida_em  TIMESTAMPTZ;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS criado_por    UUID REFERENCES public.perfis(id);

NOTIFY pgrst, 'reload schema';
