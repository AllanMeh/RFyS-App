/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Order, ClientAccount, UserAccount } from '../types';
import { formatStoreName } from '../lib/database/sucursales';
import { Clock, ChefHat, Play, CheckCircle2, AlertTriangle, Flame, Timer } from 'lucide-react';
import { CustomizationsRenderer } from './CustomizationsRenderer';

interface CocinaPanelProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado') => void;
  onCancelOrder?: (orderId: string, reason: string) => void;
}

export default function CocinaPanel({ orders, onUpdateStatus, onCancelOrder }: CocinaPanelProps) {
  const [now, setNow] = useState(new Date());
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (cancellingOrderId) {
      const timer = setTimeout(() => setCancellingOrderId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [cancellingOrderId]);

  const getHoraEntrega = (timestamp: string, notes?: string) => {
    if (notes) {
      const parts = notes.split(' | ');
      const entregaPart = parts.find(p => p.startsWith('Entrega:'));
      if (entregaPart) {
        const val = entregaPart.replace('Entrega:', '').trim();
        if (val.toLowerCase() === 'ahora') return 'Ahora';
        return val;
      }
    }
    try {
      const d = new Date(timestamp);
      d.setMinutes(d.getMinutes() + 15);
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return '12:15 PM'; }
  };

  const getMinutesRemaining = (order: Order) => {
    let targetDate = new Date(order.timestamp);
    targetDate.setMinutes(targetDate.getMinutes() + 15);
    if (order.notes) {
      const parts = order.notes.split(' | ');
      const entregaPart = parts.find(p => p.startsWith('Entrega:'));
      if (entregaPart) {
        const val = entregaPart.replace('Entrega:', '').trim();
        if (val.toLowerCase() !== 'ahora') {
          const timeMatch = val.match(/(\d+):(\d+)/);
          if (timeMatch) {
            const customDate = new Date(order.timestamp);
            customDate.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
            targetDate = customDate;
          }
        }
      }
    }
    return Math.ceil((targetDate.getTime() - now.getTime()) / 60000);
  };

  const getMinutesElapsed = (timestampStr: string) => {
    return Math.max(0, Math.floor((now.getTime() - new Date(timestampStr).getTime()) / 60000));
  };

  const getOrderBranch = (order: Order): string => {
    if (order.notes) {
      const parts = order.notes.split(' | ');
      const match = parts.find(p => p.startsWith('Tienda:'));
      if (match) {
        const storeVal = match.replace('Tienda:', '').trim();
        if (storeVal && !storeVal.includes('Central') && !storeVal.includes('Harbor') && !storeVal.includes('Station')) {
          if (storeVal.toLowerCase().includes('mesa') || storeVal.toLowerCase().includes('local')) return 'Mesa';
          return formatStoreName(storeVal);
        }
      }
    }
    if (order.clientName) {
      const cName = order.clientName.toLowerCase();
      if (cName.includes('mesa') || cName.includes('local')) return 'Mesa';
      const match = order.clientName.match(/\(([^)]+)\)/);
      if (match?.[1]) {
        const val = match[1].trim();
        if (!val.includes('Central') && !val.includes('Harbor') && !val.includes('Station')) return formatStoreName(val);
      }
    }
    return 'Mesa';
  };

  const pendingOrders = orders.filter(o => o.status === 'Pendiente');
  const preppingOrders = orders.filter(o => o.status === 'En preparación');
  const activeOrders = orders
    .filter(o => o.status === 'Pendiente' || o.status === 'En preparación')
    .sort((a, b) => {
      const getTargetTime = (order: Order) => {
        const val = order.deliveryTime;
        if (val) {
          if (val.toLowerCase() === 'ahora') {
            return 0; // Prioritize ASAP absolutely
          } else {
            const timeMatch = val.match(/(\d+):(\d+)/);
            if (timeMatch) {
              let h = parseInt(timeMatch[1]);
              const m = parseInt(timeMatch[2]);
              if (val.toLowerCase().includes('pm') && h !== 12) h += 12;
              if (val.toLowerCase().includes('am') && h === 12) h = 0;
              return h * 60 + m; // Total minutes from midnight
            }
          }
        }
        return 0; // Fallback to 'Ahora' if no delivery time specified
      };
      
      return getTargetTime(a) - getTargetTime(b);
    });

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-emerald-500 dark:text-emerald-400 tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            <span>Pantalla de Cocina</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Control de producción en tiempo real</p>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-xl border border-amber-400/30 dark:border-amber-500/30">
            <Timer className="w-4 h-4" />
            <span>POR INICIAR</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-300">{pendingOrders.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl border border-blue-400/30 dark:border-blue-500/30">
            <Flame className="w-4 h-4 animate-pulse" />
            <span>EN PROCESO</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-300">{preppingOrders.length}</span>
          </div>
        </div>
      </div>

      {/* KDS label row */}
      <div className="flex items-center gap-3 px-1">
        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
        <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
          Órdenes Activas en Cocina ({activeOrders.length})
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
      </div>

      {/* CARDS GRID */}
      {activeOrders.length === 0 ? (
        <div className="bg-slate-800/30 dark:bg-slate-800/50 rounded-2xl border border-dashed border-emerald-700/40 p-16 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-emerald-400 font-black text-sm">¡Todo listo! No hay pedidos en cocina.</p>
          <p className="text-slate-500 text-xs mt-1">Los pedidos nuevos aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map((order) => {
            const elapsed = getMinutesElapsed(order.timestamp);
            const minsRemaining = getMinutesRemaining(order);
            const horaEntrega = getHoraEntrega(order.timestamp, order.notes);
            const isPrepping = order.status === 'En preparación';
            const isLate = minsRemaining < 0;
            const isUrgent = minsRemaining >= 0 && minsRemaining < 5;


            const storeName = getOrderBranch(order);
            let cleanClientName = order.clientName?.trim() || 'Cliente';
            cleanClientName = cleanClientName.replace(/\s*\([^)]+\)$/, '').trim();

            let filteredNotes = '';
            if (order.notes) {
              const parts = order.notes.split(' | ');
              filteredNotes = parts.filter(p => !p.startsWith('Tienda:') && !p.startsWith('Entrega:')).join(' | ').trim();
            }

            // Card theme based on urgency
            const cardTheme = isLate
              ? { card: 'border-rose-500 dark:border-rose-500 shadow-rose-500/20', header: 'bg-gradient-to-r from-rose-600 to-red-600', headerText: 'text-white', accent: 'text-rose-300', badge: 'bg-rose-500/20 border-rose-500/40 text-rose-300', itemBg: 'bg-rose-950/30 border-rose-700/40', glow: 'shadow-lg shadow-rose-500/20' }
              : isUrgent
              ? { card: 'border-orange-500 dark:border-orange-400 shadow-orange-500/20', header: 'bg-gradient-to-r from-orange-600 to-amber-500', headerText: 'text-white', accent: 'text-orange-200', badge: 'bg-orange-500/20 border-orange-500/40 text-orange-200', itemBg: 'bg-amber-950/30 border-amber-600/40', glow: 'shadow-lg shadow-orange-500/20' }
              : isPrepping
              ? { card: 'border-blue-500/60 dark:border-blue-400/50 shadow-blue-500/10', header: 'bg-gradient-to-r from-blue-700 to-blue-500', headerText: 'text-white', accent: 'text-blue-200', badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300', itemBg: 'bg-blue-950/30 border-blue-700/40', glow: 'shadow-md shadow-blue-500/15' }
              : { card: 'border-slate-600/60 dark:border-slate-600/50', header: 'bg-gradient-to-r from-slate-700 to-slate-600', headerText: 'text-white', accent: 'text-amber-300', badge: 'bg-slate-700/50 border-slate-600/50 text-slate-300', itemBg: 'bg-slate-800/50 border-slate-700/50', glow: '' };

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 ${cardTheme.card} ${cardTheme.glow} bg-slate-800/80 dark:bg-slate-800/90 backdrop-blur-sm overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.01]`}
              >
                {/* HEADER BAND */}
                <div className={`${cardTheme.header} px-4 py-2.5 flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-3.5 h-3.5 ${cardTheme.headerText}`} />
                    <span className={`text-[10px] font-bold ${cardTheme.headerText} opacity-80`}>ENTREGA:</span>
                    <span className={`text-[12px] font-black ${cardTheme.headerText}`}>{horaEntrega}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-black ${cardTheme.headerText}`}>
                    {isLate && <><AlertTriangle className="w-3.5 h-3.5 animate-bounce" /><span>RETRASADO</span></>}
                    {isUrgent && <><AlertTriangle className="w-3.5 h-3.5 animate-bounce" /><span>¡{minsRemaining} min!</span></>}
                    {!isLate && !isUrgent && <span>⏱ {minsRemaining < 60 ? `${minsRemaining} min` : horaEntrega}</span>}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-grow">

                  {/* CLIENT + STORE */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[10px] font-bold">📍 Punto de Entrega:</span>
                        <span className="text-amber-400 font-black text-xs uppercase tracking-wide">{storeName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[10px] font-bold">👤 Cliente:</span>
                        <span className="text-slate-100 font-black text-xs uppercase tracking-wide truncate">{cleanClientName}</span>
                      </div>
                    </div>
                    <div className={`shrink-0 px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${cardTheme.badge}`}>
                      {isPrepping ? '⚡ EN PROCESO' : '⏳ EN ESPERA'}
                    </div>
                  </div>

                  {/* TIMING BAR */}
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500 bg-slate-900/40 rounded-lg px-3 py-1.5 border border-slate-700/50">
                    <span>Espera: <span className="text-slate-300">{elapsed >= 60 ? `${Math.floor(elapsed/60)}h ${elapsed%60}min` : `${elapsed} min`}</span></span>
                    <span className="text-slate-600">Ticket <span className="text-slate-400">{order.id}</span></span>
                  </div>

                  {/* ITEMS LIST */}
                  <div className={`rounded-xl border px-3 py-2.5 space-y-2 ${cardTheme.itemBg}`}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`shrink-0 text-[11px] font-black px-2 py-0.5 rounded-md border ${
                          isPrepping
                            ? 'bg-blue-600/30 border-blue-500/50 text-blue-200'
                            : 'bg-amber-600/30 border-amber-500/50 text-amber-200'
                        }`}>
                          {item.quantity}x
                        </span>
                        <div className="min-w-0 flex-1">
                          {(() => {
                            // Detect if the product name itself is the string of guisados
                            const isLegacyGuisado = item.product.name.trim().match(/^\d+\s+[^,]+/) && !item.product.name.toLowerCase().includes('torta') && !item.product.name.toLowerCase().includes('sandwich');
                            
                            const displayName = isLegacyGuisado ? 'TACOS DE GUISADO' : item.product.name;
                            const customList = isLegacyGuisado ? [item.product.name, ...item.customizations] : item.customizations;

                            return (
                              <>
                                <p className="font-black text-slate-100 uppercase leading-tight text-[12px] tracking-tight">
                                  {displayName}
                                </p>
                                {customList.length > 0 && (
                                  <CustomizationsRenderer 
                                    customizations={customList}
                                    listClassName="flex flex-col gap-0.5 mt-1.5 pl-1"
                                    itemClassName="text-[10px] font-bold text-rose-300 flex items-start gap-1 uppercase leading-tight"
                                    bulletClassName="text-rose-500 mt-[1px]"
                                  />
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* NOTES */}
                  {filteredNotes && (
                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-1.5">
                      <p className="text-[10px] text-amber-300 font-medium truncate" title={filteredNotes}>
                        📝 {filteredNotes}
                      </p>
                    </div>
                  )}

                  {/* TOTAL */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Subtotal</span>
                    <span className="text-xl font-black font-mono text-emerald-400">${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="px-4 pb-4">
                  {cancellingOrderId === order.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { if (onCancelOrder) onCancelOrder(order.id, 'Cancelado desde Cocina'); setCancellingOrderId(null); }}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        ⚠️ ¿Confirmar Cancelar?
                      </button>
                      <button
                        onClick={() => setCancellingOrderId(null)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-4 rounded-xl py-2.5 transition-all cursor-pointer border border-slate-600"
                      >
                        Volver
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {isPrepping ? (
                        <button
                          onClick={() => { onUpdateStatus(order.id, 'Listo'); alert(`Pedido ${order.id} marcado como ¡Terminado!`); }}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/40 cursor-pointer uppercase tracking-wide"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>¡Terminado!</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'En preparación')}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-900/40 cursor-pointer uppercase tracking-wide"
                        >
                          <Play className="w-4 h-4" />
                          <span>Iniciar</span>
                        </button>
                      )}
                      <button
                        onClick={() => setCancellingOrderId(order.id)}
                        className="bg-slate-700/80 hover:bg-rose-900/60 border border-slate-600 hover:border-rose-700 text-slate-300 hover:text-rose-300 text-xs font-bold px-3 rounded-xl py-2.5 flex items-center gap-1 transition-all cursor-pointer"
                        title="Cancelar Pedido"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
