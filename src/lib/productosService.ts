/**
 * @file productosService.ts
 * @description Capa de servicio para operaciones CRUD de productos en Supabase.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  FASE 1 – INFRAESTRUCTURA                                               │
 * │  Este archivo está PREPARADO pero NO está conectado a la aplicación.   │
 * │  localStorage sigue siendo la fuente de verdad hasta la Fase 2.        │
 * │  No importes ni uses estas funciones todavía en App.tsx ni componentes.│
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Mapeo de tipos:
 *   Product (types.ts)  ←→  ProductoRow (database.types.ts)
 *
 * Las funciones de mapeo convierten entre la interfaz del frontend (Product)
 * y el esquema de Supabase (ProductoRow) sin modificar la lógica de negocio.
 */

import supabase from './supabase';
import type { Product } from '../types';
import type { ProductoRow, ProductoInsert } from './database.types';

// ─── Mapeo: ProductoRow (DB) → Product (frontend) ────────────────────────────

export function dbRowToProduct(row: ProductoRow): Product {
  return {
    id: row.id,
    name: row.nombre,
    category: row.categoria,
    price: row.precio,
    image: row.imagen ?? '',
    active: row.activo,
    description: row.descripcion ?? undefined,
    agotado: row.agotado,
    noDisponibleHoy: row.no_disponible_hoy,
    oculto: row.oculto,
    orden: row.orden ?? undefined,
    allowComments: row.permite_comentarios,
    tieneVariantes: row.tiene_variantes,
    applyRounding: row.aplica_redondeo,
    layoutAllowPresentation: row.permite_presentacion,
    productType: row.tipo_producto as Product['productType'] ?? undefined,
    productLayout: row.layout as Product['productLayout'] ?? undefined,

    // Arrays simples
    customizationOptions: row.opciones_personalizacion,
    variants: row.variantes,
    ingredients: row.ingredientes,
    baseIngredients: row.ingredientes_base,
    removableIngredients: row.ingredientes_removibles,

    infoCardText: row.texto_info_tarjeta ?? undefined,
    extraIngredients: row.ingredientes_extra,
    layoutPresentations: row.presentaciones,

    // Layout 2
    layout2Options: row.layout2_opciones,
    layout2Extras: row.layout2_extras,

    // Layout 3
    layout3Preps: row.layout3_preparaciones,
    layout3Removables: row.layout3_removibles,
    layout3ExtraTortilla: row.layout3_extra_tortilla,
    layout3TortillaPrice: row.layout3_precio_tortilla ?? undefined,
    layout3AllowPolloPiece: row.layout3_permite_pollo,

    // Layout 4
    layout4Preps: row.layout4_preparaciones,
    layout4Removables: row.layout4_removibles,
    layout4ExtraTortilla: row.layout4_extra_tortilla,
    layout4TortillaPrice: row.layout4_precio_tortilla ?? undefined,
    layout4IncludedTortillas: row.layout4_tortillas_incl ?? undefined,

    // Layout 5
    layout5Presentations: row.layout5_presentaciones,
    layout5Fruits: row.layout5_frutas,
    layout5Extras: row.layout5_extras,

    // Layout 6
    layout6Proteins: row.layout6_proteinas,
    layout6Removables: row.layout6_removibles,
    layout6Extras: row.layout6_extras,

    // Layout 7
    layout7Sizes: row.layout7_tamanios,
    layout7AllowMilk: row.layout7_permite_leche,
    layout7MilkPrice: row.layout7_precio_leche ?? undefined,
    layout7AllowSugar: row.layout7_permite_azucar,

    // Layout 8
    layout8Sizes: row.layout8_tamanios,
    layout8Flavors: row.layout8_sabores,

    // Layout 9
    layout9Sizes: row.layout9_tamanios,
    layout9Flavors: row.layout9_sabores,
    layout9Modifiers: row.layout9_modificadores,
  };
}

// ─── Mapeo: Product (frontend) → ProductoInsert (DB) ────────────────────────

