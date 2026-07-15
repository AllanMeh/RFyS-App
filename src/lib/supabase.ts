/**
 * @file supabase.ts
 * @description Cliente Supabase singleton + utilidades de conexión.
 *
 * FASE 1 – Conexión activa.
 * localStorage sigue funcionando igual. No se migra ningún dato aquí.
 *
 * Sistema moderno de API Keys de Supabase:
 *   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<Publishable Key — sb_publishable_...>
 *
 * NOTA: La Secret Key (sb_secret_...) NUNCA debe usarse en el frontend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isConfigured) {
  console.info(
    '[Supabase] ⚠ Credenciales no configuradas. ' +
    'Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env'
  );
}

export interface LastWriteQuery {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  payload: any;
}

let lastWriteQuery: LastWriteQuery | null = null;

export function getLastWriteQuery(): LastWriteQuery | null {
  return lastWriteQuery;
}

export function clearLastWriteQuery(): void {
  lastWriteQuery = null;
}

const rawSupabase = isConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Cliente singleton de Supabase.
 * Null si las credenciales no están configuradas.
 */
export const supabase: SupabaseClient | null = rawSupabase
  ? new Proxy(rawSupabase, {
      get(target, prop, receiver) {
        if (prop === 'from') {
          return (table: string) => {
            const queryBuilder = target.from(table);
            return new Proxy(queryBuilder, {
              get(qTarget, qProp) {
                const originalVal = (qTarget as any)[qProp];
                if (typeof originalVal === 'function') {
                  if (qProp === 'insert') {
                    return (values: any, options: any) => {
                      lastWriteQuery = { table, operation: 'insert', payload: values };
                      return originalVal.call(qTarget, values, options);
                    };
                  }
                  if (qProp === 'upsert') {
                    return (values: any, options: any) => {
                      lastWriteQuery = { table, operation: 'upsert', payload: values };
                      return originalVal.call(qTarget, values, options);
                    };
                  }
                  if (qProp === 'update') {
                    return (values: any, options: any) => {
                      lastWriteQuery = { table, operation: 'update', payload: values };
                      const filterBuilder = originalVal.call(qTarget, values, options);
                      return new Proxy(filterBuilder, {
                        get(fTarget, fProp) {
                          const fOriginalVal = (fTarget as any)[fProp];
                          if (typeof fOriginalVal === 'function' && fProp === 'eq') {
                            return (column: string, value: any) => {
                              if (column === 'id' && lastWriteQuery) {
                                lastWriteQuery.payload = { ...lastWriteQuery.payload, id: value };
                              } else if (column === 'store_id' && lastWriteQuery) {
                                lastWriteQuery.payload = { ...lastWriteQuery.payload, store_id: value };
                              }
                              return fOriginalVal.call(fTarget, column, value);
                            };
                          }
                          return fOriginalVal;
                        }
                      });
                    };
                  }
                  if (qProp === 'delete') {
                    return (options: any) => {
                      lastWriteQuery = { table, operation: 'delete', payload: { id: null } };
                      const filterBuilder = originalVal.call(qTarget, options);
                      return new Proxy(filterBuilder, {
                        get(fTarget, fProp) {
                          const fOriginalVal = (fTarget as any)[fProp];
                          if (typeof fOriginalVal === 'function' && fProp === 'eq') {
                            return (column: string, value: any) => {
                              if (column === 'id' && lastWriteQuery) {
                                lastWriteQuery.payload = { id: value };
                              } else if (column === 'store_id' && lastWriteQuery) {
                                lastWriteQuery.payload = { store_id: value };
                              }
                              return fOriginalVal.call(fTarget, column, value);
                            };
                          }
                          return fOriginalVal;
                        }
                      });
                    };
                  }

                  return (...args: any[]) => {
                    const result = originalVal.apply(qTarget, args);
                    if (result && typeof result === 'object') {
                      return new Proxy(result, {
                        get(rTarget, rProp) {
                          const rOriginalVal = (rTarget as any)[rProp];
                          if (typeof rOriginalVal === 'function' && rProp === 'eq') {
                            return (column: string, value: any) => {
                              if (lastWriteQuery) {
                                if (column === 'id') {
                                  lastWriteQuery.payload = { ...lastWriteQuery.payload, id: value };
                                } else if (column === 'store_id') {
                                  lastWriteQuery.payload = { ...lastWriteQuery.payload, store_id: value };
                                }
                              }
                              return rOriginalVal.call(rTarget, column, value);
                            };
                          }
                          return rOriginalVal;
                        }
                      });
                    }
                    return result;
                  };
                }
                return originalVal;
              }
            });
          };
        }
        return (target as any)[prop];
      }
    })
  : null;

// ─── Estado de conexión ───────────────────────────────────────────────────────

export type SupabaseStatus = 'unconfigured' | 'connecting' | 'connected' | 'error';

/**
 * Verifica la conexión real con Supabase usando el cliente oficial.
 * Utiliza supabase.auth.getSession() — método sin dependencias de tablas,
 * compatible con el sistema moderno de Publishable Keys.
 *
 * @returns 'connected' | 'error' | 'unconfigured'
 */
export async function checkSupabaseConnection(): Promise<{
  status: SupabaseStatus;
  message: string;
  latencyMs?: number;
}> {
  if (!supabase) {
    return {
      status: 'unconfigured',
      message: 'Variables de entorno no configuradas. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env',
    };
  }

  const t0 = performance.now();

  try {
    // Verificación oficial mediante el cliente de auth.
    // getSession() no requiere ninguna tabla ni permiso adicional;
    // simplemente comprueba que el proyecto Supabase responde correctamente.
    const { error } = await supabase.auth.getSession();

    const latencyMs = Math.round(performance.now() - t0);

    if (!error) {
      return {
        status: 'connected',
        message: `Conexión exitosa con Supabase (${latencyMs} ms)`,
        latencyMs,
      };
    }

    // Error de autenticación: clave incorrecta o proyecto inactivo
    if (
      error.message?.includes('Invalid API key') ||
      error.message?.includes('JWT') ||
      error.message?.includes('unauthorized') ||
      error.status === 401
    ) {
      return {
        status: 'error',
        message: `Error de autenticación: verifica VITE_SUPABASE_ANON_KEY (Publishable Key)`,
      };
    }

    return {
      status: 'error',
      message: `Error inesperado: ${error.message}`,
    };

  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - t0);

    // Error de red (sin internet o URL incorrecta)
    if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('Failed')) {
      return {
        status: 'error',
        message: `Sin conexión con Supabase. Verifica VITE_SUPABASE_URL y tu conexión a internet.`,
        latencyMs,
      };
    }

    return {
      status: 'error',
      message: `Error de conexión: ${err?.message || 'Desconocido'}`,
      latencyMs,
    };
  }
}

export default supabase;
