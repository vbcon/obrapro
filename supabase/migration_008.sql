-- ============================================================
-- MIGRATION 008: Solicitações do cliente, cronograma melhorado,
--                documentos de compra (notas fiscais / boletos)
-- ============================================================
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── 1. SOLICITAÇÕES DO CLIENTE ────────────────────────────

CREATE TABLE IF NOT EXISTS public.solicitacoes_cliente (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id         uuid        NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  usuario_id      uuid        REFERENCES public.perfis(id),
  titulo          text        NOT NULL,
  descricao       text,
  categoria       text        NOT NULL DEFAULT 'solicitacao',
  status          text        NOT NULL DEFAULT 'aberta',
  resposta        text,
  respondido_por  uuid        REFERENCES public.perfis(id),
  respondido_em   timestamptz,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso solicitacoes obra" ON public.solicitacoes_cliente;
CREATE POLICY "Acesso solicitacoes obra"
  ON public.solicitacoes_cliente FOR ALL
  USING  (public.user_has_obra_access(obra_id))
  WITH CHECK (public.user_has_obra_access(obra_id));

-- ── 2. CRONOGRAMA — NOVOS CAMPOS ─────────────────────────

ALTER TABLE public.cronograma
  ADD COLUMN IF NOT EXISTS categoria       text,
  ADD COLUMN IF NOT EXISTS responsavel     text,
  ADD COLUMN IF NOT EXISTS predecessora_id uuid REFERENCES public.cronograma(id),
  ADD COLUMN IF NOT EXISTS duracao_dias    integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS observacoes     text,
  ADD COLUMN IF NOT EXISTS ordem          integer;

-- Índice para busca de etapas por ordem dentro de uma obra
CREATE INDEX IF NOT EXISTS idx_cronograma_obra_ordem
  ON public.cronograma(obra_id, ordem);

-- ── 3. DOCUMENTOS DE COMPRA ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.documentos_compra (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id        uuid        NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
  obra_id          uuid        NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  tipo             text        NOT NULL DEFAULT 'nota_fiscal',
  numero_nota      text,
  descricao        text,
  fornecedor       text,
  valor            decimal(12,2),
  data_emissao     date,
  data_vencimento  date,
  data_pagamento   date,
  status           text        NOT NULL DEFAULT 'a_pagar',
  arquivo_url      text,
  arquivo_nome     text,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso documentos compra" ON public.documentos_compra;
CREATE POLICY "Acesso documentos compra"
  ON public.documentos_compra FOR ALL
  USING  (public.user_has_obra_access(obra_id))
  WITH CHECK (public.user_has_obra_access(obra_id));

-- ── 4. STORAGE: BUCKET DOCUMENTOS ────────────────────────
--
-- ATENÇÃO: Crie o bucket manualmente ANTES de rodar as políticas abaixo.
-- Supabase Dashboard → Storage → New bucket
--   Nome: documentos
--   Public: NÃO (privado)
--
-- Depois volte e execute apenas este bloco:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false)
--   ON CONFLICT DO NOTHING;

-- DROP POLICY IF EXISTS "Doc upload autenticados" ON storage.objects;
-- CREATE POLICY "Doc upload autenticados"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');

-- DROP POLICY IF EXISTS "Doc leitura autenticados" ON storage.objects;
-- CREATE POLICY "Doc leitura autenticados"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');

-- DROP POLICY IF EXISTS "Doc delete proprio" ON storage.objects;
-- CREATE POLICY "Doc delete proprio"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'documentos' AND auth.uid()::text = owner);
