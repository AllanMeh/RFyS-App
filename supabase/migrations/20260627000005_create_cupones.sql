-- ============================================================
-- Migración: 20260627000005_create_cupones.sql
-- Descripción: Tabla `cupones` para rf_coupons (Coupon[]).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cupones (
  id          TEXT        PRIMARY KEY,
  code        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'porcentaje'
                          CHECK (type IN ('porcentaje','fijo')),
  value       NUMERIC     NOT NULL DEFAULT 0,
  valid_until TEXT        NOT NULL DEFAULT '',
  client_id   TEXT        NOT NULL DEFAULT '',
  used        BOOLEAN     NOT NULL DEFAULT false,
  nombre      TEXT,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupones_client_id ON public.cupones (client_id);
CREATE INDEX IF NOT EXISTS idx_cupones_code      ON public.cupones (code);
CREATE INDEX IF NOT EXISTS idx_cupones_used      ON public.cupones (used);

DROP TRIGGER IF EXISTS trg_cupones_updated_at ON public.cupones;
CREATE TRIGGER trg_cupones_updated_at
  BEFORE UPDATE ON public.cupones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cupones_all_access" ON public.cupones;
CREATE POLICY "cupones_all_access"
  ON public.cupones FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.cupones IS 'Cupones de descuento del POS (rf_coupons).';
