-- ============================================================
-- Migración: 20260715180000_drop_fk_pedidos_client_id.sql
-- Descripción: Eliminar la restricción de clave foránea fk_pedidos_client_id
--   para permitir el polimorfismo de client_id entre clientes y cuentas_cliente.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_pedidos_client_id'
  ) THEN
    ALTER TABLE public.pedidos DROP CONSTRAINT fk_pedidos_client_id;
  END IF;
END $$;
