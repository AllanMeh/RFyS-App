/**
 * pedidosService.ts
 * CRUD para la tabla `public.pedidos` (rf_orders / Order[]).
 */

import { supabase } from './supabase';
import type { Order, OrderItem } from '../types';

// ─── Mapeo ────────────────────────────────────────────────────────────────────

function toRow(o: Order): Record<string, unknown> {
  return {
    id:             o.id,
    items:          o.items as unknown as object,
    subtotal:       o.subtotal,
    discount:       o.discount,
    total:          o.total,
    status:         o.status,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod ?? null,
    mixed_payment:  o.mixedPayment ? (o.mixedPayment as unknown as object) : null,
    client_name:    o.clientName ?? null,
    client_id:      o.clientId ?? null,
    timestamp:      o.timestamp,
    notes:          o.notes ?? null,
  };
}

function fromRow(r: Record<string, unknown>): Order {
  return {
    id:            r['id'] as string,
    items:         (r['items'] as OrderItem[]) ?? [],
    subtotal:      Number(r['subtotal']),
    discount:      Number(r['discount']),
    total:         Number(r['total']),
    status:        r['status'] as Order['status'],
    paymentStatus: r['payment_status'] as Order['paymentStatus'],
    paymentMethod: r['payment_method'] as Order['paymentMethod'] | undefined,
    mixedPayment:  r['mixed_payment'] as { cash: number; card: number } | undefined,
    clientName:    r['client_name'] as string | undefined,
    clientId:      r['client_id'] as string | undefined,
    timestamp:     r['timestamp'] as string,
    notes:         r['notes'] as string | undefined,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchPedidos(): Promise<Order[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) {
    console.warn('[Sync:Pedidos] ❌ fetchPedidos error:', error.message);
    return [];
  }
  console.info(`[Sync:Pedidos] ✅ ${(data ?? []).length} pedidos cargados desde Supabase.`);
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

// ─── Upsert individual ────────────────────────────────────────────────────────

export async function upsertPedido(pedido: Order): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('pedidos')
    .upsert(toRow(pedido), { onConflict: 'id' });
  if (error) {
    console.error('[Sync:Pedidos] ❌ upsertPedido error:', error.message);
    throw new Error(error.message);
  } else {
    console.info(`[Sync:Pedidos] ⬆️ Pedido ${pedido.id} sincronizado.`);
  }
}

// ─── Upsert bulk ─────────────────────────────────────────────────────────────

export async function upsertPedidosBulk(pedidos: Order[]): Promise<void> {
  if (!supabase || pedidos.length === 0) return;
  const rows = pedidos.map(toRow);
  const { error } = await supabase
    .from('pedidos')
    .upsert(rows, { onConflict: 'id' });
  if (error) {
    console.warn('[Sync:Pedidos] ❌ upsertPedidosBulk error:', error.message);
  } else {
    console.info(`[Sync:Pedidos] ⬆️ ${pedidos.length} pedidos sincronizados en bulk.`);
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePedido(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('pedidos').delete().eq('id', id);
  if (error) {
    console.warn('[Sync:Pedidos] ❌ deletePedido error:', error.message);
  }
}
