-- ============================================================
-- Migración: 20260627000001_create_clientes.sql
-- Descripción: Tabla `clientes` para rf_clients (ClientDebt[])
--   con historial de movimientos embebido como JSONB.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clientes (
  id              TEXT        PRIMARY KEY,
  nombre          TEXT        NOT NULL DEFAULT '',
  telefono        TEXT        NOT NULL DEFAULT 'Sin teléfono',
  branch          TEXT        NOT NULL DEFAULT 'Station #1 - Central',
  balance         NUMERIC     NOT NULL DEFAULT 0,
  days_overdue    INTEGER     NOT NULL DEFAULT 0,
  last_movement   TEXT        NOT NULL DEFAULT '',
  pedidos_pendientes INTEGER  NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'Activa'
                              CHECK (status IN ('Activa','Pagada','Cerrada','Archivada','Eliminada')),
  paid_at         TEXT,
  history         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_status   ON public.clientes (status);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes (telefono);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_all_access" ON public.clientes;
CREATE POLICY "clientes_all_access"
  ON public.clientes FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.clientes IS 'Perfiles de crédito de clientes del POS (rf_clients).';
