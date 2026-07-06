-- Migration 004: Aprovação pelo cliente e geração de O.C.

-- 1. Adicionar colunas de aprovação do cliente nas cotações
ALTER TABLE cotacoes
  ADD COLUMN IF NOT EXISTS token_aprovacao TEXT DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS aprovado_cliente_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aprovado_cliente_nome TEXT;

-- Gerar tokens para cotações existentes sem token
UPDATE cotacoes SET token_aprovacao = gen_random_uuid()::text WHERE token_aprovacao IS NULL;

-- 2. Ampliar status das cotações
ALTER TABLE cotacoes DROP CONSTRAINT IF EXISTS cotacoes_status_check;
ALTER TABLE cotacoes ADD CONSTRAINT cotacoes_status_check
  CHECK (status IN ('recebida','aprovada','rejeitada','aguardando_cliente','oc_gerada'));

-- 3. Ampliar status das solicitações
ALTER TABLE solicitacoes_compra DROP CONSTRAINT IF EXISTS solicitacoes_compra_status_check;
ALTER TABLE solicitacoes_compra ADD CONSTRAINT solicitacoes_compra_status_check
  CHECK (status IN ('aberta','em_cotacao','aprovada','aguardando_cliente','convertida','cancelada'));

-- 4. Ajustar tabela compras para funcionar sem fornecedor cadastrado
ALTER TABLE compras ALTER COLUMN fornecedor_id DROP NOT NULL;
ALTER TABLE compras
  ADD COLUMN IF NOT EXISTS fornecedor_nome TEXT,
  ADD COLUMN IF NOT EXISTS cotacao_id UUID REFERENCES cotacoes(id),
  ADD COLUMN IF NOT EXISTS solicitacao_id UUID REFERENCES solicitacoes_compra(id);

-- 5. Função pública: ler cotação pelo token (sem autenticação)
CREATE OR REPLACE FUNCTION get_cotacao_por_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', c.id,
    'fornecedor_nome', c.fornecedor_nome,
    'valor_total', c.valor_total,
    'itens', c.itens,
    'prazo_entrega', c.prazo_entrega,
    'condicao_pagamento', c.condicao_pagamento,
    'observacoes', c.observacoes,
    'status', c.status,
    'obra', json_build_object(
      'nome', o.nome, 'codigo', o.codigo,
      'endereco', o.endereco, 'cidade', o.cidade, 'estado', o.estado
    ),
    'solicitacao', json_build_object(
      'titulo', s.titulo,
      'itens', s.itens,
      'data_necessidade', s.data_necessidade
    )
  ) INTO v_result
  FROM cotacoes c
  JOIN solicitacoes_compra s ON s.id = c.solicitacao_id
  JOIN obras o ON o.id = s.obra_id
  WHERE c.token_aprovacao = p_token;

  RETURN COALESCE(v_result, json_build_object('error', 'not_found'));
END;
$$;

-- 6. Função pública: aprovar cotação e gerar O.C.
CREATE OR REPLACE FUNCTION aprovar_cotacao_cliente(p_token TEXT, p_nome TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cotacao cotacoes%ROWTYPE;
  v_sol     solicitacoes_compra%ROWTYPE;
  v_count   INT;
  v_numero  TEXT;
  v_oc_id   UUID;
BEGIN
  SELECT * INTO v_cotacao FROM cotacoes WHERE token_aprovacao = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Token inválido');
  END IF;

  IF v_cotacao.status = 'oc_gerada' THEN
    RETURN json_build_object('error', 'already_done');
  END IF;

  IF v_cotacao.status NOT IN ('aprovada', 'aguardando_cliente') THEN
    RETURN json_build_object('error', 'not_available');
  END IF;

  SELECT * INTO v_sol FROM solicitacoes_compra WHERE id = v_cotacao.solicitacao_id;

  SELECT COUNT(*) + 1 INTO v_count FROM compras;
  v_numero := 'OC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_count::TEXT, 4, '0');

  INSERT INTO compras (
    obra_id, fornecedor_nome, cotacao_id, solicitacao_id,
    numero_pedido, status, valor_total,
    data_pedido, data_entrega_prevista, observacoes
  ) VALUES (
    v_sol.obra_id,
    v_cotacao.fornecedor_nome,
    v_cotacao.id,
    v_cotacao.solicitacao_id,
    v_numero,
    'aprovada',
    v_cotacao.valor_total,
    NOW()::DATE,
    v_cotacao.prazo_entrega,
    v_cotacao.observacoes
  ) RETURNING id INTO v_oc_id;

  UPDATE cotacoes SET
    status = 'oc_gerada',
    aprovado_cliente_em = NOW(),
    aprovado_cliente_nome = p_nome
  WHERE id = v_cotacao.id;

  UPDATE solicitacoes_compra SET status = 'convertida' WHERE id = v_cotacao.solicitacao_id;

  RETURN json_build_object(
    'success', true,
    'oc_numero', v_numero,
    'oc_id', v_oc_id::TEXT
  );
END;
$$;

-- 7. Permitir usuários anônimos chamarem as funções públicas
GRANT EXECUTE ON FUNCTION get_cotacao_por_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION aprovar_cotacao_cliente(TEXT, TEXT) TO anon;