export function productToDbInsert(p: Product): ProductoInsert {
  return {
    id: p.id,
    nombre: p.name,
    categoria: p.category,
    precio: p.price,
    imagen: p.image || null,
    activo: p.active,
    descripcion: p.description ?? null,
    agotado: p.agotado ?? false,
    no_disponible_hoy: p.noDisponibleHoy ?? false,
    oculto: p.oculto ?? false,
    orden: p.orden ?? null,
    permite_comentarios: p.allowComments ?? false,
    tiene_variantes: p.tieneVariantes ?? false,
    aplica_redondeo: p.applyRounding ?? false,
    permite_presentacion: p.layoutAllowPresentation ?? false,
    tipo_producto: p.productType ?? null,
    layout: p.productLayout ?? null,

    // Arrays simples
    opciones_personalizacion: p.customizationOptions ?? [],
    variantes: p.variants ?? [],
    ingredientes: p.ingredients ?? [],
    ingredientes_base: p.baseIngredients ?? [],
    ingredientes_removibles: p.removableIngredients ?? [],

    texto_info_tarjeta: p.infoCardText ?? null,
    ingredientes_extra: p.extraIngredients ?? [],
    presentaciones: p.layoutPresentations ?? [],

    // Layout 2
    layout2_opciones: p.layout2Options ?? [],
    layout2_extras: p.layout2Extras ?? [],

    // Layout 3
    layout3_preparaciones: p.layout3Preps ?? [],
    layout3_removibles: p.layout3Removables ?? [],
    layout3_extra_tortilla: p.layout3ExtraTortilla ?? false,
    layout3_precio_tortilla: p.layout3TortillaPrice ?? null,
    layout3_permite_pollo: p.layout3AllowPolloPiece ?? false,

    // Layout 4
    layout4_preparaciones: p.layout4Preps ?? [],
    layout4_removibles: p.layout4Removables ?? [],
    layout4_extra_tortilla: p.layout4ExtraTortilla ?? false,
    layout4_precio_tortilla: p.layout4TortillaPrice ?? null,
    layout4_tortillas_incl: p.layout4IncludedTortillas ?? null,

    // Layout 5
    layout5_presentaciones: p.layout5Presentations ?? [],
    layout5_frutas: p.layout5Fruits ?? [],
    layout5_extras: p.layout5Extras ?? [],

    // Layout 6
    layout6_proteinas: p.layout6Proteins ?? [],
    layout6_removibles: p.layout6Removables ?? [],
    layout6_extras: p.layout6Extras ?? [],

    // Layout 7
    layout7_tamanios: p.layout7Sizes ?? [],
    layout7_permite_leche: p.layout7AllowMilk ?? false,
    layout7_precio_leche: p.layout7MilkPrice ?? null,
    layout7_permite_azucar: p.layout7AllowSugar ?? false,

    // Layout 8
    layout8_tamanios: p.layout8Sizes ?? [],
    layout8_sabores: p.layout8Flavors ?? [],

    // Layout 9
    layout9_tamanios: p.layout9Sizes ?? [],
    layout9_sabores: p.layout9Flavors ?? [],
    layout9_modificadores: p.layout9Modifiers ?? [],
  };
}

// ─── Operaciones CRUD (PREPARADAS para Fase 2) ───────────────────────────────

/**
 * Obtiene todos los productos activos de Supabase.
 * Fase 2: reemplazará la lectura de localStorage.
 */
export async function fetchProductos(): Promise<Product[]> {
  if (!supabase) throw new Error('[productosService] Supabase no está configurado.');

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('orden', { ascending: true, nullsFirst: false })
    .order('nombre', { ascending: true });

  if (error) throw new Error(`[productosService] Error al obtener productos: ${error.message}`);

  return (data as ProductoRow[]).map(dbRowToProduct);
}

/**
 * Inserta un nuevo producto en Supabase.
 * Requiere sesión autenticada — retorna `null` silenciosamente si no hay sesión.
 * Cuando se implemente Supabase Auth, esta función se activará automáticamente.
 */
