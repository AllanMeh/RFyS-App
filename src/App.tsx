/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Role, Product, Order, ClientDebt, CajaStatus, Movement, UserAccount, ExtraMovement, ClientAccount, Coupon, StoreInfo } from './types';
import { loadThemeMode, saveThemeMode, applyThemeToDom, resolveTheme } from './theme';
import { INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_ORDERS, INITIAL_CAJA, INITIAL_STORES } from './data';
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
import ClientPanel from './components/ClientPanel';
import LoginScreen from './components/LoginScreen';
import { ShieldAlert, KeyRound, UserCheck } from 'lucide-react';
import { useSupabaseStatus } from './lib/useSupabaseStatus';
import supabase from './lib/supabase';
import { subscribeToAuthChanges, logout as supabaseLogout, getCurrentSession } from './lib/authService';
import { processQueue } from './lib/database/offlineQueue';
import type { AuthUser } from './lib/authService';

// Importación de la nueva capa de persistencia híbrida
import { getLocalProducts, getProducts, saveLocalProducts, addProduct, editProduct, removeProduct } from './lib/database/products';
import { getLocalOrders, getOrders, saveLocalOrders, addOrder as addOrderDb, editOrder as editOrderDb, removeOrder as removeOrderDb } from './lib/database/orders';
import { getLocalClients, getClients, saveLocalClients, addClient as addClientDb, editClient as editClientDb, removeClient as removeClientDb } from './lib/database/clients';
import { getLocalCaja, getCajaStatus, updateCajaStatus, getLocalExtraMovements, getExtraMovements, saveLocalExtraMovements, removeExtraMovement } from './lib/database/caja';
import { getLocalUsers, getUsers, saveLocalUsers, addOrUpdateUser as addOrUpdateUserDb, removeUser as removeUserDb } from './lib/database/users';
import { getLocalCoupons, getCoupons, saveLocalCoupons } from './lib/database/coupons';
import { getLocalStores, getStores, saveLocalStores, addOrUpdateStore } from './lib/database/sucursales';
import { getLocalStoreClosed, getStoreClosed, setStoreClosed, getLocalLogoUrl, getLogoUrl, setLogoUrl as setDbLogoUrl, getLocalPolloStatus, getPolloStatus, setPolloStatus as setDbPolloStatus, getLocalMenuDelDia, getMenuDelDia, setMenuDelDia } from './lib/database/configuracion';
import { getLocalClientAccounts, getClientAccounts, saveLocalClientAccounts, getLocalActiveClient, saveLocalActiveClient, addOrUpdateClientAccount } from './lib/database/clientAccounts';

// Safe localStorage wrapper to prevent QuotaExceededError crashes
try {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    try {
      originalSetItem.call(localStorage, key, value);
    } catch (e) {
      console.error(`localStorage.setItem failed for key "${key}":`, e);
    }
  };
} catch (e) {
  console.error("Failed to override localStorage.setItem:", e);
}

