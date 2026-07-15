/**
 * @file products.ts
 * @description Servicio híbrido para la entidad Productos.
 */

import { runHybrid } from './dbClient';
import { fetchProductos, insertProducto, updateProducto, deleteProducto, productToDbInsert } from '../productosService';
import { supabase } from '../supabase';
import type { Product } from '../../types';
import { INITIAL_PRODUCTS } from '../../data';

const STORAGE_KEY = 'rf_products';

/**
 * Obtiene los productos almacenados localmente de forma síncrona.
 * Útil para la inicialización inmediata del estado de React.
 */
export function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Product[];
      return parsed.map(p => {
        if (p.id === 'prod-11' || p.id === 'prod-12' || p.id === 'prod-13') {
          const fresh = INITIAL_PRODUCTS.find(x => x.id === p.id);
          if (fresh && !p.productLayout) {
            return { ...p, ...fresh };
          }
        }
        return p;
      });
    } catch {
      return INITIAL_PRODUCTS;
    }
  }
  return INITIAL_PRODUCTS;
}

/**
 * Guarda los productos en localStorage.
 */
export function saveLocalProducts(products: Product[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }
}

/**
 * Obtiene la lista de productos de forma híbrida (Supabase con fallback a localStorage).
 */
export async function getProducts(): Promise<Product[]> {
  return runHybrid(
    async () => {
      const dbProducts = await fetchProductos();
      if (dbProducts && dbProducts.length > 0) {
        saveLocalProducts(dbProducts); // Actualiza caché local
        return dbProducts;
      }
      
      // Si Supabase responde pero está vacío, importamos los productos locales la primera vez
      const local = getLocalProducts();
      if (local && local.length > 0 && supabase) {
        console.info(`[Sync:Products] ⬆️ Sincronizando catálogo inicial de productos a Supabase (${local.length} items)...`);
        const rows = local.map(productToDbInsert);
        const { error } = await supabase.from('productos').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.warn('[Sync:Products] Error en importación inicial automática:', error.message);
        } else {
          console.info('[Sync:Products] ✅ Sincronización inicial completada con éxito.');
        }
      }
      return local;
    },
    () => getLocalProducts(),
    'obtenerProductos'
  );
}

/**
 * Agrega un nuevo producto (escribe en localStorage y Supabase).
 */
export async function addProduct(product: Product): Promise<void> {
  const local = getLocalProducts();
  if (!local.some(p => p.id === product.id)) {
    local.push(product);
    saveLocalProducts(local);
  }

  await runHybrid(
    async () => {
      await insertProducto(product);
    },
    () => {},
    'insertarProducto'
  );
}

/**
 * Actualiza un producto existente (escribe en localStorage y Supabase).
 */
export async function editProduct(product: Product): Promise<void> {
  const local = getLocalProducts();
  const index = local.findIndex(p => p.id === product.id);
  if (index !== -1) {
    local[index] = product;
    saveLocalProducts(local);
  }

  await runHybrid(
    async () => {
      await updateProducto(product);
    },
    () => {},
    'actualizarProducto'
  );
}

/**
 * Elimina un producto por su ID (elimina en localStorage y Supabase).
 */
export async function removeProduct(id: string): Promise<void> {
  const local = getLocalProducts();
  const filtered = local.filter(p => p.id !== id);
  saveLocalProducts(filtered);

  await runHybrid(
    async () => {
      await deleteProducto(id);
    },
    () => {},
    'eliminarProducto'
  );
}
