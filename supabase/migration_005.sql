-- Migration 005: Sistema de papéis e controle de acesso por obra

-- 1. Adicionar papel ao perfil
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS papel TEXT DEFAULT 'admin'
    CHECK (papel IN ('admin', 'cliente', 'arquiteto')),
  ADD COLUMN IF NOT EXISTS empresa TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Todos os usuários existentes viram admin (só quem já usou o sistema)
UPDATE perfis SET papel = 'admin' WHERE papel IS NULL;

-- 2. Tabela de vínculo usuário <-> obra
CREATE TABLE IF NOT EXISTS usuario_obras (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obra_id    UUID REFERENCES obras(id) ON DELETE CASCADE NOT NULL,
  criado_em  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, obra_id)
);

ALTER TABLE usuario_obras ENABLE ROW LEVEL SECURITY;

-- 3. Funções auxiliares (SECURITY DEFINER = rodam como postgres, bypassam RLS)

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT papel FROM perfis WHERE id = auth.uid()), 'cliente'
  ) = 'admin'
$$;

CREATE OR REPLACE FUNCTION get_user_papel()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((SELECT papel FROM perfis WHERE id = auth.uid()), 'cliente')
$$;

CREATE OR REPLACE FUNCTION user_has_obra_access(p_obra_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    COALESCE((SELECT papel FROM perfis WHERE id = auth.uid()), 'cliente') = 'admin'
    OR EXISTS (
      SELECT 1 FROM usuario_obras
      WHERE usuario_id = auth.uid() AND obra_id = p_obra_id
    )
$$;

-- 4. Policies em usuario_obras
CREATE POLICY "Admin gerencia usuario_obras"
  ON usuario_obras FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Usuarios veem seus proprios vinculos"
  ON usuario_obras FOR SELECT
  USING (usuario_id = auth.uid());

-- 5. Policies em perfis
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON perfis;
DROP POLICY IF EXISTS "Users can insert their own profile." ON perfis;
DROP POLICY IF EXISTS "Users can update own profile." ON perfis;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON perfis;
DROP POLICY IF EXISTS "Authenticated users can manage perfis" ON perfis;

CREATE POLICY "perfis_select"
  ON perfis FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "perfis_insert"
  ON perfis FOR INSERT
  WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "perfis_update"
  ON perfis FOR UPDATE
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "perfis_delete"
  ON perfis FOR DELETE
  USING (is_admin());

-- 6. Policies em obras
DROP POLICY IF EXISTS "Authenticated users can manage obras" ON obras;

CREATE POLICY "obras_select"
  ON obras FOR SELECT
  USING (user_has_obra_access(id));

CREATE POLICY "obras_insert"
  ON obras FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "obras_update"
  ON obras FOR UPDATE
  USING (is_admin());

CREATE POLICY "obras_delete"
  ON obras FOR DELETE
  USING (is_admin());

-- 7. Policies em diario_obra
DROP POLICY IF EXISTS "Authenticated users can manage diario" ON diario_obra;
DROP POLICY IF EXISTS "Authenticated users can manage diario_obra" ON diario_obra;

CREATE POLICY "diario_select"
  ON diario_obra FOR SELECT
  USING (user_has_obra_access(obra_id));

CREATE POLICY "diario_write"
  ON diario_obra FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "diario_update"
  ON diario_obra FOR UPDATE
  USING (is_admin());

CREATE POLICY "diario_delete"
  ON diario_obra FOR DELETE
  USING (is_admin());

-- 8. Policies em solicitacoes_compra
DROP POLICY IF EXISTS "Authenticated users can manage solicitacoes_compra" ON solicitacoes_compra;
DROP POLICY IF EXISTS "Authenticated users can manage compras" ON solicitacoes_compra;

CREATE POLICY "solicitacoes_select"
  ON solicitacoes_compra FOR SELECT
  USING (user_has_obra_access(obra_id));

CREATE POLICY "solicitacoes_write"
  ON solicitacoes_compra FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "solicitacoes_update"
  ON solicitacoes_compra FOR UPDATE
  USING (is_admin());

CREATE POLICY "solicitacoes_delete"
  ON solicitacoes_compra FOR DELETE
  USING (is_admin());

-- 9. Policies em financeiro
DROP POLICY IF EXISTS "Authenticated users can manage financeiro" ON financeiro;

CREATE POLICY "financeiro_select"
  ON financeiro FOR SELECT
  USING (user_has_obra_access(obra_id));

CREATE POLICY "financeiro_write"
  ON financeiro FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "financeiro_update"
  ON financeiro FOR UPDATE
  USING (is_admin());

CREATE POLICY "financeiro_delete"
  ON financeiro FOR DELETE
  USING (is_admin());

-- 10. Policies em compras
DROP POLICY IF EXISTS "Authenticated users can manage compras" ON compras;

CREATE POLICY "compras_select"
  ON compras FOR SELECT
  USING (user_has_obra_access(obra_id));

CREATE POLICY "compras_write"
  ON compras FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "compras_update"
  ON compras FOR UPDATE
  USING (is_admin());

CREATE POLICY "compras_delete"
  ON compras FOR DELETE
  USING (is_admin());

-- 11. Policies em cotacoes (acesso via obra da solicitação)
DROP POLICY IF EXISTS "Authenticated users can manage cotacoes" ON cotacoes;

CREATE POLICY "cotacoes_select"
  ON cotacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM solicitacoes_compra s
      WHERE s.id = cotacoes.solicitacao_id
        AND user_has_obra_access(s.obra_id)
    )
  );

CREATE POLICY "cotacoes_write"
  ON cotacoes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "cotacoes_update"
  ON cotacoes FOR UPDATE
  USING (is_admin());

CREATE POLICY "cotacoes_delete"
  ON cotacoes FOR DELETE
  USING (is_admin());

-- 12. Permissão para a função is_admin ser chamada por usuários autenticados
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_papel() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_obra_access(UUID) TO authenticated;
