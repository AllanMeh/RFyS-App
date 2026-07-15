/**
 * @file SupabaseStatusBadge.tsx
 * @description Indicador visual de conexión con Supabase.
 *
 * Muestra un pequeño badge en el Header con el estado de la conexión:
 *   🔵 Verificando...
 *   🟢 Conectado a Supabase (XX ms)
 *   ⚙️  Sin configurar
 *   🔴 Error de conexión
 *
 * Este componente NO modifica lógica. Solo es visual/informativo.
 */

import React, { useState } from 'react';
import { SupabaseConnectionState } from '../lib/useSupabaseStatus';

interface Props {
  connectionState: SupabaseConnectionState;
}

export default function SupabaseStatusBadge({ connectionState }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { status, message, latencyMs, checked } = connectionState;

  if (!checked && status === 'connecting') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="hidden sm:inline">DB</span>
      </div>
    );
  }

  const config = {
    connected: {
      dot: 'bg-emerald-500 shadow-sm shadow-emerald-500/60',
      badge: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300',
      label: `DB ✓`,
      icon: '🟢',
    },
    unconfigured: {
      dot: 'bg-slate-400',
      badge: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400',
      label: 'DB',
      icon: '⚙️',
    },
    error: {
      dot: 'bg-rose-500 animate-pulse',
      badge: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400',
      label: 'DB ✗',
      icon: '🔴',
    },
    connecting: {
      dot: 'bg-blue-400 animate-pulse',
      badge: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400',
      label: 'DB ...',
      icon: '🔵',
    },
  };

  const c = config[status];

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(v => !v)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase transition-all cursor-default ${c.badge}`}
        title={message}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
        <span className="hidden sm:inline">{c.label}</span>
      </button>

      {/* Tooltip con detalles */}
      {showTooltip && (
        <div className="absolute right-0 top-7 z-50 w-64 bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-xl text-left animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span>{c.icon}</span>
            <span className="text-[10px] font-black text-slate-200 uppercase tracking-wider">
              {status === 'connected' ? 'Supabase Conectado' :
               status === 'unconfigured' ? 'Sin Configurar' :
               status === 'error' ? 'Error de Conexión' : 'Verificando...'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">{message}</p>
          {latencyMs !== undefined && status === 'connected' && (
            <div className="mt-1.5 text-[9px] font-mono text-emerald-400">
              Latencia: {latencyMs} ms
            </div>
          )}
          {status === 'unconfigured' && (
            <p className="mt-1.5 text-[9px] text-amber-400 font-mono">
              Agrega VITE_SUPABASE_URL y<br/>VITE_SUPABASE_ANON_KEY en .env
            </p>
          )}
        </div>
      )}
    </div>
  );
}
