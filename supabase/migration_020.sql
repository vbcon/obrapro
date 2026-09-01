-- ============================================================
-- MIGRATION 020: Garante bucket "status-obra" e políticas de storage
-- (fotos do Status da Obra e dos Relatórios)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('status-obra', 'status-obra', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "status_obra_upload"  ON storage.objects;
DROP POLICY IF EXISTS "status_obra_leitura" ON storage.objects;
DROP POLICY IF EXISTS "status_obra_update"  ON storage.objects;
DROP POLICY IF EXISTS "status_obra_deletar" ON storage.objects;

CREATE POLICY "status_obra_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'status-obra' AND auth.role() = 'authenticated');

CREATE POLICY "status_obra_leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'status-obra');

CREATE POLICY "status_obra_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'status-obra' AND auth.role() = 'authenticated');

CREATE POLICY "status_obra_deletar" ON storage.objects FOR DELETE
  USING (bucket_id = 'status-obra' AND auth.role() = 'authenticated');
