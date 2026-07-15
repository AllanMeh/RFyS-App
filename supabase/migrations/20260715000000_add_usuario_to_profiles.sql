-- ============================================================
-- Migración: 20260715000000_add_usuario_to_profiles.sql
-- Descripción: Agrega campos 'usuario' y 'avatar_url' a la tabla profiles.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS usuario TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Añadir índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_profiles_usuario ON public.profiles (usuario);
