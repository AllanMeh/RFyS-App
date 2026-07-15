/**
 * @file caja.ts
 * @description Servicio híbrido para la gestión de Caja (caja_estado y caja_movimientos_extra).
 */

import { runHybrid } from './dbClient';
import { fetchCajaEstado, saveCajaEstado, fetchMovimientosExtra, upsertMovimientoExtra, deleteMovimientoExtra } from '../cajaService';
import type { CajaStatus, ExtraMovement } from '../../types';
import { INITIAL_CAJA } from '../../data';

const STORAGE_KEY = 'rf_caja';
const STORAGE_MOV_KEY = 'rf_caja_extra_movements';

/**
 * Obtiene el estado de caja local de forma síncrona.
 */
export function getLocalCaja(): CajaStatus {
  if (typeof window === 'undefined') return INITIAL_CAJA;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as CajaStatus;
    } catch {
      return INITIAL_CAJA;
    }
  }
  return INITIAL_CAJA;
}

/**
 * Guarda el estado de caja localmente.
 */
export function saveLocalCaja(caja: CajaStatus): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(caja));
  }
}

/**
 * Obtiene el estado de caja de forma híbrida.
 */
export async function getCajaStatus(): Promise<CajaStatus> {
  return runHybrid(
    async () => {
      const dbCaja = await fetchCajaEstado();
      if (dbCaja) {
        saveLocalCaja(dbCaja);
        return dbCaja;
      }
      return getLocalCaja();
    },
    () => getLocalCaja(),
    'obtenerCajaEstado'
  );
}

/**
 * Actualiza el estado de caja.
 */
export async function updateCajaStatus(caja: CajaStatus): Promise<void> {
  saveLocalCaja(caja);

  await runHybrid(
    async () => {
      await saveCajaEstado(caja);
    },
    () => {},
    'actualizarCajaEstado'
  );
}

// ─── Movimientos Extra ───

/**
 * Obtiene los movimientos extra locales de forma síncrona.
 */
export function getLocalExtraMovements(): ExtraMovement[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_MOV_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as ExtraMovement[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Guarda los movimientos extra localmente.
 */
export function saveLocalExtraMovements(movs: ExtraMovement[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_MOV_KEY, JSON.stringify(movs));
  }
}

/**
 * Obtiene los movimientos extra de forma híbrida.
 */
export async function getExtraMovements(): Promise<ExtraMovement[]> {
  return runHybrid(
    async () => {
      const dbMovs = await fetchMovimientosExtra();
      if (dbMovs && dbMovs.length > 0) {
        saveLocalExtraMovements(dbMovs);
        return dbMovs;
      }
      return getLocalExtraMovements();
    },
    () => getLocalExtraMovements(),
    'obtenerMovimientosExtra'
  );
}

/**
 * Agrega un movimiento extra.
 */
export async function addExtraMovement(mov: ExtraMovement): Promise<void> {
  const local = getLocalExtraMovements();
  if (!local.some(m => m.id === mov.id)) {
    local.push(mov);
    saveLocalExtraMovements(local);
  }

  await runHybrid(
    async () => {
      await upsertMovimientoExtra(mov);
    },
    () => {},
    'insertarMovimientoExtra'
  );
}

/**
 * Elimina un movimiento extra.
 */
export async function removeExtraMovement(id: string): Promise<void> {
  const local = getLocalExtraMovements();
  const filtered = local.filter(m => m.id !== id);
  saveLocalExtraMovements(filtered);

  await runHybrid(
    async () => {
      await deleteMovimientoExtra(id);
    },
    () => {},
    'eliminarMovimientoExtra'
  );
}
