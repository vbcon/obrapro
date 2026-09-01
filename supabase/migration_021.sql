-- ============================================================
-- MIGRATION 021: CORREÇÃO DE SEGURANÇA — isolamento por obra
--
-- Remove TODAS as políticas antigas (permissivas) das tabelas
-- sensíveis e recria um conjunto limpo, escopado por obra.
--
-- Modelo:
--   • admin      → acesso total (a todas as obras)
--   • arquiteto  → vê e edita apenas as obras vinculadas a ele
--   • cliente    → apenas VISUALIZA suas obras (compras, financeiro,
--                  status, cronograma). Não vê tarefas nem solicitações.
-- ============================================================

-- 1. Remove todas as políticas existentes das tabelas sensíveis
DO $$
DECLARE
  r RECORD;
  t TEXT;
  tabelas TEXT[] := ARRAY[
    'compras', 'financeiro', 'diario_obra', 'cronograma',
    'solicitacoes_compra', 'tarefas'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = t) THEN
      FOR r IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = t LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
      END LOOP;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- 2. COMPRAS — cliente vê as suas; só admin cria/edita
CREATE POLICY "compras_select" ON public.compras
  FOR SELECT USING (user_has_obra_access(obra_id));
CREATE POLICY "compras_insert" ON public.compras
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "compras_update" ON public.compras
  FOR UPDATE USING (is_admin());
CREATE POLICY "compras_delete" ON public.compras
  FOR DELETE USING (is_admin());

-- 3. FINANCEIRO — cliente vê o das suas obras; só admin cria/edita
CREATE POLICY "financeiro_select" ON public.financeiro
  FOR SELECT USING (user_has_obra_access(obra_id));
CREATE POLICY "financeiro_insert" ON public.financeiro
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "financeiro_update" ON public.financeiro
  FOR UPDATE USING (is_admin());
CREATE POLICY "financeiro_delete" ON public.financeiro
  FOR DELETE USING (is_admin());

-- 4. DIARIO_OBRA (Status da Obra) — cliente vê; admin/arquiteto editam suas obras
CREATE POLICY "diario_select" ON public.diario_obra
  FOR SELECT USING (user_has_obra_access(obra_id));
CREATE POLICY "diario_insert" ON public.diario_obra
  FOR INSERT WITH CHECK (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "diario_update" ON public.diario_obra
  FOR UPDATE USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "diario_delete" ON public.diario_obra
  FOR DELETE USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');

-- 5. CRONOGRAMA — cliente vê; admin/arquiteto editam suas obras
CREATE POLICY "cronograma_select" ON public.cronograma
  FOR SELECT USING (user_has_obra_access(obra_id));
CREATE POLICY "cronograma_insert" ON public.cronograma
  FOR INSERT WITH CHECK (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "cronograma_update" ON public.cronograma
  FOR UPDATE USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "cronograma_delete" ON public.cronograma
  FOR DELETE USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');

-- 6. TAREFAS — cliente NÃO vê nada; admin/arquiteto gerenciam suas obras
CREATE POLICY "tarefas_select" ON public.tarefas
  FOR SELECT USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "tarefas_insert" ON public.tarefas
  FOR INSERT WITH CHECK (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "tarefas_update" ON public.tarefas
  FOR UPDATE USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "tarefas_delete" ON public.tarefas
  FOR DELETE USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');

-- 7. SOLICITACOES_COMPRA — cliente NÃO vê; admin/arquiteto gerenciam suas obras
CREATE POLICY "solicitacoes_select" ON public.solicitacoes_compra
  FOR SELECT USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "solicitacoes_insert" ON public.solicitacoes_compra
  FOR INSERT WITH CHECK (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "solicitacoes_update" ON public.solicitacoes_compra
  FOR UPDATE USING (user_has_obra_access(obra_id) AND get_user_papel() <> 'cliente');
CREATE POLICY "solicitacoes_delete" ON public.solicitacoes_compra
  FOR DELETE USING (is_admin());

NOTIFY pgrst, 'reload schema';
