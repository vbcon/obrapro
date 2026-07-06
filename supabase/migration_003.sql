-- Migration 003: Tabela de cotações de fornecedores

CREATE TABLE IF NOT EXISTS cotacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitacao_id UUID REFERENCES solicitacoes_compra(id) ON DELETE CASCADE NOT NULL,
  fornecedor_nome TEXT NOT NULL,
  fornecedor_contato TEXT,
  valor_total DECIMAL(12,2),
  itens JSONB DEFAULT '[]',
  prazo_entrega DATE,
  validade_proposta DATE,
  condicao_pagamento TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'recebida' CHECK (status IN ('recebida','aprovada','rejeitada')),
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cotacoes"
  ON cotacoes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_cotacoes_atualizado_em
  BEFORE UPDATE ON cotacoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- Adicionar coluna observacoes em solicitacoes_compra (caso não exista)
ALTER TABLE solicitacoes_compra ADD COLUMN IF NOT EXISTS observacoes TEXT;
