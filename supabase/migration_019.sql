-- ============================================================
-- MIGRATION 019: Garante colunas fotos e comentarios em diario_obra
-- (estavam na migration_006, que não foi aplicada por completo)
-- ============================================================

ALTER TABLE public.diario_obra ADD COLUMN IF NOT EXISTS comentarios TEXT;
ALTER TABLE public.diario_obra ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
