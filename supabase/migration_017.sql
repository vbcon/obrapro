-- ============================================================
-- MIGRATION 017: Garante bucket "projetos" e políticas de storage
-- (rode se o upload de arquivos na obra estiver falhando)
-- ============================================================

-- 1. Bucket público "projetos"
INSERT INTO storage.buckets (id, name, public)
VALUES ('projetos', 'projetos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Políticas de storage do bucket (recria para garantir)
DROP POLICY IF EXISTS "projetos_upload"   ON storage.objects;
DROP POLICY IF EXISTS "projetos_leitura"  ON storage.objects;
DROP POLICY IF EXISTS "projetos_deletar"  ON storage.objects;
DROP POLICY IF EXISTS "projetos_update"   ON storage.objects;

CREATE POLICY "projetos_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'projetos' AND auth.role() = 'authenticated');

CREATE POLICY "projetos_leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'projetos');

CREATE POLICY "projetos_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'projetos' AND auth.role() = 'authenticated');

CREATE POLICY "projetos_deletar" ON storage.objects FOR DELETE
  USING (bucket_id = 'projetos' AND auth.role() = 'authenticated');

-- 3. Garante a tabela obra_arquivos e suas políticas
CREATE TABLE IF NOT EXISTS public.obra_arquivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  tamanho INTEGER,
  storage_path TEXT NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.obra_arquivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "obra_arquivos_select"           ON public.obra_arquivos;
DROP POLICY IF EXISTS "obra_arquivos_insert"           ON public.obra_arquivos;
DROP POLICY IF EXISTS "obra_arquivos_delete"           ON public.obra_arquivos;
DROP POLICY IF EXISTS "Usuários gerenciam arquivos de suas obras" ON public.obra_arquivos;

CREATE POLICY "obra_arquivos_select" ON public.obra_arquivos
  FOR SELECT USING (public.user_has_obra_access(obra_id));
CREATE POLICY "obra_arquivos_insert" ON public.obra_arquivos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "obra_arquivos_delete" ON public.obra_arquivos
  FOR DELETE USING (auth.uid() IS NOT NULL);
