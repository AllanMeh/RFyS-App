-- ============================================================
-- Migración: 20260627000003_create_caja.sql
-- Descripción: Tabla `caja_estado` (CajaStatus) y tabla
--   `caja_movimientos_extra` (ExtraMovement[]).
-- ============================================================

-- ─── caja_estado: fila única por tienda ─────────────────────
CREATE TABLE IF NOT EXISTS public.caja_estado (
  store_id                    TEXT        PRIMARY KEY DEFAULT 'default',
  ventas_del_dia              NUMERIC     NOT NULL DEFAULT 0,
  pedidos_pagados             INTEGER     NOT NULL DEFAULT 0,
  pedidos_pendientes          INTEGER     NOT NULL DEFAULT 0,
  dinero_entregado_a_lider    NUMERIC     NOT NULL DEFAULT 0,
  entregas_pendientes_a_lider JSONB       NOT NULL DEFAULT '[]'::jsonb,
  fondo_caja                  NUMERIC     NOT NULL DEFAULT 0,
  historial_cierres           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_caja_estado_updated_at ON public.caja_estado;
CREATE TRIGGER trg_caja_estado_updated_at
  BEFORE UPDATE ON public.caja_estado
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.caja_estado ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "caja_estado_all_access" ON public.caja_estado;
CREATE POLICY "caja_estado_all_access"
  ON public.caja_estado FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ─── caja_movimientos_extra ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.caja_movimientos_extra (
  id              TEXT        PRIMARY KEY,
  type            TEXT        NOT NULL
                              CHECK (type IN ('Abono','Gasto','PagoDirecto','Entrega')),
  concept         TEXT        NOT NULL DEFAULT '',
  amount          NUMERIC     NOT NULL DEFAULT 0,
  payment_method  TEXT,
  timestamp       TEXT        NOT NULL DEFAULT '',
  client_name     TEXT,
  client_id       TEXT,
  category        TEXT,
  usuario         TEXT,
  sucursal        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caja_mov_type      ON public.caja_movimientos_extra (type);
CREATE INDEX IF NOT EXISTS idx_caja_mov_timestamp ON public.caja_movimientos_extra (timestamp);

ALTER TABLE public.caja_movimientos_extra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "caja_movimientos_all_access" ON public.caja_movimientos_extra;
CREATE POLICY "caja_movimientos_all_access"
  ON public.caja_movimientos_extra FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.caja_estado IS 'Estado de caja del día (rf_caja).';
COMMENT ON TABLE public.caja_movimientos_extra IS 'Movimientos extra de caja (rf_caja_extra_movements).';

-- Fila inicial por defecto
INSERT INTO public.caja_estado (store_id) VALUES ('default')
ON CONFLICT (store_id) DO NOTHING;
