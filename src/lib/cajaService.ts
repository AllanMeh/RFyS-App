/**
 * cajaService.ts
 * CRUD para `public.caja_estado` (rf_caja / CajaStatus) y
 * `public.caja_movimientos_extra` (rf_caja_extra_movements / ExtraMovement[]).
 */

import { supabase } from './supabase';
import type { CajaStatus, ExtraMovement } from '../types';

const STORE_ID = 'default';

// ─── CajaStatus — mapeo ───────────────────────────────────────────────────────

function cajaToRow(c: CajaStatus): Record<string, unknown> {
  return {
    store_id:                    STORE_ID,
    ventas_del_dia:              c.ventasDelDia,
    pedidos_pagados:             c.pedidosPagados,
    pedidos_pendientes:          c.pedidosPendientes,
    dinero_entregado_a_lider:    c.dineroEntregadoALider,
    entregas_pendientes_a_lider: (c.entregasPendientesALider ?? []) as unknown as object,
    fondo_caja:                  c.fondoCaja,
    historial_cierres:           (c.historialCierres ?? []) as unknown as object,
  };
}

function cajaFromRow(r: Record<string, unknown>): CajaStatus {
  return {
    ventasDelDia:              Number(r['ventas_del_dia']),
    pedidosPagados:            Number(r['pedidos_pagados']),
    pedidosPendientes:         Number(r['pedidos_pendientes']),
    dineroEntregadoALider:     Number(r['dinero_entregado_a_lider']),
    entregasPendientesALider:  (r['entregas_pendientes_a_lider'] as CajaStatus['entregasPendientesALider']) ?? [],
    fondoCaja:                 Number(r['fondo_caja']),
    historialCierres:          (r['historial_cierres'] as CajaStatus['historialCierres']) ?? [],
  };
}

// ─── CajaEstado — fetch ───────────────────────────────────────────────────────

export async function fetchCajaEstado(): Promise<CajaStatus | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('caja_estado')
    .select('*')
    .eq('store_id', STORE_ID)
    .single();
  if (error) {
    console.warn('[Sync:Caja] ❌ fetchCajaEstado error:', error.message);
    return null;
  }
  console.info('[Sync:Caja] ✅ Estado de caja cargado desde Supabase.');
  return cajaFromRow(data as Record<string, unknown>);
}

// ─── CajaEstado — save ────────────────────────────────────────────────────────

export async function saveCajaEstado(caja: CajaStatus): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('caja_estado')
    .upsert(cajaToRow(caja), { onConflict: 'store_id' });
  if (error) {
    console.warn('[Sync:Caja] ❌ saveCajaEstado error:', error.message);
  } else {
    console.info('[Sync:Caja] ⬆️ Estado de caja sincronizado.');
  }
}

// ─── MovimientosExtra — mapeo ─────────────────────────────────────────────────

function movToRow(m: ExtraMovement): Record<string, unknown> {
  return {
    id:             m.id,
    type:           m.type,
    concept:        m.concept,
    amount:         m.amount,
    payment_method: m.paymentMethod ?? null,
    timestamp:      m.timestamp,
    client_name:    m.clientName ?? null,
    client_id:      m.clientId ?? null,
    category:       m.category ?? null,
    usuario:        m.usuario ?? null,
    sucursal:       m.sucursal ?? null,
  };
}

function movFromRow(r: Record<string, unknown>): ExtraMovement {
  return {
    id:            r['id'] as string,
    type:          r['type'] as ExtraMovement['type'],
    concept:       r['concept'] as string,
    amount:        Number(r['amount']),
    paymentMethod: r['payment_method'] as ExtraMovement['paymentMethod'] | undefined,
    timestamp:     r['timestamp'] as string,
    clientName:    r['client_name'] as string | undefined,
    clientId:      r['client_id'] as string | undefined,
    category:      r['category'] as string | undefined,
    usuario:       r['usuario'] as string | undefined,
    sucursal:      r['sucursal'] as string | undefined,
  };
}

// ─── MovimientosExtra — fetch ─────────────────────────────────────────────────

export async function fetchMovimientosExtra(): Promise<ExtraMovement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('caja_movimientos_extra')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) {
    console.warn('[Sync:Caja] ❌ fetchMovimientosExtra error:', error.message);
    return [];
  }
  console.info(`[Sync:Caja] ✅ ${(data ?? []).length} movimientos extra cargados.`);
  return (data ?? []).map(r => movFromRow(r as Record<string, unknown>));
}

// ─── MovimientosExtra — upsert individual ────────────────────────────────────

export async function upsertMovimientoExtra(mov: ExtraMovement): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('caja_movimientos_extra')
    .upsert(movToRow(mov), { onConflict: 'id' });
  if (error) {
    console.warn('[Sync:Caja] ❌ upsertMovimientoExtra error:', error.message);
  } else {
    console.info(`[Sync:Caja] ⬆️ Movimiento ${mov.id} sincronizado.`);
  }
}

// ─── MovimientosExtra — bulk ──────────────────────────────────────────────────

export async function upsertMovimientosExtraBulk(movs: ExtraMovement[]): Promise<void> {
  if (!supabase || movs.length === 0) return;
  const { error } = await supabase
    .from('caja_movimientos_extra')
    .upsert(movs.map(movToRow), { onConflict: 'id' });
  if (error) {
    console.warn('[Sync:Caja] ❌ upsertMovimientosExtraBulk error:', error.message);
  } else {
    console.info(`[Sync:Caja] ⬆️ ${movs.length} movimientos sincronizados en bulk.`);
  }
}

// ─── MovimientosExtra — delete ────────────────────────────────────────────────

export async function deleteMovimientoExtra(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('caja_movimientos_extra')
    .delete()
    .eq('id', id);
  if (error) {
    console.warn('[Sync:Caja] ❌ deleteMovimientoExtra error:', error.message);
  }
}
