-- ============================================================
-- MIGRATION 010: Aprovação de OC pelo cliente via link público
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Novos campos na tabela compras
ALTER TABLE public.compras
  ADD COLUMN IF NOT EXISTS token_aprovacao      text DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS telefone_cliente      text,
  ADD COLUMN IF NOT EXISTS aprovado_cliente_em   timestamptz,
  ADD COLUMN IF NOT EXISTS aprovado_cliente_nome text;

-- Gerar tokens para OCs existentes sem token
UPDATE public.compras SET token_aprovacao = gen_random_uuid()::text WHERE token_aprovacao IS NULL;

-- Índice único no token
CREATE UNIQUE INDEX IF NOT EXISTS idx_compras_token ON public.compras(token_aprovacao);

-- 2. Adicionar status 'aguardando_aprovacao' no constraint
ALTER TABLE public.compras DROP CONSTRAINT IF EXISTS compras_status_check;
ALTER TABLE public.compras
  ADD CONSTRAINT compras_status_check
  CHECK (status IN ('rascunho','enviado','aguardando_aprovacao','aprovado','recebido','cancelado','direta'));

-- 3. Função pública: buscar OC pelo token (sem autenticação)
CREATE OR REPLACE FUNCTION public.get_oc_por_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result json;
BEGIN
  SELECT json_build_object(
    'id',                   c.id,
    'numero_pedido',        c.numero_pedido,
    'status',               c.status,
    'data_pedido',          c.data_pedido,
    'fornecedor_nome',      c.fornecedor_nome,
    'condicao_pagamento',   c.condicao_pagamento,
    'valor_total',          c.valor_total,
    'itens',                c.itens,
    'observacoes',          c.observacoes,
    'aprovado_cliente_em',  c.aprovado_cliente_em,
    'aprovado_cliente_nome',c.aprovado_cliente_nome,
    'obra', json_build_object(
      'nome',    o.nome,
      'codigo',  o.codigo,
      'cliente', o.cliente,
      'cidade',  o.cidade
    )
  )
  INTO v_result
  FROM public.compras c
  JOIN public.obras o ON o.id = c.obra_id
  WHERE c.token_aprovacao = p_token;

  RETURN v_result;
END;
$$;

-- 4. Função pública: aprovar OC e criar lançamento no financeiro
CREATE OR REPLACE FUNCTION public.aprovar_oc_por_token(p_token text, p_nome text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_oc public.compras%ROWTYPE;
BEGIN
  SELECT * INTO v_oc FROM public.compras WHERE token_aprovacao = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'erro', 'O.C. não encontrada.');
  END IF;

  IF v_oc.status = 'aprovado' THEN
    RETURN json_build_object('ok', false, 'erro', 'Esta O.C. já foi aprovada anteriormente.');
  END IF;

  -- Marcar OC como aprovada
  UPDATE public.compras SET
    status                = 'aprovado',
    aprovado_cliente_em   = now(),
    aprovado_cliente_nome = trim(p_nome)
  WHERE id = v_oc.id;

  -- Criar lançamento automático no financeiro
  INSERT INTO public.financeiro (
    obra_id, tipo, descricao, valor,
    data_referencia, status, observacoes
  ) VALUES (
    v_oc.obra_id,
    'materiais',
    'O.C. ' || COALESCE(v_oc.numero_pedido, '') || ' — ' || COALESCE(v_oc.fornecedor_nome, 'Fornecedor'),
    COALESCE(v_oc.valor_total, 0),
    CURRENT_DATE,
    'pendente',
    'Lançamento criado automaticamente após aprovação pelo cliente em ' ||
      to_char(now(), 'DD/MM/YYYY HH24:MI')
  );

  RETURN json_build_object('ok', true);
END;
$$;

-- 5. Permitir que usuários anônimos chamem as funções públicas
GRANT EXECUTE ON FUNCTION public.get_oc_por_token(text)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aprovar_oc_por_token(text, text) TO anon, authenticated;
