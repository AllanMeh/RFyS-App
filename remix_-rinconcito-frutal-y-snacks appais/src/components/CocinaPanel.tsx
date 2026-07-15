/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { Clock, ChefHat, Play, CheckCircle2, Home, User, AlertTriangle, MessageSquare } from 'lucide-react';

interface CocinaPanelProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado') => void;
  onCancelOrder?: (orderId: string, reason: string) => void;
}

export default function CocinaPanel({ orders, onUpdateStatus, onCancelOrder }: CocinaPanelProps) {
  const [now, setNow] = useState(new Date());

  // Periodically update the tick timer to calculate real-time delay minutes
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Helper inside loop for order formatting
  const formatTimeStr = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '12:00 PM';
    }
  };

  // Target Delivery Time (Hara entrega = timestamp + 15 minutes or from notes)
  const getHoraEntrega = (timestamp: string, notes?: string) => {
    if (notes) {
      const parts = notes.split(' | ');
      const entregaPart = parts.find(p => p.startsWith('Entrega:'));
      if (entregaPart) {
        const val = entregaPart.replace('Entrega:', '').trim();
        if (val.toLowerCase() === 'ahora') {
          return 'Ahora';
        }
        return val;
      }
    }
    try {
      const d = new Date(timestamp);
      d.setMinutes(d.getMinutes() + 15);
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '12:15 PM';
    }
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
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const customDate = new Date(order.timestamp);
            customDate.setHours(hours, minutes, 0, 0);
            targetDate = customDate;
          }
        }
      }
    }

    const diffMs = targetDate.getTime() - now.getTime();
    return Math.ceil(diffMs / 60000);
  };

  // Delay calculation in minutes
  const getMinutesElapsed = (timestampStr: string) => {
    const start = new Date(timestampStr);
    const diffMs = now.getTime() - start.getTime();
    const mins = Math.floor(diffMs / 60000);
    return Math.max(0, mins);
  };

  // Read clients from localStorage to map order branch sucursal "Tienda" properly
  const getOrderBranch = (order: Order): string => {
    // Attempt parsing from metadata notes first
    if (order.notes) {
      const parts = order.notes.split(' | ');
      const match = parts.find(p => p.startsWith('Tienda:'));
      if (match) {
        const storeVal = match.replace('Tienda:', '').trim();
        if (storeVal && !storeVal.includes('Central') && !storeVal.includes('Harbor') && !storeVal.includes('Station')) {
          if (storeVal.toLowerCase().includes('mesa') || storeVal.toLowerCase().includes('local') || storeVal.toLowerCase().includes('gente')) {
            return 'Mesa';
          }
          return storeVal;
        }
      }
    }
    // Attempt tracking client card
    if (order.clientId) {
      try {
        const savedClientsStr = localStorage.getItem('rf_clients');
        if (savedClientsStr) {
          const clients = JSON.parse(savedClientsStr) as any[];
          const client = clients.find(c => c.id === order.clientId);
          if (client && client.branch && !client.branch.includes('Central') && !client.branch.includes('Harbor') && !client.branch.includes('Station')) {
            return client.branch;
          }
        }
      } catch (e) {
         console.error('Error fetching branch from local storage clients', e);
      }
    }
    if (order.clientName) {
      const cName = order.clientName.toLowerCase();
      if (cName.includes('mesa') || cName.includes('local') || cName.includes('gente')) {
        return 'Mesa';
      }
      const match = order.clientName.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        const val = match[1].trim();
        if (!val.includes('Central') && !val.includes('Harbor') && !val.includes('Station')) {
          return val;
        }
      }
    }
    return 'Mesa';
  };
  // Filter and sort kitchen orders by timestamp ASC (most urgent / older first)
  const pendingOrders = orders.filter(o => o.status === 'Pendiente');
  const preppingOrders = orders.filter(o => o.status === 'En preparación');
  const activeOrders = orders
    .filter(o => o.status === 'Pendiente' || o.status === 'En preparación')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Stats Row without the large green box */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-extrabold text-[#006e0a] tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            <span>Pantalla de Cocina</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Control de producción en tiempo real</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono font-bold w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial bg-amber-50 text-amber-900 px-3.5 py-1.5 rounded-lg border border-amber-300 text-center">
            POR INICIAR: <span className="font-extrabold text-base text-amber-700 ml-1">{pendingOrders.length}</span>
          </div>
          <div className="flex-1 sm:flex-initial bg-blue-50 text-blue-900 px-3.5 py-1.5 rounded-lg border border-blue-300 text-center">
            EN PRODUCCIÓN: <span className="font-extrabold text-base text-blue-700 ml-1">{preppingOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Main KDS Board Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200">
          <h3 className="font-sans font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#006e0a] rounded-full animate-pulse" />
            <span>Ordenes Activas en Cocina ({activeOrders.length})</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase pb-0.5">Orden cronológico</span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-neutral-50 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400 text-xs font-bold font-sans">
            🟢 No hay pedidos en cocina. ¡Todo listo!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => {
              const elapsed = getMinutesElapsed(order.timestamp);
              const minsRemaining = getMinutesRemaining(order);
              const isUrgent = minsRemaining < 15;
              const horaEntrega = getHoraEntrega(order.timestamp, order.notes);
              const isPrepping = order.status === 'En preparación';

              // Extract clean store using our non-fictitious branch resolver
              const storeName = getOrderBranch(order);

              // Extract clean client name (remove training tienda parentheses)
              let cleanClientName = order.clientName?.trim() || 'Cliente';
              cleanClientName = cleanClientName.replace(/\s*\([^)]+\)$/, '').trim();

              // Helper for time remaining
              const getTiempoRestanteLabel = (mins: number, hEntrega: string) => {
                if (mins < 0) {
                  return <span className="text-rose-700 font-extrabold flex items-center gap-1 animate-pulse">🔴 ⚠ Retrasado</span>;
                }
                if (mins < 5) {
                  return <span className="text-orange-600 font-black animate-bounce flex items-center gap-1">⚠ {mins} min</span>;
                }
                if (mins < 60) {
                  return <span className="text-amber-600 font-bold">🟡 {mins} min</span>;
                }
                return <span className="text-emerald-700 font-bold">🟢 {hEntrega}</span>;
              };

              let cardBgBorder = '';
              if (minsRemaining < 0) {
                cardBgBorder = 'bg-rose-50/40 border-rose-500 hover:border-rose-600';
              } else if (minsRemaining < 5) {
                cardBgBorder = 'bg-rose-50/20 border-orange-400 hover:border-orange-500';
              } else if (minsRemaining < 15) {
                cardBgBorder = 'bg-amber-50/30 border-amber-400 hover:border-amber-500';
              } else {
                cardBgBorder = 'bg-white border-slate-250 hover:border-slate-350';
              }

              // Clean notes by removing Tienda and Entrega parts
              let filteredNotes = '';
              if (order.notes) {
                const parts = order.notes.split(' | ');
                const filteredParts = parts.filter(p => !p.startsWith('Tienda:') && !p.startsWith('Entrega:'));
                filteredNotes = filteredParts.join(' | ').trim();
              }

              return (
                <div 
                  key={order.id}
                  className={`rounded-xl border-2 transition-all flex flex-col justify-between shadow-xs overflow-hidden ${cardBgBorder}`}
                >
                  {/* ENCABEZADO */}
                  <div className="bg-slate-100/90 border-b border-gray-200 px-3.5 py-2 flex justify-between items-center gap-2">
                    <div className="bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-md font-extrabold font-mono text-[10px] flex items-center gap-1.5 shrink-0 shadow-xs border border-slate-900">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-300 font-bold">ENTREGA:</span>
                      <span className="tracking-wide text-amber-300 text-[11px]">{horaEntrega}</span>
                    </div>
                    <div className="text-[10px] font-mono font-extrabold">
                      {getTiempoRestanteLabel(minsRemaining, horaEntrega)}
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col gap-3 flex-grow">
                    {/* INFORMACIÓN PRINCIPAL */}
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-805 flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold">📍 Punto de Entrega:</span>
                        <span className="text-[#904d00] font-black uppercase text-xs">{storeName}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-805 flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold">👤 Cliente:</span>
                        <span className="text-slate-900 font-black text-xs uppercase">{cleanClientName}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500 border-t border-b border-gray-100 py-1">
                      <span className="text-slate-400">
                        Espera total: {
                          elapsed >= 60 
                            ? `${Math.floor(elapsed / 60)} h ${elapsed % 60} min`
                            : `${elapsed} min`
                        }
                      </span>
                      <span className={isPrepping ? 'text-blue-700 animate-pulse font-extrabold text-[8px]' : 'text-slate-400 text-[8px]'}>
                        {isPrepping ? `⚡ EN PROCESO` : `⏳ EN ESPERA`}
                      </span>
                    </div>

                    {/* PRODUCTOS */}
                    <div className={`border px-2.5 py-2 rounded-lg space-y-1.5 ${
                      isPrepping ? 'bg-blue-50/60 border-blue-200' : 'bg-amber-50/40 border-amber-200'
                    }`}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border shrink-0 ${
                            isPrepping 
                              ? 'text-blue-950 bg-blue-100 border-blue-250' 
                              : 'text-amber-950 bg-amber-100 border-amber-250'
                          }`}>
                            {item.quantity}x
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-slate-950 uppercase leading-snug tracking-tight text-xs">
                              {item.product.name}
                            </p>
                            {item.customizations.length > 0 && (
                              <p className="text-[9px] font-bold text-red-750 bg-red-100 border border-red-200 px-1 rounded-md inline-block mt-0.5 uppercase">
                                🚨 {item.customizations.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Operational Notes (filtered) */}
                    {filteredNotes && (
                      <p className={`text-[10px] font-medium px-2 py-1 rounded border truncate ${
                        isPrepping ? 'text-blue-800 bg-blue-50/50 border-blue-105' : 'text-amber-900 bg-amber-100/30 border-amber-200'
                      }`} title={filteredNotes}>
                        📝 "{filteredNotes}"
                      </p>
                    )}

                    {/* TOTAL */}
                    <div className="border-t border-gray-150 pt-2.5 flex justify-between items-center text-xs font-bold mt-auto">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Subtotal:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-sm font-black font-mono text-slate-905">${order.total.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* ACCIONES */}
                  <div className="p-3.5 pt-0">
                    <div className="flex gap-2">
                      {isPrepping ? (
                        <button
                          onClick={() => {
                            onUpdateStatus(order.id, 'Listo');
                            alert(`Pedido ${order.id} marcado como ¡Terminado!`);
                          }}
                          className="flex-1 bg-[#006e0a] hover:bg-emerald-800 text-white font-sans font-black text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-tight"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                          <span>¡Terminado!</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onUpdateStatus(order.id, 'En preparación');
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-sans font-black text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-tight"
                        >
                          <Play className="w-4 h-4 text-blue-105" />
                          <span>Iniciar</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const reasonOption = prompt(
                            `¿Estás seguro de que deseas cancelar el Pedido ${order.id}?\n\n` +
                            `Escribe el motivo de la cancelación o elige uno:\n` +
                            `1. Cancelado por cliente\n` +
                            `2. Error de captura\n` +
                            `3. Cancelado por administrador\n\n` +
                            `Motivo:`
                          );
                          if (reasonOption === null) return; // User closed or canceled prompt
                          let finalReason = reasonOption.trim();
                          if (finalReason === '1') finalReason = 'Cancelado por cliente';
                          else if (finalReason === '2') finalReason = 'Error de captura';
                          else if (finalReason === '3') finalReason = 'Cancelado por administrador';
                          else if (!finalReason) finalReason = 'Cancelado sin motivo especificado';
                          
                          if (onCancelOrder) {
                            onCancelOrder(order.id, finalReason);
                          } else {
                            alert('La cancelación no está soportada por el componente actual.');
                          }
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-2 rounded-lg py-2 flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Cancelar Pedido"
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
