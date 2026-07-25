-- migration_013.sql
-- Adiciona forma de pagamento e dados bancários à OC
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Novos campos
ALTER TABLE public.compras
  ADD COLUMN IF NOT EXISTS metodo_pagamento text
    CHECK (metodo_pagamento IN ('pix', 'ted', 'boleto', 'dinheiro')),
  ADD COLUMN IF NOT EXISTS dados_pagamento jsonb;

-- 2. Atualiza get_oc_por_token para retornar os novos campos
CREATE OR REPLACE FUNCTION public.get_oc_por_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result json;
BEGIN
  SELECT json_build_object(
    'id',                    c.id,
    'numero_pedido',         c.numero_pedido,
    'status',                c.status,
    'data_pedido',           c.data_pedido,
    'fornecedor_nome',       c.fornecedor_nome,
    'condicao_pagamento',    c.condicao_pagamento,
    'valor_total',           c.valor_total,
    'itens',                 c.itens,
    'observacoes',           c.observacoes,
    'aprovado_cliente_em',   c.aprovado_cliente_em,
    'aprovado_cliente_nome', c.aprovado_cliente_nome,
    'metodo_pagamento',      c.metodo_pagamento,
    'dados_pagamento',       c.dados_pagamento,
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
