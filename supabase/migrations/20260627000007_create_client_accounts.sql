-- ============================================================
-- Migración: 20260627000007_create_client_accounts.sql
-- Descripción: Tabla `cuentas_cliente` para rf_client_accounts
--   (ClientAccount[]) y rf_active_client.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cuentas_cliente (
  id                        TEXT        PRIMARY KEY,
  nombre                    TEXT        NOT NULL DEFAULT '',
  email                     TEXT,
  telefono                  TEXT        NOT NULL DEFAULT '',
  password_hint             TEXT,
  default_store             TEXT        NOT NULL DEFAULT '',
  avatar_url                TEXT,
  avatar                    TEXT,
  notification_prefs        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  notifications_prompt_shown BOOLEAN    NOT NULL DEFAULT false,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cuentas_cliente_telefono ON public.cuentas_cliente (telefono);

DROP TRIGGER IF EXISTS trg_cuentas_cliente_updated_at ON public.cuentas_cliente;
CREATE TRIGGER trg_cuentas_cliente_updated_at
  BEFORE UPDATE ON public.cuentas_cliente
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.cuentas_cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cuentas_cliente_all_access" ON public.cuentas_cliente;
CREATE POLICY "cuentas_cliente_all_access"
  ON public.cuentas_cliente FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.cuentas_cliente IS 'Cuentas de clientes del portal (rf_client_accounts).';
