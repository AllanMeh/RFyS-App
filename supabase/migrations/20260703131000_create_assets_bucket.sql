-- ============================================================
-- Migración: 20260703131000_create_assets_bucket.sql
-- Descripción: Crea el bucket de almacenamiento unificado 'assets'
--   y configura las políticas de seguridad (RLS) para lectura pública
--   y subida (upload) anónima y autenticada.
-- ============================================================

-- Creamos el bucket si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Lectura pública (cualquiera puede ver las imágenes en assets)
DROP POLICY IF EXISTS "Assets de acceso público" ON storage.objects;
CREATE POLICY "Assets de acceso público" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'assets');

-- Política: Subida de imágenes (anon y authenticated)
DROP POLICY IF EXISTS "Permitir subida de assets" ON storage.objects;
CREATE POLICY "Permitir subida de assets" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'assets');

-- Política: Actualización de imágenes
DROP POLICY IF EXISTS "Permitir actualización de assets" ON storage.objects;
CREATE POLICY "Permitir actualización de assets" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'assets');

-- Política: Eliminación de imágenes
DROP POLICY IF EXISTS "Permitir eliminación de assets" ON storage.objects;
CREATE POLICY "Permitir eliminación de assets" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'assets');
