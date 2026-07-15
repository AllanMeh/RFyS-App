/**
 * @file users.ts
 * @description Servicio híbrido para la entidad Usuarios y Empleados (usuarios_pos).
 */

import { supabase } from '../supabase';
import { runHybrid } from './dbClient';
import { fetchUsuarios, upsertUsuario } from '../usuariosService';
import type { UserAccount, Role } from '../../types';

const STORAGE_KEY = 'rf_users';
const ROLE_KEY = 'rf_role';

const INITIAL_USERS: UserAccount[] = [
  { id: 'usr-1', name: 'Administrador Principal', phone: '5511223344', username: 'admin', role: 'Administrador', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
  { id: 'usr-2', name: 'Juan Pérez', phone: '5566778899', username: 'juan', role: 'Empleado', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
  { id: 'usr-3', name: 'Sofía Castro', phone: '5522334455', username: 'sofia', role: 'Repartidor', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
];

/**
 * Obtiene los usuarios almacenados localmente de forma síncrona.
 */
export function getLocalUsers(): UserAccount[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as UserAccount[];
    } catch {
      return INITIAL_USERS;
    }
  }
  return INITIAL_USERS;
}

/**
 * Guarda los usuarios en localStorage.
 */
export function saveLocalUsers(users: UserAccount[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
}

/**
 * Obtiene los usuarios de forma híbrida.
 */
export async function getUsers(): Promise<UserAccount[]> {
  return runHybrid(
    async () => {
      const dbUsers = await fetchUsuarios();
      if (dbUsers && dbUsers.length > 0) {
        saveLocalUsers(dbUsers);
        return dbUsers;
      }
      return getLocalUsers();
    },
    () => getLocalUsers(),
    'obtenerUsuarios'
  );
}

/**
 * Agrega o actualiza un usuario.
 */
export async function addOrUpdateUser(user: UserAccount): Promise<void> {
  const local = getLocalUsers();
  const index = local.findIndex(u => u.id === user.id);
  if (index !== -1) {
    local[index] = user;
  } else {
    local.push(user);
  }
  saveLocalUsers(local);

  await runHybrid(
    async () => {
      await upsertUsuario(user);
    },
    () => {},
    'actualizarUsuario'
  );
}

/**
 * Obtiene el rol activo localmente de forma síncrona.
 */
export function getLocalRole(): Role {
  if (typeof window === 'undefined') return 'Administrador';
  const saved = localStorage.getItem(ROLE_KEY);
  return (saved as Role) || 'Administrador';
}

/**
 * Guarda el rol activo.
 */
export function saveLocalRole(role: Role): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ROLE_KEY, role);
  }
}

/**
 * Elimina un usuario.
 */
export async function removeUser(id: string): Promise<void> {
  const local = getLocalUsers();
  const filtered = local.filter(u => u.id !== id);
  saveLocalUsers(filtered);

  await runHybrid(
    async () => {
      if (!supabase) return;
      const { error } = await supabase.from('usuarios_pos').delete().eq('id', id);
      if (error) throw error;
    },
    () => {},
    'eliminarUsuario'
  );
}
