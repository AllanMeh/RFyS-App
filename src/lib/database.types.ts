/**
 * @file database.types.ts
 * @description Tipos TypeScript generados manualmente que representan el
 * esquema de la base de datos Supabase.
 *
 * Refleja exactamente las columnas de la tabla `productos` definida en:
 *   supabase/migrations/20260626000001_create_productos.sql
 *
 * FASE 1 – Solo infraestructura. No se usa todavía en la lógica de negocio.
 */

// ─── Fila de la tabla `productos` tal como la devuelve Supabase ───────────────

export interface ProductoRow {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
  agotado: boolean;
  no_disponible_hoy: boolean;
  oculto: boolean;
  orden: number | null;
  permite_comentarios: boolean;
  tiene_variantes: boolean;
  aplica_redondeo: boolean;
  permite_presentacion: boolean;
  tipo_producto: string | null;
  layout: string | null;

  // Arrays simples
  opciones_personalizacion: string[];
  variantes: string[];
  ingredientes: string[];
  ingredientes_base: string[];
  ingredientes_removibles: string[];

  texto_info_tarjeta: string | null;

  // JSONB — arrays de objetos
  ingredientes_extra: { name: string; price: number }[];
  presentaciones: { name: string; price: number }[];

  // Layout 2
  layout2_opciones: { name: string; price: number; active: boolean }[];
  layout2_extras: { name: string; price: number; perPiece: boolean; active: boolean }[];

  // Layout 3
  layout3_preparaciones: { name: string; priceDiff?: number; active: boolean }[];
  layout3_removibles: { name: string; active: boolean }[];
  layout3_extra_tortilla: boolean;
  layout3_precio_tortilla: number | null;
  layout3_permite_pollo: boolean;

  // Layout 4
  layout4_preparaciones: { name: string; active: boolean }[];
  layout4_removibles: { name: string; active: boolean }[];
  layout4_extra_tortilla: boolean;
  layout4_precio_tortilla: number | null;
  layout4_tortillas_incl: number | null;

  // Layout 5
  layout5_presentaciones: { name: string; price: number; active: boolean }[];
  layout5_frutas: { name: string; active: boolean }[];
  layout5_extras: { name: string; price: number; active: boolean }[];

  // Layout 6
  layout6_proteinas: { name: string; price: number; active: boolean }[];
  layout6_removibles: { name: string; active: boolean }[];
  layout6_extras: { name: string; price: number; active: boolean }[];

  // Layout 7
  layout7_tamanios: { name: string; price: number; active: boolean }[];
  layout7_permite_leche: boolean;
  layout7_precio_leche: number | null;
  layout7_permite_azucar: boolean;

  // Layout 8
  layout8_tamanios: { name: string; price: number; active: boolean }[];
  layout8_sabores: { name: string; active: boolean }[];

  // Layout 9
  layout9_tamanios: { name: string; price: number; active: boolean }[];
  layout9_sabores: { name: string; active: boolean }[];
  layout9_modificadores: { name: string; active: boolean }[];

  // Auditoría
  created_at: string;
  updated_at: string;
}

// ─── Tipo para INSERT (omite campos auto-generados) ───────────────────────────
export type ProductoInsert = Omit<ProductoRow, 'created_at' | 'updated_at'>;

// ─── Tipo para UPDATE (todos los campos opcionales excepto id) ────────────────
export type ProductoUpdate = Partial<Omit<ProductoRow, 'id' | 'created_at'>> & {
  id: string;
};

// ─── Definición del esquema completo de la DB (para createClient<Database>) ───
export interface Database {
  public: {
    Tables: {
      productos: {
        Row: ProductoRow;
        Insert: ProductoInsert;
        Update: ProductoUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
