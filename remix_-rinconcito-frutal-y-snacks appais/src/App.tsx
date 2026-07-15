/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, Role, Product, Order, ClientDebt, CajaStatus, Movement, UserAccount, ExtraMovement } from './types';
import { INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_ORDERS, INITIAL_CAJA } from './data';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import DashboardPanel from './components/DashboardPanel';
import POSPanel from './components/POSPanel';
import CocinaPanel from './components/CocinaPanel';
import EntregasPanel from './components/EntregasPanel';
import CajaPanel from './components/CajaPanel';
import CreditosPanel from './components/CreditosPanel';
import AdminPanel from './components/AdminPanel';
import CuentaPanel from './components/CuentaPanel';
import ClientMenuPanel from './components/ClientMenuPanel';
import { ShieldAlert, KeyRound, Sparkles, UserCheck, RefreshCw } from 'lucide-react';

export default function App() {
  // Load initial data states from local storage falling back to data module
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const saved = localStorage.getItem('rf_role');
    return (saved as Role) || 'Administrador';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('Dashboard');

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('rf_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Product[];
        const merged = [...parsed];
        INITIAL_PRODUCTS.forEach(initial => {
          const existingIdx = merged.findIndex(p => p.id === initial.id || p.name.toLowerCase() === initial.name.toLowerCase());
          if (existingIdx === -1) {
            merged.push(initial);
          } else {
            merged[existingIdx] = {
              ...initial,
              ...merged[existingIdx],
              name: initial.name, // strict POS-exact name matching
              variants: merged[existingIdx].variants || initial.variants,
              ingredients: merged[existingIdx].ingredients || initial.ingredients,
              customizationOptions: merged[existingIdx].customizationOptions || initial.customizationOptions,
            };
          }
        });
        return merged;
      } catch (err) {
        console.error("Failed to parse saved products, falling back to INITIAL_PRODUCTS", err);
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('rf_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [clients, setClients] = useState<ClientDebt[]>(() => {
    const saved = localStorage.getItem('rf_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [cajaState, setCajaState] = useState<CajaStatus>(() => {
    const saved = localStorage.getItem('rf_caja');
    return saved ? JSON.parse(saved) : INITIAL_CAJA;
  });

  const [menuDelDia, setMenuDelDia] = useState<string>(() => {
    return localStorage.getItem('rf_menu') || '🍹 Licuado de Fresa Especial con Leche de Coco\n🥗 Escamocha de Frutas Mixtas con yogurt natural y miel de agave\n🥪 Club Sandwich Rinconcito acompañado de papas adobadas crujientes';
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('rf_users');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'usr-1', name: 'Administrador Principal', phone: '5511223344', username: 'admin', role: 'Administrador', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
      { id: 'usr-2', name: 'Juan Pérez', phone: '5566778899', username: 'juan', role: 'Empleado', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
      { id: 'usr-3', name: 'Sofía Castro', phone: '5522334455', username: 'sofia', role: 'Repartidor', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
    ];
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('rf_theme');
    // Default to light if nothing is saved
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rf_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const [isStoreClosed, setIsStoreClosed] = useState<boolean>(() => {
    return localStorage.getItem('rf_store_closed') === 'true';
  });

  const [isClientPOV, setIsClientPOV] = useState<boolean>(false);

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('rf_logo_url') || '';
  });

  // Sync state changes to clean localStorage
  useEffect(() => {
    localStorage.setItem('rf_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('rf_store_closed', String(isStoreClosed));
  }, [isStoreClosed]);

  useEffect(() => {
    localStorage.setItem('rf_logo_url', logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    localStorage.setItem('rf_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('rf_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('rf_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('rf_caja', JSON.stringify(cajaState));
  }, [cajaState]);

  useEffect(() => {
    localStorage.setItem('rf_menu', menuDelDia);
  }, [menuDelDia]);

  useEffect(() => {
    localStorage.setItem('rf_users', JSON.stringify(users));
  }, [users]);

  // Handle Automatic Redirections when roles change
  useEffect(() => {
    if (currentRole === 'Empleado' && !['POS', 'Cocina', 'Caja', 'Cuenta'].includes(activeTab)) {
      setActiveTab('POS');
    } else if (currentRole === 'Repartidor' && !['Dashboard', 'POS', 'Cocina', 'Entregas', 'Caja', 'Créditos', 'Cuenta'].includes(activeTab)) {
      setActiveTab('Entregas');
    } else if (currentRole === 'Administrador' && activeTab === 'POS' && orders.length === 0) {
      setActiveTab('Dashboard');
    }
  }, [currentRole]);

  // RESET / REFRESH ALL HANDLER (Hard reset button in header)
  const handleHardReset = () => {
    if (confirm('¿Deseas restablecer todos los datos de demostración de Rinconcito Frutal? Se perderán las ventas del día registradas.')) {
      localStorage.removeItem('rf_products');
      localStorage.removeItem('rf_orders');
      localStorage.removeItem('rf_clients');
      localStorage.removeItem('rf_caja');
      localStorage.removeItem('rf_menu');
      localStorage.removeItem('rf_users');
      
      setProducts(INITIAL_PRODUCTS);
      setOrders(INITIAL_ORDERS);
      setClients(INITIAL_CLIENTS);
      setCajaState(INITIAL_CAJA);
      setMenuDelDia('🍹 Licuado de Fresa Especial con Leche de Coco\n🥗 Escamocha de Frutas Mixtas con yogurt natural y miel de agave\n🥪 Club Sandwich Rinconcito acompañado de papas adobadas crujientes');
      setUsers([
        { id: 'usr-1', name: 'Administrador Principal', phone: '5511223344', username: 'admin', role: 'Administrador', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
        { id: 'usr-2', name: 'Juan Pérez', phone: '5566778899', username: 'juan', role: 'Empleado', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
        { id: 'usr-3', name: 'Sofía Castro', phone: '5522334455', username: 'sofia', role: 'Repartidor', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
      ]);
      setActiveTab('Dashboard');
      setCurrentRole('Administrador');
      alert('¡Datos restablecidos con éxito!');
    }
  };

  // State transaction actions
  const addOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);

    // If order has already paid during POS checkout (contado)
    if (newOrder.paymentStatus === 'Pagado') {
      setCajaState(prev => ({
        ...prev,
        ventasDelDia: prev.ventasDelDia + newOrder.total,
        pedidosPagados: prev.pedidosPagados + 1
      }));
    }

    // If checkout was registered directly as Credito (fiado)
    if (newOrder.paymentStatus === 'Crédito' && newOrder.clientId) {
      updateClientBalanceDirect(
        newOrder.clientId,
        newOrder.total,
        `Consumo en POS: Pedido ${newOrder.id}`,
        'Pedido'
      );
    }
  };

  // Cocina Ticket avance
  const updateOrderStatus = (orderId: string, newStatus: 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado') => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  // Cancelar un pedido en cocina
  const cancelOrder = (orderId: string, reason: string) => {
    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const existingNotes = o.notes ? `${o.notes} | ` : '';
        return {
          ...o,
          status: 'Cancelado',
          notes: `${existingNotes}Cancelado: ${reason}`
        } as Order;
      }
      return o;
    }));

    if (orderToCancel.paymentStatus === 'Pagado') {
      setCajaState(prev => ({
        ...prev,
        ventasDelDia: Math.max(0, prev.ventasDelDia - orderToCancel.total),
        pedidosPagados: Math.max(0, prev.pedidosPagados - 1)
      }));
    }

    if (orderToCancel.paymentStatus === 'Crédito' && orderToCancel.clientId) {
      updateClientBalanceDirect(
        orderToCancel.clientId,
        -orderToCancel.total,
        `Cancelación Pedido ${orderToCancel.id}: ${reason}`,
        'Ajuste'
      );
    }
  };

  // Guardar cambios de un pedido editado
  const handleSaveEditedOrder = (updatedOrder: Order) => {
    const oldOrder = orders.find(o => o.id === updatedOrder.id);
    if (!oldOrder) return;

    // 1. Revertir finanzas previas
    if (oldOrder.paymentStatus === 'Pagado') {
      setCajaState(prev => ({
        ...prev,
        ventasDelDia: Math.max(0, prev.ventasDelDia - oldOrder.total),
        pedidosPagados: Math.max(0, prev.pedidosPagados - 1)
      }));
    } else if (oldOrder.paymentStatus === 'Crédito' && oldOrder.clientId) {
      updateClientBalanceDirect(
        oldOrder.clientId,
        -oldOrder.total,
        `Corrección de Pedido ${oldOrder.id} (Reversión previa)`,
        'Ajuste'
      );
    }

    // 2. Aplicar nuevas finanzas
    if (updatedOrder.paymentStatus === 'Pagado') {
      setCajaState(prev => ({
        ...prev,
        ventasDelDia: prev.ventasDelDia + updatedOrder.total,
        pedidosPagados: prev.pedidosPagados + 1
      }));
    } else if (updatedOrder.paymentStatus === 'Crédito' && updatedOrder.clientId) {
      updateClientBalanceDirect(
        updatedOrder.clientId,
        updatedOrder.total,
        `Consumo en POS (Modificado): Pedido ${updatedOrder.id}`,
        'Pedido'
      );
    }

    // 3. Reemplazar comanda en el listado
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    // 4. Limpiar estado de edición y regresar
    setEditingOrder(null);
    setActiveTab('Caja');
    alert(`Se guardaron exitosamente los cambios en el Pedido ${updatedOrder.id}.`);
  };

  // Deliver and Settle Payment at delivery hub (Entregas Panel)
  const deliverAndSettleOrder = (orderId: string, paymentMethod: 'Efectivo' | 'Tarjeta' | 'Crédito' | 'Pendiente', clientId?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'Entregado',
          paymentStatus: paymentMethod === 'Pendiente' ? 'Pendiente' : (paymentMethod === 'Crédito' ? 'Crédito' : 'Pagado'),
          paymentMethod,
          clientId: paymentMethod === 'Crédito' ? clientId : undefined
        };
      }
      return o;
    }));

    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    if (paymentMethod === 'Crédito' && clientId) {
      // Post to credit balance
      updateClientBalanceDirect(
        clientId,
        targetOrder.total,
        `Entregas: Despachado Pedido ${targetOrder.id}`,
        'Pedido'
      );
    } else if (paymentMethod !== 'Pendiente') {
      // Add cash / card sales to register
      setCajaState(prev => ({
        ...prev,
        ventasDelDia: prev.ventasDelDia + targetOrder.total,
        pedidosPagados: prev.pedidosPagados + 1
      }));
    }
  };

  // Settle non-paid delivered orders from Box list to Credit Client
  const settlePendingOrderToCredit = (orderId: string, clientId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          paymentStatus: 'Crédito',
          paymentMethod: 'Crédito',
          clientId: clientId
        };
      }
      return o;
    }));

    updateClientBalanceDirect(
      clientId,
      targetOrder.total,
      `Caja: Traspaso a Crédito de Pedido Entregado ${targetOrder.id}`,
      'Pedido'
    );
  };

  // Settle non-paid delivered orders immediately with cash, bank card, or mixed
  const settlePendingOrderImmediately = (orderId: string, paymentMethod: 'Efectivo' | 'Tarjeta' | 'Mixto', mixedCashAmount?: number, usuario?: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let oldNotes = o.notes || '';
        let newNotes = oldNotes;
        if (usuario) {
          newNotes = oldNotes ? `${oldNotes} | Responsable: ${usuario}` : `Responsable: ${usuario}`;
        }
        
        const mixedPaymentDetail = paymentMethod === 'Mixto' && mixedCashAmount !== undefined
          ? { cash: mixedCashAmount, card: o.total - mixedCashAmount }
          : undefined;

        return {
          ...o,
          paymentStatus: 'Pagado',
          paymentMethod: paymentMethod,
          mixedPayment: mixedPaymentDetail,
          notes: newNotes
        };
      }
      return o;
    }));

    setCajaState(prev => ({
      ...prev,
      ventasDelDia: prev.ventasDelDia + targetOrder.total,
      pedidosPagados: prev.pedidosPagados + 1
    }));
  };

  // Client Balance Updates (Abono / Deuda / Ajuste / Liquidación / Eliminación)
  const updateClientBalanceDirect = (
    clientId: string,
    amountChange: number,
    description: string,
    moveType: 'Pago' | 'Pedido' | 'Ajuste' | 'Liquidación Total' | 'Deuda Eliminada',
    customUser?: string,
    customBranch?: string,
    customStatus?: 'Activa' | 'Pagada' | 'Cerrada' | 'Archivada' | 'Eliminada'
  ) => {
    setClients(prev => prev.map(client => {
      if (client.id === clientId) {
        const newBalance = Math.max(0, client.balance + amountChange);
        const dateLabel = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
        
        let statusLabel: 'PEDIDO AGREGADO' | 'PAGO RECEIBIDO' | 'AJUSTE' | 'SALDO INICIAL' | 'LIQUIDACIÓN TOTAL' | 'DEUDA ELIMINADA' = 'PEDIDO AGREGADO';
        if (moveType === 'Pago') statusLabel = 'PAGO RECEIBIDO';
        if (moveType === 'Ajuste') statusLabel = 'AJUSTE';
        if (moveType === 'Liquidación Total') statusLabel = 'LIQUIDACIÓN TOTAL';
        if (moveType === 'Deuda Eliminada') statusLabel = 'DEUDA ELIMINADA';

        const historyItem: Movement = {
          id: `mov-${Date.now()}`,
          type: moveType,
          label: `${description}`,
          date: dateLabel,
          amount: amountChange,
          statusLabel,
          notes: description,
          usuario: customUser,
          sucursal: customBranch || client.branch
        };

        const isNowSettlePaid = newBalance === 0;
        let finalStatus = customStatus || (isNowSettlePaid ? 'Pagada' : 'Activa');

        return {
          ...client,
          balance: newBalance,
          lastMovement: `${dateLabel} (${moveType})`,
          status: finalStatus as any,
          paidAt: isNowSettlePaid ? new Date().toISOString() : undefined,
          daysOverdue: isNowSettlePaid ? 0 : client.daysOverdue,
          pedidosPendientes: moveType === 'Pedido' ? client.pedidosPendientes + 1 : Math.max(0, client.pedidosPendientes - 1),
          history: [historyItem, ...client.history]
        };
      }
      return client;
    }));
  };

  // Immediate Client Deletion
  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
  };

  // Leader Partial Deliveries (Cash Box)
  const reportLeaderRelease = (amount: number) => {
    setCajaState(prev => ({
      ...prev,
      dineroEntregadoALider: prev.dineroEntregadoALider + amount
    }));
  };

  // Corte de Caja Definitivo
  const executeCorteDefinitivo = (
    usuario: string,
    reportDetails?: {
      hora: string;
      ventas: number;
      ventasCategorias: { licuadosJugos: number; comida: number; snacks: number };
      pedidosCorte: number;
      creditosOtorgados: number;
      efectivoFinal: number;
      diferencia: number;
      topProductos: { name: string; quantity: number }[];
      gastosRetiros?: ExtraMovement[];
    }
  ) => {
    const backupCorte = {
      id: `CR-${Math.floor(100 + Math.random() * 900)}`,
      fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      hora: reportDetails?.hora || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      ventas: reportDetails ? reportDetails.ventas : cajaState.ventasDelDia,
      ventasCategorias: reportDetails?.ventasCategorias || { licuadosJugos: 0, comida: 0, snacks: 0 },
      pedidosCorte: reportDetails?.pedidosCorte || orders.length,
      creditosOtorgados: reportDetails?.creditosOtorgados || 0,
      efectivoFinal: reportDetails?.efectivoFinal || (cajaState.fondoCaja + cajaState.ventasDelDia),
      diferencia: reportDetails?.diferencia || 0.00,
      usuario,
      topProductos: reportDetails?.topProductos || [],
      gastosRetiros: reportDetails?.gastosRetiros || []
    };

    setCajaState(prev => ({
      ...prev,
      ventasDelDia: 0.00,
      pedidosPagados: 0,
      dineroEntregadoALider: 0.00,
      fondoCaja: 1500.00,
      historialCierres: [backupCorte, ...prev.historialCierres]
    }));
    
    // Reset daily operation counters by clearing orders list
    setOrders([]);
  };

  // Catalog methods
  const addProductToCatalog = (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProductInCatalog = (updatedProd: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
  };

  const deleteProductFromCatalog = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // User Accounts
  const handleAddUser = (newUser: UserAccount) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleUpdateUserAvatar = (userId: string, avatarUrl: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatarUrl } : u));
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };


  // Role Permission Verification Filter
  const checkTabPermission = (tab: ActiveTab, role: Role): boolean => {
    const tabPerms: Record<ActiveTab, Role[]> = {
      'Dashboard': ['Administrador', 'Líder', 'Empleado', 'Repartidor'],
      'POS': ['Administrador', 'Empleado', 'Repartidor'],
      'Cocina': ['Administrador', 'Líder', 'Empleado', 'Repartidor'],
      'Entregas': ['Administrador', 'Empleado', 'Repartidor'],
      'Caja': ['Administrador', 'Líder', 'Empleado', 'Repartidor'],
      'Créditos': ['Administrador', 'Líder', 'Repartidor'],
      'Administración': ['Administrador'],
      'Cuenta': ['Administrador', 'Líder', 'Empleado', 'Repartidor']
    };
    return tabPerms[tab].includes(role);
  };

  const isPermitted = checkTabPermission(activeTab, currentRole);
  const activeUserObj = users.find(u => u.role === currentRole);
  const activeEmployeeName = activeUserObj ? activeUserObj.name : currentRole;

  if (isClientPOV) {
    return (
      <ClientMenuPanel 
        products={products}
        isStoreClosed={isStoreClosed}
        menuDelDia={menuDelDia}
        logoUrl={logoUrl}
        onExit={() => setIsClientPOV(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col pb-24 transition-colors">
      {/* Top operational bar */}
      <Header 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole} 
        onRefreshAll={handleHardReset} 
        activeTab={activeTab}
        users={users}
        isStoreClosed={isStoreClosed}
        logoUrl={logoUrl}
        onNavigateToProfile={() => setActiveTab('Cuenta')}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6">
        
        {/* If user is permitted, render the tab panel */}
        {isPermitted ? (
          <div>
            {activeTab === 'Dashboard' && (
              <DashboardPanel 
                orders={orders} 
                clients={clients} 
                products={products} 
                onNavigate={setActiveTab}
                ventasDelDia={cajaState.ventasDelDia}
                activeUserName={activeEmployeeName}
                activeUserAvatar={activeUserObj?.avatarUrl}
              />
            )}

            {activeTab === 'POS' && (
              <POSPanel 
                products={products} 
                clients={clients} 
                onAddOrder={addOrder}
                onAddClient={(c) => setClients(p => [c, ...p])}
                isStoreClosed={isStoreClosed}
                editingOrder={editingOrder}
                onSaveEditedOrder={handleSaveEditedOrder}
                onCancelEdit={() => { setEditingOrder(null); setActiveTab('Caja'); }}
              />
            )}

            {activeTab === 'Cocina' && (
              <CocinaPanel 
                orders={orders} 
                onUpdateStatus={updateOrderStatus} 
                onCancelOrder={cancelOrder}
              />
            )}

            {activeTab === 'Entregas' && (
              <EntregasPanel 
                orders={orders} 
                clients={clients} 
                onDeliverOrder={deliverAndSettleOrder} 
              />
            )}

            {activeTab === 'Caja' && (
              <CajaPanel 
                orders={orders} 
                cajaState={cajaState} 
                userRole={currentRole}
                activeEmployeeName={activeEmployeeName}
                onLeaderRelease={reportLeaderRelease}
                onExecuteCorte={executeCorteDefinitivo}
                clients={clients}
                onAddClient={(c) => setClients(p => [c, ...p])}
                onSettleOrderToCredit={settlePendingOrderToCredit}
                onPayOrderImmediately={(orderId, payMethod, mixedCashAmount) => settlePendingOrderImmediately(orderId, payMethod, mixedCashAmount, activeEmployeeName)}
                onUpdateClientBalance={updateClientBalanceDirect}
                setCajaState={setCajaState}
                setOrders={setOrders}
                onEditOrder={(order) => { setEditingOrder(order); setActiveTab('POS'); }}
              />
            )}

            {activeTab === 'Créditos' && (
              <CreditosPanel 
                clients={clients} 
                onAddClient={(c) => setClients(p => [c, ...p])} 
                onUpdateClientBalance={updateClientBalanceDirect}
                userRole={currentRole}
                onDeleteClient={handleDeleteClient}
              />
            )}

            {activeTab === 'Administración' && (
              <AdminPanel 
                products={products} 
                orders={orders} 
                clients={clients}
                onAddProduct={addProductToCatalog}
                onUpdateProduct={updateProductInCatalog}
                onDeleteProduct={deleteProductFromCatalog}
                menuDelDia={menuDelDia}
                onUpdateMenuDelDia={setMenuDelDia}
                users={users}
                onUpdateUserRole={handleUpdateUserRole}
                isStoreClosed={isStoreClosed}
                onSetStoreClosed={setIsStoreClosed}
                logoUrl={logoUrl}
                onSetLogoUrl={setLogoUrl}
                cajaState={cajaState}
                onToggleClientPOV={() => setIsClientPOV(true)}
              />
            )}

            {activeTab === 'Cuenta' && (
              <CuentaPanel 
                users={users}
                onAddUser={handleAddUser}
                currentRole={currentRole}
                setCurrentRole={setCurrentRole}
                onUpdateUserAvatar={handleUpdateUserAvatar}
                onUpdateUser={handleUpdateUser}
              />
            )}
          </div>
        ) : (
          /* OTHERWISE RENDER ACCESS LOCK OVERLAY SHIELD */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 max-w-lg mx-auto text-center space-y-6 mt-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-650 mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-sans font-bold text-xl text-gray-900">Módulo Bloqueado para tu Rol</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-sans">
                El módulo de <strong className="text-gray-900">"{activeTab}"</strong> requiere permisos especiales. Tu rol actual es <strong className="text-gray-900">"{currentRole}"</strong>.
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-950 font-sans leading-relaxed text-left flex gap-3 items-center">
              <KeyRound className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p>
                <strong>¿Estás evaluando la aplicación?</strong> Puedes cambiar de rol (Administrador, Empleado o Repartidor) fácilmente usando el selector en el menú superior naranja en cualquier momento.
              </p>
            </div>

            <div className="pt-2">
              <button
                value="Administrador"
                onClick={() => setCurrentRole('Administrador')}
                className="bg-[#904d00] hover:bg-amber-900 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
              >
                <UserCheck className="w-4 h-4" />
                <span>Asumir Rol Administrador 👑</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Bottom navigation is sticky */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentRole={currentRole}
        readyCount={orders.filter(o => o.status === 'Listo').length}
        cocinaCount={orders.filter(o => ['Pendiente', 'En preparación'].includes(o.status)).length}
      />
    </div>
  );
}

