-- ============================================================
-- Migración: 20260703000002_allow_anon_products.sql
-- Descripción: Permite lectura y escritura total para anon
--   y authenticated en la tabla `productos` para habilitar
--   la sincronización en modo híbrido.
-- ============================================================

DROP POLICY IF EXISTS "productos_select_public" ON public.productos;
DROP POLICY IF EXISTS "productos_write_authenticated" ON public.productos;

CREATE POLICY "productos_all_access"
  ON public.productos FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);
