-- ============================================================
-- OBRAPRO - Schema do Banco de Dados
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: perfis (estende auth.users do Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.perfis (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  telefone    TEXT,
  cargo       TEXT,
  avatar_url  TEXT,
  empresa     TEXT DEFAULT 'VBCON ENGENHARIA',
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprio perfil"
  ON public.perfis FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários editam próprio perfil"
  ON public.perfis FOR UPDATE
  USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABELA: obras (projetos de construção)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.obras (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo          TEXT NOT NULL UNIQUE,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  cliente         TEXT NOT NULL,
  endereco        TEXT,
  cidade          TEXT,
  estado          TEXT DEFAULT 'DF',
  cep             TEXT,
  tipo            TEXT CHECK (tipo IN ('residencial', 'comercial', 'industrial', 'reforma', 'outro')) DEFAULT 'comercial',
  status          TEXT CHECK (status IN ('planejamento', 'em_andamento', 'pausada', 'concluida', 'cancelada')) DEFAULT 'planejamento',
  data_inicio     DATE,
  data_prevista   DATE,
  data_conclusao  DATE,
  orcamento_total NUMERIC(15,2) DEFAULT 0,
  custo_atual     NUMERIC(15,2) DEFAULT 0,
  percentual_conclusao INTEGER DEFAULT 0 CHECK (percentual_conclusao BETWEEN 0 AND 100),
  responsavel_id  UUID REFERENCES public.perfis(id),
  criado_por      UUID REFERENCES public.perfis(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem obras"
  ON public.obras FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados criam obras"
  ON public.obras FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Autenticados editam obras"
  ON public.obras FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: etapas (fases/etapas de uma obra)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.etapas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id         UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  ordem           INTEGER DEFAULT 0,
  status          TEXT CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')) DEFAULT 'pendente',
  data_inicio     DATE,
  data_prevista   DATE,
  data_conclusao  DATE,
  percentual_conclusao INTEGER DEFAULT 0 CHECK (percentual_conclusao BETWEEN 0 AND 100),
  responsavel_id  UUID REFERENCES public.perfis(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam etapas"
  ON public.etapas FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: tarefas (atividades dentro das etapas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tarefas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etapa_id        UUID NOT NULL REFERENCES public.etapas(id) ON DELETE CASCADE,
  obra_id         UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  status          TEXT CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')) DEFAULT 'pendente',
  prioridade      TEXT CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')) DEFAULT 'media',
  data_inicio     DATE,
  data_prevista   DATE,
  data_conclusao  DATE,
  responsavel_id  UUID REFERENCES public.perfis(id),
  criado_por      UUID REFERENCES public.perfis(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam tarefas"
  ON public.tarefas FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: fornecedores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj_cpf    TEXT,
  email       TEXT,
  telefone    TEXT,
  whatsapp    TEXT,
  endereco    TEXT,
  cidade      TEXT,
  estado      TEXT,
  categoria   TEXT,
  ativo       BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam fornecedores"
  ON public.fornecedores FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: compras (pedidos de compra)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.compras (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id         UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  fornecedor_id   UUID REFERENCES public.fornecedores(id),
  numero_pedido   TEXT,
  status          TEXT CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'recebido', 'cancelado')) DEFAULT 'rascunho',
  data_pedido     DATE DEFAULT CURRENT_DATE,
  data_entrega_prevista DATE,
  data_entrega_real DATE,
  valor_total     NUMERIC(15,2) DEFAULT 0,
  desconto        NUMERIC(15,2) DEFAULT 0,
  forma_pagamento TEXT,
  condicao_pagamento TEXT,
  observacoes     TEXT,
  solicitado_por  UUID REFERENCES public.perfis(id),
  aprovado_por    UUID REFERENCES public.perfis(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam compras"
  ON public.compras FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: itens_compra (itens de um pedido de compra)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.itens_compra (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id     UUID NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
  descricao     TEXT NOT NULL,
  unidade       TEXT DEFAULT 'un',
  quantidade    NUMERIC(12,3) NOT NULL,
  preco_unitario NUMERIC(15,2) NOT NULL,
  preco_total   NUMERIC(15,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  observacoes   TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.itens_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam itens_compra"
  ON public.itens_compra FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: cronograma (marcos e eventos do calendário)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cronograma (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id       UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  etapa_id      UUID REFERENCES public.etapas(id),
  titulo        TEXT NOT NULL,
  descricao     TEXT,
  tipo          TEXT CHECK (tipo IN ('marco', 'entrega', 'reuniao', 'vistoria', 'pagamento', 'outro')) DEFAULT 'marco',
  data_inicio   TIMESTAMPTZ NOT NULL,
  data_fim      TIMESTAMPTZ,
  dia_todo      BOOLEAN DEFAULT FALSE,
  concluido     BOOLEAN DEFAULT FALSE,
  cor           TEXT DEFAULT '#f97316',
  responsavel_id UUID REFERENCES public.perfis(id),
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cronograma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam cronograma"
  ON public.cronograma FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: documentos (arquivos e anexos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id     UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  categoria   TEXT CHECK (categoria IN ('contrato', 'planta', 'orcamento', 'nota_fiscal', 'foto', 'relatorio', 'outro')) DEFAULT 'outro',
  url_arquivo TEXT NOT NULL,
  tamanho_kb  INTEGER,
  mime_type   TEXT,
  enviado_por UUID REFERENCES public.perfis(id),
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam documentos"
  ON public.documentos FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: whatsapp_contatos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_contatos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  telefone    TEXT NOT NULL UNIQUE,
  grupo       TEXT,
  obra_id     UUID REFERENCES public.obras(id),
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.whatsapp_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam whatsapp_contatos"
  ON public.whatsapp_contatos FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TABELA: whatsapp_mensagens (log de mensagens enviadas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contato_id    UUID REFERENCES public.whatsapp_contatos(id),
  obra_id       UUID REFERENCES public.obras(id),
  telefone      TEXT NOT NULL,
  mensagem      TEXT NOT NULL,
  status        TEXT CHECK (status IN ('enviando', 'enviada', 'entregue', 'lida', 'erro')) DEFAULT 'enviando',
  enviado_por   UUID REFERENCES public.perfis(id),
  enviado_em    TIMESTAMPTZ DEFAULT NOW(),
  erro_detalhes TEXT
);

ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gerenciam whatsapp_mensagens"
  ON public.whatsapp_mensagens FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- FUNÇÃO: atualizar campo atualizado_em automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com atualizado_em
CREATE TRIGGER set_obras_atualizado_em
  BEFORE UPDATE ON public.obras
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TRIGGER set_etapas_atualizado_em
  BEFORE UPDATE ON public.etapas
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TRIGGER set_tarefas_atualizado_em
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TRIGGER set_fornecedores_atualizado_em
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TRIGGER set_compras_atualizado_em
  BEFORE UPDATE ON public.compras
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ============================================================
-- DADOS INICIAIS PARA TESTE
-- ============================================================

-- Inserir uma obra de exemplo (requer usuário autenticado)
-- Descomente e ajuste após criar seu primeiro usuário:

-- INSERT INTO public.obras (codigo, nome, cliente, tipo, status, data_inicio, data_prevista, orcamento_total)
-- VALUES ('OBR-001', 'Reforma Escritório Centro', 'Cliente Exemplo LTDA', 'comercial', 'em_andamento', '2026-01-15', '2026-06-30', 150000.00);
