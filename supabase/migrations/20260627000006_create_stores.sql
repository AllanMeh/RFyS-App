-- ============================================================
-- Migración: 20260627000006_create_stores.sql
-- Descripción: Tabla `sucursales` para rf_stores (StoreInfo[]).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sucursales (
  id          TEXT        PRIMARY KEY,
  nombre      TEXT        NOT NULL DEFAULT '',
  image       TEXT,
  orden       INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sucursales_active ON public.sucursales (active);
CREATE INDEX IF NOT EXISTS idx_sucursales_orden  ON public.sucursales (orden);

DROP TRIGGER IF EXISTS trg_sucursales_updated_at ON public.sucursales;
CREATE TRIGGER trg_sucursales_updated_at
  BEFORE UPDATE ON public.sucursales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sucursales_all_access" ON public.sucursales;
CREATE POLICY "sucursales_all_access"
  ON public.sucursales FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.sucursales IS 'Sucursales / lugares de trabajo de clientes (rf_stores).';
