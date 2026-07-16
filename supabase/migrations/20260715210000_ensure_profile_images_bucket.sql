-- ============================================================
-- Migración: 20260715210000_ensure_profile_images_bucket.sql
-- Descripción: Garantiza la existencia del bucket 'profile-images'
--   y la correcta configuración de políticas de acceso público (RLS).
-- ============================================================

-- Crear el bucket 'profile-images' si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para 'profile-images'
DROP POLICY IF EXISTS "profile_images_select" ON storage.objects;
CREATE POLICY "profile_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_insert" ON storage.objects;
CREATE POLICY "profile_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_update" ON storage.objects;
CREATE POLICY "profile_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_delete" ON storage.objects;
CREATE POLICY "profile_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'profile-images');