export async function insertProducto(product: Product): Promise<Product | null> {
  if (!supabase) { console.info('[productosService] Supabase no configurado. Escritura omitida.'); return null; }

  const payload = productToDbInsert(product);


  const { data, error, status } = await supabase
    .from('productos')
    .insert(payload)
    .select()
    .single();


  if (error) throw new Error(`[productosService] Error al insertar producto: ${error.message} (Status: ${status})`);

  return dbRowToProduct(data as ProductoRow);
}

/**
 * Actualiza un producto existente en Supabase.
 * Requiere sesión autenticada — retorna `null` silenciosamente si no hay sesión.
 * Cuando se implemente Supabase Auth, esta función se activará automáticamente.
 */
export async function updateProducto(product: Product): Promise<Product | null> {
  if (!supabase) { console.info('[productosService] Supabase no configurado. Escritura omitida.'); return null; }

  const { id, ...updateFields } = productToDbInsert(product);


  const { data, error, status } = await supabase
    .from('productos')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();


  if (error) throw new Error(`[productosService] Error al actualizar producto: ${error.message} (Status: ${status})`);

  return dbRowToProduct(data as ProductoRow);
}

/**
 * Elimina un producto de Supabase por su id.
 * Requiere sesión autenticada — no-op silencioso si no hay sesión.
 * Cuando se implemente Supabase Auth, esta función se activará automáticamente.
 */
export async function deleteProducto(productId: string): Promise<void> {
  if (!supabase) { console.info('[productosService] Supabase no configurado. Escritura omitida.'); return; }



  const { error, status } = await supabase
    .from('productos')
    .delete()
    .eq('id', productId);


  if (error) throw new Error(`[productosService] Error al eliminar producto: ${error.message} (Status: ${status})`);
}

// ─── Seed (Fase 3) ───────────────────────────────────────────────────────────

export interface SeedResult {
  total: number;
  upserted: number;
  errors: string[];
  durationMs: number;
}

/**
 * Importa el catálogo actual de productos a Supabase usando UPSERT.
 * Seguro de ejecutar múltiples veces: no crea duplicados.
 *
 * Requiere sesión autenticada de Supabase Auth.
 * Si no hay sesión, retorna un SeedResult con 0 upserted y un mensaje informativo.
 *
 * @param products - Array de productos del estado React (localStorage)
 * @returns Resumen de la operación: total, insertados/actualizados, errores
 */
export async function seedProductosToSupabase(products: Product[]): Promise<SeedResult> {
  if (!supabase) {
    return { total: products.length, upserted: 0, errors: ['Supabase no está configurado.'], durationMs: 0 };
  }


  const t0 = performance.now();
  const errors: string[] = [];
  let upserted = 0;

  // Procesamos en lotes de 10 para evitar timeouts en proyectos con muchos productos
  const BATCH_SIZE = 10;
  const batches: Product[][] = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const rows = batch.map(productToDbInsert);


    const { error } = await supabase.from('productos').upsert(rows, {
        onConflict: 'id',          // Si el id ya existe → actualizar
        ignoreDuplicates: false,   // Queremos actualizar, no ignorar
      })
      .select('id');               // count() no está disponible en upsert directo

    if (error) {
      console.error('[SEED] Error:', error);
      errors.push(`Lote ${batches.indexOf(batch) + 1}: ${error.message} (Detalle: ${error.details || 'ninguno'}, Hint: ${error.hint || 'ninguno'})`);
    } else {
      upserted += batch.length;
    }
  }

  const durationMs = Math.round(performance.now() - t0);

  console.info(
    `[Supabase Seed] ${upserted}/${products.length} productos sincronizados en ${durationMs}ms.` +
    (errors.length > 0 ? ` Errores: ${errors.length}` : ' Sin errores.')
  );

  return {
    total: products.length,
    upserted,
    errors,
    durationMs,
  };
}
