-- ============================================================
-- OBRAPRO - Migration 002: Novos módulos
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Adicionar campos em obras
ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS condicao_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS valor_contrato NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anotacoes TEXT;

-- ============================================================
-- TABELA: diario_obra (RDO - Relatório Diário de Obra)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.diario_obra (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id         UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  data            DATE NOT NULL DEFAULT CURRENT_DATE,
  clima           TEXT CHECK (clima IN ('ensolarado', 'nublado', 'chuvoso', 'parcialmente_nublado')) DEFAULT 'ensolarado',
  atividades      TEXT,
  ocorrencias     TEXT,
  avisos          TEXT,
  efetivo_total   INTEGER DEFAULT 0,
  efetivo_detalhe JSONB DEFAULT '[]',
  fotos           JSONB DEFAULT '[]',
  criado_por      UUID REFERENCES public.perfis(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diario_obra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam diario_obra"
  ON public.diario_obra FOR ALL
  USING (auth.role() = 'authenticated');

CREATE TRIGGER set_diario_obra_atualizado_em
  BEFORE UPDATE ON public.diario_obra
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ============================================================
-- TABELA: solicitacoes_compra (solicitações de material)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.solicitacoes_compra (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id         UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  urgencia        TEXT CHECK (urgencia IN ('baixa', 'media', 'alta', 'urgente')) DEFAULT 'media',
  status          TEXT CHECK (status IN ('aberta', 'em_cotacao', 'aprovada', 'convertida', 'cancelada')) DEFAULT 'aberta',
  itens           JSONB DEFAULT '[]',
  observacoes     TEXT,
  solicitado_por  UUID REFERENCES public.perfis(id),
  aprovado_por    UUID REFERENCES public.perfis(id),
  data_necessidade DATE,
  compra_id       UUID REFERENCES public.compras(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.solicitacoes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam solicitacoes_compra"
  ON public.solicitacoes_compra FOR ALL
  USING (auth.role() = 'authenticated');

CREATE TRIGGER set_solicitacoes_atualizado_em
  BEFORE UPDATE ON public.solicitacoes_compra
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ============================================================
-- TABELA: financeiro (medições e pagamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financeiro (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id         UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  tipo            TEXT CHECK (tipo IN ('medicao', 'pagamento', 'adiantamento', 'retencao', 'multa')) NOT NULL,
  descricao       TEXT NOT NULL,
  valor           NUMERIC(15,2) NOT NULL,
  data_referencia DATE NOT NULL,
  data_vencimento DATE,
  data_pagamento  DATE,
  status          TEXT CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')) DEFAULT 'pendente',
  comprovante_url TEXT,
  observacoes     TEXT,
  criado_por      UUID REFERENCES public.perfis(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam financeiro"
  ON public.financeiro FOR ALL
  USING (auth.role() = 'authenticated');

CREATE TRIGGER set_financeiro_atualizado_em
  BEFORE UPDATE ON public.financeiro
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();
