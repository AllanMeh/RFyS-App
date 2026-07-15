/**
 * @file offlineQueue.ts
 * @description Módulo central de sincronización offline para encolar y reintentar operaciones fallidas.
 */

import { supabase } from '../supabase';

export interface QueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  payload: any;
  timestamp: string;
}

const QUEUE_KEY = 'rf_sync_queue';

/**
 * Obtiene la cola de sincronización de localStorage.
 */
export function getQueue(): QueueItem[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(QUEUE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as QueueItem[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Guarda la cola en localStorage.
 */
export function saveQueue(queue: QueueItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}

/**
 * Agrega una operación fallida a la cola.
 */
export function pushToQueue(table: string, operation: 'insert' | 'update' | 'delete' | 'upsert', payload: any): void {
  const queue = getQueue();

  // Evitar duplicados exactos
  const isDuplicate = queue.some(item => 
    item.table === table && 
    item.operation === operation && 
    JSON.stringify(item.payload) === JSON.stringify(payload)
  );
  if (isDuplicate) return;

  const newItem = {
    id: `${table}-${operation}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    table,
    operation,
    payload,
    timestamp: new Date().toISOString()
  };
  queue.push(newItem);

  saveQueue(queue);
  console.info(`[OfflineQueue] Operación encolada: ${operation} sobre tabla ${table}`);
}

/**
 * Procesa la cola en orden FIFO. Se detiene ante el primer fallo para preservar consistencia.
 */
export async function processQueue(): Promise<void> {
  if (!supabase) return;
  const queue = getQueue();

  if (queue.length === 0) return;

  console.info(`[OfflineQueue] Procesando ${queue.length} operaciones pendientes...`);
  let processedCount = 0;

  for (const item of [...queue]) {
    try {
      let error: any = null;

      if (item.operation === 'insert') {
        const { error: err } = await supabase.from(item.table).insert(item.payload);
        error = err;
      } else if (item.operation === 'upsert') {
        const { error: err } = await supabase.from(item.table).upsert(item.payload);
        error = err;
      } else if (item.operation === 'update') {
        const payload = item.payload;
        if (Array.isArray(payload)) {
          const { error: err } = await supabase.from(item.table).upsert(payload);
          error = err;
        } else {
          const key = payload.id ? 'id' : (payload.store_id ? 'store_id' : null);
          if (key) {
            const { [key]: keyValue, ...fields } = payload;
            const { error: err } = await supabase.from(item.table).update(fields).eq(key, keyValue);
            error = err;
          } else {
            const { error: err } = await supabase.from(item.table).upsert(payload);
            error = err;
          }
        }
      } else if (item.operation === 'delete') {
        const key = item.payload.id ? 'id' : (item.payload.store_id ? 'store_id' : null);
        if (key) {
          const { error: err } = await supabase.from(item.table).delete().eq(key, item.payload[key]);
          error = err;
        } else {
          console.warn('[OfflineQueue] No se encontró clave (id/store_id) para la operación delete, omitiendo');
        }
      }

      if (error) {
        throw error;
      }

      // Eliminar de la cola tras éxito
      const currentQueue = getQueue();
      const updated = currentQueue.filter(q => q.id !== item.id);
      saveQueue(updated);
      processedCount++;
    } catch (err: any) {
      console.error(`[OfflineQueue] Error al procesar elemento ${item.id}. Deteniendo cola.`, err.message || err);
      break; // Detener flujo FIFO ante cualquier error
    }
  }

  if (processedCount > 0) {
    console.info(`[OfflineQueue] Sincronizadas con éxito ${processedCount} operaciones pendientes.`);
  }
}

// Escuchar reconexión a Internet
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('[OfflineQueue] Conexión en línea restablecida, disparando cola...');
    processQueue();
  });
}
