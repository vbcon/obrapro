-- ============================================================
-- MIGRATION 007: Corrigir RLS para acesso por papel/função
-- ============================================================
-- Problema: políticas genéricas permitiam qualquer usuário
-- autenticado ver todos os dados. Agora admin vê tudo,
-- cliente/arquiteto vê apenas obras vinculadas via usuario_obras.
-- ============================================================

-- Funções auxiliares de permissão
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE id = auth.uid() AND papel = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_obra_access(p_obra_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.usuario_obras
      WHERE usuario_id = auth.uid() AND obra_id = p_obra_id
    );
$$;

-- ── OBRAS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados veem obras" ON public.obras;
DROP POLICY IF EXISTS "Usuários veem obras com acesso" ON public.obras;
CREATE POLICY "Usuários veem obras com acesso"
  ON public.obras FOR SELECT
  USING (public.user_has_obra_access(id));

DROP POLICY IF EXISTS "Autenticados criam obras" ON public.obras;
CREATE POLICY "Admins criam obras"
  ON public.obras FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Autenticados editam obras" ON public.obras;
CREATE POLICY "Admins editam obras"
  ON public.obras FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins deletam obras" ON public.obras;
CREATE POLICY "Admins deletam obras"
  ON public.obras FOR DELETE
  USING (public.is_admin());

-- ── USUARIO_OBRAS ─────────────────────────────────────────────
ALTER TABLE IF EXISTS public.usuario_obras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins gerenciam usuario_obras" ON public.usuario_obras;
DROP POLICY IF EXISTS "Usuarios veem proprios vinculos" ON public.usuario_obras;

CREATE POLICY "Admins gerenciam usuario_obras"
  ON public.usuario_obras FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Usuarios veem proprios vinculos"
  ON public.usuario_obras FOR SELECT
  USING (usuario_id = auth.uid());

-- ── COMPRAS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados gerenciam compras" ON public.compras;
CREATE POLICY "Usuários gerenciam compras de suas obras"
  ON public.compras FOR ALL
  USING (public.user_has_obra_access(obra_id))
  WITH CHECK (public.user_has_obra_access(obra_id));

-- ── SOLICITACOES_COMPRA ───────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados gerenciam solicitacoes" ON public.solicitacoes_compra;
CREATE POLICY "Usuários gerenciam solicitacoes de suas obras"
  ON public.solicitacoes_compra FOR ALL
  USING (public.user_has_obra_access(obra_id))
  WITH CHECK (public.user_has_obra_access(obra_id));

-- ── LANCAMENTOS_FINANCEIROS ───────────────────────────────────
DROP POLICY IF EXISTS "Autenticados gerenciam lancamentos" ON public.lancamentos_financeiros;
CREATE POLICY "Usuários gerenciam lancamentos de suas obras"
  ON public.lancamentos_financeiros FOR ALL
  USING (public.user_has_obra_access(obra_id))
  WITH CHECK (public.user_has_obra_access(obra_id));

-- ── DIARIO_OBRA ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados gerenciam diario" ON public.diario_obra;
CREATE POLICY "Usuários gerenciam diario de suas obras"
  ON public.diario_obra FOR ALL
  USING (public.user_has_obra_access(obra_id))
  WITH CHECK (public.user_has_obra_access(obra_id));

-- ── CRONOGRAMA ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados gerenciam cronograma" ON public.cronograma;
CREATE POLICY "Usuários gerenciam cronograma de suas obras"
  ON public.cronograma FOR ALL
  USING (public.user_has_obra_access(obra_id))
  WITH CHECK (public.user_has_obra_access(obra_id));

-- ── OBRA_ARQUIVOS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados gerenciam documentos" ON public.obra_arquivos;
CREATE POLICY "Usuários gerenciam arquivos de suas obras"
  ON public.obra_arquivos FOR ALL
  USING (public.user_has_obra_access(obra_id))
  WITH CHECK (public.user_has_obra_access(obra_id));

-- ── COTACOES ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados gerenciam cotacoes" ON public.cotacoes;
CREATE POLICY "Usuários gerenciam cotacoes de suas obras"
  ON public.cotacoes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = cotacao_id AND public.user_has_obra_access(c.obra_id)
    )
    OR public.is_admin()
  )
  WITH CHECK (public.is_admin());
