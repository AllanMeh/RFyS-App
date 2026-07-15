/**
 * @file clientAccounts.ts
 * @description Servicio híbrido para la entidad Cuentas de Cliente (cuentas_cliente / rf_client_accounts).
 */

import { supabase } from '../supabase';
import { runHybrid } from './dbClient';
import type { ClientAccount } from '../../types';

const STORAGE_KEY = 'rf_client_accounts';
const ACTIVE_KEY = 'rf_active_client';

function toRow(c: ClientAccount): Record<string, unknown> {
  return {
    id:                         c.id,
    nombre:                     c.name,
    email:                      c.email ?? null,
    telefono:                   c.phone,
    password_hint:              c.password ?? null,
    default_store:              c.defaultStore,
    avatar_url:                 c.avatarUrl ?? null,
    avatar:                     c.avatar ?? null,
    notification_prefs:         (c.notificationPrefs ?? {}) as unknown as object,
    notifications_prompt_shown: c.notificationsPromptShown ?? false,
  };
}

function fromRow(r: Record<string, unknown>): ClientAccount {
  return {
    id:                        r['id'] as string,
    name:                      r['nombre'] as string,
    email:                     (r['email'] as string) || undefined,
    phone:                     r['telefono'] as string,
    password:                  (r['password_hint'] as string) || undefined,
    defaultStore:              r['default_store'] as string,
    avatarUrl:                 (r['avatar_url'] as string) || undefined,
    avatar:                    (r['avatar'] as string) || undefined,
    notificationPrefs:         (r['notification_prefs'] as ClientAccount['notificationPrefs']) ?? undefined,
    notificationsPromptShown:  r['notifications_prompt_shown'] as boolean | undefined,
  };
}

/**
 * Obtiene las cuentas de cliente locales de forma síncrona.
 */
export function getLocalClientAccounts(): ClientAccount[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as ClientAccount[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Guarda las cuentas de cliente localmente.
 */
export function saveLocalClientAccounts(accounts: ClientAccount[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }
}

/**
 * Obtiene las cuentas de cliente de forma híbrida.
 */
export async function getClientAccounts(): Promise<ClientAccount[]> {
  return runHybrid(
    async () => {
      if (!supabase) return getLocalClientAccounts();
      const { data, error } = await supabase
        .from('cuentas_cliente')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const parsed = (data ?? []).map(r => fromRow(r as Record<string, unknown>));
      saveLocalClientAccounts(parsed);
      return parsed;
    },
    () => getLocalClientAccounts(),
    'obtenerCuentasCliente'
  );
}

/**
 * Agrega o actualiza una cuenta de cliente.
 */
export async function addOrUpdateClientAccount(account: ClientAccount): Promise<void> {
  const local = getLocalClientAccounts();
  const index = local.findIndex(a => a.id === account.id);
  if (index !== -1) {
    local[index] = account;
  } else {
    local.push(account);
  }
  saveLocalClientAccounts(local);

  await runHybrid(
    async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from('cuentas_cliente')
        .upsert(toRow(account), { onConflict: 'id' });
      if (error) throw error;
    },
    () => {},
    'guardarCuentaCliente'
  );
}

/**
 * Obtiene la cuenta de cliente activa localmente de forma síncrona.
 */
export function getLocalActiveClient(): ClientAccount | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(ACTIVE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as ClientAccount;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Guarda la cuenta de cliente activa localmente.
 */
export function saveLocalActiveClient(client: ClientAccount | null): void {
  if (typeof window !== 'undefined') {
    if (client) {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(client));
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }
}
