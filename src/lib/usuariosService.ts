/**
 * usuariosService.ts
 * CRUD para la tabla `public.usuarios_pos` (rf_users / UserAccount[]).
 * Independiente de auth.users — solo empleados internos del POS.
 */

import { supabase } from './supabase';
import type { UserAccount, Role } from '../types';

// ─── Mapeo ────────────────────────────────────────────────────────────────────

function toRow(u: UserAccount): Record<string, unknown> {
  return {
    id:            u.id,
    nombre:        u.name,
    telefono:      u.phone,
    username:      u.username,
    rol:           u.role,
    registered_at: u.registeredAt,
    avatar_url:    u.avatarUrl ?? null,
    avatar:        u.avatar ?? null,
    password_hint: u.password ?? null,
    status:        u.status ?? 'Activa',
  };
}

function fromRow(r: Record<string, unknown>): UserAccount {
  return {
    id:           r['id'] as string,
    name:         r['nombre'] as string,
    phone:        r['telefono'] as string,
    username:     r['username'] as string,
    role:         r['rol'] as Role,
    registeredAt: r['registered_at'] as string,
    avatarUrl:    r['avatar_url'] as string | undefined,
    avatar:       r['avatar'] as string | undefined,
    password:     r['password_hint'] as string | undefined,
    status:       r['status'] as UserAccount['status'] | undefined,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchUsuarios(): Promise<UserAccount[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('usuarios_pos')
    .select('*')
    .order('registered_at', { ascending: true });
  if (error) {
    console.warn('[Sync:Usuarios] ❌ fetchUsuarios error:', error.message);
    return [];
  }
  console.info(`[Sync:Usuarios] ✅ ${(data ?? []).length} usuarios cargados desde Supabase.`);
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

// ─── Upsert individual ────────────────────────────────────────────────────────

export async function upsertUsuario(usuario: UserAccount): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('usuarios_pos')
    .upsert(toRow(usuario), { onConflict: 'id' });
  if (error) {
    console.warn('[Sync:Usuarios] ❌ upsertUsuario error:', error.message);
  } else {
    console.info(`[Sync:Usuarios] ⬆️ Usuario ${usuario.id} sincronizado.`);
  }
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export async function upsertUsuariosBulk(usuarios: UserAccount[]): Promise<void> {
  if (!supabase || usuarios.length === 0) return;
  const { error } = await supabase
    .from('usuarios_pos')
    .upsert(usuarios.map(toRow), { onConflict: 'id' });
  if (error) {
    console.warn('[Sync:Usuarios] ❌ upsertUsuariosBulk error:', error.message);
  } else {
    console.info(`[Sync:Usuarios] ⬆️ ${usuarios.length} usuarios sincronizados en bulk.`);
  }
}
