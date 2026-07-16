-- ============================================================
-- Migración: 20260715200000_pedidos_replica_full.sql
-- Descripción: Cambiar la identidad de réplica de pedidos a FULL
--   para asegurar que Supabase Realtime envíe todas las columnas
--   en el objeto payload.new durante los eventos UPDATE.
-- ============================================================

ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