export default function App() {
  // Supabase connection status (no-op while credentials are not set)
  const supabaseStatus = useSupabaseStatus();

  // ── Auth state ────────────────────────────────────────────────────────────
  // null  = loading (checking session)
  // false = no session (show LoginScreen)
  // AuthUser = logged in
  const [authUser, setAuthUser] = useState<AuthUser | null | false>(null);
  // Subscribe to Supabase auth changes on mount
  useEffect(() => {
    if (!supabase) {
      setAuthUser(false);
      return;
    }

    // Check existing session first
    getCurrentSession().then(session => {
      if (!session) {
        setAuthUser(false); // no session → show login
      }
    });

    const unsubscribe = subscribeToAuthChanges(user => {
      if (user) {
        setAuthUser(user);
      } else {
        setAuthUser(false);
      }
    });

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthLogin = useCallback((user: AuthUser) => {
    setAuthUser(user);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabaseLogout();
    setAuthUser(false);
    setActiveClient(null);
  }, []);

  const handleClientLogin = useCallback((client: ClientAccount) => {
    setActiveClient(client);
    setAuthUser({
      id: client.id,
      nombre: client.name,
      telefono: client.phone,
      rol: 'Cliente',
      activo: true
    });
  }, []);

  // Derived role purely from auth user
  const currentRole = authUser ? (authUser.rol as Role) : null;

  const [activeTab, setActiveTab] = useState<ActiveTab>('POS');

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    return getLocalProducts();
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    return getLocalOrders();
  });

  const [clients, setClients] = useState<ClientDebt[]>(() => {
    return getLocalClients();
  });

  const [cajaState, setCajaState] = useState<CajaStatus>(() => {
    return getLocalCaja();
  });

  const [menuDelDia, setMenuDelDia] = useState<string>(() => {
    return getLocalMenuDelDia();
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    return getLocalUsers();
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return resolveTheme(loadThemeMode('Administrador')) === 'dark';
  });

  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>(() => {
    return getLocalClientAccounts();
  });

  const [activeClient, setActiveClient] = useState<ClientAccount | null>(() => {
    return getLocalActiveClient();
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    return getLocalCoupons();
  });

  const [stores, setStores] = useState<StoreInfo[]>(() => {
    return getLocalStores();
  });

  const [extraMovements, setExtraMovements] = useState<ExtraMovement[]>(() => {
    return getLocalExtraMovements();
  });

  useEffect(() => {
    saveLocalStores(stores);
  }, [stores]);

  useEffect(() => {
    saveLocalExtraMovements(extraMovements);
    if (supabase && extraMovements.length > 0) {
      const rows = extraMovements.map(m => ({
        id:             m.id,
        type:           m.type,
        concept:        m.concept,
        amount:         m.amount,
        payment_method: m.paymentMethod ?? null,
        timestamp:      m.timestamp,
        client_name:    m.clientName ?? null,
        client_id:      m.clientId ?? null,
        category:       m.category ?? null,
        usuario:        m.usuario ?? null,
        sucursal:       m.sucursal ?? null,
      }));
      supabase.from('caja_movimientos_extra').upsert(rows, { onConflict: 'id' }).then(({ error }) => {
        if (error) console.error('[Supabase Sync] Error al sincronizar movimientos extra:', error.message);
      });
    }
  }, [extraMovements]);


  useEffect(() => {
    if (currentRole) {
      const resolved = resolveTheme(loadThemeMode(currentRole));
      setIsDarkMode(resolved === 'dark');
    }
  }, [currentRole]);

  useEffect(() => {
    if (currentRole) {
      const resolved: 'light' | 'dark' = isDarkMode ? 'dark' : 'light';
      applyThemeToDom(resolved);
      saveThemeMode(currentRole, resolved);
    }
  }, [isDarkMode, currentRole]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const [isStoreClosed, setIsStoreClosed] = useState<boolean>(() => {
    return getLocalStoreClosed();
  });

  useEffect(() => {
    saveLocalClientAccounts(clientAccounts);
    if (supabase && clientAccounts.length > 0) {
      const rows = clientAccounts.map(c => ({
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
      }));
      supabase.from('cuentas_cliente').upsert(rows, { onConflict: 'id' }).then(({ error }) => {
        if (error) console.error('[Sync] Error al sincronizar cuentas de cliente en Supabase:', error.message);
      });
    }
  }, [clientAccounts]);

  useEffect(() => {
    saveLocalActiveClient(activeClient);
  }, [activeClient]);

  useEffect(() => {
    saveLocalCoupons(coupons);
    if (supabase && coupons.length > 0) {
      const rows = coupons.map(c => ({
        id:          c.id,
        code:        c.code,
        nombre:      c.name ?? null,
        type:        c.type,
        value:       c.value,
        client_id:   c.clientId,
        valid_until: c.validUntil,
        active:      c.active !== false,
        used:        c.used,
      }));
      supabase.from('cupones').upsert(rows, { onConflict: 'id' }).then(({ error }) => {
        if (error) console.error('[Supabase Sync] Error al sincronizar cupones:', error.message);
      });
    }
  }, [coupons]);

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return getLocalLogoUrl();
  });

  const [polloStatus, setPolloStatus] = useState<{ pierna: boolean; muslo: boolean }>(() => {
    return getLocalPolloStatus();
  });

  useEffect(() => {
    setDbPolloStatus(polloStatus);
  }, [polloStatus]);


  useEffect(() => {
    setStoreClosed(isStoreClosed);
  }, [isStoreClosed]);

  useEffect(() => {
    setDbLogoUrl(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    saveLocalProducts(products);
  }, [products]);

  useEffect(() => {
    saveLocalOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveLocalClients(clients);
  }, [clients]);

  useEffect(() => {
    updateCajaStatus(cajaState);
  }, [cajaState]);

  useEffect(() => {
    setMenuDelDia(menuDelDia);
  }, [menuDelDia]);

  useEffect(() => {
    saveLocalUsers(users);
  }, [users]);

  // ── Fase 5: Cargar productos desde Supabase al montar ────────────────────
  // localStorage actúa como caché de arranque (ya está cargado en useState).
  // Supabase reemplaza el catálogo local SOLO si contiene todos los IDs locales.
  // Si Supabase devuelve un set parcial, se conserva localStorage y se avisa.
  useEffect(() => {
    // Procesar cualquier operación offline pendiente antes de consultar los catálogos de Supabase
    processQueue()
      .then(() => {
        // [COMENTARIO MIGRACIÓN: Productos]
        // Aquí comienza el flujo de consulta híbrida de catálogo de productos.
        getProducts()
          .then(dbProducts => {
            if (dbProducts && dbProducts.length > 0) {
              setProducts(dbProducts);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar productos:', err));

        // [COMENTARIO MIGRACIÓN: Pedidos]
        // Aquí se inicia la consulta híbrida del historial de órdenes y ventas.
        getOrders()
          .then(dbOrders => {
            if (dbOrders && dbOrders.length > 0) {
              setOrders(dbOrders);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar pedidos:', err));

        // [COMENTARIO MIGRACIÓN: Clientes]
        // [COMENTARIO MIGRACIÓN: Créditos]
        // Aquí se consultan las cuentas de crédito de los clientes y sus respectivos movimientos históricos.
        getClients()
          .then(dbClients => {
            if (dbClients && dbClients.length > 0) {
              setClients(dbClients);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar clientes:', err));

        // [COMENTARIO MIGRACIÓN: Caja]
        // Aquí se recupera el balance del fondo de caja actual y los cierres diarios.
        getCajaStatus()
          .then(dbCaja => {
            if (dbCaja) {
              setCajaState(dbCaja);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar estado de caja:', err));

        // [COMENTARIO MIGRACIÓN: Usuarios]
        // Aquí se cargan y sincronizan los perfiles de los usuarios y empleados internos del POS.
        getUsers()
          .then(dbUsers => {
            if (dbUsers && dbUsers.length > 0) {
              setUsers(dbUsers);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar usuarios:', err));

        // [COMENTARIO MIGRACIÓN: Cupones]
        // Sincronización del catálogo de cupones de descuento activos para clientes.
        getCoupons()
          .then(dbCoupons => {
            if (dbCoupons && dbCoupons.length > 0) {
              setCoupons(dbCoupons);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar cupones:', err));

        // [COMENTARIO MIGRACIÓN: Portal Cliente]
        // Sincronización de las cuentas registradas en el portal de autoservicio de clientes.
        getClientAccounts()
          .then(dbAccounts => {
            if (dbAccounts && dbAccounts.length > 0) {
              setClientAccounts(dbAccounts);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar cuentas de clientes:', err));

        // [COMENTARIO MIGRACIÓN: Movimientos Extra Caja]
        getExtraMovements()
          .then(dbMovs => {
            if (dbMovs && dbMovs.length > 0) {
              setExtraMovements(dbMovs);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar movimientos extra de caja:', err));

        // Sincronización de sucursales activas
        getStores()
          .then(dbStores => {
            if (dbStores && dbStores.length > 0) {
              setStores(dbStores);
            }
          })
          .catch(err => console.warn('[HybridDB] Error al cargar sucursales:', err));

        // [COMENTARIO MIGRACIÓN: Configuración]
        // Carga inicial híbrida de parámetros generales del sistema.
        getStoreClosed().then(closed => setIsStoreClosed(closed));
        getLogoUrl().then(url => setLogoUrl(url));
        getPolloStatus().then(status => setPolloStatus(status));
        getMenuDelDia().then(menu => setMenuDelDia(menu));
      })
      .catch(err => console.warn('[OfflineQueue] Error al procesar la cola inicial:', err));
  }, []);

  // Handle Automatic Redirections when roles change
  useEffect(() => {
    if (currentRole === 'Empleado' && !['POS', 'Cocina', 'Caja', 'Cuenta'].includes(activeTab)) {
      setActiveTab('POS');
    } else if (currentRole === 'Repartidor' && !['Dashboard', 'POS', 'Cocina', 'Entregas', 'Caja', 'Créditos', 'Cuenta'].includes(activeTab)) {
      setActiveTab('Entregas');
    }
  }, [currentRole]);

  // RESET / REFRESH ALL HANDLER (Hard reset button in header)
  const handleHardReset = () => {
    if (confirm('¿Deseas restablecer todos los datos iniciales de Rinconcito Frutal? Se perderán las ventas del día registradas.')) {
      localStorage.removeItem('rf_products');
      localStorage.removeItem('rf_orders');
      localStorage.removeItem('rf_clients');
      localStorage.removeItem('rf_caja');
      localStorage.removeItem('rf_menu');
      localStorage.removeItem('rf_users');
      localStorage.removeItem('rf_stores');
      localStorage.removeItem('rf_coupons');

      setProducts(INITIAL_PRODUCTS);
      setOrders(INITIAL_ORDERS);
      setClients(INITIAL_CLIENTS);
      setCajaState(INITIAL_CAJA);
      setStores(INITIAL_STORES);
      setCoupons([]);
      setMenuDelDia('🍹 Licuado de Fresa Especial con Leche de Coco\n🥗 Escamocha de Frutas Mixtas con yogurt natural y miel de agave\n🥪 Club Sandwich Rinconcito acompañado de papas adobadas crujientes');
      setUsers([
        { id: 'usr-1', name: 'Administrador Principal', phone: '5511223344', username: 'admin', role: 'Administrador', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
        { id: 'usr-2', name: 'Juan Pérez', phone: '5566778899', username: 'juan', role: 'Empleado', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
        { id: 'usr-3', name: 'Sofía Castro', phone: '5522334455', username: 'sofia', role: 'Repartidor', registeredAt: new Date('2026-06-19T12:00:00Z').toISOString() },
      ]);
      setActiveTab('Dashboard');
      alert('¡Datos restablecidos con éxito!');
    }
  };

  // State transaction actions
  const addOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    addOrderDb(newOrder).catch(err => {
      console.error('[Supabase Sync] Error al insertar pedido en Supabase:', err);
    });

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
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, status: newStatus };
        editOrderDb(updated).catch(err => {
          console.error('[Supabase Sync] Error al actualizar estado del pedido:', err);
        });
        return updated;
      }
      return o;
    }));
  };

  // Cancelar un pedido en cocina
  // Cancelar un pedido en cocina y eliminarlo del estado
  const cancelOrder = (orderId: string, reason: string) => {
    // Encontrar el pedido a cancelar
    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    // Ajustar métricas de caja si el pedido estaba pagado
    if (orderToCancel.paymentStatus === 'Pagado') {
      setCajaState(prev => ({
        ...prev,
        ventasDelDia: Math.max(0, prev.ventasDelDia - orderToCancel.total),
        pedidosPagados: Math.max(0, prev.pedidosPagados - 1)
      }));
    }

    // Ajustar crédito del cliente si corresponde
    if (orderToCancel.paymentStatus === 'Crédito' && orderToCancel.clientId) {
      updateClientBalanceDirect(
        orderToCancel.clientId,
        -orderToCancel.total,
        `Cancelación Pedido ${orderToCancel.id}: ${reason}`,
        'Ajuste'
      );
    }

    // Eliminar el pedido del estado global y base de datos
    setOrders(prev => prev.filter(o => o.id !== orderId));
    removeOrderDb(orderId).catch(err => {
      console.error('[Supabase Sync] Error al eliminar pedido cancelado:', err);
    });
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

    // 3. Reemplazar comanda en el listado y base de datos
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    editOrderDb(updatedOrder).catch(err => {
      console.error('[Supabase Sync] Error al actualizar pedido editado:', err);
    });

    // 4. Limpiar estado de edición y regresar
    setEditingOrder(null);
    setActiveTab('Caja');
    alert(`Se guardaron exitosamente los cambios en el Pedido ${updatedOrder.id}.`);
  };

  // ─── SINGLE SOURCE OF TRUTH: getOrCreateClientDebt ───────────────────────
  // This is the ONLY function authorized to create or retrieve credit profiles.
  // It looks up by clientId, then phone, then name. If found it patches any
  // updated fields (name / phone / branch) to keep the record fresh without
  // losing history. If not found it creates exactly one new profile.
  const getOrCreateClientDebt = (
    clientId?: string,
    clientName?: string,
    clientPhone?: string,
    clientBranch?: string
  ): ClientDebt | null => {
    // Normalise the clean name (strip parenthesised suffixes)
    const cleanName = (clientName || '').replace(/\s*\([^)]*\)/g, '').trim();

    // Enrich from clientAccounts when available
    let resolvedName = cleanName;
    let resolvedPhone = clientPhone || 'Sin teléfono';
    let resolvedBranch = clientBranch || 'Station #1 - Central';
    let resolvedId = clientId || '';

    if (clientAccounts) {
      const account = clientAccounts.find(acc =>
        (clientId && (acc.id === clientId || acc.phone === clientId)) ||
        (clientPhone && acc.phone === clientPhone) ||
        (cleanName && acc.name.toLowerCase().trim() === cleanName.toLowerCase())
      );
      if (account) {
        if (account.name) resolvedName = account.name;
        if (account.phone) resolvedPhone = account.phone;
        if (account.defaultStore) resolvedBranch = account.defaultStore;
        if (account.id) resolvedId = account.id;
      }
    }

    // Search synchronously in the current React state array `clients`
    let existing: ClientDebt | undefined;

    // 1. Match by id
    if (resolvedId) {
      existing = clients.find(c => c.id === resolvedId || c.id === clientId);
    }
    // 2. Match by phone
    if (!existing && resolvedPhone && resolvedPhone !== 'Sin teléfono') {
      existing = clients.find(c => c.phone === resolvedPhone);
    }
    // 3. Match by clientId stored as phone field
    if (!existing && clientId) {
      existing = clients.find(c => c.phone === clientId || c.id === clientId);
    }
    // 4. Match by name
    if (!existing && resolvedName) {
      existing = clients.find(
        c => c.name.toLowerCase().trim() === resolvedName.toLowerCase()
      );
    }

    if (existing) {
      // Patch outdated fields while keeping history intact
      const needsPatch =
        (resolvedName && existing.name !== resolvedName) ||
        (resolvedPhone && resolvedPhone !== 'Sin teléfono' && existing.phone !== resolvedPhone) ||
        (resolvedBranch && resolvedBranch !== 'Station #1 - Central' && existing.branch !== resolvedBranch);

      if (!needsPatch) return existing;

      const patched = {
        ...existing,
        name: resolvedName || existing.name,
        phone: resolvedPhone !== 'Sin teléfono' ? resolvedPhone : existing.phone,
        branch: resolvedBranch !== 'Station #1 - Central' ? resolvedBranch : existing.branch
      };

      setClients(prev => prev.map(c => c.id === patched.id ? patched : c));
      editClientDb(patched).catch(err => {
        console.error('[Supabase Sync] Error al actualizar cliente en Supabase:', err);
      });
      return patched;
    }

    // Not found → create exactly one new profile
    const newId = resolvedId || `CRED-${Math.floor(1000 + Math.random() * 9000)}`;
    const newClient: ClientDebt = {
      id: newId,
      name: resolvedName || 'Cliente',
      phone: resolvedPhone,
      branch: resolvedBranch,
      balance: 0,
      daysOverdue: 0,
      lastMovement: 'Cuenta creada automáticamente',
      pedidosPendientes: 0,
      status: 'Activa',
      history: []
    };

    setClients(prev => [newClient, ...prev]);
    addClientDb(newClient).catch(err => {
      console.error('[Supabase Sync] Error al insertar cliente en Supabase:', err);
    });

    return newClient;
  };

  // Deliver and Settle Payment at delivery hub (Entregas Panel)
  const deliverAndSettleOrder = (
    orderId: string,
    paymentMethod: 'Efectivo' | 'Tarjeta' | 'Crédito' | 'Pendiente',
    clientId?: string
  ) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    let resolvedClientId = clientId;

    if (paymentMethod === 'Crédito' && clientId) {
      // Ensure we always use (or create) the canonical credit profile
      const debt = getOrCreateClientDebt(
        clientId,
        targetOrder.clientName,
        undefined,
        undefined
      );
      resolvedClientId = debt?.id ?? clientId;
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = {
          ...o,
          status: 'Entregado',
          paymentStatus:
            paymentMethod === 'Pendiente' ? 'Pendiente' :
              paymentMethod === 'Crédito' ? 'Crédito' : 'Pagado',
          paymentMethod,
          clientId: paymentMethod === 'Crédito' ? resolvedClientId : undefined
        };
        editOrderDb(updated).catch(err => {
          console.error('[Supabase Sync] Error al actualizar pedido entregado en Supabase:', err);
        });
        return updated;
      }
      return o;
    }));

    if (paymentMethod === 'Crédito' && resolvedClientId) {
      updateClientBalanceDirect(
        resolvedClientId,
        targetOrder.total,
        `Entregas: Despachado Pedido ${targetOrder.id}`,
        'Pedido'
      );
    } else if (paymentMethod !== 'Pendiente') {
      setCajaState(prev => ({
        ...prev,
        ventasDelDia: prev.ventasDelDia + targetOrder.total,
        pedidosPagados: prev.pedidosPagados + 1
      }));
    }
  };

  // Settle non-paid pending orders from Caja list to a Credit Client
  const settlePendingOrderToCredit = (orderId: string, clientId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    // Resolve (or create) the canonical credit profile via the single helper
    const debt = getOrCreateClientDebt(
      clientId,
      targetOrder.clientName,
      undefined,
      undefined
    );
    const resolvedClientId = debt?.id ?? clientId;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = {
          ...o,
          paymentStatus: 'Crédito',
          paymentMethod: 'Crédito',
          clientId: resolvedClientId
        };
        editOrderDb(updated).catch(err => {
          console.error('[Supabase Sync] Error al traspasar pedido a crédito en Supabase:', err);
        });
        return updated;
      }
      return o;
    }));

    updateClientBalanceDirect(
      resolvedClientId,
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

        const updated = {
          ...o,
          paymentStatus: 'Pagado',
          paymentMethod: paymentMethod,
          mixedPayment: mixedPaymentDetail,
          notes: newNotes
        };
        editOrderDb(updated).catch(err => {
          console.error('[Supabase Sync] Error al liquidar pedido en Supabase:', err);
        });
        return updated;
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
        const finalStatus = customStatus || (isNowSettlePaid ? 'Pagada' : 'Activa');

        const updated = {
          ...client,
          balance: newBalance,
          lastMovement: `${dateLabel} (${moveType})`,
          status: finalStatus as any,
          paidAt: isNowSettlePaid ? new Date().toISOString() : undefined,
          daysOverdue: isNowSettlePaid ? 0 : client.daysOverdue,
          pedidosPendientes: moveType === 'Pedido' ? client.pedidosPendientes + 1 : Math.max(0, client.pedidosPendientes - 1),
          history: [historyItem, ...client.history]
        };

        editClientDb(updated).catch(err => {
          console.error('[Supabase Sync] Error al actualizar cliente/crédito en Supabase:', err);
        });

        return updated;
      }
      return client;
    }));
  };

  // Immediate Client Deletion
  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    removeClientDb(clientId).catch(err => {
      console.error('[Supabase Sync] Error al eliminar cliente de Supabase:', err);
    });
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
    const listExtra = reportDetails?.gastosRetiros || [];
    const totalGastos = listExtra.filter(m => m.type === 'Gasto').reduce((sum, m) => sum + m.amount, 0);
    const totalEntregado = listExtra.filter(m => m.type === 'Entrega').reduce((sum, m) => sum + m.amount, 0);

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
      gastosRetiros: listExtra,
      gastos: totalGastos,
      creditos: reportDetails?.creditosOtorgados || 0,
      efectivo: reportDetails?.efectivoFinal || 0,
      dineroEntregado: totalEntregado || cajaState.dineroEntregadoALider
    };

    setCajaState(prev => ({
      ...prev,
      ventasDelDia: 0.00,
      pedidosPagados: 0,
      dineroEntregadoALider: 0.00,
      fondoCaja: 0.00,
      historialCierres: [backupCorte, ...prev.historialCierres]
    }));

    // Reset daily operation counters by clearing orders list
    setOrders([]);
  };

  // Catalog methods
  // Escritura: localStorage únicamente (vía React state + useEffect).
  // Supabase Auth no está implementado aún: las operaciones de escritura
  // en Supabase requieren rol `authenticated`. Se activarán en la fase de Auth.
  const addProductToCatalog = (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);
    addProduct(newProd).catch(err => {
      console.error('[Supabase Sync] Error al insertar producto en Supabase:', err);
    });
  };

  const updateProductInCatalog = (updatedProd: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
    editProduct(updatedProd).catch(err => {
      console.error('[Supabase Sync] Error al actualizar producto en Supabase:', err);
    });
  };

  const deleteProductFromCatalog = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    removeProduct(productId).catch(err => {
      console.error('[Supabase Sync] Error al eliminar producto en Supabase:', err);
    });
  };

  // Store Catalog methods
  const handleAddStore = (newStore: StoreInfo) => {
    setStores(prev => [...prev, newStore].sort((a, b) => a.order - b.order));
    addOrUpdateStore(newStore).catch(err => {
      console.error('[Supabase Sync] Error al insertar sucursal en Supabase:', err);
    });
  };

  const handleUpdateStore = (updated: StoreInfo) => {
    setStores(prev => prev.map(s => s.id === updated.id ? updated : s).sort((a, b) => a.order - b.order));
    addOrUpdateStore(updated).catch(err => {
      console.error('[Supabase Sync] Error al actualizar sucursal en Supabase:', err);
    });
  };

  const handleDeleteStore = (storeId: string) => {
    setStores(prev => {
      const updated = prev.filter(s => s.id !== storeId);
      saveLocalStores(updated);
      return updated;
    });
    if (supabase) {
      supabase.from('sucursales').delete().eq('id', storeId).then(({ error }) => {
        if (error) console.error('[Supabase Sync] Error al eliminar sucursal en Supabase:', error.message);
      });
    }
  };

  const handleReorderStores = (newStores: StoreInfo[]) => {
    const ordered = newStores.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStores(ordered);
    saveLocalStores(ordered);
    if (supabase) {
      const rows = ordered.map(s => ({
        id:     s.id,
        nombre: s.name,
        image:  s.image ?? null,
        orden:  s.order,
        active: s.active,
      }));
      supabase.from('sucursales').upsert(rows, { onConflict: 'id' }).then(({ error }) => {
        if (error) console.error('[Supabase Sync] Error al reordenar sucursales en Supabase:', error.message);
      });
    }
  };


  const handleDeleteExtraMovement = (id: string) => {
    removeExtraMovement(id).catch(err => {
      console.error('[Supabase Sync] Error al eliminar movimiento extra en Supabase:', err);
    });
  };


  // User Accounts
  const handleAddUser = (newUser: UserAccount) => {
    setUsers(prev => [newUser, ...prev]);
    addOrUpdateUserDb(newUser).catch(err => {
      console.error('[Supabase Sync] Error al guardar usuario en Supabase:', err);
    });
  };

  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, role: newRole } : u);
      const target = updated.find(u => u.id === userId);
      if (target) {
        addOrUpdateUserDb(target).catch(err => {
          console.error('[Supabase Sync] Error al actualizar rol de usuario en Supabase:', err);
        });
      }
      return updated;
    });
  };

  const handleUpdateUserAvatar = (userId: string, avatarUrl: string) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, avatarUrl } : u);
      const target = updated.find(u => u.id === userId);
      if (target) {
        addOrUpdateUserDb(target).catch(err => {
          console.error('[Supabase Sync] Error al actualizar avatar de usuario en Supabase:', err);
        });
      }
      return updated;
    });
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addOrUpdateUserDb(updatedUser).catch(err => {
      console.error('[Supabase Sync] Error al actualizar usuario en Supabase:', err);
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    removeUserDb(userId).catch(err => {
      console.error('[Supabase Sync] Error al eliminar usuario en Supabase:', err);
    });
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

  // Initial auth guard blocker removed to allow direct POS access.
  // Supabase auth checking operates silently in the background.

  if (currentRole === 'Cliente') {
    return (
      <ClientPanel
        products={products}
        isStoreClosed={isStoreClosed}
        menuDelDia={menuDelDia}
        logoUrl={logoUrl}
        clients={clients}
        onAddClient={(c) => { getOrCreateClientDebt(c.id, c.name, c.phone, c.branch); }}
        orders={orders}
        onAddOrder={addOrder}
        coupons={coupons}
        setCoupons={setCoupons}
        clientAccounts={clientAccounts}
        setClientAccounts={setClientAccounts}
        activeClient={activeClient}
        setActiveClient={setActiveClient}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onExit={() => setCurrentRole('Administrador')}
        stores={stores}
        polloStatus={polloStatus}
      />
    );
  }

  if (!authUser || !currentRole) {
    return (
      <LoginScreen 
        onLogin={handleAuthLogin}
        clientAccounts={clientAccounts}
        onClientLogin={handleClientLogin}
        onAddClientAccount={addOrUpdateClientAccount}
      />
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col pb-24 transition-colors">
      {/* Top operational bar */}
      <Header
        currentRole={currentRole}
        onRefreshAll={handleHardReset}
        activeTab={activeTab}
        users={users}
        isStoreClosed={isStoreClosed}
        logoUrl={logoUrl}
        onNavigateToProfile={() => setActiveTab('Cuenta')}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        supabaseStatus={supabaseStatus}
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
                onAddClient={(c) => { getOrCreateClientDebt(c.id, c.name, c.phone, c.branch); }}
                isStoreClosed={isStoreClosed}
                editingOrder={editingOrder}
                onSaveEditedOrder={handleSaveEditedOrder}
                onCancelEdit={() => { setEditingOrder(null); setActiveTab('Caja'); }}
                stores={stores}
                polloStatus={polloStatus}
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
                onAddClient={(c) => { getOrCreateClientDebt(c.id, c.name, c.phone, c.branch); }}
                onSettleOrderToCredit={settlePendingOrderToCredit}
                onPayOrderImmediately={(orderId, payMethod, mixedCashAmount) => settlePendingOrderImmediately(orderId, payMethod, mixedCashAmount, activeEmployeeName)}
                onUpdateClientBalance={updateClientBalanceDirect}
                setCajaState={setCajaState}
                setOrders={setOrders}
                onEditOrder={(order) => { setEditingOrder(order); setActiveTab('POS'); }}
                clientAccounts={clientAccounts}
                extraMovements={extraMovements}
                setExtraMovements={setExtraMovements}
                onDeleteExtraMovement={handleDeleteExtraMovement}
              />
            )}

            {activeTab === 'Créditos' && (
              <CreditosPanel
                clients={clients}
                onAddClient={(c) => { getOrCreateClientDebt(c.id, c.name, c.phone, c.branch); }}
                onUpdateClientBalance={updateClientBalanceDirect}
                userRole={currentRole}
                onDeleteClient={handleDeleteClient}
                stores={stores}
              />
            )}

            {activeTab === 'Administración' && (
                <div className="space-y-4">
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
                    onToggleClientPOV={() => setCurrentRole('Cliente')}
                    stores={stores}
                    onAddStore={handleAddStore}
                    onUpdateStore={handleUpdateStore}
                    onDeleteStore={handleDeleteStore}
                    onReorderStores={handleReorderStores}
                    polloStatus={polloStatus}
                    onUpdatePolloStatus={setPolloStatus}
                    coupons={coupons}
                    setCoupons={setCoupons}
                    clientAccounts={clientAccounts}
                  />
                </div>
            )}

            {activeTab === 'Cuenta' && (
              <div className="space-y-6">
                <CuentaPanel
                  users={users}
                  onAddUser={handleAddUser}
                  currentRole={currentRole as Role}
                  onUpdateUserAvatar={handleUpdateUserAvatar}
                  onUpdateUser={handleUpdateUser}
                  authUser={authUser}
                />
                
                {supabase && authUser && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 max-w-xl mx-auto space-y-4 shadow-sm font-sans">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-gray-200 dark:border-slate-700 pb-2">
                      🔒 Seguridad Supabase
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                      <div>
                        <p className="text-gray-900 dark:text-slate-200 font-semibold">Sesión activa como: {authUser.nombre}</p>
                        <p className="text-gray-400 dark:text-slate-500">Teléfono: {authUser.telefono} ({authUser.rol})</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="bg-red-650 hover:bg-red-750 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Cerrar Sesión Supabase 🚪
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

