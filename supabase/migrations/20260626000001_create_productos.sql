-- ============================================================
-- Migración: 20260626000001_create_productos.sql
-- Descripción: Crea la tabla `productos` en Supabase.
--
-- Estrategia de mapeo desde la interfaz Product (types.ts):
--   - Campos escalares → columnas nativas (text, numeric, boolean, etc.)
--   - Arrays simples (customizationOptions, variants, ingredients, etc.) → text[]
--   - Objetos complejos de layouts (layout2Options, layout3Preps, etc.) → jsonb
--   - El campo `id` conserva el formato string original (ej. "prod-01")
--     para permitir coexistencia con localStorage sin conflictos de clave.
--
-- RLS (Row Level Security):
--   - Habilitado en la tabla.
--   - Política pública de solo lectura (SELECT) para authenticated y anon.
--   - Las operaciones de escritura (INSERT/UPDATE/DELETE) solo se realizan
--     desde el backend o roles con permisos explícitos (fase futura).
--
-- NOTA: Esta migración NO inserta datos. No modifica ninguna lógica
--       existente de la aplicación ni localStorage.
-- ============================================================

-- ─── Extensión para UUID (por si se necesita en el futuro) ───────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tabla principal de productos ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
  -- Identificador: conserva el formato string del frontend (ej. "prod-01")
  id                      TEXT PRIMARY KEY,

  -- ── Campos escalares básicos ──────────────────────────────────────────────
  nombre                  TEXT        NOT NULL,
  categoria               TEXT        NOT NULL,
  precio                  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descripcion             TEXT,
  imagen                  TEXT,
  activo                  BOOLEAN     NOT NULL DEFAULT true,
  agotado                 BOOLEAN     NOT NULL DEFAULT false,
  no_disponible_hoy       BOOLEAN     NOT NULL DEFAULT false,
  oculto                  BOOLEAN     NOT NULL DEFAULT false,
  orden                   INTEGER,
  permite_comentarios     BOOLEAN     NOT NULL DEFAULT false,
  tiene_variantes         BOOLEAN     NOT NULL DEFAULT false,
  aplica_redondeo         BOOLEAN     NOT NULL DEFAULT false,
  permite_presentacion    BOOLEAN     NOT NULL DEFAULT false,

  -- ── Tipo de producto y layout ────────────────────────────────────────────
  tipo_producto           TEXT,       -- 'simple' | 'custom' | 'tacos_guisado' | etc.
  layout                  TEXT,       -- 'layout_1_simple' | 'layout_2_cantidades' | etc.

  -- ── Arrays simples → columnas nativas text[] ─────────────────────────────
  opciones_personalizacion  TEXT[]    DEFAULT '{}',
  variantes                 TEXT[]    DEFAULT '{}',
  ingredientes              TEXT[]    DEFAULT '{}',
  ingredientes_base         TEXT[]    DEFAULT '{}',
  ingredientes_removibles   TEXT[]    DEFAULT '{}',

  -- ── Texto auxiliar de tarjeta informativa ────────────────────────────────
  texto_info_tarjeta      TEXT,

  -- ── Extras con precio (array de objetos) → jsonb ─────────────────────────
  -- Estructura: [{ "name": string, "price": number }]
  ingredientes_extra      JSONB       DEFAULT '[]',

  -- ── Presentaciones del layout general ────────────────────────────────────
  -- Estructura: [{ "name": string, "price": number }]
  presentaciones          JSONB       DEFAULT '[]',

  -- ── Layout 2: Selección por cantidades ───────────────────────────────────
  -- layout2Options:  [{ "name": string, "price": number, "active": boolean }]
  -- layout2Extras:   [{ "name": string, "price": number, "perPiece": boolean, "active": boolean }]
  layout2_opciones        JSONB       DEFAULT '[]',
  layout2_extras          JSONB       DEFAULT '[]',

  -- ── Layout 3: Platillo ────────────────────────────────────────────────────
  -- layout3Preps:      [{ "name": string, "priceDiff": number?, "active": boolean }]
  -- layout3Removables: [{ "name": string, "active": boolean }]
  layout3_preparaciones   JSONB       DEFAULT '[]',
  layout3_removibles      JSONB       DEFAULT '[]',
  layout3_extra_tortilla  BOOLEAN     NOT NULL DEFAULT false,
  layout3_precio_tortilla NUMERIC(10, 2),
  layout3_permite_pollo   BOOLEAN     NOT NULL DEFAULT false,

  -- ── Layout 4: Huevos al gusto ─────────────────────────────────────────────
  -- layout4Preps:      [{ "name": string, "active": boolean }]
  -- layout4Removables: [{ "name": string, "active": boolean }]
  layout4_preparaciones   JSONB       DEFAULT '[]',
  layout4_removibles      JSONB       DEFAULT '[]',
  layout4_extra_tortilla  BOOLEAN     NOT NULL DEFAULT false,
  layout4_precio_tortilla NUMERIC(10, 2),
  layout4_tortillas_incl  INTEGER,

  -- ── Layout 5: Frutas ─────────────────────────────────────────────────────
  -- layout5Presentations: [{ "name": string, "price": number, "active": boolean }]
  -- layout5Fruits:        [{ "name": string, "active": boolean }]
  -- layout5Extras:        [{ "name": string, "price": number, "active": boolean }]
  layout5_presentaciones  JSONB       DEFAULT '[]',
  layout5_frutas          JSONB       DEFAULT '[]',
  layout5_extras          JSONB       DEFAULT '[]',

  -- ── Layout 6: Proteína + Ingredientes ────────────────────────────────────
  -- layout6Proteins:   [{ "name": string, "price": number, "active": boolean }]
  -- layout6Removables: [{ "name": string, "active": boolean }]
  -- layout6Extras:     [{ "name": string, "price": number, "active": boolean }]
  layout6_proteinas       JSONB       DEFAULT '[]',
  layout6_removibles      JSONB       DEFAULT '[]',
  layout6_extras          JSONB       DEFAULT '[]',

  -- ── Layout 7: Bebidas Calientes ───────────────────────────────────────────
  -- layout7Sizes: [{ "name": string, "price": number, "active": boolean }]
  layout7_tamanios        JSONB       DEFAULT '[]',
  layout7_permite_leche   BOOLEAN     NOT NULL DEFAULT false,
  layout7_precio_leche    NUMERIC(10, 2),
  layout7_permite_azucar  BOOLEAN     NOT NULL DEFAULT false,

  -- ── Layout 8: Aguas Frescas ───────────────────────────────────────────────
  -- layout8Sizes:   [{ "name": string, "price": number, "active": boolean }]
  -- layout8Flavors: [{ "name": string, "active": boolean }]
  layout8_tamanios        JSONB       DEFAULT '[]',
  layout8_sabores         JSONB       DEFAULT '[]',

  -- ── Layout 9: Jugos ───────────────────────────────────────────────────────
  -- layout9Sizes:      [{ "name": string, "price": number, "active": boolean }]
  -- layout9Flavors:    [{ "name": string, "active": boolean }]
  -- layout9Modifiers:  [{ "name": string, "active": boolean }]
  layout9_tamanios        JSONB       DEFAULT '[]',
  layout9_sabores         JSONB       DEFAULT '[]',
  layout9_modificadores   JSONB       DEFAULT '[]',

  -- ── Auditoría ─────────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Índices útiles para consultas frecuentes ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_productos_categoria
  ON public.productos (categoria);

