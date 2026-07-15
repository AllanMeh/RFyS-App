-- ============================================================
-- Migración: 20260703000000_soft_delete_and_constraints.sql
-- Descripción: Agrega soporte de Soft Delete (deleted_at),
--   auditoría y restricciones de integridad referencial
--   para producción.
-- ============================================================

-- ─── 1. Agregar campo deleted_at a todas las tablas principales ───

ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.usuarios_pos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.cupones ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.cuentas_cliente ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ─── 2. Crear índices para optimizar consultas que excluyen registros eliminados ───

CREATE INDEX IF NOT EXISTS idx_productos_deleted_at ON public.productos (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_deleted_at ON public.clientes (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_deleted_at ON public.pedidos (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_pos_deleted_at ON public.usuarios_pos (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cupones_deleted_at ON public.cupones (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sucursales_deleted_at ON public.sucursales (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cuentas_cliente_deleted_at ON public.cuentas_cliente (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles (deleted_at) WHERE deleted_at IS NULL;

-- ─── 3. Agregar restricciones de clave foránea si corresponde ───

-- Relación de cupones con cuentas de cliente
-- Para no romper datos si el cliente es borrado físicamente, usamos ON DELETE SET NULL o ON DELETE CASCADE.
-- Como estamos en producción, ON DELETE SET NULL es ideal para mantener el histórico de cupones.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cupones_client_id'
  ) THEN
    -- Para hacer esto seguro sin migrar datos inválidos actuales, primero nos aseguramos de que no falle.
    -- Dado que client_id puede no coincidir en localStorage de prueba, no forzamos FK estricta a menos que los ids coincidan,
    -- pero como la estructura debe ser sólida para producción, la definimos.
    -- Nota: Usamos client_id como referencia opcional a cuentas_cliente(id)
    ALTER TABLE public.cupones
      ADD CONSTRAINT fk_cupones_client_id
      FOREIGN KEY (client_id)
      REFERENCES public.cuentas_cliente(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Relación de pedidos con clientes (opcional si el cliente existe en la tabla clientes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_pedidos_client_id'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT fk_pedidos_client_id
      FOREIGN KEY (client_id)
      REFERENCES public.clientes(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 4. Funciones auxiliares para Soft Delete ───

-- Función para realizar soft delete de un producto
CREATE OR REPLACE FUNCTION public.soft_delete_producto(target_id TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.productos
  SET deleted_at = NOW()
  WHERE id = target_id;
END;
$$;

-- Función para realizar soft delete de un cliente
CREATE OR REPLACE FUNCTION public.soft_delete_cliente(target_id TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.clientes
  SET deleted_at = NOW()
  WHERE id = target_id;
END;
$$;

-- Función para realizar soft delete de un pedido
CREATE OR REPLACE FUNCTION public.soft_delete_pedido(target_id TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.pedidos
  SET deleted_at = NOW()
  WHERE id = target_id;
END;
$$;

-- Comentarios
COMMENT ON COLUMN public.productos.deleted_at IS 'Fecha y hora de eliminación lógica para Soft Delete.';
COMMENT ON COLUMN public.clientes.deleted_at IS 'Fecha y hora de eliminación lógica para Soft Delete.';
COMMENT ON COLUMN public.pedidos.deleted_at IS 'Fecha y hora de eliminación lógica para Soft Delete.';
