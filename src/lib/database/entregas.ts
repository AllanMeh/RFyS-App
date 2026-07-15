/**
 * @file entregas.ts
 * @description Servicio híbrido para la entidad Entregas en Ruta (entregas_en_ruta / rf_en_ruta_ids).
 */

import { supabase } from '../supabase';
import { runHybrid } from './dbClient';

const STORAGE_KEY = 'rf_en_ruta_ids';
const STORE_ID = 'default';

/**
 * Obtiene los IDs de órdenes en ruta locales de forma síncrona.
 */
export function getLocalEnRutaIds(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as string[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Guarda los IDs en ruta localmente.
 */
export function saveLocalEnRutaIds(ids: string[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

/**
 * Obtiene los IDs en ruta de forma híbrida.
 */
export async function getEnRutaIds(): Promise<string[]> {
  return runHybrid(
    async () => {
      if (!supabase) return getLocalEnRutaIds();
      const { data, error } = await supabase
        .from('entregas_en_ruta')
        .select('order_ids')
        .eq('store_id', STORE_ID)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return getLocalEnRutaIds();
        throw error;
      }
      const ids = (data?.order_ids as string[]) ?? [];
      saveLocalEnRutaIds(ids);
      return ids;
    },
    () => getLocalEnRutaIds(),
    'obtenerEntregasEnRuta'
  );
}

/**
 * Guarda los IDs en ruta.
 */
export async function updateEnRutaIds(ids: string[]): Promise<void> {
  saveLocalEnRutaIds(ids);

  await runHybrid(
    async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from('entregas_en_ruta')
        .upsert({ store_id: STORE_ID, order_ids: ids }, { onConflict: 'store_id' });
      if (error) throw error;
    },
    () => {},
    'guardarEntregasEnRuta'
  );
}
