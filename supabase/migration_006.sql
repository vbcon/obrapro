-- =============================================
-- MIGRATION 006 — Cronograma, Projetos da Obra, Status da Obra (fotos), OC Direta
-- =============================================

-- 1. Cronograma de eventos / marcos
CREATE TABLE IF NOT EXISTS cronograma (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'outro' CHECK (tipo IN ('marco', 'entrega', 'reuniao', 'vistoria', 'pagamento', 'outro')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dia_todo BOOLEAN DEFAULT true,
  concluido BOOLEAN DEFAULT false,
  cor TEXT DEFAULT '#F97316',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Arquivos / projetos vinculados à obra
CREATE TABLE IF NOT EXISTS obra_arquivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  tamanho INTEGER,
  storage_path TEXT NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Adicionar fotos e comentários ao diário / status da obra
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS comentarios TEXT;

-- 4. Adicionar tipo e itens à tabela compras (para OC direta)
ALTER TABLE compras ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'cotacao';
ALTER TABLE compras ADD COLUMN IF NOT EXISTS itens JSONB DEFAULT '[]'::jsonb;

-- 5. Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('projetos', 'projetos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('status-obra', 'status-obra', true)
ON CONFLICT (id) DO NOTHING;

-- 6. RLS
ALTER TABLE cronograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cronograma_select" ON cronograma FOR SELECT USING (user_has_obra_access(obra_id));
CREATE POLICY "cronograma_insert" ON cronograma FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cronograma_update" ON cronograma FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "cronograma_delete" ON cronograma FOR DELETE USING (is_admin());

CREATE POLICY "obra_arquivos_select" ON obra_arquivos FOR SELECT USING (user_has_obra_access(obra_id));
CREATE POLICY "obra_arquivos_insert" ON obra_arquivos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "obra_arquivos_delete" ON obra_arquivos FOR DELETE USING (is_admin());

-- 7. Trigger atualizado_em para cronograma
CREATE TRIGGER update_cronograma_atualizado_em
  BEFORE UPDATE ON cronograma
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 8. Storage policies
CREATE POLICY "projetos_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'projetos' AND auth.role() = 'authenticated');
CREATE POLICY "projetos_leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'projetos');
CREATE POLICY "projetos_deletar" ON storage.objects FOR DELETE
  USING (bucket_id = 'projetos' AND auth.role() = 'authenticated');

CREATE POLICY "status_obra_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'status-obra' AND auth.role() = 'authenticated');
CREATE POLICY "status_obra_leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'status-obra');
CREATE POLICY "status_obra_deletar" ON storage.objects FOR DELETE
  USING (bucket_id = 'status-obra' AND auth.role() = 'authenticated');
