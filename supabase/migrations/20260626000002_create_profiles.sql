-- ============================================================
-- Migración: 20260626000002_create_profiles.sql
-- Descripción: Crea la tabla `profiles` independiente para login
--   basado en número de teléfono y PIN.
-- ============================================================

-- Limpiar dependencias antiguas si existen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ─── Tabla profiles ─────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT        NOT NULL,
  telefono   TEXT        UNIQUE NOT NULL,
  pin_hash   TEXT        NOT NULL,
  rol        TEXT        NOT NULL DEFAULT 'Empleado'
                         CHECK (rol IN ('Administrador', 'Empleado', 'Repartidor', 'Líder')),
  activo     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_rol ON public.profiles (rol);
CREATE INDEX idx_profiles_activo ON public.profiles (activo);
CREATE INDEX idx_profiles_telefono ON public.profiles (telefono);

-- ─── Trigger: actualiza updated_at automáticamente ───────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Acceso total para anon y authenticated
DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;
CREATE POLICY "profiles_all_access"
  ON public.profiles FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Comentarios ─────────────────────────────────────────────────────────────
COMMENT ON TABLE  public.profiles IS 'Perfiles de usuarios del POS Rinconcito Frutal para login físico.';
COMMENT ON COLUMN public.profiles.rol IS 'Rol del usuario en el POS: Administrador | Empleado | Repartidor | Líder';
COMMENT ON COLUMN public.profiles.activo IS 'Si false, el usuario no puede acceder al sistema.';

-- ─── Usuario Administrador Inicial por defecto ───────────────────────────────
-- Teléfono: 5511223344
-- PIN: 1234
-- pin_hash: SHA-256 de '1234' = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
INSERT INTO public.profiles (nombre, telefono, pin_hash, rol, activo)
VALUES (
  'Administrador Principal',
  '5511223344',
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  'Administrador',
  true
)
ON CONFLICT (telefono) DO NOTHING;
