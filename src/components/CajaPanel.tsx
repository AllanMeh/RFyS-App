/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, CajaStatus, Role, ClientDebt, ExtraMovement, ClientAccount } from '../types';
import { getLocalExtraMovements, saveLocalExtraMovements } from '../lib/database/caja';
import { 
  DollarSign, 
  Printer, 
  ArrowUpRight, 
  TrendingUp, 
  Key, 
  Calendar, 
  ShieldCheck, 
  UserCheck, 
  Inbox, 
  Landmark, 
  PiggyBank, 
  CircleCheck, 
  AlertCircle, 
  PlusCircle,
  Coins,
  CreditCard,
  MinusCircle,
  Receipt,
  Trash2,
  Lock,
  Calculator,
  ListOrdered,
  BadgeAlert,
  X
} from 'lucide-react';
import AvatarUploader, { getAvatarForClient } from './AvatarUploader';
import { UserAccount } from '../types';

interface CajaPanelProps {
  orders: Order[];
  cajaState: CajaStatus;
  userRole: Role;
  activeEmployeeName?: string;
  onLeaderRelease: (amount: number) => void;
  onExecuteCorte: (
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
  ) => void;
  clients: ClientDebt[];
  onAddClient: (newClient: ClientDebt) => void;
  onSettleOrderToCredit: (orderId: string, clientId: string) => void;
  onPayOrderImmediately: (orderId: string, paymentMethod: 'Efectivo' | 'Tarjeta' | 'Mixto', mixedCashAmount?: number) => void;
  onUpdateClientBalance?: (clientId: string, amountChange: number, description: string, moveType: 'Pago' | 'Pedido' | 'Ajuste') => void;
  setCajaState?: React.Dispatch<React.SetStateAction<CajaStatus>>;
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
  onEditOrder?: (order: Order) => void;
  extraMovements?: ExtraMovement[];
  setExtraMovements?: React.Dispatch<React.SetStateAction<ExtraMovement[]>>;
  clientAccounts?: ClientAccount[];
  users?: UserAccount[];
  onDeleteExtraMovement?: (id: string) => void;
}

