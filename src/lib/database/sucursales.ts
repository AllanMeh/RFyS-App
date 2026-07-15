/**
 * @file sucursales.ts
 * @description Servicio híbrido para la entidad Sucursales (sucursales / rf_stores).
 */

import { supabase } from '../supabase';
import { runHybrid } from './dbClient';
import type { StoreInfo } from '../../types';
import { INITIAL_STORES } from '../../data';

const STORAGE_KEY = 'rf_stores';

function toRow(s: StoreInfo): Record<string, unknown> {
  return {
    id:     s.id,
    nombre: s.name,
    image:  s.image ?? null,
    orden:  s.order,
    active: s.active,
  };
}

function fromRow(r: Record<string, unknown>): StoreInfo {
  return {
    id:     r['id'] as string,
    name:   r['nombre'] as string,
    image:  (r['image'] as string) || undefined,
    order:  Number(r['orden'] || 0),
    active: r['active'] as boolean,
  };
}

/**
 * Obtiene las sucursales almacenadas localmente de forma síncrona.
 */
export function getLocalStores(): StoreInfo[] {
  if (typeof window === 'undefined') return INITIAL_STORES;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as StoreInfo[];
    } catch {
      return INITIAL_STORES;
    }
  }
  return INITIAL_STORES;
}

/**
 * Guarda las sucursales localmente.
 */
export function saveLocalStores(stores: StoreInfo[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
  }
}

/**
 * Obtiene las sucursales de forma híbrida.
 */
export async function getStores(): Promise<StoreInfo[]> {
  return runHybrid(
    async () => {
      if (!supabase) return getLocalStores();
      const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .order('orden', { ascending: true });
      if (error) throw error;
      const parsed = (data ?? []).map(r => fromRow(r as Record<string, unknown>));
      saveLocalStores(parsed);
      return parsed;
    },
    () => getLocalStores(),
    'obtenerSucursales'
  );
}

/**
 * Agrega o actualiza una sucursal.
 */
export async function addOrUpdateStore(store: StoreInfo): Promise<void> {
  const local = getLocalStores();
  const index = local.findIndex(s => s.id === store.id);
  if (index !== -1) {
    local[index] = store;
  } else {
    local.push(store);
  }
  saveLocalStores(local);

  await runHybrid(
    async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from('sucursales')
        .upsert(toRow(store), { onConflict: 'id' });
      if (error) throw error;
    },
    () => {},
    'guardarSucursal'
  );
}
