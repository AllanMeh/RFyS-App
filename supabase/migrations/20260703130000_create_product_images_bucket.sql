-- ============================================================
-- Migración: 20260703130000_create_product_images_bucket.sql
-- Descripción: Crea el bucket de almacenamiento 'product-images'
--   y configura las políticas de seguridad (RLS) para lectura pública
--   y subida (upload) anónima y autenticada.
-- ============================================================

-- Asegurar que el esquema storage esté presente (normalmente lo está)
-- Creamos el bucket si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Lectura pública (cualquiera puede ver las imágenes)
DROP POLICY IF EXISTS "Imágenes de productos de acceso público" ON storage.objects;
CREATE POLICY "Imágenes de productos de acceso público" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'product-images');

-- Política: Subida de imágenes (anon y authenticated)
DROP POLICY IF EXISTS "Permitir subida de imágenes de productos" ON storage.objects;
CREATE POLICY "Permitir subida de imágenes de productos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'product-images');

-- Política: Actualización de imágenes
DROP POLICY IF EXISTS "Permitir actualización de imágenes de productos" ON storage.objects;
CREATE POLICY "Permitir actualización de imágenes de productos" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'product-images');

-- Política: Eliminación de imágenes
DROP POLICY IF EXISTS "Permitir eliminación de imágenes de productos" ON storage.objects;
CREATE POLICY "Permitir eliminación de imágenes de productos" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'product-images');
