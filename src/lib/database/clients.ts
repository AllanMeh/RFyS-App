/**
 * @file clients.ts
 * @description Servicio híbrido para la entidad Clientes y Créditos.
 */

import { runHybrid } from './dbClient';
import { fetchClientes, upsertCliente, deleteCliente } from '../clientesService';
import type { ClientDebt } from '../../types';
import { INITIAL_CLIENTS } from '../../data';

const STORAGE_KEY = 'rf_clients';

/**
 * Obtiene los clientes almacenados localmente de forma síncrona.
 */
export function getLocalClients(): ClientDebt[] {
  if (typeof window === 'undefined') return INITIAL_CLIENTS;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as ClientDebt[];
    } catch {
      return INITIAL_CLIENTS;
    }
  }
  return INITIAL_CLIENTS;
}

/**
 * Guarda los clientes en localStorage.
 */
export function saveLocalClients(clients: ClientDebt[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }
}

/**
 * Obtiene los clientes de forma híbrida.
 */
export async function getClients(): Promise<ClientDebt[]> {
  return runHybrid(
    async () => {
      const dbClients = await fetchClientes();
      if (dbClients && dbClients.length > 0) {
        saveLocalClients(dbClients);
        return dbClients;
      }
      return getLocalClients();
    },
    () => getLocalClients(),
    'obtenerClientes'
  );
}

/**
 * Agrega un nuevo cliente.
 */
export async function addClient(client: ClientDebt): Promise<void> {
  const local = getLocalClients();
  if (!local.some(c => c.id === client.id)) {
    local.push(client);
    saveLocalClients(local);
  }

  await runHybrid(
    async () => {
      await upsertCliente(client);
    },
    () => {},
    'insertarCliente'
  );
}

/**
 * Actualiza un cliente existente.
 */
export async function editClient(client: ClientDebt): Promise<void> {
  const local = getLocalClients();
  const index = local.findIndex(c => c.id === client.id);
  if (index !== -1) {
    local[index] = client;
    saveLocalClients(local);
  }

  await runHybrid(
    async () => {
      await upsertCliente(client);
    },
    () => {},
    'actualizarCliente'
  );
}

/**
 * Elimina un cliente.
 */
export async function removeClient(id: string): Promise<void> {
  const local = getLocalClients();
  const filtered = local.filter(c => c.id !== id);
  saveLocalClients(filtered);

  await runHybrid(
    async () => {
      await deleteCliente(id);
    },
    () => {},
    'eliminarCliente'
  );
}
