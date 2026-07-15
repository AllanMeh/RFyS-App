/**
 * @file useSupabaseStatus.ts
 * @description Hook React que verifica la conexión con Supabase al montar la app.
 *
 * - No modifica ningún dato.
 * - No reemplaza localStorage.
 * - Solo verifica que el proyecto de Supabase responde correctamente.
 */

import { useState, useEffect } from 'react';
import { checkSupabaseConnection, SupabaseStatus } from './supabase';

export interface SupabaseConnectionState {
  status: SupabaseStatus;
  message: string;
  latencyMs?: number;
  checked: boolean;
}

const INITIAL_STATE: SupabaseConnectionState = {
  status: 'connecting',
  message: 'Verificando conexión con Supabase...',
  checked: false,
};

/**
 * Hook que ejecuta un ping de conexión a Supabase una vez al iniciar la app.
 * Devuelve el estado actual de la conexión para mostrarlo en la UI.
 */
export function useSupabaseStatus(): SupabaseConnectionState {
  const [state, setState] = useState<SupabaseConnectionState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const result = await checkSupabaseConnection();
      if (!cancelled) {
        setState({
          ...result,
          checked: true,
        });

        // Log amigable en la consola
        if (result.status === 'connected') {
          console.info(`✅ [Supabase] ${result.message}`);
        } else if (result.status === 'unconfigured') {
          console.info(`⚙️ [Supabase] ${result.message}`);
        } else {
          console.error(`❌ [Supabase] ${result.message}`);
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