export default function CajaPanel({ 
  orders, 
  cajaState, 
  userRole, 
  activeEmployeeName = 'Cajero',
  onLeaderRelease, 
  onExecuteCorte,
  clients,
  onAddClient,
  onSettleOrderToCredit,
  onPayOrderImmediately,
  onUpdateClientBalance,
  setCajaState,
  setOrders,
  onEditOrder,
  extraMovements: propExtraMovements,
  setExtraMovements: propSetExtraMovements,
  clientAccounts,
  users,
  onDeleteExtraMovement
}: CajaPanelProps) {
  const isCajaAdmin = userRole === 'Administrador';
  const showDineroTeorico = userRole === 'Administrador' || userRole === 'Líder';

  // --- LOCAL PERSISTED MANOEUVRES STATE ---
  const [localExtraMovements, setLocalExtraMovements] = useState<ExtraMovement[]>(() => {
    return getLocalExtraMovements();
  });

  const extraMovements = propExtraMovements !== undefined ? propExtraMovements : localExtraMovements;
  const setExtraMovements = propSetExtraMovements !== undefined ? propSetExtraMovements : setLocalExtraMovements;

  useEffect(() => {
    if (propExtraMovements === undefined) {
      saveLocalExtraMovements(localExtraMovements);
    }
  }, [localExtraMovements, propExtraMovements]);

  // Clean local movements automatically if orders are reset by the app
  useEffect(() => {
    if (orders.length === 0 && cajaState.ventasDelDia === 0 && extraMovements.length > 0) {
      setExtraMovements([]);
    }
  }, [orders, cajaState]);

  // --- ACTIONS STATE FOR FORMS ---
  const [activeActionTab, setActiveActionTab] = useState<'pago' | 'gasto' | 'abono' | 'entrega'>('pago');
  
  // Registrar Entrega params
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [receiverUser, setReceiverUser] = useState<string>('');

  // Registrar Gasto params
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseConcept, setExpenseConcept] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Diversos');

  // Registrar Abono params
  const [selectedAbonoClientId, setSelectedAbonoClientId] = useState<string>('');
  const [abonoAmount, setAbonoAmount] = useState<string>('');
  const [abonoPaymentMethod, setAbonoPaymentMethod] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');

  // Registrar Pago Directo or Order liquidation params
  const [pagoType, setPagoType] = useState<'pedido' | 'directo'>('pedido');
  const [selectedPendingOrderId, setSelectedPendingOrderId] = useState<string>('');
  const [directPagoAmount, setDirectPagoAmount] = useState<string>('');
  const [directPagoConcept, setDirectPagoConcept] = useState<string>('');
  const [directPagoMethod, setDirectPagoMethod] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');

  // Interactive drawer counting
  const [physicalCashCount, setPhysicalCashCount] = useState<string>('');

  // Settle Order into Customer Credit params (modal state)
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<Order | null>(null);
  const [targetClientId, setTargetClientId] = useState<string>('');

  // --- CALCULATING METRICS AUTOMATICALLY ---
  const [sucursalFilter, setSucursalFilter] = useState<'TODAS' | 'TIENDA' | 'PUESTOS'>('TODAS');

  const filteredOrders = orders.filter(o => {
    if (o.status === 'Cancelado') return false;
    if (sucursalFilter === 'TODAS') return true;
    const branch = (o.clientName || '').toUpperCase();
    return branch.includes(sucursalFilter);
  });

  const filteredExtraMovements = extraMovements.filter(m => {
    if (sucursalFilter === 'TODAS') return true;
    const branch = (m.sucursal || '').toUpperCase();
    return branch.includes(sucursalFilter);
  });

  const activeSucursalForCreation = sucursalFilter === 'TODAS' ? 'TIENDA' : sucursalFilter;
  
  // 1. Core Orders today stats
  const activeOrdersForMetrics = filteredOrders.filter(o => o.status !== 'Cancelado');
  const paidOrdersToday = activeOrdersForMetrics.filter(o => o.paymentStatus === 'Pagado');
  const pendingOrdersToday = activeOrdersForMetrics.filter(o => o.paymentStatus === 'Pendiente');
  const creditOrdersToday = activeOrdersForMetrics.filter(o => o.paymentStatus === 'Crédito');

  const ordersPaidSum = paidOrdersToday.reduce((sum, o) => sum + o.total, 0);
  const ordersPendingSum = pendingOrdersToday.reduce((sum, o) => sum + o.total, 0);
  const ordersCreditSum = creditOrdersToday.reduce((sum, o) => sum + o.total, 0);

  // 2. Extra local movements stats
  const extraPagosDirectos = filteredExtraMovements.filter(m => m.type === 'PagoDirecto');
  const extraPagosDirectosSum = extraPagosDirectos.reduce((sum, m) => sum + m.amount, 0);

  const extraAbonos = filteredExtraMovements.filter(m => m.type === 'Abono');
  const extraAbonosSum = extraAbonos.reduce((sum, m) => sum + m.amount, 0);

  const totalExpenses = filteredExtraMovements.filter(m => m.type === 'Gasto').reduce((sum, m) => sum + m.amount, 0);

  // 3. User Requested Metrics to display:
  // - Ventas del día (Total orders generated + standalone registered sales)
  const totalVendidoCalculated = activeOrdersForMetrics.reduce((sum, o) => sum + o.total, 0) + extraPagosDirectosSum;
  
  // - Pedidos pagados
  const totalPedidosPagadosCount = paidOrdersToday.length + extraPagosDirectos.length;
  const totalPedidosPagadosAmount = ordersPaidSum + extraPagosDirectosSum;

  // - Pedidos pendientes
  const totalPedidosPendientesCount = pendingOrdersToday.length;
  const totalPedidosPendientesAmount = ordersPendingSum;

  // - Créditos generados
  const totalCreditosGeneradosCount = creditOrdersToday.length;
  const totalCreditosGeneradosAmount = ordersCreditSum;

  // - Dinero entregado a líder
  const totalDineroEntregado = cajaState.dineroEntregadoALider;

  // --- DETAILED DRAWER CASH ANALYSIS ---
  // Expected physical money inside drawer = Starter fund + cash payments + cash abonos - cash expenses - cash leader transfers
  const startingFund = cajaState.fondoCaja;
  
  // Cash incomes
  const ordersCashIncome = activeOrdersForMetrics.filter(o => o.paymentStatus === 'Pagado' && o.paymentMethod === 'Efectivo').reduce((sum, o) => sum + o.total, 0);
  const extraPagosCashIncome = extraPagosDirectos.filter(m => m.paymentMethod === 'Efectivo').reduce((sum, m) => sum + m.amount, 0);
  const abonosCashIncome = extraAbonos.filter(m => m.paymentMethod === 'Efectivo').reduce((sum, m) => sum + m.amount, 0);
  const totalCashIncome = ordersCashIncome + extraPagosCashIncome + abonosCashIncome;

  // Card incomes (separate from physical drawer cash)
  const ordersCardIncome = activeOrdersForMetrics.filter(o => o.paymentStatus === 'Pagado' && o.paymentMethod === 'Tarjeta').reduce((sum, o) => sum + o.total, 0);
  const extraPagosCardIncome = extraPagosDirectos.filter(m => m.paymentMethod === 'Tarjeta').reduce((sum, m) => sum + m.amount, 0);
  const abonosCardIncome = extraAbonos.filter(m => m.paymentMethod === 'Tarjeta').reduce((sum, m) => sum + m.amount, 0);
  const totalCardIncome = ordersCardIncome + extraPagosCardIncome + abonosCardIncome;

  // Expected Cash inside drawer
  const expectedCashInDrawer = startingFund + totalCashIncome - totalExpenses - totalDineroEntregado;

  // Computation of mismatch (Diferencia)
  const physicalFloat = parseFloat(physicalCashCount) || 0;
  const computedDifference = physicalCashCount.trim() !== '' ? (physicalFloat - expectedCashInDrawer) : null;

  // --- ACTION SUBMISSIONS ---

  // Action: Entregar efectivo a líder
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferAmount <= 0) {
      alert('Ingresa una cantidad mayor a cero.');
      return;
    }
    
    if (transferAmount > expectedCashInDrawer) {
      if (!confirm(`La cantidad ingresada ($${transferAmount}) supera el efectivo estimado disponible en caja ($${expectedCashInDrawer.toFixed(2)}). ¿Deseas solicitarla de todos modos?`)) {
        return;
      }
    }
    
    const timeLabel = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const newPendingDelivery = {
      id: `PEND-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: transferAmount,
      time: timeLabel,
      employee: activeEmployeeName || 'Cajero'
    };

    if (setCajaState) {
      setCajaState(prev => ({
        ...prev,
        entregasPendientesALider: [...(prev.entregasPendientesALider || []), newPendingDelivery]
      }));
      setTransferAmount(0);
      alert(`✅ Solicitud de entrega enviada a la Líder por $${transferAmount.toFixed(2)}. Esperando confirmación.`);
    } else {
      alert('Error: No se pudo enviar la solicitud.');
    }
  };

  const handleAcceptDelivery = (solicitud: { id: string, amount: number, time: string, employee: string }) => {
    if (!setCajaState) return;
    
    setCajaState(prev => ({
      ...prev,
      dineroEntregadoALider: prev.dineroEntregadoALider + solicitud.amount,
      entregasPendientesALider: (prev.entregasPendientesALider || []).filter(s => s.id !== solicitud.id)
    }));

    const newEntrega: ExtraMovement = {
      id: solicitud.id,
      type: 'Entrega',
      concept: `Entrega a Líder: ${activeEmployeeName}`,
      amount: solicitud.amount,
      paymentMethod: 'Efectivo',
      timestamp: new Date().toISOString(),
      usuario: solicitud.employee
    };
    setExtraMovements(prev => [newEntrega, ...prev]);
  };

  const handleRejectDelivery = (id: string) => {
    if (!setCajaState) return;
    setCajaState(prev => ({
      ...prev,
      entregasPendientesALider: (prev.entregasPendientesALider || []).filter(s => s.id !== id)
    }));
  };

  // Action: Registrar Gasto / Egreso de Caja
  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseAmount);
    if (!expenseAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor, ingresa un monto válido.');
      return;
    }
    if (!expenseConcept.trim()) {
      alert('Por favor, ingresa el concepto o motivo del gasto.');
      return;
    }

    const newExpense: ExtraMovement = {
      id: `ext-gasto-${Date.now()}`,
      type: 'Gasto',
      concept: expenseConcept.trim(),
      amount: parsedAmount,
      timestamp: new Date().toISOString(),
      category: expenseCategory,
      usuario: activeEmployeeName,
      sucursal: activeSucursalForCreation
    };

    setExtraMovements(prev => [newExpense, ...prev]);
    setExpenseAmount('');
    setExpenseConcept('');
    alert('Gasto registrado de forma exitosa.');
  };

  // Action: Registrar Abono de Deuda de Cliente
  const handleRegisterAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbonoClientId) {
      alert('Por favor, selecciona un cliente con crédito.');
      return;
    }
    const parsedAmount = parseFloat(abonoAmount);
    if (!abonoAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor, ingresa un importe de abono válido.');
      return;
    }

    const client = clients.find(c => c.id === selectedAbonoClientId);
    if (!client) return;

    if (parsedAmount > client.balance) {
      if (!confirm(`El abono ($${parsedAmount}) supera el saldo insoluto del cliente ($${client.balance.toFixed(2)}). El saldo final será cero. ¿Continuar?`)) {
        return;
      }
    }

    // 1. Deduct debt globally in global state (App.tsx)
    if (onUpdateClientBalance) {
      onUpdateClientBalance(
        selectedAbonoClientId,
        -parsedAmount,
        `Abono de Deuda (Caja) via ${abonoPaymentMethod}`,
        'Pago'
      );
    }

    // 2. Log payment locally in extra movements to feed calculations
    const newAbono: ExtraMovement = {
      id: `ext-abono-${Date.now()}`,
      type: 'Abono',
      concept: `Abono de ${client.name}`,
      amount: parsedAmount,
      paymentMethod: abonoPaymentMethod,
      timestamp: new Date().toISOString(),
      clientName: client.name,
      clientId: client.id,
      usuario: activeEmployeeName,
      sucursal: activeSucursalForCreation
    };

    setExtraMovements(prev => [newAbono, ...prev]);

    // 3. Update global caja register total metrics
    if (setCajaState) {
      setCajaState(prev => ({
        ...prev,
        ventasDelDia: prev.ventasDelDia + parsedAmount
      }));
    }

    setAbonoAmount('');
    setSelectedAbonoClientId('');
    alert(`Abono de $${parsedAmount} para ${client.name} registrado con éxito.`);
  };

  // Action: Registrar Pago (Opciones: Liquidar Pedido Pendiente o Registrar Pago de Venta Rápida)
  const handleRegisterPago = (e: React.FormEvent) => {
    e.preventDefault();

    if (pagoType === 'pedido') {
      if (!selectedPendingOrderId) {
        alert('Por favor, selecciona un pedido pendiente.');
        return;
      }
      
      const order = orders.find(o => o.id === selectedPendingOrderId);
      if (!order) return;

      onPayOrderImmediately(order.id, directPagoMethod);
      setSelectedPendingOrderId('');
      alert(`Pedido ${order.id} liquidado en ${directPagoMethod} con éxito.`);
    } else {
      // Venta Directa o Gasto no previsto
      const parsedAmount = parseFloat(directPagoAmount);
      if (!directPagoAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Por favor, introduce un monto válido.');
        return;
      }
      if (!directPagoConcept.trim()) {
        alert('Por favor, describe el concepto o alimento.');
        return;
      }

      // Add to local registers
      const newDirect: ExtraMovement = {
        id: `ext-pago-${Date.now()}`,
        type: 'PagoDirecto',
        concept: `Venta Rápida: ${directPagoConcept.trim()}`,
        amount: parsedAmount,
        paymentMethod: directPagoMethod,
        timestamp: new Date().toISOString(),
        usuario: activeEmployeeName,
        sucursal: activeSucursalForCreation
      };

      setExtraMovements(prev => [newDirect, ...prev]);

      // Push into general cash operations metrics
      if (setCajaState) {
        setCajaState(prev => ({
          ...prev,
          ventasDelDia: prev.ventasDelDia + parsedAmount,
          pedidosPagados: prev.pedidosPagados + 1
        }));
      }

      setDirectPagoAmount('');
      setDirectPagoConcept('');
      alert('Venta directa registrada y cobrada en el cajón.');
    }
  };

  // CORTE DEFINITIVO BUTTON
  const handleCorteSubmit = () => {
    if (!isCajaAdmin) {
      alert('Solo el rol de Administrador puede realizar cortes de caja definitivos.');
      return;
    }

    const message = computedDifference !== null 
      ? `¿Estás seguro de realizar el corte definitivo de caja del turno?\n\n` +
        `Efectivo Estimado: $${expectedCashInDrawer.toFixed(2)}\n` +
        `Efectivo Físico Contado: $${physicalFloat.toFixed(2)}\n` +
        `Diferencia: ${computedDifference >= 0 ? '+' : ''}$${computedDifference.toFixed(2)}\n\n` +
        `Esto reiniciará el saldo diario para el próximo turno/día.`
      : `¿Estás seguro de realizar el corte definitivo del día de Rinconcito Frutal? Se registrará en el historial permanente.`;

    if (confirm(message)) {
      // Compile detailed closure report stats
      const productCounts: Record<string, number> = {};
      filteredOrders.forEach(o => {
        o.items.forEach(itm => {
          productCounts[itm.product.name] = (productCounts[itm.product.name] || 0) + itm.quantity;
        });
      });

      const topProductos = Object.entries(productCounts)
        .map(([name, val]) => ({ name, quantity: val }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      const categoriesSum = {
        licuadosJugos: 0,
        comida: 0,
        snacks: 0
      };

      filteredOrders.forEach(o => {
        o.items.forEach(itm => {
          const cat = itm.product.category;
          const sub = itm.subtotal;
          if (cat === 'Licuados y Jugos') {
            categoriesSum.licuadosJugos += sub;
          } else if (cat === 'Comida y Snacks') {
            categoriesSum.comida += sub;
          } else if (cat === 'Sabritas y Galletas') {
            categoriesSum.snacks += sub;
          } else {
            categoriesSum.snacks += sub;
          }
        });
      });

      const reportDetails = {
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        ventas: totalVendidoCalculated,
        ventasCategorias: categoriesSum,
        pedidosCorte: filteredOrders.length,
        creditosOtorgados: totalCreditosGeneradosAmount,
        efectivoFinal: physicalCashCount.trim() !== '' ? physicalFloat : expectedCashInDrawer,
        diferencia: computedDifference !== null ? computedDifference : 0,
        topProductos,
        gastosRetiros: filteredExtraMovements.map(m => ({
          ...m,
          usuario: m.usuario || userRole,
          sucursal: m.sucursal || 'Central'
        }))
      };

      onExecuteCorte(userRole, reportDetails);
      
      // Clear manual tracking
      setExtraMovements([]);
      setPhysicalCashCount('');
      alert('¡Corte definitivo completado! El fondo de caja inicial para el próximo turno se ha cuadrado.');
    }
  };

  // Mixed payment modal state
  const [isMixedPaymentModalOpen, setIsMixedPaymentModalOpen] = useState(false);
  const [mixedPaymentCashAmount, setMixedPaymentCashAmount] = useState<string>('');

  const openMixedPaymentModal = (order: Order) => {
    setSelectedPendingOrder(order);
    setMixedPaymentCashAmount('');
    setIsMixedPaymentModalOpen(true);
  };

  const handleMixedPaymentSubmit = () => {
    if (!selectedPendingOrder) return;
    const cashAmount = parseFloat(mixedPaymentCashAmount);
    if (!mixedPaymentCashAmount || isNaN(cashAmount) || cashAmount <= 0) {
      alert("Por favor ingresa un monto válido de efectivo.");
      return;
    }
    if (cashAmount >= selectedPendingOrder.total) {
      alert("El monto en efectivo debe ser menor al total del pedido. En ese caso, liquide todo en efectivo.");
      return;
    }
    
    onPayOrderImmediately(selectedPendingOrder.id, 'Mixto', cashAmount);
    alert(`Pedido ${selectedPendingOrder.id} liquidado en Pago Mixto.\nEfectivo: $${cashAmount.toFixed(2)}\nTarjeta: $${(selectedPendingOrder.total - cashAmount).toFixed(2)}`);
    
    setIsMixedPaymentModalOpen(false);
    setSelectedPendingOrder(null);
  };

  // Traspaso a Crédito modal trigger
  const openDebtSettleModal = (order: Order) => {
    setSelectedPendingOrder(order);
    const cleanName = (order.clientName || '').replace(/\s*\([^)]*\)/g, '').trim();
    
    // First, find if there is an existing credit profile in clients
    let existing = clients.find(c => {
      if (order.clientId && (c.id === order.clientId || c.phone === order.clientId)) {
        return true;
      }
      return false;
    });
    
    // If not found, search in clientAccounts
    if (!existing && clientAccounts) {
      const account = clientAccounts.find(acc => {
        if (order.clientId && (acc.id === order.clientId || acc.phone === order.clientId)) {
          return true;
        }
        return false;
      });
      if (account) {
        existing = clients.find(c => 
          (account.phone && c.phone === account.phone) ||
          (account.id && c.id === account.id)
        );
      }
    }
    
    if (existing) {
      setTargetClientId(existing.id);
    } else {
      setTargetClientId('');
    }
  };

  const handleAutoCreateClient = () => {
    if (!selectedPendingOrder || !selectedPendingOrder.clientName) return;
    const cleanName = selectedPendingOrder.clientName.replace(/\s*\([^)]*\)/g, '').trim();
    if (!cleanName) {
      alert("La orden no tiene un nombre de cliente asignado.");
      return;
    }
    
    // Check if client already exists in clients (ClientDebt)
    let existingDebt = clients.find(c => {
      if (selectedPendingOrder.clientId && (c.id === selectedPendingOrder.clientId || c.phone === selectedPendingOrder.clientId)) {
        return true;
      }
      return false;
    });
    
    // Check if client exists in clientAccounts
    let existingAccount = clientAccounts?.find(acc => {
      if (selectedPendingOrder.clientId && (acc.id === selectedPendingOrder.clientId || acc.phone === selectedPendingOrder.clientId)) {
        return true;
      }
      return false;
    });
    
    if (existingAccount && !existingDebt) {
      existingDebt = clients.find(c => 
        (existingAccount.phone && c.phone === existingAccount.phone) ||
        (existingAccount.id && c.id === existingAccount.id)
      );
    }
    
    // Reuse existing client if matches
    if (existingDebt) {
      setTargetClientId(existingDebt.id);
      alert(`Se reutilizó la cuenta de crédito existente para "${existingDebt.name}".`);
      return;
    }
    
    // Reuse registered info if client is in clientAccounts
    if (existingAccount) {
      const newId = existingAccount.id || `CRED-${Math.floor(1000 + Math.random() * 9000)}`;
      const newClient: ClientDebt = {
        id: newId,
        name: existingAccount.name,
        phone: existingAccount.phone || 'Sin teléfono',
        branch: existingAccount.defaultStore || 'Station #1 - Central',
        balance: 0,
        daysOverdue: 0,
        lastMovement: 'Cuenta abierta por Caja',
        pedidosPendientes: 0,
        status: 'Activa',
        history: []
      };
      onAddClient(newClient);
      setTargetClientId(newId);
      alert(`Se creó una nueva cuenta de crédito utilizando los datos de cliente de "${existingAccount.name}".`);
      return;
    }
    
    // Otherwise, create a new one from scratch (for unregistered customer)
    const newId = `CRED-${Math.floor(1000 + Math.random() * 9000)}`;
    const newClient: ClientDebt = {
      id: newId,
      name: cleanName,
      phone: 'Sin teléfono',
      branch: 'Station #1 - Central',
      balance: 0,
      daysOverdue: 0,
      lastMovement: 'Cuenta abierta por Caja',
      pedidosPendientes: 0,
      status: 'Activa',
      history: []
    };
    
    onAddClient(newClient);
    setTargetClientId(newId);
    alert(`Se creó una nueva cuenta de crédito para "${cleanName}". Ahora puedes transferir el pedido.`);
  };

  const handleConfirmCreditSettle = () => {
    if (!selectedPendingOrder || !targetClientId) {
      alert("Por favor selecciona un cliente de la lista.");
      return;
    }
    onSettleOrderToCredit(selectedPendingOrder.id, targetClientId);
    setSelectedPendingOrder(null);
    setTargetClientId('');
    alert("El pedido ha sido traspasado y cargado en su historial de crédito.");
  };

  const handleDeleteMovement = (id: string, type: string, amount: number) => {
    if (confirm('¿Deseas eliminar este registro manual? Se recalcularán los ingresos y efectivo de caja.')) {
      setExtraMovements(prev => prev.filter(m => m.id !== id));
      if (onDeleteExtraMovement) {
        onDeleteExtraMovement(id);
      }
      
      // If we are reversing a PagoDirecto or Abono, we decrement general sales
      if ((type === 'PagoDirecto' || type === 'Abono') && setCajaState) {
        setCajaState(prev => ({
          ...prev,
          ventasDelDia: Math.max(0, prev.ventasDelDia - amount),
          pedidosPagados: type === 'PagoDirecto' ? Math.max(0, prev.pedidosPagados - 1) : prev.pedidosPagados
        }));
      } else if (type === 'Entrega' && setCajaState) {
        setCajaState(prev => ({
          ...prev,
          dineroEntregadoALider: Math.max(0, prev.dineroEntregadoALider - amount)
        }));
      }
      alert('Movimiento revertido correctamente.');
    }
  };

  // Find standard delivered but unpaid orders (caja pending list)
  const deliveredPendingOrders = filteredOrders.filter(o => o.status === 'Entregado' && o.paymentStatus === 'Pendiente');

  return (
    <div id="caja-panel-container" className="space-y-6">

      {/* ----------------- LÍDER: SOLICITUDES PENDIENTES DE EFECTIVO ----------------- */}
      {(userRole === 'Líder' || userRole === 'Administrador') && cajaState.entregasPendientesALider && cajaState.entregasPendientesALider.length > 0 && (
        <div className="bg-purple-100 border border-purple-200 rounded-3xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-200/50">
            <Landmark className="w-5 h-5 text-purple-700" />
            <h3 className="font-sans font-black text-purple-900 text-sm uppercase">Solicitudes Pendientes de Efectivo ({cajaState.entregasPendientesALider.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cajaState.entregasPendientesALider.map(solicitud => (
              <div key={solicitud.id} className="bg-white border border-purple-200 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                <div>
                  <p className="text-xs font-bold text-gray-900">Enviado por: {solicitud.employee}</p>
                  <p className="text-[10px] text-gray-500 font-semibold">{solicitud.time}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-mono font-black text-lg text-purple-700">${solicitud.amount.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAcceptDelivery(solicitud)}
                      className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                    >
                      Aceptar
                    </button>
                    <button 
                      onClick={() => handleRejectDelivery(solicitud.id)}
                      className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUCURSAL REGISTERED SELECTION FILTERS ----------------- */}
      <div id="sucursal-filter-banner" className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-sans font-black text-gray-901 text-sm tracking-tight flex items-center gap-1.5">
            🏢 Sucursales y Registro de Operación
          </h3>
          <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
            Filtra y visualiza las ventas, cortes, reportes y dinero en caja para cada una de las sucursales.
          </p>
        </div>
        <div className="flex gap-1.5 bg-slate-50 border border-gray-200 p-1.5 rounded-xl self-end sm:self-auto shrink-0 shadow-inner">
          {[
            { value: 'TODAS', label: '🌍 Todas' },
            { value: 'TIENDA', label: '🏠 TIENDA' },
            { value: 'PUESTOS', label: '🎪 PUESTOS' }
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSucursalFilter(opt.value as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sucursalFilter === opt.value
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-gray-650 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* ----------------- METRICS DASHBOARD GRID ----------------- */}
      <div id="caja-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric Card 1: Ventas del Día Total */}
        <div id="metric-ventas-dia" className="bg-[#f2f9ff] dark:bg-blue-950/30 p-4.5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10.5px] font-mono font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Ventas del Día</span>
            <span className="p-1 px-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold font-mono">Total</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-sans font-black text-blue-950 dark:text-blue-300">
              ${totalVendidoCalculated.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1 font-mono">
              Generado entre todos los estados hoy
            </p>
          </div>
        </div>

        {/* Metric Card 2: Pedidos Pagados */}
        <div id="metric-pago-entregado" className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10.5px] font-mono font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Cobrado / Pagados</span>
            <span className="p-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-lg">
              <Coins className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-sans font-black text-emerald-950 dark:text-emerald-300">
              ${totalPedidosPagadosAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>{totalPedidosPagadosCount} transacciones hoy</span>
            </p>
          </div>
        </div>

        {/* Metric Card 3: Pedidos Pendientes */}
        <div id="metric-pendientes-hoy" className="bg-amber-50/70 dark:bg-amber-950/30 p-4.5 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10.5px] font-mono font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Pedidos Pendientes</span>
            <span className="p-1 px-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded text-[10px] font-bold font-mono">Caja</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-sans font-black text-amber-950 dark:text-amber-300">
              ${totalPedidosPendientesAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-mono leading-tight">
              <strong>{totalPedidosPendientesCount}</strong> pendientes de liquidar
            </p>
          </div>
        </div>

        {/* Metric Card 4: Créditos Generados */}
        <div id="metric-creditos-generados" className="bg-rose-50/70 dark:bg-rose-950/30 p-4.5 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10.5px] font-mono font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Créditos Generados</span>
            <span className="p-1 px-2 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 rounded text-[9.5px] font-black font-mono">Fiado Hoy</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-sans font-black text-rose-950 dark:text-rose-300">
              ${totalCreditosGeneradosAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-mono">
              {totalCreditosGeneradosCount} pedidos pasados a saldo deudor
            </p>
          </div>
        </div>

        {/* Metric Card 5: Dinero Entregado a Líder */}
        <div id="metric-dinero-lider" className="bg-purple-50 dark:bg-purple-950/30 p-4.5 rounded-xl border border-purple-200 dark:border-purple-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10.5px] font-mono font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider">Entregado a Líder</span>
            <span className="p-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg">
              <Landmark className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-sans font-black text-purple-950 dark:text-purple-300">
              ${totalDineroEntregado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-mono">
              Efectivo físico retirado de caja
            </p>
          </div>
        </div>

      </div>

      {/* ----------------- INTERACTIVE CONTROL SYSTEM ----------------- */}
      <div id="caja-interactive-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIONS AND PENDING ORDER SETTLEMENTS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ACTION INTERFACE HUB (4 PRIMARY OPERATIONS) */}
          <div id="caja-actions-card" className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center sm:flex-row flex-col gap-2">
              <div>
                <h3 className="font-sans font-black text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>Caja Rinconcito: Panel de Acciones Operativas</span>
                </h3>
                <p className="text-[11.5px] text-slate-400 leading-normal font-sans">
                  Registra ingresos directos, abonos de deuda, gastos diversos y entregas a líder.
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-800 text-amber-300 font-bold p-1.5 px-3.5 rounded border border-slate-700 shrink-0">
                Rol: {userRole}
              </span>
            </div>

            {/* Hub tabs selector */}
            <div className="flex border-b border-gray-200 overflow-x-auto divide-x divide-gray-200 bg-slate-50/50">
              <button
                id="tab-pago"
                onClick={() => setActiveActionTab('pago')}
                className={`flex-1 py-3 px-4 font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-all ${
                  activeActionTab === 'pago' ? 'bg-white text-emerald-800 border-b-2 border-emerald-600' : 'text-gray-600 hover:bg-white/60'
                }`}
              >
                <Coins className="w-4 h-4 shrink-0" />
                <span>💵 Registrar Pago / Venta</span>
              </button>
              
              <button
                id="tab-abono"
                onClick={() => setActiveActionTab('abono')}
                className={`flex-1 py-3 px-4 font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-all ${
                  activeActionTab === 'abono' ? 'bg-white text-blue-800 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-white/60'
                }`}
              >
                <PiggyBank className="w-4 h-4 shrink-0" />
                <span>🏦 Registrar Abono Cliente</span>
              </button>

              <button
                id="tab-gasto"
                onClick={() => setActiveActionTab('gasto')}
                className={`flex-1 py-3 px-4 font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-all ${
                  activeActionTab === 'gasto' ? 'bg-white text-rose-800 border-b-2 border-rose-600' : 'text-gray-600 hover:bg-white/60'
                }`}
              >
                <MinusCircle className="w-4 h-4 shrink-0" />
                <span>🎟️ Registrar Gasto / Egreso</span>
              </button>

              <button
                id="tab-entrega"
                onClick={() => setActiveActionTab('entrega')}
                className={`flex-1 py-3 px-4 font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-all ${
                  activeActionTab === 'entrega' ? 'bg-white text-purple-800 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-white/60'
                }`}
              >
                <Landmark className="w-4 h-4 shrink-0" />
                <span>📤 Retiro a Líder</span>
              </button>
            </div>

            {/* Form Rendering for Selected Active Operation */}
            <div className="p-5">
              
              {/* TAB: REGISTRAR PAGO (Liquidar Pedidos o Venta Directa) */}
              {activeActionTab === 'pago' && (
                <div className="space-y-4">
                  <div className="flex gap-4 border-b border-gray-150 pb-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                      <input 
                        type="radio" 
                        name="pagoMode" 
                        checked={pagoType === 'pedido'} 
                        onChange={() => setPagoType('pedido')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Cobrar Pedido Pendiente</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                      <input 
                        type="radio" 
                        name="pagoMode" 
                        checked={pagoType === 'directo'} 
                        onChange={() => setPagoType('directo')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Ingreso Directo / Venta Rápida</span>
                    </label>
                  </div>

                  {pagoType === 'pedido' ? (
                    <form onSubmit={handleRegisterPago} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block">Selecciona el pedido pendiente por cobrar:</label>
                        <select
                          id="select-pago-pedido"
                          value={selectedPendingOrderId}
                          onChange={(e) => setSelectedPendingOrderId(e.target.value)}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">-- Elige un pedido del día --</option>
                          {pendingOrdersToday.map(order => (
                            <option key={order.id} value={order.id}>
                              {order.id} - {order.clientName || 'Consumidor Final'} (${order.total.toFixed(2)}) - {[...order.items].map(i => i.product.name).join(', ')}
                            </option>
                          ))}
                        </select>
                        {pendingOrdersToday.length === 0 && (
                          <p className="text-[11px] text-emerald-600 font-mono font-medium">✨ No hay pedidos pendientes de cobro registrados hoy. ¡Caja balanceada!</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Método de Cobro:</label>
                          <div className="flex gap-2">
                            <button
                              id="btn-method-efectivo"
                              type="button"
                              onClick={() => setDirectPagoMethod('Efectivo')}
                              className={`flex-1 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                                directPagoMethod === 'Efectivo' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-400' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <span>💵 Efectivo</span>
                            </button>
                            <button
                              id="btn-method-tarjeta"
                              type="button"
                              onClick={() => setDirectPagoMethod('Tarjeta')}
                              className={`flex-1 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                                directPagoMethod === 'Tarjeta' 
                                  ? 'bg-[#005fb8]/10 text-[#005fb8] border-[#005fb8]/50 ring-1 ring-[#005fb8]/50' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <span>💳 Tarjeta</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-end">
                          <button
                            id="btn-pago-entregar"
                            type="submit"
                            disabled={!selectedPendingOrderId}
                            className={`w-full text-white font-sans font-extrabold text-xs py-2.5 rounded-lg text-center cursor-pointer transition-all active:scale-98 ${
                              selectedPendingOrderId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed dark:text-slate-400'
                            }`}
                          >
                            Registrar Recibo y Cobrar
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleRegisterPago} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Monto a Cobrar ($):</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                            <input 
                              id="input-direct-amount"
                              type="number" 
                              min="0" 
                              step="0.01" 
                              required
                              placeholder="0.00" 
                              value={directPagoAmount}
                              onChange={(e) => setDirectPagoAmount(e.target.value)}
                              className="bg-white text-gray-900 w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Concepto o Alimento:</label>
                          <input 
                            id="input-direct-concept"
                            type="text" 
                            required
                            placeholder="Ej. Consumo Extra barra / Snack ajeno" 
                            value={directPagoConcept}
                            onChange={(e) => setDirectPagoConcept(e.target.value)}
                            className="bg-white text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Forma de Pago:</label>
                          <div className="flex gap-2">
                            <button
                              id="btn-direct-method-efectivo"
                              type="button"
                              onClick={() => setDirectPagoMethod('Efectivo')}
                              className={`flex-1 py-1.5 rounded-md border text-[11px] font-bold ${
                                directPagoMethod === 'Efectivo' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1' 
                                  : 'bg-white text-gray-500 border-gray-200'
                              }`}
                            >
                              💵 Efectivo
                            </button>
                            <button
                              id="btn-direct-method-tarjeta"
                              type="button"
                              onClick={() => setDirectPagoMethod('Tarjeta')}
                              className={`flex-1 py-1.5 rounded-md border text-[11px] font-bold ${
                                directPagoMethod === 'Tarjeta' 
                                  ? 'bg-blue-50 text-blue-800 border-blue-400 ring-1' 
                                  : 'bg-white text-gray-500 border-gray-200'
                              }`}
                            >
                              💳 Tarjeta
                            </button>
                          </div>
                        </div>

                        <div className="flex items-end">
                          <button
                            id="btn-direct-pago-submit"
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-extrabold text-xs py-2.5 rounded-lg text-center cursor-pointer active:scale-98 transition-all"
                          >
                            Registrar Entrada Inmediata
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB: REGISTRAR ABONO (Cobrar parte del crédito de clientes) */}
              {activeActionTab === 'abono' && (
                <form onSubmit={handleRegisterAbono} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Selecciona el Cliente Deudor:</label>
                      <select
                        id="select-abono-client"
                        value={selectedAbonoClientId}
                        onChange={(e) => setSelectedAbonoClientId(e.target.value)}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Elige quién abona --</option>
                        {clients.filter(c => c.balance > 0).map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Por pagar: ${c.balance.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      {clients.filter(c => c.balance > 0).length === 0 && (
                        <p className="text-[11px] text-gray-400 font-mono">No hay deudores activos en el sistema actualmente.</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Monto del Abono ($):</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input 
                          id="input-abono-amount"
                          type="number" 
                          min="0.01" 
                          step="0.01" 
                          required
                          placeholder="Monto a abonar" 
                          value={abonoAmount}
                          onChange={(e) => setAbonoAmount(e.target.value)}
                          className="bg-white text-gray-900 w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Recibido en:</label>
                      <div className="flex gap-2">
                        <button
                          id="btn-abono-method-efectivo"
                          type="button"
                          onClick={() => setAbonoPaymentMethod('Efectivo')}
                          className={`flex-1 py-1.5 rounded-md border text-[11px] font-bold cursor-pointer ${
                            abonoPaymentMethod === 'Efectivo' 
                              ? 'bg-blue-50 text-blue-800 border-blue-400 ring-1' 
                              : 'bg-white text-gray-500 border-gray-200'
                          }`}
                        >
                          💵 Efectivo
                        </button>
                        <button
                          id="btn-abono-method-tarjeta"
                          type="button"
                          onClick={() => setAbonoPaymentMethod('Tarjeta')}
                          className={`flex-1 py-1.5 rounded-md border text-[11px] font-bold cursor-pointer ${
                            abonoPaymentMethod === 'Tarjeta' 
                              ? 'bg-purple-50 text-purple-800 border-purple-400 ring-1' 
                              : 'bg-white text-gray-500 border-gray-200'
                          }`}
                        >
                          💳 Tarjeta
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        id="btn-abono-submit"
                        type="submit"
                        disabled={!selectedAbonoClientId}
                        className={`w-full text-white font-sans font-extrabold text-xs py-2.5 rounded-lg text-center cursor-pointer transition-all active:scale-98 ${
                          selectedAbonoClientId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Registrar Abono Recibido
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB: REGISTRAR GASTO (Salidas/Egresos directos del cajón) */}
              {activeActionTab === 'gasto' && (
                <form onSubmit={handleRegisterExpense} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Importe de Gasto ($):</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input 
                          id="input-expense-amount"
                          type="number" 
                          min="0.01" 
                          step="0.01" 
                          required
                          placeholder="0.00" 
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          className="bg-white text-gray-900 w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Categoría:</label>
                      <select
                        id="select-expense-category"
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="bg-white text-gray-900 w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:border-rose-500 focus:outline-none"
                      >
                        <option value="Suministros">🧊 Suministros (Hielo/Desechables)</option>
                        <option value="Alimentos">🥑 Alimentos (Compras de emergencia)</option>
                        <option value="Servicios">⚡ Servicios / Reparación</option>
                        <option value="Repartos">🏍️ Gastos Reparto / Gasolina</option>
                        <option value="Diversos">📁 Diversos / Caja Chica</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Concepto / Motivo:</label>
                      <input 
                        id="input-expense-concept"
                        type="text" 
                        required
                        placeholder="Ej. Compra 2 bolsas Hielo" 
                        value={expenseConcept}
                        onChange={(e) => setExpenseConcept(e.target.value)}
                        className="bg-white text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      id="btn-expense-submit"
                      type="submit"
                      className="w-full sm:w-auto bg-[#bb171d] hover:bg-rose-900 text-white font-sans font-extrabold text-xs py-2.5 px-6 rounded-lg text-center cursor-pointer active:scale-98 transition-all"
                    >
                      Descontar de Caja y Guardar Gasto
                    </button>
                  </div>
                </form>
              )}

              {/* TAB: RETIRO A LÍDER / ENTREGAS DE EFECTIVO */}
              {activeActionTab === 'entrega' && (
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-150 space-y-1 text-xs text-purple-950">
                    <span className="font-bold flex items-center gap-1.5 text-purple-900">
                      <Landmark className="w-4 h-4" />
                      <span>Retiros parciales de efectivo para resguardo</span>
                    </span>
                    <p className="leading-relaxed text-purple-800">
                      Solicitar retiro de efectivo. El dinero se restará de la caja cuando la Líder reciba y apruebe la solicitud en su perfil.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Importe a Entregar al Líder ($):</label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input 
                        id="input-leader-release-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={transferAmount || ''}
                        onChange={(e) => setTransferAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-white text-gray-900 w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-leader-release-submit"
                    type="submit"
                    className="w-full bg-[#904d00] hover:bg-amber-900 text-white font-sans font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer active:scale-98 transition-all"
                  >
                    <span>Enviar Solicitud a Líder</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

            </div>
          </div>

          {/* LISTA DE PENDIENTES DE COBRO (ENTREGADOS SIN PAGO) */}
          <div id="caja-delivered-pending-list" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-150">
              <div>
                <h3 className="font-sans font-black text-base text-gray-950 flex items-center gap-2">
                  <span className="p-1 px-2.5 rounded-md bg-amber-100 text-amber-800 text-xs font-mono font-black animate-pulse">
                    {deliveredPendingOrders.length}
                  </span>
                  <span>Pedidos Entregados Pendientes de Cobro</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-sans">
                  Pedidos que el repartidor o barista despachó pero cuya cuenta quedó pendiente de liquidar.
                </p>
              </div>
            </div>

            {deliveredPendingOrders.length === 0 ? (
              <div id="alert-no-pending" className="bg-emerald-50 border border-emerald-150 p-4.5 rounded-xl flex items-center gap-3 text-xs text-emerald-800">
                <CircleCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">¡Cuentas al día!</p>
                  <p className="text-emerald-700 font-medium">No existen pedidos terminados/entregados con saldos pendientes por cobrar hoy.</p>
                </div>
              </div>
            ) : (
              <div id="delivered-orders-list" className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {deliveredPendingOrders.map((order) => (
                  <div 
                    key={order.id} 
                    id={`delivered-pending-item-${order.id}`}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:border-amber-300 transition-all hover:bg-slate-100/50"
                  >
                    <div className="flex gap-2.5 items-start">
                      {(() => {
                        const info = getAvatarForClient(order.clientId, order.clientName, clientAccounts, users);
                        return (
                          <AvatarUploader
                            avatar={info.avatar}
                            avatarUrl={info.avatarUrl}
                            name={info.name}
                            size="sm"
                            editable={false}
                          />
                        );
                      })()}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#904d00] bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                            {order.id}
                          </span>
                          <strong className="text-sm text-gray-950 font-sans">
                            {order.clientName || 'Consumidor Final'}
                          </strong>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                          Despachado: {new Date(order.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} • {order.items.length} productos
                        </p>
                        <p className="text-[11.5px] text-rose-800 font-semibold mt-1">
                          Contenido: {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 shrink-0">
                      <div className="text-right sm:mr-1">
                        <span className="text-[10px] text-gray-400 font-mono block">SALDO PENDIENTE:</span>
                        <span className="text-base font-mono font-extrabold text-[#bb171d]">${order.total.toFixed(2)}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          id={`btn-collect-cash-${order.id}`}
                          onClick={() => {
                            onPayOrderImmediately(order.id, 'Efectivo');
                            alert(`Pedido ${order.id} liquidado en Efectivo.`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10.5px] cursor-pointer transition-all active:scale-95"
                        >
                          💵 Efectivo
                        </button>
                        <button
                          id={`btn-collect-card-${order.id}`}
                          onClick={() => {
                            onPayOrderImmediately(order.id, 'Tarjeta');
                            alert(`Pedido ${order.id} liquidado con Tarjeta.`);
                          }}
                          className="bg-[#005fb8] hover:bg-[#004d99] text-white font-bold py-1.5 px-2.5 rounded-lg text-[10.5px] cursor-pointer transition-all active:scale-95"
                        >
                          💳 Tarjeta
                        </button>
                        <button
                          id={`btn-collect-mixed-${order.id}`}
                          onClick={() => openMixedPaymentModal(order)}
                          className="bg-[#006e0a] hover:bg-emerald-900 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10.5px] cursor-pointer transition-all active:scale-95"
                        >
                          💵💳 Mixto
                        </button>
                        <button
                          id={`btn-collect-credit-${order.id}`}
                          onClick={() => openDebtSettleModal(order)}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10.5px] cursor-pointer transition-all active:scale-95"
                        >
                          🏦 Traspasar Crédito
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTORIAL GENERAL DE CAJA DE HOY (TICKET RECONCITO FRUTAL) */}
          <div id="caja-transactions-log" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-sans font-black text-base text-gray-950 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-gray-700" />
              <span>Bitácora de Transacciones y Movimientos de Hoy</span>
            </h3>
            
            <div id="caja-transactions-scroller" className="divide-y divide-gray-150 overflow-y-auto max-h-[350px] pr-1">
              {filteredOrders.length === 0 && filteredExtraMovements.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-mono font-bold">
                  No hay transacciones registradas actualmente en el corte de caja.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Local Extra Movements */}
                  {filteredExtraMovements.map(m => (
                    <div 
                      key={m.id} 
                      id={`extra-movement-item-${m.id}`}
                      className="py-2.5 flex justify-between items-center text-xs border-b border-gray-100 hover:bg-slate-50/50 rounded-lg px-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded ${
                            m.type === 'Gasto' ? 'bg-rose-100 text-rose-800' :
                            m.type === 'Abono' ? 'bg-blue-100 text-blue-800' : 
                            m.type === 'Entrega' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {m.type === 'Entrega' ? 'RETIRO LÍDER' : m.type.toUpperCase()}
                          </span>
                          <span className="font-bold text-gray-900">{m.concept}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          Hora: {new Date(m.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}  
                          {m.paymentMethod ? ` • Cobro: ${m.paymentMethod}` : ''}
                          {m.category ? ` • Cat: ${m.category}` : ''}
                          {m.usuario ? ` • Responsable: ${m.usuario}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-black text-xs ${
                          m.type === 'Gasto' || m.type === 'Entrega' ? 'text-rose-700' : 'text-emerald-700'
                        }`}>
                          {m.type === 'Gasto' || m.type === 'Entrega' ? '-' : '+'}${m.amount.toFixed(2)}
                        </span>
                        <button
                          id={`btn-delete-movement-${m.id}`}
                          onClick={() => handleDeleteMovement(m.id, m.type, m.amount)}
                          className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          title="Deshacer Movimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Orders List */}
                  {filteredOrders.map(order => (
                    <div 
                      key={order.id} 
                      id={`order-log-item-${order.id}`}
                      className="py-2.5 flex justify-between items-center text-xs border-b border-gray-100 hover:bg-slate-50 px-2 rounded-lg"
                    >
                      <div className="flex gap-2.5 items-start">
                        {(() => {
                          const info = getAvatarForClient(order.clientId, order.clientName, clientAccounts, users);
                          return (
                            <AvatarUploader
                              avatar={info.avatar}
                              avatarUrl={info.avatarUrl}
                              name={info.name}
                              size="sm"
                              editable={false}
                            />
                          );
                        })()}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{order.id}</span>
                            <span className="font-bold text-gray-900">{order.clientName || 'Consumidor Final'}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block mt-1">
                            {new Date(order.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} • {order.items.length} productos
                            {order.paymentMethod === 'Mixto' && order.mixedPayment 
                              ? ` • Pago: Mixto (Efe: $${order.mixedPayment.cash.toFixed(2)}, Tar: $${order.mixedPayment.card.toFixed(2)})` 
                              : ` • Pago: ${order.paymentMethod || 'Pendiente'}`
                            }
                          </span>
                          {order.status === 'Pendiente' && onEditOrder && (
                            <button
                              onClick={() => onEditOrder(order)}
                              type="button"
                              className="mt-1.5 bg-amber-50 hover:bg-amber-150 border border-amber-200 text-[#904d00] text-[9.5px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition"
                              title="Editar comanda antes de preparar"
                            >
                              ✏️ Editar Pedido
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-extrabold text-sm block ${
                          order.paymentStatus === 'Pagado' ? 'text-emerald-700' :
                          order.paymentStatus === 'Crédito' ? 'text-purple-700 font-bold' : 'text-[#904d00]'
                        }`}>
                          {order.paymentStatus === 'Pagado' ? '+' : ''}${order.total.toFixed(2)}
                        </span>
                        <span className={`text-[9.5px] font-black block ${
                          order.paymentStatus === 'Pagado' ? 'text-emerald-600' :
                          order.paymentStatus === 'Crédito' ? 'text-purple-600' : 'text-amber-600 animate-pulse'
                        }`}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ----------------- RIGHT COLUMN: CORTE DE CAJA (SUMMARY BOX) ----------------- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* COMPREHENSIVE TICKET & METRICS BOX DETAILED (CORTE DE CAJA) */}
          <div id="corte-de-caja-ticket" className="bg-white border-2 border-dashed border-gray-300 rounded-2xl shadow-sm p-5 space-y-4">
            
            <div className="text-center pb-3 border-b-2 border-dashed border-gray-200">
              <span className="p-1.5 bg-[#bb171d]/10 text-[#bb171d] rounded-lg inline-block mb-1.5">
                <Receipt className="w-6 h-6" />
              </span>
              <h3 className="font-sans font-black text-base uppercase text-gray-950 tracking-tight">Corte de Caja Diario</h3>
              <p className="text-[10.5px] text-gray-400 font-mono leading-relaxed mt-0.5">
                Rinconcito Frutal y Snacks<br />
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* FINANCIAL SUMMARY ITEMS */}
            <div id="ticket-financial-resumen" className="space-y-2 text-xs font-mono">
              <p className="text-[10.5px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-150 pb-1 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                <span>Resumen Operativo</span>
              </p>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600">Total vendido hoje:</span>
                <span className="font-bold text-gray-900">${totalVendidoCalculated.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 px-2 rounded-md">
                <span>Total cobrado (Ingresos):</span>
                <span>+${totalPedidosPagadosAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-[#904d00]">
                <span>Total pendiente:</span>
                <span>${totalPedidosPendientesAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-purple-700">
                <span>Total créditos (Fiados):</span>
                <span>${totalCreditosGeneradosAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-700">
                <span>Gastos / Egresos turno:</span>
                <span>-${totalExpenses.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-slate-700 border-b border-gray-150 pb-2">
                <span>Dinero entregado a líder:</span>
                <span>-${totalDineroEntregado.toFixed(2)}</span>
              </div>
            </div>

            {/* ESTIMATED CASH IN HAND DRAWER CALCULATOR */}
            {showDineroTeorico ? (
              <div id="cash-estimated-box" className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-mono font-bold text-slate-600 block uppercase tracking-wider">Cálculo de Efectivo Estimado:</span>
                
                <div className="space-y-1 text-[11.5px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fondo Inicial de Caja:</span>
                    <span className="font-bold text-gray-800">${startingFund.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cobrado en Efectivo (+):</span>
                    <span className="font-bold text-emerald-700">+${totalCashIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gastos Registrados (-):</span>
                    <span className="font-bold text-rose-700">-${totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Entregado a Líder (-):</span>
                    <span className="font-bold text-orange-700">-${totalDineroEntregado.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-slate-300 pt-2 flex justify-between text-xs font-sans font-black text-gray-900">
                    <span>Efectivo en Caja Estimado:</span>
                    <span className="font-mono text-sm">${expectedCashInDrawer.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Separate Card / Safe reference info */}
                <div className="text-[9.5px] font-mono text-gray-400 border-t border-slate-200 pt-1.5 flex justify-between leading-normal">
                  <span>Cobro con Tarjeta (Banco):</span>
                  <span>${totalCardIncome.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div id="cash-estimated-box-hidden" className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-xs font-sans leading-relaxed text-gray-500 font-semibold shadow-xs">
                🔒 El conteo de caja teórico estimado y los montos totales están restringidos para este rol de trabajo para garantizar auditoría a ciegas.
              </div>
            )}

            {/* REAL-TIME PHYSICAL COUNT INPUT AND MISMATCH DISPLAY */}
            <div id="corte-counting-area" className="space-y-3.5 pt-1 border-t-2 border-dashed border-gray-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">💵 Conteo Físico en Caja ($):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold font-mono text-sm">$</span>
                  <input 
                    id="input-physical-float"
                    type="number"
                    step="0.01"
                    placeholder="Digita el dinero contado en caja"
                    value={physicalCashCount}
                    onChange={(e) => setPhysicalCashCount(e.target.value)}
                    className="bg-white text-gray-950 w-full pl-8 pr-3.5 py-3 border-2 border-gray-300 rounded-xl font-bold font-mono text-base focus:border-[#bb171d] focus:outline-none focus:ring-1 focus:ring-[#bb171d]/20 placeholder:text-gray-300 placeholder:font-sans placeholder:text-xs"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-sans leading-normal">
                  Cuenta los billetes y monedas físicos en la gaveta e introduce el total para cuadrar.
                </p>
              </div>

              {/* MISMATCH VISUAL ALERTS */}
              {showDineroTeorico && computedDifference !== null && (
                <div id="corte-discrepancy-panel" className={`p-3 rounded-xl border text-center font-sans ${
                  Math.abs(computedDifference) < 0.1 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : computedDifference > 0 
                      ? 'bg-blue-50 border-blue-200 text-blue-900' 
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider block">Resultado de Diferencia</span>
                  <p className="text-xl font-mono font-black mt-1">
                    {computedDifference >= 0 ? '+' : ''}${computedDifference.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  
                  <span className="text-xs font-bold block mt-1.5">
                    {Math.abs(computedDifference) < 0.1 && '✨ ¡Caja Cuadrada Perfectamente! No hay faltantes.'}
                    {computedDifference > 0.1 && `📈 ¡Sobrante de Caja! Sobran $${computedDifference.toFixed(2)} respecto al estimado.`}
                    {computedDifference < -0.1 && `⚠️ ¡Faltante de Caja! Hacen falta $${Math.abs(computedDifference).toFixed(2)}.`}
                  </span>
                </div>
              )}
            </div>

            {/* CORTE DE CAJA BUTTONS AND ACCESS CONTROL */}
            <div id="corte-actions-area" className="pt-2">
              {isCajaAdmin ? (
                <button
                  id="btn-execute-corte"
                  onClick={handleCorteSubmit}
                  className="w-full bg-[#bb171d] hover:bg-rose-900 text-white font-sans font-black text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer uppercase tracking-wider hover:shadow-md transition-all active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Realizar Corte Definitivo de Turno</span>
                </button>
              ) : (
                <div id="corte-blocked-info" className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center space-y-1.5">
                  <span className="text-gray-400 font-bold flex items-center justify-center gap-1.5 text-xs">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span>Corte de Turno Bloqueado</span>
                  </span>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    Solo los usuarios con rol de <strong>Administrador</strong> coordinan la ejecución de cierres permanentes en este módulo.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* BRUSH PATTERN DESIGNS / TIPS (Esthetic visual guidelines) */}
          <div id="caja-tips-card" className="bg-[#fcf9f8] dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4.5 rounded-2xl shadow-xs">
            <span className="text-[9.5px] font-mono font-bold uppercase text-amber-800 dark:text-amber-400 tracking-wider flex items-center gap-1">
              <BadgeAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>Notas Operativas de Turnos</span>
            </span>
            <ul className="text-[11px] text-gray-600 dark:text-slate-400 list-disc pl-4 mt-2 space-y-1.5 leading-relaxed font-sans">
              <li>Cada abono registrado disminuye la deuda en la cuenta de crédito del cliente correspondiente en tiempo real.</li>
              <li>Asegúrate de registrar todo gasto menor con su respectiva categoría para evitar diferencias o faltantes al final del día.</li>
              <li>Toda entrega a líder debe descontarse físicamente de la gaveta en el momento en que se declara en la aplicación.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* ----------------- TRASPASAR A CRÉDITO DIALOG MODAL ----------------- */}
      {selectedPendingOrder && (
        <div id="credit-settle-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-150 overflow-hidden transform transition-all">
            <div className="bg-[#bb171d] text-white p-4">
              <h3 className="font-sans font-black text-base flex items-center gap-1.5">
                <Landmark className="w-5 h-5" />
                <span>Traspasar a Crédito de Deudor</span>
              </h3>
              <p className="text-[11px] text-rose-100 mt-1 font-mono">
                Orden ID: {selectedPendingOrder.id} • Importe: ${selectedPendingOrder.total.toFixed(2)}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-rose-900 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Por registrar a nombre de la persona que encargó</span>
                </span>
                <p className="text-rose-800 leading-normal mb-1">
                  Nombre registrado en el pedido original: <strong className="underline decoration-wavy">{selectedPendingOrder.clientName || 'Sin Nombre'}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  1. Seleccionar Cuenta de Crédito de la Lista:
                </label>
                <select
                  id="select-modal-client-target"
                  value={targetClientId}
                  onChange={(e) => setTargetClientId(e.target.value)}
                  className="bg-white text-gray-950 w-full text-xs font-semibold p-3 border border-gray-300 rounded-lg focus:border-rose-500 focus:outline-none"
                >
                  <option value="">-- Elige quién asume esta deuda --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Por pagar actualmente: ${c.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 border-dashed"></div>
                </div>
                <span className="relative bg-white px-2.5 text-[9px] text-gray-400 font-bold uppercase font-mono">¿No está registrado en el padrón?</span>
              </div>

              <div className="space-y-2">
                <button
                  id="btn-modal-create-client"
                  type="button"
                  onClick={handleAutoCreateClient}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-sans font-extrabold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 transition-all hover:border-slate-300"
                >
                  <PlusCircle className="w-4.5 h-4.5 text-[#bb171d]" />
                  <span>Crear nueva cuenta para "{selectedPendingOrder.clientName || 'Sin Nombre'}"</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-2 border-t border-gray-150">
              <button
                id="btn-modal-cancel"
                type="button"
                onClick={() => {
                  setSelectedPendingOrder(null);
                  setTargetClientId('');
                }}
                className="bg-white hover:bg-gray-100 text-gray-700 font-sans font-bold text-xs py-2 px-4 border border-gray-300 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-modal-confirm"
                type="button"
                onClick={handleConfirmCreditSettle}
                disabled={!targetClientId}
                className={`text-white font-sans font-black text-xs py-2 px-5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                  targetClientId ? 'bg-[#bb171d] hover:bg-rose-900' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <span>Confirmar Traspaso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAGO MIXTO */}
      {isMixedPaymentModalOpen && selectedPendingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMixedPaymentModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden animate-fade-in border border-gray-150 flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-sans font-black text-gray-900 text-sm flex items-center gap-1.5 uppercase">
                <span className="text-xl leading-none">💳💵</span> Pago Mixto
              </h3>
              <button 
                onClick={() => setIsMixedPaymentModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100 flex justify-between items-center">
                <span className="text-emerald-900 text-xs font-black">Ticket {selectedPendingOrder.id}</span>
                <span className="text-emerald-700 font-mono font-black text-sm">TOTAL: ${selectedPendingOrder.total.toFixed(2)}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Total recibido en Efectivo:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={mixedPaymentCashAmount}
                    onChange={(e) => setMixedPaymentCashAmount(e.target.value)}
                    className="bg-white text-gray-900 w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-black focus:border-[#006e0a] focus:outline-none focus:ring-1 focus:ring-[#006e0a]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5 opacity-80 cursor-not-allowed">
                <label className="text-[10.5px] font-bold text-gray-500 uppercase block">Restante a cobrar en Tarjeta:</label>
                <div className="bg-gray-100/50 text-gray-700 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-black text-right font-mono">
                  ${Math.max(0, selectedPendingOrder.total - (parseFloat(mixedPaymentCashAmount) || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-2 border-t border-gray-150">
              <button
                type="button"
                onClick={() => setIsMixedPaymentModalOpen(false)}
                className="bg-white hover:bg-gray-100 text-gray-700 font-sans font-bold text-xs py-2 px-4 border border-gray-300 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleMixedPaymentSubmit}
                className="text-white bg-[#006e0a] hover:bg-emerald-900 font-sans font-black text-xs py-2 px-5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>Confirmar Pago Mixto</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
