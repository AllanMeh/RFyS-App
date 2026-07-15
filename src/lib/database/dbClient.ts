/**
 * @file dbClient.ts
 * @description Utilidades centrales para gestionar el modo híbrido (Supabase + LocalStorage fallback).
 */

import { supabase, getLastWriteQuery, clearLastWriteQuery } from '../supabase';
import { pushToQueue } from './offlineQueue';

/**
 * Verifica de forma rápida si Supabase responde y es alcanzable.
 */
export async function isSupabaseOnline(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('fetch') || msg.includes('network') || error.status === 504) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Ejecuta una operación contra Supabase. Si falla, se corta la conexión por timeout
 * o se lanza un error de red, recurre automáticamente a la operación local de LocalStorage.
 *
 * @param supabaseOp Operación asíncrona contra Supabase.
 * @param localStorageOp Operación (síncrona/asíncrona) contra LocalStorage.
 * @param fallbackMessage Mensaje descriptivo para depuración ante un fallback.
 */
export async function runHybrid<T>(
  supabaseOp: () => Promise<T>,
  localStorageOp: () => T | Promise<T>,
  fallbackMessage: string
): Promise<T> {
  if (!supabase) {
    return await localStorageOp();
  }
  // Clear any leftover write query state
  clearLastWriteQuery();

  try {
    // Implementamos una carrera con un timeout de 3.5 segundos para evitar colgar la UI en redes lentas/bloqueadas
    const result = await Promise.race([
      supabaseOp(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase request timeout (3500ms)')), 3500)
      )
    ]);
    return result;
  } catch (err: any) {
    console.warn(`[HybridDB] ⚠ Fallback a LocalStorage en "${fallbackMessage}". Detalle:`, err?.message || err);
    
    // Check if it's a write operation based on fallbackMessage prefix
    const msg = fallbackMessage.toLowerCase();
    const isWrite = msg.startsWith('insertar') || msg.startsWith('actualizar') || msg.startsWith('eliminar') || msg.startsWith('guardar');
    
    if (isWrite) {
      const lastWrite = getLastWriteQuery();
      if (lastWrite) {
        pushToQueue(lastWrite.table, lastWrite.operation, lastWrite.payload);
      }
    }

    return await localStorageOp();
  } finally {
    clearLastWriteQuery();
  }
}
