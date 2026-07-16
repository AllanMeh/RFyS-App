-- ============================================================
-- Migración: 20260715190000_enable_realtime_pedidos.sql
-- Descripción: Habilitar Supabase Realtime para la tabla pedidos.
-- ============================================================

DO $$
BEGIN
  -- Verificar si la tabla ya está en la publicación supabase_realtime
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pedidos'
  ) THEN
    -- Agregar la tabla a la publicación para que emita eventos
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
  END IF;
END $$;
