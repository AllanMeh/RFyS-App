/**
 * @file credits.ts
 * @description Servicio híbrido para la gestión de créditos. Reutiliza los servicios de clientes.
 */

import { getClients, editClient, getLocalClients, saveLocalClients } from './clients';
import type { ClientDebt } from '../../types';

/**
 * Obtiene todos los clientes de crédito.
 */
export async function getCreditClients(): Promise<ClientDebt[]> {
  return getClients();
}

/**
 * Obtiene los clientes de crédito locales de forma síncrona.
 */
export function getLocalCreditClients(): ClientDebt[] {
  return getLocalClients();
}

/**
 * Guarda los clientes de crédito localmente.
 */
export function saveLocalCreditClients(clients: ClientDebt[]): void {
  saveLocalClients(clients);
}

/**
 * Actualiza el estado de crédito de un cliente.
 */
export async function updateCreditClient(client: ClientDebt): Promise<void> {
  return editClient(client);
}
