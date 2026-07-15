-- ============================================================
-- Migración: 20260703013031_create_missing_schema_items.sql
-- Descripción: Define el esquema restante (historial_pedidos,
--   movimientos_credito y auditoria) para la base de datos Supabase,
--   incorporando RLS, políticas de acceso libre, índices y auditoría.
-- ============================================================

-- ─── 1. TABLA: historial_pedidos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.historial_pedidos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       TEXT        NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_nuevo    TEXT        NOT NULL,
  usuario         TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_pedidos_pedido_id ON public.historial_pedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_historial_pedidos_timestamp ON public.historial_pedidos(timestamp);

ALTER TABLE public.historial_pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historial_pedidos_all_access"
  ON public.historial_pedidos FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.historial_pedidos IS 'Bitácora de cambios de estado en los pedidos.';

-- ─── 2. TABLA: movimientos_credito ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.movimientos_credito (
  id            TEXT        PRIMARY KEY,
  client_id     TEXT        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL, -- 'Pedido' | 'Pago' | 'Ajuste' etc.
  label         TEXT        NOT NULL DEFAULT '',
  date          TEXT        NOT NULL DEFAULT '',
  amount        NUMERIC     NOT NULL DEFAULT 0,
  status_label  TEXT        NOT NULL DEFAULT '',
  notes         TEXT,
  usuario       TEXT,
  sucursal      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_mov_credito_client_id ON public.movimientos_credito(client_id);
CREATE INDEX IF NOT EXISTS idx_mov_credito_deleted_at ON public.movimientos_credito(deleted_at) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_movimientos_credito_updated_at ON public.movimientos_credito;
CREATE TRIGGER trg_movimientos_credito_updated_at
  BEFORE UPDATE ON public.movimientos_credito
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.movimientos_credito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movimientos_credito_all_access"
  ON public.movimientos_credito FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.movimientos_credito IS 'Historial relacional de movimientos de crédito (abonos, cargos, etc.) de los clientes.';

-- ─── 3. TABLA: auditoria ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auditoria (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT        NOT NULL,
  record_id    TEXT        NOT NULL,
  action       TEXT        NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE'
  performed_by TEXT,
  old_data     JSONB,
  new_data     JSONB,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_table_name ON public.auditoria(table_name);
CREATE INDEX IF NOT EXISTS idx_auditoria_record_id  ON public.auditoria(record_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp  ON public.auditoria(timestamp);

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditoria_all_access"
  ON public.auditoria FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.auditoria IS 'Tabla de auditoría global para registrar acciones críticas.';
