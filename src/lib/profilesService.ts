/**
 * profilesService.ts
 * CRUD completo para la tabla `public.profiles` de Supabase.
 * Habilitado para uso directo por el cliente POS.
 */

import { supabase } from './supabase';
import { getCurrentUser } from './authService';

export interface Profile {
  id: string;
  nombre: string;
  telefono: string;
  pin_hash: string;
  rol: 'Administrador' | 'Empleado' | 'Repartidor' | 'Líder';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

/** Obtiene TODOS los perfiles activos. */
export async function fetchProfiles(): Promise<Profile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[profilesService] fetchProfiles error:', error.message);
    return [];
  }
  return (data ?? []) as Profile[];
}

/** Obtiene el perfil del usuario actualmente autenticado desde la sesión local. */
export async function fetchCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return {
    id: user.id,
    nombre: user.nombre,
    telefono: user.telefono,
    pin_hash: '', // No exponemos el PIN hash por seguridad
    rol: user.rol as any,
    activo: user.activo,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

/** Obtiene un perfil por su UUID. */
export async function fetchProfileById(id: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[profilesService] fetchProfileById error:', error.message);
    return null;
  }
  return data as Profile;
}

// ─── Insert ───────────────────────────────────────────────────────────────────

/** Crea un perfil nuevo. */
export async function insertProfile(profile: Profile): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error('[profilesService] insertProfile error:', error.message);
    return null;
  }
  return data as Profile;
}

// ─── Update ───────────────────────────────────────────────────────────────────

/** Actualiza campos parciales de un perfil existente. */
export async function updateProfile(
  id: string,
  changes: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[profilesService] updateProfile error:', error.message);
    return null;
  }
  return data as Profile;
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

/** Inserta o actualiza un perfil. */
export async function upsertProfile(profile: Profile): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[profilesService] upsertProfile error:', error.message);
    return null;
  }
  return data as Profile;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/** Desactiva un perfil (soft delete). */
export async function deactivateProfile(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('profiles')
    .update({ activo: false })
    .eq('id', id);

  if (error) {
    console.error('[profilesService] deactivateProfile error:', error.message);
    return false;
  }
  return true;
}

/** Elimina permanentemente un perfil. */
export async function deleteProfile(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[profilesService] deleteProfile error:', error.message);
    return false;
  }
  return true;
}
