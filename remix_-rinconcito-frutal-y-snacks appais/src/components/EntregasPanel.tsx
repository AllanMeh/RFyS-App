/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, ClientDebt } from '../types';
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
    try {
      const saved = localStorage.getItem('rf_en_ruta_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('rf_en_ruta_ids', JSON.stringify(enRutaIds));
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
      <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 shadow-xs">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 md:flex bg-neutral-150 p-1 rounded-lg gap-1 border border-neutral-250/60 w-full md:w-auto">
          <button
            onClick={() => {
              setActiveTab('Listo');
              setAssigningCreditOrderId(null);
              setAssigningPaidOrderId(null);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-sans text-[11px] font-black transition-all cursor-pointer ${
              activeTab === 'Listo'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-gray-650 hover:text-gray-900 hover:bg-gray-100/75'
            }`}
          >
            <span>🟢 Listos</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-bold ${
              activeTab === 'Listo' ? 'bg-amber-955/40 text-amber-100' : 'bg-gray-200 text-gray-700'
            }`}>
              {listoOrders.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('En ruta');
              setAssigningCreditOrderId(null);
              setAssigningPaidOrderId(null);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-sans text-[11px] font-black transition-all cursor-pointer ${
              activeTab === 'En ruta'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-gray-655 hover:text-gray-900 hover:bg-gray-100/75'
            }`}
          >
            <span>🚚 Ruta</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-bold ${
              activeTab === 'En ruta' ? 'bg-blue-955/40 text-blue-105' : 'bg-gray-200 text-gray-700'
            }`}>
              {enRutaOrders.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('Entregado');
              setAssigningCreditOrderId(null);
              setAssigningPaidOrderId(null);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-sans text-[11px] font-black transition-all cursor-pointer border border-transparent ${
              activeTab === 'Entregado'
                ? 'bg-slate-700 text-white shadow-xs border-slate-800'
                : 'text-gray-650 hover:text-gray-900 hover:bg-gray-100/75'
            }`}
          >
            <span>✅ Entregados</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-bold ${
              activeTab === 'Entregado' ? 'bg-slate-950/40 text-slate-100' : 'bg-gray-200 text-gray-700'
            }`}>
              {entregadoOrders.length}
            </span>
          </button>
        </div>

        {/* Current status overview badge */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 font-sans font-medium px-1">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>Ordenes de despacho organizadas: <strong>Más urgente primero</strong></span>
        </div>
      </div>

      {/* Main Order Queue View */}
      <div className="space-y-3">
        {renderedOrders.length === 0 ? (
          <div className="bg-neutral-50/50 border border-dashed border-gray-300 rounded-2xl p-16 text-center text-gray-400 font-sans font-semibold text-xs leading-relaxed space-y-2">
            <p className="text-gray-500 font-bold text-sm">📭 No hay pedidos en esta sección</p>
            <p className="font-normal text-gray-400 max-w-sm mx-auto">
              {activeTab === 'Listo' && 'Cuando los pedidos finalicen su preparación en el panel de Cocina, aparecerán listos aquí.'}
              {activeTab === 'En ruta' && 'Marca un pedido listo como "Empaquetado" para colocarlo en reparto.'}
              {activeTab === 'Entregado' && 'Todos los pedidos que vayas entregando se archivarán en este historial operativo.'}
            </p>
          </div>
        ) : (
          renderedOrders.map((order) => {
            const horaEntrega = getHoraEntrega(order.timestamp, order.notes);
            
            // Extract clean store
            const storeName = getOrderBranch(order);

            // Extract clean client name
            let cleanClientName = order.clientName?.trim() || 'Cliente';
            cleanClientName = cleanClientName.replace(/\s*\([^)]+\)$/, '').trim();

            // Calculate timing details
            // Support KDS time calculations of Target Date = timestamp + 15 min or from notes
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
            const timeDiffMs = targetDate.getTime() - new Date().getTime();
            const minsRemaining = Math.ceil(timeDiffMs / 60000);
            const elapsed = Math.max(0, Math.floor((new Date().getTime() - new Date(order.timestamp).getTime()) / 60000));
            const isLate = minsRemaining < 0;

            // Helper for time remaining
            const getTiempoRestanteLabel = (mins: number, hEntrega: string) => {
              if (activeTab === 'Entregado') {
                return <span className="text-emerald-700 font-extrabold">✅ ENTREGADO</span>;
              }
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
            if (activeTab === 'Entregado') {
              cardBgBorder = 'bg-white border-slate-200 hover:border-slate-300';
            } else if (activeTab === 'En ruta') {
              cardBgBorder = 'bg-blue-50/20 border-blue-400 hover:border-blue-500';
            } else {
              if (minsRemaining < 0) {
                cardBgBorder = 'bg-rose-50/40 border-rose-500 hover:border-rose-600';
              } else if (minsRemaining < 5) {
                cardBgBorder = 'bg-rose-50/20 border-orange-400 hover:border-orange-500';
              } else if (minsRemaining < 15) {
                cardBgBorder = 'bg-amber-50/30 border-amber-400 hover:border-amber-500';
              } else {
                cardBgBorder = 'bg-white border-slate-250 hover:border-slate-350';
              }
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
                    <span className="tracking-wide text-amber-305 font-extrabold text-[11px]">{horaEntrega}</span>
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
                    <span className="text-slate-400 text-[8px]">
                      TICKET {order.id}
                    </span>
                  </div>

                  {/* PRODUCTOS */}
                  <div className="border border-slate-200 bg-slate-50 px-2.5 py-2 rounded-lg space-y-1">
                    <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase block">Productos</span>
                    <p className="text-[11px] text-slate-800 font-extrabold uppercase truncate">
                      {order.items.map(it => `${it.quantity}x ${it.product.name}`).join(', ')}
                    </p>
                  </div>

                  {/* Operational Notes (filtered) */}
                  {filteredNotes && (
                    <p className="text-[10px] font-medium text-slate-600 bg-slate-50/55 p-2 rounded border border-slate-150 truncate" title={filteredNotes}>
                      📝 "{filteredNotes}"
                    </p>
                  )}

                  {/* TOTAL */}
                  <div className="border-t border-gray-150 pt-2.5 flex justify-between items-center text-xs font-bold mt-auto">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Subtotal:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-sm font-black font-mono text-slate-905">${order.total.toFixed(2)}</strong>
                      {order.paymentStatus === 'Crédito' && (
                        <span className="bg-red-100 text-red-800 text-[8px] px-1 py-0.2 rounded font-black border border-red-200 font-mono">
                          CRÉDITO
                        </span>
                      )}
                      {order.paymentStatus === 'Pendiente' && (
                        <span className="bg-amber-100 text-amber-900 text-[8px] px-1 py-0.2 rounded font-black border border-amber-200 font-mono">
                          PENDIENTE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="p-3.5 pt-0 border-t border-gray-100 mt-1 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                      className="bg-amber-800 hover:bg-amber-900 text-white font-sans font-black text-[11px] px-3.5 py-1.2 rounded-md flex items-center gap-1 shadow-xs transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-100" />
                      <span>Empaquetado</span>
                    </button>
                  )}

                  {activeTab === 'En ruta' && (
                    <div className="flex items-center gap-1.5 animate-fade-in">
                      <button
                        onClick={() => {
                          onDeliverOrder(order.id, 'Efectivo');
                          setEnRutaIds(prev => prev.filter(id => id !== order.id));
                          alert(`Pedido ${order.id} entregado y marcado como PAGADO.`);
                        }}
                        className="bg-slate-700 hover:bg-slate-800 text-white font-sans font-black text-[11px] px-3 py-1.2 rounded-md flex items-center gap-1 shadow-xs transition-all cursor-pointer uppercase tracking-wider"
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
                        className="bg-slate-500 hover:bg-slate-600 text-white font-sans font-black text-[11px] px-py-1.2 rounded-md flex items-center gap-1 shadow-xs transition-all cursor-pointer uppercase tracking-wider"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-200" />
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden transform scale-100 transition-all text-xs font-sans">
            
            {/* Header of Popup */}
            <div className="bg-[#ffdcc3] p-4 border-b border-[#ddc1ae] flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-900 font-mono tracking-wider">
                  Detalle del Ticket de Entrega
                </span>
                <h3 className="font-sans font-bold text-gray-900 text-lg">Ticket {selectedOrder.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-full border border-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-5 space-y-4 text-left">
              
              {/* Product list breakdown */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-gray-500 uppercase font-mono tracking-wider">Productos de la orden</span>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-150 divide-y divide-gray-200 text-xs">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-gray-950">{item.quantity}x</span> {item.product.name}
                        {item.customizations.length > 0 && (
                          <p className="text-[10px] text-rose-600 font-mono mt-0.5">
                            Adicionales: {item.customizations.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 font-mono">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  
                  {/* Totals Summary */}
                  <div className="pt-2 mt-2 font-mono text-[11px] text-gray-500 flex justify-between">
                    <span>Subtotal:</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="pt-1 text-[11px] text-rose-600 flex justify-between">
                      <span>Descuento aplicado:</span>
                      <span>-${selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 mt-2 flex justify-between items-center font-sans font-bold text-sm text-gray-900 border-t border-dashed">
                    <span>TOTAL DEL PEDIDO:</span>
                    <span className="text-emerald-800 text-base font-mono">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Extra technical labels */}
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 font-mono text-[10px] text-gray-600">
                <div>
                  <span className="text-gray-400 block uppercase">Establecimiento</span>
                  <span className="font-bold text-gray-800">{getOrderBranch(selectedOrder)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase">Flujo del Estado</span>
                  <span className="font-bold text-blue-700 capitalize">
                    {activeTab === 'Listo' ? 'Listo para Despachar' : (activeTab === 'En ruta' ? 'En Tránsito / Reparto' : 'Entregado Exitosamente')}
                  </span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-gray-700">
                  <span className="font-bold block text-amber-900 mb-0.5">Instrucciones de Cocina / Reparto:</span>
                  <p className="italic leading-normal">{selectedOrder.notes}</p>
                </div>
              )}

            </div>

            {/* Footer triggers */}
            <div className="bg-gray-50 p-4 border-t border-gray-150 flex justify-between items-center gap-2">
              {activeTab === 'En ruta' ? (
                <div className="flex gap-2 w-full max-w-[280px]">
                  <button
                    onClick={() => {
                      onDeliverOrder(selectedOrder.id, 'Efectivo');
                      setEnRutaIds(prev => prev.filter(id => id !== selectedOrder.id));
                      setSelectedOrder(null);
                      alert(`Pedido ${selectedOrder.id} entregado y marcado como PAGADO.`);
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-sans font-black text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer uppercase tracking-tight shadow-sm"
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
                className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-750 text-xs font-bold px-4 py-2 rounded-lg text-center cursor-pointer ml-auto"
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
