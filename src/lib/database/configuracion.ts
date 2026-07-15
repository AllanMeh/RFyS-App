/**
 * @file configuracion.ts
 * @description Servicio híbrido para la gestión de configuración general (configuracion).
 */

import { supabase } from '../supabase';
import { runHybrid } from './dbClient';

// Helper base de consulta/escritura híbrida

export async function getConfigValue(key: string, defaultValue: string): Promise<string> {
  return runHybrid(
    async () => {
      if (!supabase) return getLocalConfigRaw(key, defaultValue);
      const { data, error } = await supabase
        .from('configuracion')
        .select('value')
        .eq('key', key)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return getLocalConfigRaw(key, defaultValue);
        }
        throw error;
      }
      const val = data?.value ?? defaultValue;
      saveLocalConfigRaw(key, val);
      return val;
    },
    () => getLocalConfigRaw(key, defaultValue),
    `obtenerConfig:${key}`
  );
}

export async function setConfigValue(key: string, value: string): Promise<void> {
  saveLocalConfigRaw(key, value);

  await runHybrid(
    async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from('configuracion')
        .upsert({ key, value }, { onConflict: 'key' });
      if (error) throw error;
    },
    () => {},
    `guardarConfig:${key}`
  );
}

// Helpers para localStorage con mapeo de nombres de llaves locales originales

function getLocalConfigRaw(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') return defaultValue;
  const localKey = mapKeyToLocal(key);
  return localStorage.getItem(localKey) ?? defaultValue;
}

function saveLocalConfigRaw(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    const localKey = mapKeyToLocal(key);
    localStorage.setItem(localKey, value);
  }
}

function mapKeyToLocal(key: string): string {
  switch (key) {
    case 'store_closed': return 'rf_store_closed';
    case 'logo_url':     return 'rf_logo_url';
    case 'pollo_status': return 'rf_pollo_status';
    case 'menu_del_dia': return 'rf_menu';
    default:             return `rf_${key}`;
  }
}

// ─── Funciones específicas tipadas ───

// 1. Store Closed
export function getLocalStoreClosed(): boolean {
  return getLocalConfigRaw('store_closed', 'false') === 'true';
}

export async function getStoreClosed(): Promise<boolean> {
  const val = await getConfigValue('store_closed', 'false');
  return val === 'true';
}

export async function setStoreClosed(closed: boolean): Promise<void> {
  await setConfigValue('store_closed', String(closed));
}

// 2. Logo URL
export function getLocalLogoUrl(): string {
  return getLocalConfigRaw('logo_url', '');
}

export async function getLogoUrl(): Promise<string> {
  return getConfigValue('logo_url', '');
}

export async function setLogoUrl(url: string): Promise<void> {
  await setConfigValue('logo_url', url);
}

// 3. Pollo Status
export function getLocalPolloStatus(): { pierna: boolean; muslo: boolean } {
  const saved = getLocalConfigRaw('pollo_status', '{"pierna":true,"muslo":true}');
  try {
    return JSON.parse(saved);
  } catch {
    return { pierna: true, muslo: true };
  }
}

export async function getPolloStatus(): Promise<{ pierna: boolean; muslo: boolean }> {
  const val = await getConfigValue('pollo_status', '{"pierna":true,"muslo":true}');
  try {
    return JSON.parse(val);
  } catch {
    return { pierna: true, muslo: true };
  }
}

export async function setPolloStatus(status: { pierna: boolean; muslo: boolean }): Promise<void> {
  await setConfigValue('pollo_status', JSON.stringify(status));
}

// 4. Menu del día
export function getLocalMenuDelDia(): string {
  return getLocalConfigRaw(
    'menu_del_dia',
    '🍹 Licuado de Fresa Especial con Leche de Coco\n🥗 Escamocha de Frutas Mixtas con yogurt natural y miel de agave\n🥪 Club Sandwich Rinconcito acompañado de papas adobadas crujientes'
  );
}

export async function getMenuDelDia(): Promise<string> {
  return getConfigValue(
    'menu_del_dia',
    '🍹 Licuado de Fresa Especial con Leche de Coco\n🥗 Escamocha de Frutas Mixtas con yogurt natural y miel de agave\n🥪 Club Sandwich Rinconcito acompañado de papas adobadas crujientes'
  );
}

export async function setMenuDelDia(menu: string): Promise<void> {
  await setConfigValue('menu_del_dia', menu);
}

// Helpers raw síncronos para evitar acceso directo a localStorage en otras partes del código
export function getRawLocalConfig(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(key) ?? defaultValue;
}

export function setRawLocalConfig(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
}
