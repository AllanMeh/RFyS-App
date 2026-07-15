/**
 * clientesService.ts
 * CRUD para la tabla `public.clientes` (rf_clients / ClientDebt[]).
 * Convierte entre ClientDebt (frontend) y el row de Supabase.
 */

import { supabase } from './supabase';
import type { ClientDebt, Movement } from '../types';

// ─── Mapeo ────────────────────────────────────────────────────────────────────

function toRow(c: ClientDebt): Record<string, unknown> {
  return {
    id:                 c.id,
    nombre:             c.name,
    telefono:           c.phone,
    branch:             c.branch,
    balance:            c.balance,
    days_overdue:       c.daysOverdue,
    last_movement:      c.lastMovement,
    pedidos_pendientes: c.pedidosPendientes,
    status:             c.status,
    paid_at:            c.paidAt ?? null,
    history:            c.history as unknown as object,
  };
}

function fromRow(r: Record<string, unknown>): ClientDebt {
  return {
    id:                r['id'] as string,
    name:              r['nombre'] as string,
    phone:             r['telefono'] as string,
    branch:            r['branch'] as string,
    balance:           Number(r['balance']),
    daysOverdue:       Number(r['days_overdue']),
    lastMovement:      r['last_movement'] as string,
    pedidosPendientes: Number(r['pedidos_pendientes']),
    status:            r['status'] as ClientDebt['status'],
    paidAt:            r['paid_at'] as string | undefined,
    history:           (r['history'] as Movement[]) ?? [],
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchClientes(): Promise<ClientDebt[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[Sync:Clientes] ❌ fetchClientes error:', error.message);
    return [];
  }
  console.info(`[Sync:Clientes] ✅ ${(data ?? []).length} clientes cargados desde Supabase.`);
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

// ─── Upsert individual ────────────────────────────────────────────────────────

export async function upsertCliente(cliente: ClientDebt): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('clientes')
    .upsert(toRow(cliente), { onConflict: 'id' });
  if (error) {
    console.warn('[Sync:Clientes] ❌ upsertCliente error:', error.message);
  } else {
    console.info(`[Sync:Clientes] ⬆️ Cliente ${cliente.id} sincronizado.`);
  }
}

// ─── Upsert bulk (carga inicial) ──────────────────────────────────────────────

export async function upsertClientesBulk(clientes: ClientDebt[]): Promise<void> {
  if (!supabase || clientes.length === 0) return;
  const rows = clientes.map(toRow);
  const { error } = await supabase
    .from('clientes')
    .upsert(rows, { onConflict: 'id' });
  if (error) {
    console.warn('[Sync:Clientes] ❌ upsertClientesBulk error:', error.message);
  } else {
    console.info(`[Sync:Clientes] ⬆️ ${clientes.length} clientes sincronizados en bulk.`);
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteCliente(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) {
    console.warn('[Sync:Clientes] ❌ deleteCliente error:', error.message);
  }
}
