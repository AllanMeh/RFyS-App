-- ============================================================
-- Migración: 20260715220000_ensure_store_logos_bucket.sql
-- Descripción: Garantiza la existencia del bucket 'store-logos'
--   y la correcta configuración de políticas de acceso público (RLS).
-- ============================================================

-- Crear el bucket 'store-logos' si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para 'store-logos'
DROP POLICY IF EXISTS "store_logos_select" ON storage.objects;
CREATE POLICY "store_logos_select" ON storage.objects FOR SELECT USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "store_logos_insert" ON storage.objects;
CREATE POLICY "store_logos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "store_logos_update" ON storage.objects;
CREATE POLICY "store_logos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "store_logos_delete" ON storage.objects;
CREATE POLICY "store_logos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'store-logos');
