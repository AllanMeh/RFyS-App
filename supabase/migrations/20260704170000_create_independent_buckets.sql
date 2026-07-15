-- ============================================================
-- Migración: 20260704170000_create_independent_buckets.sql
-- Descripción: Crea los buckets independientes para perfiles, logos, sucursales y banners.
--   Las imágenes de productos (product-images) ya fueron creadas previamente.
--   Se elimina el bucket unificado 'assets' obsoleto.
-- ============================================================

-- Eliminar el bucket 'assets' que ya no será utilizado
DELETE FROM storage.buckets WHERE id = 'assets';

-- Creamos los nuevos buckets si no existen
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profile-images', 'profile-images', true),
  ('store-logos', 'store-logos', true),
  ('branch-images', 'branch-images', true),
  ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- POLÍTICAS PARA 'profile-images'
-- ==========================================
DROP POLICY IF EXISTS "profile_images_select" ON storage.objects;
CREATE POLICY "profile_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_insert" ON storage.objects;
CREATE POLICY "profile_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_update" ON storage.objects;
CREATE POLICY "profile_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_delete" ON storage.objects;
CREATE POLICY "profile_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'profile-images');


-- ==========================================
-- POLÍTICAS PARA 'store-logos'
-- ==========================================
DROP POLICY IF EXISTS "store_logos_select" ON storage.objects;
CREATE POLICY "store_logos_select" ON storage.objects FOR SELECT USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "store_logos_insert" ON storage.objects;
CREATE POLICY "store_logos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "store_logos_update" ON storage.objects;
CREATE POLICY "store_logos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "store_logos_delete" ON storage.objects;
CREATE POLICY "store_logos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'store-logos');


-- ==========================================
-- POLÍTICAS PARA 'branch-images'
-- ==========================================
DROP POLICY IF EXISTS "branch_images_select" ON storage.objects;
CREATE POLICY "branch_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'branch-images');

DROP POLICY IF EXISTS "branch_images_insert" ON storage.objects;
CREATE POLICY "branch_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'branch-images');

DROP POLICY IF EXISTS "branch_images_update" ON storage.objects;
CREATE POLICY "branch_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'branch-images');

DROP POLICY IF EXISTS "branch_images_delete" ON storage.objects;
CREATE POLICY "branch_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'branch-images');


-- ==========================================
-- POLÍTICAS PARA 'banners'
-- ==========================================
DROP POLICY IF EXISTS "banners_select" ON storage.objects;
CREATE POLICY "banners_select" ON storage.objects FOR SELECT USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners_insert" ON storage.objects;
CREATE POLICY "banners_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners_update" ON storage.objects;
CREATE POLICY "banners_update" ON storage.objects FOR UPDATE USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners_delete" ON storage.objects;
CREATE POLICY "banners_delete" ON storage.objects FOR DELETE USING (bucket_id = 'banners');
