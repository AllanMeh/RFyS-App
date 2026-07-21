-- ============================================================
-- Migración: 20260721000000_add_delivery_time.sql
-- Descripción: Agrega el campo estructurado delivery_time a la tabla pedidos.
-- ============================================================

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS delivery_time TEXT;

COMMENT ON COLUMN public.pedidos.delivery_time IS 'Hora de entrega estructurada, ej. "3:00 PM" o "Ahora".';
