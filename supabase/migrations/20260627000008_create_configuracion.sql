-- ============================================================
-- Migración: 20260627000008_create_configuracion.sql
-- Descripción: Tabla `configuracion` tipo key-value para
--   rf_store_closed, rf_logo_url, rf_pollo_status, rf_menu,
--   rf_theme_*, rf_last_notif_sent_*.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.configuracion (
  key         TEXT        PRIMARY KEY,
  value       TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_configuracion_updated_at ON public.configuracion;
CREATE TRIGGER trg_configuracion_updated_at
  BEFORE UPDATE ON public.configuracion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "configuracion_all_access" ON public.configuracion;
CREATE POLICY "configuracion_all_access"
  ON public.configuracion FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.configuracion IS 'Configuración global del POS en formato key-value.';

-- Valores iniciales
INSERT INTO public.configuracion (key, value) VALUES
  ('store_closed',  'false'),
  ('logo_url',      ''),
  ('pollo_status',  '{"pierna":true,"muslo":true}'),
  ('menu_del_dia',  '')
ON CONFLICT (key) DO NOTHING;
