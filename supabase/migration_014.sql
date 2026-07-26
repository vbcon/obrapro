-- ============================================================
-- MIGRATION 014: Permissões de cliente no dashboard
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Função para cliente aprovar/reprovar OC pelo dashboard (autenticado)
CREATE OR REPLACE FUNCTION public.aprovar_oc_cliente_dashboard(
  p_compra_id UUID,
  p_aprovado  BOOLEAN
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_oc    public.compras%ROWTYPE;
  v_nome  text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'erro', 'Não autenticado');
  END IF;

  SELECT nome INTO v_nome FROM perfis WHERE id = auth.uid();

  SELECT * INTO v_oc FROM compras WHERE id = p_compra_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'erro', 'O.C. não encontrada');
  END IF;

  IF NOT user_has_obra_access(v_oc.obra_id) THEN
    RETURN json_build_object('ok', false, 'erro', 'Sem acesso a esta obra');
  END IF;

  IF v_oc.status = 'aprovado' THEN
    RETURN json_build_object('ok', false, 'erro', 'Esta O.C. já foi aprovada anteriormente');
  END IF;

  UPDATE compras SET
    status                = CASE WHEN p_aprovado THEN 'aprovado' ELSE 'cancelado' END,
    aprovado_cliente_em   = now(),
    aprovado_cliente_nome = COALESCE(v_nome, 'Cliente')
  WHERE id = p_compra_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_oc_cliente_dashboard(UUID, BOOLEAN) TO authenticated;

-- 2. Corrigir políticas de solicitacoes_cliente
-- Clientes podem criar e visualizar, mas não editar nem excluir
DROP POLICY IF EXISTS "Acesso solicitacoes obra" ON public.solicitacoes_cliente;

CREATE POLICY "solicitacoes_cliente_select"
  ON public.solicitacoes_cliente FOR SELECT
  USING (public.user_has_obra_access(obra_id));

CREATE POLICY "solicitacoes_cliente_insert"
  ON public.solicitacoes_cliente FOR INSERT
  WITH CHECK (public.user_has_obra_access(obra_id));

CREATE POLICY "solicitacoes_cliente_update"
  ON public.solicitacoes_cliente FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "solicitacoes_cliente_delete"
  ON public.solicitacoes_cliente FOR DELETE
  USING (public.is_admin());
