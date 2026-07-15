/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, ClientDebt } from '../types';
import { getLocalEnRutaIds, updateEnRutaIds } from '../lib/database/entregas';
import { 
  Truck, 
  Check, 
  DollarSign, 
  CreditCard, 
  X, 
  Clock, 
  MapPin, 
  Eye, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  User,
  Shield,
  Milestone,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

interface EntregasPanelProps {
  orders: Order[];
  clients: ClientDebt[];
  onDeliverOrder: (orderId: string, paymentMethod: 'Efectivo' | 'Tarjeta' | 'Crédito' | 'Pendiente' | 'Mixto', clientId?: string) => void;
}

export default function EntregasPanel({ orders, clients, onDeliverOrder }: EntregasPanelProps) {
  // Tabs: 'Listo' | 'En ruta' | 'Entregado'
  const [activeTab, setActiveTab] = useState<'Listo' | 'En ruta' | 'Entregado'>('Listo');
  
  // Local state to track which orders are "En ruta" (persisted in localStorage to survive reloads)
  const [enRutaIds, setEnRutaIds] = useState<string[]>(() => {
    return getLocalEnRutaIds();
  });

  useEffect(() => {
    updateEnRutaIds(enRutaIds);
  }, [enRutaIds]);

  // Detail Modal local states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // States for inline Credit and Payment assignments
  const [assigningCreditOrderId, setAssigningCreditOrderId] = useState<string | null>(null);
  const [creditClientId, setCreditClientId] = useState<string>('');
  
  const [assigningPaidOrderId, setAssigningPaidOrderId] = useState<string | null>(null);
  const [paidMethod, setPaidMethod] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');

  // helper to get the Branch / Tienda of an order
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
      const client = clients.find(c => c.id === order.clientId);
      if (client && client.branch && !client.branch.includes('Central') && !client.branch.includes('Harbor') && !client.branch.includes('Station')) {
        return client.branch;
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

  // Target Delivery Time (Hora entrega = timestamp + 15 minutes or from notes)
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

  // Send an order to Route
  const sendToRoute = (orderId: string) => {
    if (!enRutaIds.includes(orderId)) {
      setEnRutaIds(prev => [...prev, orderId]);
    }
  };

  // Deliver an order immediately
  const handleDeliver = (order: Order) => {
    const finalMethod = order.paymentStatus === 'Pendiente' ? 'Pendiente' : (order.paymentStatus === 'Crédito' ? 'Crédito' : (order.paymentMethod || 'Efectivo'));
    
    onDeliverOrder(order.id, finalMethod, order.clientId);
    // Remove from "en ruta" list if was there
    setEnRutaIds(prev => prev.filter(id => id !== order.id));
    alert(`Pedido ${order.id} entregado y movido a Historial.`);
  };

  // Deliver order and mark as PAID immediately with Cash or Card
  const handleMarkAsPaidAndDeliver = (orderId: string, method: 'Efectivo' | 'Tarjeta') => {
    onDeliverOrder(orderId, method);
    setEnRutaIds(prev => prev.filter(id => id !== orderId));
    setAssigningPaidOrderId(null);
    alert(`Pedido ${orderId} registrado como PAGADO (${method}) y ENTREGADO.`);
  };

  // Deliver order and mark as CREDIT with debt associated to a client
  const handleAssignCreditAndDeliver = (order: Order) => {
    if (!creditClientId) {
      alert('Por favor, selecciona un cliente para asignar el crédito.');
      return;
    }

    onDeliverOrder(order.id, 'Crédito', creditClientId);
    setEnRutaIds(prev => prev.filter(id => id !== order.id));
    setAssigningCreditOrderId(null);
    setCreditClientId('');
    alert(`Pedido ${order.id} registrado a CRÉDITO y movido a Historial.`);
  };

  // Filter orders based on status & enRutaIds helper lists
  const listoOrders = orders
    .filter(o => o.status === 'Listo' && !enRutaIds.includes(o.id))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // más urgente primero

  const enRutaOrders = orders
    .filter(o => o.status === 'Listo' && enRutaIds.includes(o.id))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // más urgente primero

  const entregadoOrders = orders
    .filter(o => o.status === 'Entregado')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // más reciente primero en historial

  // Current list to render based on activeTab
  const renderedOrders = 
    activeTab === 'Listo' ? listoOrders : 
    activeTab === 'En ruta' ? enRutaOrders : 
    entregadoOrders;

  return (
    <div className="space-y-5">
      
      {/* Tab Navigation Menu Area */}
      <div className="bg-slate-800/60 dark:bg-slate-800/80 border border-slate-700/60 rounded-2xl p-2 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 backdrop-blur-sm">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 md:flex bg-slate-900/50 p-1.5 rounded-xl gap-1.5 border border-slate-700/40 w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('Listo'); setAssigningCreditOrderId(null); setAssigningPaidOrderId(null); }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-sans text-[11px] font-black transition-all cursor-pointer ${
              activeTab === 'Listo'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <span>🟢 Listos</span>
            <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-mono font-black ${
              activeTab === 'Listo' ? 'bg-amber-900/60 text-amber-200' : 'bg-slate-700 text-slate-300'
            }`}>
              {listoOrders.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('En ruta'); setAssigningCreditOrderId(null); setAssigningPaidOrderId(null); }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-sans text-[11px] font-black transition-all cursor-pointer ${
              activeTab === 'En ruta'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <span>🚚 Ruta</span>
            <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-mono font-black ${
              activeTab === 'En ruta' ? 'bg-blue-900/60 text-blue-200' : 'bg-slate-700 text-slate-300'
            }`}>
              {enRutaOrders.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('Entregado'); setAssigningCreditOrderId(null); setAssigningPaidOrderId(null); }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-sans text-[11px] font-black transition-all cursor-pointer ${
              activeTab === 'Entregado'
                ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-md shadow-slate-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <span>✅ Entregados</span>
            <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-mono font-black ${
              activeTab === 'Entregado' ? 'bg-slate-900/60 text-slate-200' : 'bg-slate-700 text-slate-300'
            }`}>
              {entregadoOrders.length}
            </span>
          </button>
        </div>

        {/* Current status overview badge */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-sans font-medium px-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Ordenes de despacho organizadas: <strong className="text-slate-200">Más urgente primero</strong></span>
        </div>
      </div>

      {/* Main Order Queue View */}
      <div className="space-y-4">
        {renderedOrders.length === 0 ? (
          <div className="bg-slate-800/30 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-600/50 p-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 font-black text-sm">No hay pedidos en esta sección</p>
            <p className="font-normal text-slate-500 text-xs max-w-sm mx-auto mt-2">
              {activeTab === 'Listo' && 'Cuando los pedidos finalicen su preparación en Cocina, aparecerán listos aquí.'}
              {activeTab === 'En ruta' && 'Marca un pedido listo como "Empaquetado" para colocarlo en reparto.'}
              {activeTab === 'Entregado' && 'Todos los pedidos que vayas entregando se archivarán en este historial operativo.'}
            </p>
          </div>
        ) : (
          renderedOrders.map((order) => {
            const horaEntrega = getHoraEntrega(order.timestamp, order.notes);
            const storeName = getOrderBranch(order);
            let cleanClientName = order.clientName?.trim() || 'Cliente';
            cleanClientName = cleanClientName.replace(/\s*\([^)]+\)$/, '').trim();

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
            const minsRemaining = Math.ceil((targetDate.getTime() - new Date().getTime()) / 60000);
            const elapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(order.timestamp).getTime()) / 60000));
            const isLate = minsRemaining < 0;
            const isUrgent = minsRemaining >= 0 && minsRemaining < 5;

            let filteredNotes = '';
            if (order.notes) {
              const parts = order.notes.split(' | ');
              filteredNotes = parts.filter(p => !p.startsWith('Tienda:') && !p.startsWith('Entrega:')).join(' | ').trim();
            }

            // Card theme matching CocinaPanel style
            const cardTheme = activeTab === 'Entregado'
              ? { border: 'border-slate-600/40', header: 'bg-gradient-to-r from-slate-700 to-slate-600', glow: '' }
              : activeTab === 'En ruta'
              ? { border: 'border-blue-500/50', header: 'bg-gradient-to-r from-blue-700 to-blue-500', glow: 'shadow-md shadow-blue-500/15' }
              : isLate
              ? { border: 'border-rose-500', header: 'bg-gradient-to-r from-rose-600 to-red-600', glow: 'shadow-lg shadow-rose-500/20' }
              : isUrgent
              ? { border: 'border-orange-500', header: 'bg-gradient-to-r from-orange-600 to-amber-500', glow: 'shadow-lg shadow-orange-500/20' }
              : { border: 'border-amber-600/40', header: 'bg-gradient-to-r from-amber-700 to-amber-600', glow: 'shadow-sm shadow-amber-900/10' };

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 ${cardTheme.border} ${cardTheme.glow} bg-slate-800/80 dark:bg-slate-800/90 backdrop-blur-sm overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.005]`}
              >
                {/* HEADER BAND */}
                <div className={`${cardTheme.header} px-4 py-2.5 flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-[10px] font-bold text-white/70">ENTREGA:</span>
                    <span className="text-[12px] font-black text-white">{horaEntrega}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-white">
                    {activeTab === 'Entregado'
                      ? <span>✅ ENTREGADO</span>
                      : isLate
                      ? <span className="animate-pulse">🔴 RETRASADO</span>
                      : isUrgent
                      ? <span className="animate-bounce">⚠️ {minsRemaining} min</span>
                      : <span>⏱ {minsRemaining < 60 ? `${minsRemaining} min` : horaEntrega}</span>
                    }
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-grow">
                  {/* CLIENT + STORE */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px] font-bold">📍 Punto de Entrega:</span>
                      <span className="text-amber-400 font-black text-xs uppercase tracking-wide">{storeName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px] font-bold">👤 Cliente:</span>
                      <span className="text-slate-100 font-black text-xs uppercase tracking-wide truncate">{cleanClientName}</span>
                    </div>
                  </div>

                  {/* TIMING BAR */}
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500 bg-slate-900/40 rounded-lg px-3 py-1.5 border border-slate-700/50">
                    <span>Espera: <span className="text-slate-300">{elapsed >= 60 ? `${Math.floor(elapsed/60)}h ${elapsed%60}min` : `${elapsed} min`}</span></span>
                    <span className="text-slate-600">Ticket <span className="text-slate-400">{order.id}</span></span>
                  </div>

                  {/* PRODUCTOS */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase block">Productos</span>
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-400 shrink-0">{it.quantity}x</span>
                        <span className="text-[12px] font-black text-slate-100 uppercase tracking-tight">{it.product.name}</span>
                        {it.customizations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {it.customizations.map((c, ci) => (
                              <span key={ci} className="text-[9px] text-rose-300 bg-rose-900/50 border border-rose-700/60 px-1.5 py-0.5 rounded-full">
                                ⚡ {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {filteredNotes && (
                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-1.5">
                      <p className="text-[10px] text-amber-300 font-medium truncate" title={filteredNotes}>📝 {filteredNotes}</p>
                    </div>
                  )}

                  {/* TOTAL */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700/50 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Subtotal</span>
                      {order.paymentStatus === 'Crédito' && (
                        <span className="bg-rose-900/60 text-rose-300 text-[8px] px-1.5 py-0.5 rounded-full font-black border border-rose-700/60">
                          CRÉDITO
                        </span>
                      )}
                      {order.paymentStatus === 'Pendiente' && (
                        <span className="bg-amber-900/50 text-amber-300 text-[8px] px-1.5 py-0.5 rounded-full font-black border border-amber-700/50">
                          PENDIENTE
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-black font-mono text-emerald-400">${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="px-4 pb-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="bg-slate-700/80 hover:bg-slate-600 border border-slate-600 text-slate-200 px-3 py-2 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalles</span>
                  </button>

                  {activeTab === 'Listo' && (
                    <button
                      onClick={() => {
                        sendToRoute(order.id);
                        alert(`Pedido ${order.id} empaquetado y enviado a En Camino.`);
                      }}
                      className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-black text-[11px] px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-900/40 transition-all cursor-pointer uppercase"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Empaquetado</span>
                    </button>
                  )}

                  {activeTab === 'En ruta' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onDeliverOrder(order.id, 'Efectivo');
                          setEnRutaIds(prev => prev.filter(id => id !== order.id));
                          alert(`Pedido ${order.id} entregado y marcado como PAGADO.`);
                        }}
                        className="bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-black text-[11px] px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition-all cursor-pointer uppercase"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Entregar</span>
                      </button>
                      <button
                        onClick={() => {
                          onDeliverOrder(order.id, 'Pendiente');
                          setEnRutaIds(prev => prev.filter(id => id !== order.id));
                          alert(`Pedido ${order.id} marcado como PENDIENTE.`);
                        }}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-black text-[11px] px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer uppercase"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pendiente</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* DETAIL MODAL WITH FULL PAYMENT MODE SELECTION */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-lg w-full overflow-hidden transform scale-100 transition-all text-xs font-sans">
            
            {/* Header of Popup */}
            <div className="bg-[#ffdcc3] dark:bg-amber-900/40 p-4 border-b border-[#ddc1ae] dark:border-amber-800/60 flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-900 dark:text-amber-300 font-mono tracking-wider">
                  Detalle del Ticket de Entrega
                </span>
                <h3 className="font-sans font-bold text-gray-900 dark:text-slate-100 text-lg">Ticket {selectedOrder.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 bg-white dark:bg-slate-700 p-1 rounded-full border border-gray-200 dark:border-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-5 space-y-4 text-left">
              
              {/* Product list breakdown */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase font-mono tracking-wider">Productos de la orden</span>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-150 dark:border-slate-600 divide-y divide-gray-200 dark:divide-slate-600 text-xs">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-gray-950 dark:text-slate-100">{item.quantity}x</span> <span className="text-gray-700 dark:text-slate-300">{item.product.name}</span>
                        {item.customizations.length > 0 && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                            Adicionales: {item.customizations.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-slate-100 font-mono">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  
                  {/* Totals Summary */}
                  <div className="pt-2 mt-2 font-mono text-[11px] text-gray-500 dark:text-slate-400 flex justify-between">
                    <span>Subtotal:</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="pt-1 text-[11px] text-rose-600 dark:text-rose-400 flex justify-between">
                      <span>Descuento aplicado:</span>
                      <span>-${selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 mt-2 flex justify-between items-center font-sans font-bold text-sm text-gray-900 dark:text-slate-100 border-t border-dashed dark:border-slate-600">
                    <span>TOTAL DEL PEDIDO:</span>
                    <span className="text-emerald-800 dark:text-emerald-400 text-base font-mono">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Extra technical labels */}
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-slate-700/40 p-2.5 rounded-lg border border-neutral-200 dark:border-slate-600 font-mono text-[10px] text-gray-600 dark:text-slate-300">
                <div>
                  <span className="text-gray-400 dark:text-slate-500 block uppercase">Establecimiento</span>
                  <span className="font-bold text-gray-800 dark:text-slate-200">{getOrderBranch(selectedOrder)}</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-500 block uppercase">Flujo del Estado</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 capitalize">
                    {activeTab === 'Listo' ? 'Listo para Despachar' : (activeTab === 'En ruta' ? 'En Tránsito / Reparto' : 'Entregado Exitosamente')}
                  </span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-amber-50/50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/60 text-[11px] text-gray-700 dark:text-amber-200">
                  <span className="font-bold block text-amber-900 dark:text-amber-300 mb-0.5">Instrucciones de Cocina / Reparto:</span>
                  <p className="italic leading-normal">{selectedOrder.notes}</p>
                </div>
              )}

            </div>

            {/* Footer triggers */}
            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 border-t border-gray-150 dark:border-slate-700 flex justify-between items-center gap-2">
              {activeTab === 'En ruta' ? (
                <div className="flex gap-2 w-full max-w-[280px]">
                  <button
                    onClick={() => {
                      onDeliverOrder(selectedOrder.id, 'Efectivo');
                      setEnRutaIds(prev => prev.filter(id => id !== selectedOrder.id));
                      setSelectedOrder(null);
                      alert(`Pedido ${selectedOrder.id} entregado y marcado como PAGADO.`);
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-sans font-black text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer uppercase tracking-tight shadow-sm"
                  >
                    <Check className="w-4.5 h-4.5" />
                    <span>Entregar</span>
                  </button>
                  <button
                    onClick={() => {
                      onDeliverOrder(selectedOrder.id, 'Pendiente');
                      setEnRutaIds(prev => prev.filter(id => id !== selectedOrder.id));
                      setSelectedOrder(null);
                      alert(`Pedido ${selectedOrder.id} marcado como PENDIENTE.`);
                    }}
                    className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-sans font-black text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer uppercase tracking-tight shadow-sm"
                  >
                    <Clock className="w-4.5 h-4.5" />
                    <span>Pendiente</span>
                  </button>
                </div>
              ) : activeTab === 'Listo' ? (
                <button
                  onClick={() => {
                    sendToRoute(selectedOrder.id);
                    setSelectedOrder(null);
                    alert(`Pedido ${selectedOrder.id} empaquetado y enviado a En Camino.`);
                  }}
                  className="bg-amber-800 hover:bg-amber-900 text-white font-sans font-black text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider shadow-sm"
                >
                  <Send className="w-4 h-4 text-amber-100" />
                  <span>Empaquetado</span>
                </button>
              ) : <div />}

              <button 
                onClick={() => setSelectedOrder(null)}
                className="bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 text-gray-750 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-lg text-center cursor-pointer ml-auto"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
