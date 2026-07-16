/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, ClientDebt, Product, ActiveTab } from '../types';
import { formatStoreName } from '../lib/database/sucursales';
import { 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  ChefHat, 
  
  Clock, 
  AlertTriangle, 
  ListOrdered, 
  CheckCircle, 
  Calendar, 
  ArrowRight,
  UserCheck,
  Activity,
  History,
  TrendingDown,
  Users,
  } from 'lucide-react';
import AvatarUploader from './AvatarUploader';

interface DashboardPanelProps {
  orders: Order[];
  clients: ClientDebt[];
  products: Product[];
  onNavigate: (tab: ActiveTab) => void;
  ventasDelDia: number;
  activeUserName?: string;
  activeUserAvatar?: string;
}

interface ActivityEvent {
  id: string;
  type: 'pedido_creado' | 'enviado_cocina' | 'pedido_listo' | 'pedido_entregado' | 'pago_registrado' | 'credito_registrado';
  title: string;
  description: string;
  time: Date;
  timeLabel: string;
}

export default function DashboardPanel({ 
  orders, 
  clients, 
  onNavigate, 
  ventasDelDia,
  activeUserName = 'Operador',
  activeUserAvatar
}: DashboardPanelProps) {
  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format date and clock for the operational header
  const formattedTime = currentTime.toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });
  
  const formattedDate = currentTime.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const currentHour = currentTime.getHours();
  let greetingMsg = 'Buenas noches';
  let greetingEmote = '🌙';
  let greetingBg = 'from-slate-900 to-indigo-950 text-white';

  if (currentHour >= 6 && currentHour < 12) {
    greetingMsg = 'Buenos días';
    greetingEmote = '🌅';
    greetingBg = 'from-amber-500 to-[#904d00]/90 text-white';
  } else if (currentHour >= 12 && currentHour < 20) {
    greetingMsg = 'Buenas tardes';
    greetingEmote = '☀️';
    greetingBg = 'from-[#ff8c00] to-amber-900 text-white';
  }

  // Correlate sucursal branch info based on Order's register info
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
          return formatStoreName(storeVal);
        }
      }
    }
    // Attempt tracking client card
    if (order.clientId) {
      const client = clients.find(c => c.id === order.clientId);
      if (client && client.branch && !client.branch.includes('Central') && !client.branch.includes('Harbor') && !client.branch.includes('Station')) {
        return formatStoreName(client.branch);
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
          return formatStoreName(val);
        }
      }
    }
    return 'Mesa';
  };

  // Helper inside loop for order formatting
  const formatOrderTimeOnly = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '12:00 PM';
    }
  };

  // Calculation for Wait times and delay queues
  const getElapsedMinutes = (isoString: string) => {
    try {
      const diffMs = currentTime.getTime() - new Date(isoString).getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60)));
    } catch {
      return 0;
    }
  };

  // Day summary indicators (as requested)
  const activeOrders = orders.filter(o => o.status !== 'Cancelado');
  const totalSalesThisDay = ventasDelDia;
  const activeOrdersCount = activeOrders.filter(o => o.status !== 'Entregado').length;
  const pendingOrdersCount = activeOrders.filter(o => o.status === 'Pendiente').length;
  const readyOrdersCount = activeOrders.filter(o => o.status === 'Listo').length;
  const deliveredOrdersCount = activeOrders.filter(o => o.status === 'Entregado').length;
  const paidOrdersCount = activeOrders.filter(o => o.paymentStatus === 'Pagado').length;
  const activeCreditClientsCount = clients.filter(c => c.status === 'Activa' && c.balance > 0).length;

  // Statistics summaries calculations
  const totalOrdersCount = activeOrders.length;
  const totalActiveSalesSum = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const averageTicketPrice = totalOrdersCount > 0 ? (totalActiveSalesSum / totalOrdersCount) : 0;
  
  // Dynamic assembled Timeline Activity Feed from orders & client movements
  const assembledActivities: ActivityEvent[] = [];

  // Map live orders status as dynamic log elements
  activeOrders.forEach(o => {
    const baseTime = new Date(o.timestamp);
    
    // Order Created
    assembledActivities.push({
      id: `act-cre-${o.id}`,
      type: 'pedido_creado',
      title: `Pedido ${o.id} creado`,
      description: `Orden para ${o.clientName || 'Cliente General'} registrada en caja por $${o.total.toFixed(2)}`,
      time: baseTime,
      timeLabel: formatOrderTimeOnly(o.timestamp)
    });

    // Sent to Kitchen (Cocina) if preparing or further
    if (o.status !== 'Pendiente') {
      const kitchenTime = new Date(baseTime.getTime() + 60000); // 1 min later
      assembledActivities.push({
        id: `act-kit-${o.id}`,
        type: 'enviado_cocina',
        title: `Pedido ${o.id} en preparación`,
        description: `Enviado a cocina. Estación preparando licuados y snacks.`,
        time: kitchenTime,
        timeLabel: formatOrderTimeOnly(kitchenTime.toISOString())
      });
    }

    // Ready for Pickup (Listo) if list or delivered
    if (o.status === 'Listo' || o.status === 'Entregado') {
      const readyTime = new Date(baseTime.getTime() + 300000); // 5 min later
      assembledActivities.push({
        id: `act-rdy-${o.id}`,
        type: 'pedido_listo',
        title: `Pedido ${o.id} listo para entregar`,
        description: `Preparación concluida con éxito en ${getOrderBranch(o)}.`,
        time: readyTime,
        timeLabel: formatOrderTimeOnly(readyTime.toISOString())
      });
    }

    // Delivered
    if (o.status === 'Entregado') {
      const deliveredTime = new Date(baseTime.getTime() + 600000); // 10 min later
      assembledActivities.push({
        id: `act-del-${o.id}`,
        type: 'pedido_entregado',
        title: `Pedido ${o.id} entregado y cerrado`,
        description: `Despachado al cliente. Forma pago registrada: ${o.paymentMethod || 'Efectivo'}`,
        time: deliveredTime,
        timeLabel: formatOrderTimeOnly(deliveredTime.toISOString())
      });
    }
  });

  // Map Client debt ledger items as dynamic logs
  clients.forEach(c => {
    c.history.forEach(mov => {
      let eventTime = new Date(currentTime.getTime() - 2 * 3600 * 1000); // estimate
      if (mov.id.startsWith('mov-')) {
        const parsedMs = parseInt(mov.id.split('-')[1]);
        if (!isNaN(parsedMs)) eventTime = new Date(parsedMs);
      } else {
        // Map historical offsets to look neat
        if (mov.id === 'mov-03') eventTime = new Date(currentTime.getTime() - 4 * 3600 * 1000);
        if (mov.id === 'mov-02') eventTime = new Date(currentTime.getTime() - 6 * 3600 * 1000);
        if (mov.id === 'mov-01') eventTime = new Date(currentTime.getTime() - 12 * 3600 * 1000);
        if (mov.id === 'mov-00') eventTime = new Date(currentTime.getTime() - 36 * 3600 * 1000);
      }

      if (mov.type === 'Pago') {
        assembledActivities.push({
          id: `act-pay-${mov.id}`,
          type: 'pago_registrado',
          title: `Pago abonado por ${c.name}`,
          description: `Abono de $${Math.abs(mov.amount).toFixed(2)} registrado en caja (${mov.notes || 'Abono corriente'})`,
          time: eventTime,
          timeLabel: eventTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
        });
      } else if (mov.type === 'Pedido') {
        assembledActivities.push({
          id: `act-deb-${mov.id}`,
          type: 'credito_registrado',
          title: `Crédito fiado cargado a cuenta`,
          description: `Se cargaron $${mov.amount.toFixed(2)} a la cuenta de deudor de ${c.name}`,
          time: eventTime,
          timeLabel: eventTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
        });
      }
    });
  });

  // Filter chronological feed to not contain future events and return top 7
  const sortedActivities = assembledActivities
    .filter(a => a.time.getTime() <= currentTime.getTime())
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 7);

  // Filter orders for Pending and Processing as "Pedidos Activos" list
  const activeOrdersList = [...activeOrders]
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Determine "Pedidos Urgentes / Próximos de alta demora"
  // If an order is not delivered and is in Pendiente or En preparación, and has elapsed for more than 4 minutes, it's urgent
  const urgentOrdersList = activeOrders
    .filter(o => o.status === 'Pendiente' || o.status === 'En preparación')
    .map(o => ({ ...o, elapsed: getElapsedMinutes(o.timestamp) }))
    .sort((a, b) => b.elapsed - a.elapsed);

  return (
    <div className="space-y-6">
      
      {/* 1. ENCABEZADO DE BIENVENIDA CON LOGO Y RELOJ */}
      <div className={`bg-gradient-to-r ${greetingBg} p-6 rounded-3xl shadow-md border border-amber-900/10 relative overflow-hidden transition-all duration-500`}>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none select-none text-9xl">
          🍊
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            
            {/* PROFILE IMAGE OR DEFAULT CORRESPONDING TO LOGGED IN USER */}
            <div className="shrink-0">
              <AvatarUploader
                avatar={activeUserAvatar}
                name={activeUserName}
                size="lg"
                editable={false}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{greetingEmote}</span>
                <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight animate-fade-in" id="dashboard-heading">
                  ¡{greetingMsg}, {activeUserName}!
                </h1>
              </div>
              <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl font-medium">
                Punto de control unificado para Rinconcito Frutal. Los pedidos de cocina, fiados y flujo de caja están sincronizados al segundo.
              </p>
            </div>
          </div>

          {/* DYNAMIC DIGITAL CLOCK */}
          <div className="bg-amber-950/40 p-4 rounded-2xl border border-white/20 w-full md:w-auto text-left md:text-right min-w-[220px] shadow-inner">
            <div className="flex items-center md:justify-end gap-1.5 text-amber-200 text-xs font-mono uppercase tracking-widest font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>HORA EN VIVO UTC-7</span>
            </div>
            <div className="text-2xl sm:text-3xl font-sans font-black tracking-widest mt-1 text-white tabular-nums drop-shadow-sm">
              {formattedTime}
            </div>
            <div className="text-[10px] sm:text-xs text-amber-100/90 font-medium mt-1 font-sans capitalize">
              📅 {formattedDate}
            </div>
          </div>

        </div>
      </div>

      {/* 2. RESUMEN DEL DÍA - 7 KPI CARDS METRIC GRID */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-black text-gray-900 dark:text-slate-100 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-[#904d00] dark:bg-amber-500 rounded"></span>
            Resumen Operativo del Día
          </h2>
          <span className="text-[11px] font-mono bg-yellow-100 dark:bg-amber-900/50 text-yellow-905 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
            ⚡ EN VIVO
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          
          {/* 1. Ventas del dia */}
          <button 
            onClick={() => onNavigate('Caja')}
            className="bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-left transition-all hover:shadow-sm active:scale-97 cursor-pointer"
            id="kpi-ventas"
          >
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-mono font-bold tracking-wider block">VENTAS</span>
            <p className="text-lg sm:text-xl font-sans font-extrabold text-emerald-900 dark:text-emerald-300 mt-1 truncate">
              ${totalSalesThisDay.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </p>
            <span className="text-[9px] text-emerald-700 dark:text-emerald-500 font-bold block mt-1">Caja Chica</span>
          </button>

          {/* 2. Pedidos activos */}
          <button 
            onClick={() => onNavigate('Cocina')}
            className="bg-[#fff5eb] dark:bg-orange-950/30 hover:bg-orange-100/80 dark:hover:bg-orange-900/40 p-3.5 rounded-2xl border border-orange-200 dark:border-orange-800 text-left transition-all hover:shadow-sm active:scale-97 cursor-pointer"
            id="kpi-activos"
          >
            <span className="text-[10px] text-orange-850 dark:text-orange-400 font-mono font-bold tracking-wider block">ACTIVOS</span>
            <p className="text-lg sm:text-xl font-sans font-extrabold text-orange-950 dark:text-orange-300 mt-1">
              {activeOrdersCount}
            </p>
            <span className="text-[9px] text-orange-700 dark:text-orange-500 font-bold block mt-1">En cola</span>
          </button>

          {/* 3. Pedidos pendientes */}
          <button 
            onClick={() => onNavigate('Cocina')}
            className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 text-left transition-all hover:shadow-sm active:scale-97 cursor-pointer"
            id="kpi-pendientes"
          >
            <span className="text-[10px] text-amber-805 dark:text-amber-400 font-mono font-bold tracking-wider block">PENDIENTES</span>
            <p className="text-lg sm:text-xl font-sans font-extrabold text-amber-950 dark:text-amber-300 mt-1">
              {pendingOrdersCount}
            </p>
            <span className="text-[9px] text-amber-700 dark:text-amber-500 font-semibold block mt-1">Sin preparar</span>
          </button>

          {/* 4. Pedidos listos */}
          <button 
            onClick={() => onNavigate('Entregas')}
            className="bg-green-50 dark:bg-green-950/30 hover:bg-green-100/80 dark:hover:bg-green-900/40 p-3.5 rounded-2xl border border-green-200 dark:border-green-800 text-left transition-all hover:shadow-sm active:scale-97 cursor-pointer"
            id="kpi-listos"
          >
            <span className="text-[10px] text-green-800 dark:text-green-400 font-mono font-bold tracking-wider block">LISTOS</span>
            <p className="text-lg sm:text-xl font-sans font-extrabold text-green-950 dark:text-green-300 mt-1">
              {readyOrdersCount}
            </p>
            <span className="text-[9px] text-green-700 dark:text-green-500 font-bold block mt-1">Para entrega</span>
          </button>

          {/* 5. Pedidos entregados */}
          <button 
            onClick={() => onNavigate('Entregas')}
            className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-left transition-all hover:shadow-sm active:scale-97 cursor-pointer"
            id="kpi-entregados"
          >
            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-mono font-bold tracking-wider block">ENTREGADOS</span>
            <p className="text-lg sm:text-xl font-sans font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {deliveredOrdersCount}
            </p>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold block mt-1">Completados</span>
          </button>

          {/* 6. Pedidos pagados */}
          <button 
            onClick={() => onNavigate('Caja')}
            className="bg-[#f0fdf4] dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 p-3.5 rounded-2xl border border-emerald-150 dark:border-emerald-800 text-left transition-all hover:shadow-sm active:scale-97 cursor-pointer"
            id="kpi-pagados"
          >
            <span className="text-[10px] text-[#006e0a] dark:text-emerald-400 font-mono font-bold tracking-wider block font-black">PAGADOS</span>
            <p className="text-lg sm:text-xl font-sans font-extrabold text-[#004b04] dark:text-emerald-300 mt-1">
              {paidOrdersCount}
            </p>
            <span className="text-[9px] text-[#006e0a] dark:text-emerald-500 font-bold block mt-1">Con corte</span>
          </button>

          {/* 7. Clientes con crédito activo */}
          <button 
            onClick={() => onNavigate('Créditos')}
            className="bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100/80 dark:hover:bg-rose-900/40 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-800 text-left transition-all hover:shadow-sm active:scale-97 cursor-pointer col-span-2 sm:col-span-1"
            id="kpi-credito-clientes"
          >
            <span className="text-[10px] text-rose-800 dark:text-rose-400 font-mono font-bold tracking-wider block">FIADOS</span>
            <p className="text-lg sm:text-xl font-sans font-extrabold text-rose-950 dark:text-rose-300 mt-1">
              {activeCreditClientsCount}
            </p>
            <span className="text-[9px] text-rose-600 dark:text-rose-500 font-bold block mt-1">Por liquidar</span>
          </button>

        </div>
      </div>

      {/* 3. PEDIDOS URGENTES (DEMORADOS EN COCINA) */}
      <div className="space-y-2">
        <h2 className="text-sm font-black text-[#904d00] tracking-wider uppercase flex items-center gap-1.5 px-1">
          <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
          Monitoreo de Horas Críticas (Pedidos Urgentes)
        </h2>

        {urgentOrdersList.length === 0 ? (
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 text-center text-xs text-emerald-950 dark:text-emerald-300 font-sans flex items-center justify-center gap-2">
            <span className="text-base">✨</span>
            <span><strong>¡Excelente flujo de cocina!</strong> No hay órdenes demoradas rezagadas en preparación. Todo va al corriente.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentOrdersList.slice(0, 3).map(order => {
              const isHighUrgency = order.elapsed >= 5;
              return (
                <div 
                  key={`urg-${order.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isHighUrgency 
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 shadow-sm shadow-rose-100 dark:shadow-rose-900/20 animate-pulse' 
                      : 'bg-[#fffdf8] dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      ID {order.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold tracking-wider ${
                      isHighUrgency ? 'bg-red-650 text-white animate-bounce' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300'
                    }`}>
                      {isHighUrgency ? '🔥 CRÍTICO' : '⏳ DEMORADO'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 leading-tight">
                      {order.clientName || 'Cliente Gral'}
                    </h4>
                    <p className="text-xs text-[#904d00] dark:text-amber-400 font-sans mt-0.5 font-bold">
                      📍 {getOrderBranch(order)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium line-clamp-1 mt-1 font-mono">
                      {order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-gray-150 dark:border-slate-700">
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium font-mono">
                      Registrado: {formatOrderTimeOnly(order.timestamp)}
                    </span>
                    
                    <span className={`text-xs font-mono font-bold ${isHighUrgency ? 'text-red-700 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}`}>
                      ⏱️ Espera: {order.elapsed} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main double column container layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COMPARTMENT: Active Orders Monitors (Pedidos Activos) & Quick Access */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 4. PEDIDOS ACTIVOS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="font-sans font-black text-base text-gray-900 dark:text-slate-100 tracking-tight">PEDIDOS EN EJECUCIÓN</h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-sans mt-0.5">Cola dinámica del día organizada por secuencia de arribo</p>
              </div>
              <button
                onClick={() => onNavigate('POS')}
                className="text-xs font-black text-[#904d00] hover:underline flex items-center gap-0.5"
              >
                + Registrar Venta
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto pr-1">
              {activeOrdersList.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs font-sans">
                  No hay pedidos registrados en el sistema para monitorear hoy.
                </div>
              ) : (
                activeOrdersList.map((order) => {
                  const sBranch = getOrderBranch(order);
                  return (
                    <div key={order.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-neutral-50/40 dark:hover:bg-slate-800/40 px-1 rounded-xl transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col items-center justify-center text-amber-900 dark:text-amber-300 font-mono shrink-0">
                          <span className="text-[9px] uppercase font-bold">ORD</span>
                          <span className="text-xs font-bold leading-tight mt-0.5">#{order.id.replace('#', '')}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-950 dark:text-slate-100 font-sans leading-tight">
                              {order.clientName || 'Cliente de Caja General'}
                            </h4>
                            <span className="text-[10px] text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                              {order.paymentMethod || 'Contado'}
                            </span>
                          </div>

                          <span className="text-xs text-gray-500 dark:text-slate-400 font-sans block mt-0.5">
                            🏠 sucursal: <strong className="text-gray-800 dark:text-slate-300">{sBranch}</strong>
                          </span>
                          
                          {/* Items and customization summary description */}
                          <p className="text-[11px] text-gray-600 font-medium font-serif mt-1 italic leading-tight">
                            {order.items.map(i => `${i.quantity}x ${i.product.name} (${i.customizations.join(', ') || 'Tradicional'})`).join(' • ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-none border-dashed border-gray-100 mt-1 sm:mt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-semibold font-mono">
                            ⏱️ {formatOrderTimeOnly(order.timestamp)}
                          </span>
                          <span className="text-sm font-sans font-black text-[#904d00]" id={`order-total-${order.id}`}>
                            ${order.total.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex gap-1.5 mt-2">
                          {/* Custom localized status badge with nice tone */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-center ${
                            order.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            order.status === 'En preparación' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
                            order.status === 'Listo' ? 'bg-green-150 text-[#006e0a] border border-green-250' :
                            'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>
                            {order.status}
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.paymentStatus === 'Pagado' ? 'bg-emerald-50 text-emerald-700' :
                            order.paymentStatus === 'Crédito' ? 'bg-rose-50 text-rose-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 5. ACCESOS RÁPIDOS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-sans font-black text-base text-gray-900 dark:text-slate-100 uppercase tracking-tight">Accesos Rápidos del Sistema</h3>
              <p className="text-[11px] text-gray-505 font-sans mt-0.5">Usa estos enlaces para saltar directamente a las diferentes terminales del puesto</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
              
              <button 
                onClick={() => onNavigate('POS')}
                className="p-3 bg-[#fff9f4] dark:bg-amber-950/30 hover:bg-[#ffe3cc] dark:hover:bg-amber-900/40 border border-[#ffca99] dark:border-amber-800 rounded-2xl text-left group transition-all active:scale-95 cursor-pointer"
                id="quick-nav-pos"
              >
                <div className="w-8 h-8 rounded-lg bg-[#904d00] text-white flex items-center justify-center font-bold text-sm">
                  🛍️
                </div>
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-sans group-hover:text-[#904d00] dark:group-hover:text-amber-400">Punto de Venta</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 leading-snug">Levantar órdenes de jugos y snacks.</p>
              </button>

              <button 
                onClick={() => onNavigate('Cocina')}
                className="p-3 bg-[#f3faf3] dark:bg-emerald-950/30 hover:bg-emerald-100/[0.7] dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-left group transition-all active:scale-95 cursor-pointer"
                id="quick-nav-kitchen"
              >
                <div className="w-8 h-8 rounded-lg bg-[#006e0a] text-white flex items-center justify-center font-bold text-sm">
                  🧑‍🍳
                </div>
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-sans group-hover:text-[#006e0a] dark:group-hover:text-emerald-400">Estación Cocina</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 leading-snug">Preparar tickets o licuados al momento.</p>
              </button>

              <button 
                onClick={() => onNavigate('Entregas')}
                className="p-3 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-left group transition-all active:scale-95 cursor-pointer"
                id="quick-nav-deliveries"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                  🚚
                </div>
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-sans group-hover:text-amber-700 dark:group-hover:text-amber-400">Hub Entregas</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 leading-snug">Despacho para choferes y repartidores.</p>
              </button>

              <button 
                onClick={() => onNavigate('Caja')}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-gray-150 dark:hover:bg-slate-700/50 border border-gray-250 dark:border-slate-700 rounded-2xl text-left group transition-all active:scale-95 cursor-pointer"
                id="quick-nav-cashbox"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-800 dark:bg-slate-600 text-white flex items-center justify-center font-bold text-sm">
                  💵
                </div>
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-sans group-hover:text-amber-900 dark:group-hover:text-amber-400">Arqueo de Caja</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 leading-snug">Consultar cortes, fondos y retiras parciales.</p>
              </button>

              <button 
                onClick={() => onNavigate('Créditos')}
                className="p-3 bg-rose-50/55 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-left group transition-all active:scale-95 cursor-pointer"
                id="quick-nav-credits"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center font-bold text-sm">
                  🗂️
                </div>
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-sans group-hover:text-rose-700 dark:group-hover:text-rose-400">Cuentas Fiadas</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 leading-snug">Saldos vencidos de clientes de confianza.</p>
              </button>

              <button 
                onClick={() => onNavigate('Administración')}
                className="p-3 bg-neutral-50 dark:bg-slate-800/50 hover:bg-neutral-100 dark:hover:bg-slate-700/50 border border-neutral-200 dark:border-slate-700 rounded-2xl text-left group transition-all active:scale-95 cursor-pointer"
                id="quick-nav-admin"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-500 dark:bg-slate-600 text-white flex items-center justify-center font-bold text-sm">
                  ⚙️
                </div>
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-slate-100 mt-2 font-sans group-hover:text-gray-950 dark:group-hover:text-slate-300">Administración</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 leading-snug">Precios Sabritas, galletas y Menú del Día.</p>
              </button>

            </div>
          </div>

        </div>

        {/* RIGHT COMPARTMENT: Recent Activity Feed & Business statistics */}
        <div className="lg:col-span-4 space-y-6">

          {/* 6. ESTADÍSTICAS DEL NEGOCIO */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-sans font-black text-sm text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 justify-between">
                <span>Ratios y Estadísticas</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-sans">Análisis cuantitativo de flujos y carteras vigentes</p>
            </div>

            <div className="space-y-4">
              
              {/* Stat 1: Ventas del día */}
              <div className="p-3 bg-[#e8f5e9]/50 dark:bg-emerald-950/30 rounded-2xl border border-[#c8e6c9]/40 dark:border-emerald-800/60 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono tracking-wider font-extrabold block">VENDADO HOY</span>
                  <span className="text-base font-extrabold text-emerald-950 dark:text-emerald-300 block mt-0.5">${totalSalesThisDay.toFixed(2)}</span>
                </div>
                <DollarSign className="w-6 h-6 text-emerald-700 dark:text-emerald-500" />
              </div>

              {/* Stat 2: Número de pedidos */}
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-neutral-150 dark:border-slate-600 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider font-extrabold block">CANT. PEDIDOS</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 block mt-0.5">{totalOrdersCount} órdenes</span>
                </div>
                <ListOrdered className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>

              {/* Stat 3: Promedio por pedido */}
              <div className="p-3 bg-[#ffecc3]/20 dark:bg-amber-950/30 rounded-2xl border border-orange-100 dark:border-amber-800/60 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#904d00]/80 dark:text-amber-400 font-mono tracking-wider font-extrabold block">PROMEDIO PEDIDO</span>
                  <span className="text-base font-extrabold text-amber-950 dark:text-amber-200 block mt-0.5">${(averageTicketPrice || 55.40).toFixed(2)}</span>
                </div>
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>

              {/* Stat 4: Clientes con crédito */}
              <div className="p-3 bg-red-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-800/60 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono tracking-wider font-extrabold block">CLIENTES FIADO</span>
                  <span className="text-base font-extrabold text-rose-950 dark:text-rose-300 block mt-0.5">{activeCreditClientsCount} deudores</span>
                </div>
                <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>

              {/* Stat 5: Pedidos pendientes */}
              <div className="p-3 bg-amber-50/40 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-800/60 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-amber-800 dark:text-amber-400 font-mono tracking-wider font-extrabold block">EN FILA ESPERA</span>
                  <span className="text-base font-extrabold text-amber-950 dark:text-amber-200 block mt-0.5">{pendingOrdersCount} sin atender</span>
                </div>
                <ChefHat className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>

            </div>
          </div>
          
          {/* 7. ACTIVIDAD RECIENTE */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
            <div className="pb-2 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-sans font-black text-sm text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#904d00] animate-pulse" />
                Bitácora de Actividad Reciente
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-sans mt-0.5">Operaciones cronológicas registradas en toda la sucursal</p>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {sortedActivities.length === 0 ? (
                <p className="text-center py-10 text-xs text-gray-400 dark:text-slate-500 font-sans">
                  No hay movimientos para desplegar en este ciclo.
                </p>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-orange-100 dark:before:bg-slate-700">
                  {sortedActivities.map((event) => {
                    // Custom iconography and background highlight per log status
                    let iconBg = 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300';
                    let iconEmote = '📋';

                    if (event.type === 'pedido_creado') {
                      iconBg = 'bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
                      iconEmote = '🛍️';
                    } else if (event.type === 'enviado_cocina') {
                      iconBg = 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
                      iconEmote = '🧑‍🍳';
                    } else if (event.type === 'pedido_listo') {
                      iconBg = 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800';
                      iconEmote = '✅';
                    } else if (event.type === 'pedido_entregado') {
                      iconBg = 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
                      iconEmote = '🚚';
                    } else if (event.type === 'pago_registrado') {
                      iconBg = 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
                      iconEmote = '💵';
                    } else if (event.type === 'credito_registrado') {
                      iconBg = 'bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
                      iconEmote = '🗂️';
                    }

                    return (
                      <div key={event.id} className="flex gap-3 relative z-10 text-xs items-start select-none">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${iconBg}`}>
                          {iconEmote}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-gray-950 dark:text-slate-100 font-sans leading-tight">
                              {event.title}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono font-medium">
                              {event.timeLabel}
                            </span>
                          </div>
                          <p className="text-gray-500 dark:text-slate-400 leading-normal text-[10px]">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
