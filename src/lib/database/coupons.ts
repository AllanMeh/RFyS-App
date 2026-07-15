/**
 * @file coupons.ts
 * @description Servicio híbrido para la entidad Cupones.
 */

import { supabase } from '../supabase';
import { runHybrid } from './dbClient';
import type { Coupon } from '../../types';

const STORAGE_KEY = 'rf_coupons';

function toRow(c: Coupon): Record<string, unknown> {
  return {
    id:          c.id,
    code:        c.code,
    type:        c.type,
    value:       c.value,
    valid_until: c.validUntil,
    client_id:   c.clientId,
    used:        c.used,
    nombre:      c.name ?? null,
    active:      c.active ?? true,
  };
}

function fromRow(r: Record<string, unknown>): Coupon {
  return {
    id:         (r['id'] as string) || '',
    code:       (r['code'] as string) || '',
    type:       (r['type'] as 'porcentaje' | 'fijo') || 'porcentaje',
    value:      Number(r['value']) || 0,
    validUntil: (r['valid_until'] as string) || '',
    clientId:   (r['client_id'] as string) || '',
    used:       Boolean(r['used']),
    name:       (r['nombre'] as string) || undefined,
    active:     r['active'] !== undefined ? Boolean(r['active']) : undefined,
  };
}

/**
 * Obtiene los cupones almacenados localmente de forma síncrona.
 */
export function getLocalCoupons(): Coupon[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Guarda los cupones en localStorage.
 */
export function saveLocalCoupons(coupons: Coupon[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  }
}

/**
 * Obtiene los cupones de forma híbrida.
 */
export async function getCoupons(): Promise<Coupon[]> {
  return runHybrid(
    async () => {
      if (!supabase) return getLocalCoupons();
      const { data, error } = await supabase
        .from('cupones')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const parsed = (data ?? []).map(r => fromRow(r as Record<string, unknown>));
      saveLocalCoupons(parsed);
      return parsed;
    },
    () => getLocalCoupons(),
    'obtenerCupones'
  );
}

/**
 * Agrega un cupón.
 */
export async function addCoupon(coupon: Coupon): Promise<void> {
  const local = getLocalCoupons();
  if (!local.some(c => c.id === coupon.id)) {
    local.push(coupon);
    saveLocalCoupons(local);
  }

  await runHybrid(
    async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from('cupones')
        .insert(toRow(coupon));
      if (error) throw error;
    },
    () => {},
    'insertarCupon'
  );
}

/**
 * Actualiza un cupón.
 */
export async function editCoupon(coupon: Coupon): Promise<void> {
  const local = getLocalCoupons();
  const index = local.findIndex(c => c.id === coupon.id);
  if (index !== -1) {
    local[index] = coupon;
    saveLocalCoupons(local);
  }

  await runHybrid(
    async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from('cupones')
        .update(toRow(coupon))
        .eq('id', coupon.id);
      if (error) throw error;
    },
    () => {},
    'actualizarCupon'
  );
}

/**
 * Elimina un cupón.
 */
export async function removeCoupon(id: string): Promise<void> {
  const local = getLocalCoupons();
  const filtered = local.filter(c => c.id !== id);
  saveLocalCoupons(filtered);

  await runHybrid(
    async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from('cupones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    () => {},
    'eliminarCupon'
  );
}