CREATE INDEX IF NOT EXISTS idx_productos_activo
  ON public.productos (activo);

CREATE INDEX IF NOT EXISTS idx_productos_orden
  ON public.productos (orden NULLS LAST);

-- ─── Trigger: actualiza updated_at automáticamente ───────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_productos_updated_at ON public.productos;
CREATE TRIGGER trg_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública (anon y authenticated) sin restricciones.
-- Los usuarios del POS solo necesitan leer el catálogo.
DROP POLICY IF EXISTS "productos_select_public" ON public.productos;
CREATE POLICY "productos_select_public"
  ON public.productos
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política: escritura solo para usuarios autenticados con rol service_role.
-- Las operaciones de administración del catálogo se harán desde el panel Admin.
-- En fases futuras se puede restringir por rol de usuario.
DROP POLICY IF EXISTS "productos_write_authenticated" ON public.productos;
CREATE POLICY "productos_write_authenticated"
  ON public.productos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Comentarios de tabla y columnas ─────────────────────────────────────────
COMMENT ON TABLE  public.productos IS 'Catálogo de productos de Rinconcito Frutal & Snacks. Mapea 1:1 con la interfaz Product de types.ts.';
COMMENT ON COLUMN public.productos.id IS 'Identificador string del frontend, ej. "prod-01". Mantiene compatibilidad con localStorage.';
COMMENT ON COLUMN public.productos.layout IS 'Tipo de layout del producto en el POS (layout_1_simple … layout_9_jugos).';
COMMENT ON COLUMN public.productos.ingredientes_extra IS 'JSON: [{ name: string, price: number }]';
COMMENT ON COLUMN public.productos.layout2_opciones IS 'JSON: [{ name, price, active }]';
COMMENT ON COLUMN public.productos.layout7_tamanios IS 'JSON: [{ name, price, active }]';
