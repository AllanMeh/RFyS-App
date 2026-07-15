/**
 * @file orders.ts
 * @description Servicio híbrido para la entidad Pedidos.
 */

import { runHybrid } from './dbClient';
import { fetchPedidos, upsertPedido, deletePedido } from '../pedidosService';
import type { Order } from '../../types';
import { INITIAL_ORDERS } from '../../data';

const STORAGE_KEY = 'rf_orders';

/**
 * Obtiene los pedidos almacenados localmente de forma síncrona.
 */
export function getLocalOrders(): Order[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as Order[];
    } catch {
      return INITIAL_ORDERS;
    }
  }
  return INITIAL_ORDERS;
}

/**
 * Guarda los pedidos en localStorage.
 */
export function saveLocalOrders(orders: Order[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }
}

/**
 * Obtiene los pedidos de forma híbrida.
 */
export async function getOrders(): Promise<Order[]> {
  return runHybrid(
    async () => {
      const dbOrders = await fetchPedidos();
      if (dbOrders && dbOrders.length > 0) {
        saveLocalOrders(dbOrders);
        return dbOrders;
      }
      return getLocalOrders();
    },
    () => getLocalOrders(),
    'obtenerPedidos'
  );
}

/**
 * Agrega un nuevo pedido.
 */
export async function addOrder(order: Order): Promise<void> {
  const local = getLocalOrders();
  if (!local.some(o => o.id === order.id)) {
    local.push(order);
    saveLocalOrders(local);
  }

  await runHybrid(
    async () => {
      await upsertPedido(order);
    },
    () => {},
    'insertarPedido'
  );
}

/**
 * Actualiza un pedido.
 */
export async function editOrder(order: Order): Promise<void> {
  const local = getLocalOrders();
  const index = local.findIndex(o => o.id === order.id);
  if (index !== -1) {
    local[index] = order;
    saveLocalOrders(local);
  }

  await runHybrid(
    async () => {
      await upsertPedido(order);
    },
    () => {},
    'actualizarPedido'
  );
}

/**
 * Elimina un pedido.
 */
export async function removeOrder(id: string): Promise<void> {
  const local = getLocalOrders();
  const filtered = local.filter(o => o.id !== id);
  saveLocalOrders(filtered);

  await runHybrid(
    async () => {
      await deletePedido(id);
    },
    () => {},
    'eliminarPedido'
  );
}
