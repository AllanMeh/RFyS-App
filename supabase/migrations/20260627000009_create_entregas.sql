-- ============================================================
-- Migración: 20260627000009_create_entregas.sql
-- Descripción: Tabla `entregas_en_ruta` para rf_en_ruta_ids.
--   Almacena qué order IDs están marcados "en ruta" hoy.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.entregas_en_ruta (
  store_id    TEXT        PRIMARY KEY DEFAULT 'default',
  order_ids   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_entregas_updated_at ON public.entregas_en_ruta;
CREATE TRIGGER trg_entregas_updated_at
  BEFORE UPDATE ON public.entregas_en_ruta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.entregas_en_ruta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entregas_en_ruta_all_access" ON public.entregas_en_ruta;
CREATE POLICY "entregas_en_ruta_all_access"
  ON public.entregas_en_ruta FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.entregas_en_ruta IS 'IDs de órdenes en ruta actualmente (rf_en_ruta_ids).';

-- Fila inicial
INSERT INTO public.entregas_en_ruta (store_id) VALUES ('default')
ON CONFLICT (store_id) DO NOTHING;
