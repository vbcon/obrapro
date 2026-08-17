-- migration_015: tabela de tarefas por obra

CREATE TABLE IF NOT EXISTS public.tarefas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id       UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  descricao     TEXT,
  responsavel   TEXT,
  prioridade    TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  data_prevista DATE,
  concluida     BOOLEAN NOT NULL DEFAULT FALSE,
  concluida_em  TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_por    UUID REFERENCES public.perfis(id)
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefas_acesso" ON public.tarefas
  FOR ALL USING (user_has_obra_access(obra_id));
