-- ============================================================
-- Migración: 20260627000002_create_pedidos.sql
-- Descripción: Tabla `pedidos` para rf_orders (Order[])
--   con items embebidos como JSONB.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedidos (
  id              TEXT        PRIMARY KEY,
  items           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  subtotal        NUMERIC     NOT NULL DEFAULT 0,
  discount        NUMERIC     NOT NULL DEFAULT 0,
  total           NUMERIC     NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'Pendiente'
                              CHECK (status IN ('Pendiente','En preparación','Listo','Entregado','Cancelado')),
  payment_status  TEXT        NOT NULL DEFAULT 'Pendiente'
                              CHECK (payment_status IN ('Pendiente','Pagado','Crédito')),
  payment_method  TEXT,
  mixed_payment   JSONB,
  client_name     TEXT,
  client_id       TEXT,
  timestamp       TEXT        NOT NULL DEFAULT '',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_status         ON public.pedidos (status);
CREATE INDEX IF NOT EXISTS idx_pedidos_payment_status ON public.pedidos (payment_status);
CREATE INDEX IF NOT EXISTS idx_pedidos_client_id      ON public.pedidos (client_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_timestamp      ON public.pedidos (timestamp);

DROP TRIGGER IF EXISTS trg_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER trg_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_all_access" ON public.pedidos;
CREATE POLICY "pedidos_all_access"
  ON public.pedidos FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.pedidos IS 'Órdenes del POS (rf_orders).';
