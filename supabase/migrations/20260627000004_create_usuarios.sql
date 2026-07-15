-- ============================================================
-- Migración: 20260627000004_create_usuarios.sql
-- Descripción: Tabla `usuarios_pos` para rf_users (UserAccount[]).
--   Independiente de auth.users. Gestiona empleados internos del POS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usuarios_pos (
  id            TEXT        PRIMARY KEY,
  nombre        TEXT        NOT NULL DEFAULT '',
  telefono      TEXT        NOT NULL DEFAULT '',
  username      TEXT        NOT NULL DEFAULT '',
  rol           TEXT        NOT NULL DEFAULT 'Empleado'
                            CHECK (rol IN ('Administrador','Líder','Empleado','Repartidor','Cliente')),
  registered_at TEXT        NOT NULL DEFAULT '',
  avatar_url    TEXT,
  avatar        TEXT,
  password_hint TEXT,
  status        TEXT        DEFAULT 'Activa'
                            CHECK (status IN ('Activa','Suspendida')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_pos_rol ON public.usuarios_pos (rol);

DROP TRIGGER IF EXISTS trg_usuarios_pos_updated_at ON public.usuarios_pos;
CREATE TRIGGER trg_usuarios_pos_updated_at
  BEFORE UPDATE ON public.usuarios_pos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.usuarios_pos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_pos_all_access" ON public.usuarios_pos;
CREATE POLICY "usuarios_pos_all_access"
  ON public.usuarios_pos FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.usuarios_pos IS 'Empleados internos del POS (rf_users). Independiente de auth.users.';
