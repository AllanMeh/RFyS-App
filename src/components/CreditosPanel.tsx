/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClientDebt, Movement, StoreInfo } from '../types';
import { getLocalUsers } from '../lib/database/users';
import { 
  Search, 
  Plus, 
  Clock, 
  ChevronLeft, 
  CalendarCheck, 
  DollarSign, 
  UserPlus, 
  Trash2, 
  Store, 
  CheckSquare, 
  AlertCircle,
  History,
  } from 'lucide-react';

interface CreditosPanelProps {
  clients: ClientDebt[];
  onAddClient: (newClient: ClientDebt) => void;
  onUpdateClientBalance: (clientId: string, amountChange: number, description: string, moveType: 'Pago' | 'Pedido' | 'Ajuste' | 'Liquidación Total' | 'Deuda Eliminada', customUser?: string, customBranch?: string, customStatus?: 'Activa' | 'Pagada' | 'Cerrada' | 'Archivada' | 'Eliminada') => void;
  userRole: string;
  stores: StoreInfo[];
}

export default function CreditosPanel({ 
  clients, 
  onAddClient, 
  onUpdateClientBalance, 
  userRole, 
  stores = []
}: React.PropsWithChildren<CreditosPanelProps>) {
  
  // Tab states for filter
  const [activeStatusTab, setActiveStatusTab] = useState<'Activa' | 'Pagada' | 'Cerrada' | 'Todos' | 'Archivado'>('Activa');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');

  // Modal display states
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showDeleteDebtModal, setShowDeleteDebtModal] = useState(false);
  const [clientToDeleteDebt, setClientToDeleteDebt] = useState<ClientDebt | null>(null);
  const [deleteMotive, setDeleteMotive] = useState('');

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveClient, setArchiveClient] = useState<ClientDebt | null>(null);

  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [liquidationClient, setLiquidationClient] = useState<ClientDebt | null>(null);

  // Form states
  const [newClientForm, setNewClientForm] = useState(() => {
    const activeList = stores.filter(s => s.active);
    return { 
      name: '', 
      phone: '', 
      branch: activeList[0]?.name || 'Mesa (gente que llega al local)', 
      initialBalance: 0,
      observaciones: 'Ficha de crédito inicial'
    };
  });

  useEffect(() => {
    const activeList = stores.filter(s => s.active);
    if (activeList.length > 0) {
      const isCurrentBranchActive = activeList.some(s => s.name === newClientForm.branch);
      if (!isCurrentBranchActive) {
        setNewClientForm(prev => ({ ...prev, branch: activeList[0].name }));
      }
    }
  }, [stores]);
  
  const [actionAmount, setActionAmount] = useState<number>(0);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);

  // Helper date for checking the 3-day paid visibility rule
  // We check relative to current actual time
  const getClientCurrentState = (client: ClientDebt): 'Activa' | 'Pagada' | 'Cerrada' | 'Archivada' | 'Eliminada' => {
    if (client.status === 'Archivada') {
      return 'Archivada';
    }
    if (client.status === 'Eliminada') {
      return 'Eliminada';
    }
    if (client.balance > 0) {
      return 'Activa';
    }
    
    // Explicit closed flag
    if (client.status === 'Cerrada') {
      return 'Cerrada';
    }

    if (client.paidAt) {
      const paidDate = new Date(client.paidAt);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - paidDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays > 3) {
        return 'Cerrada';
      }
      return 'Pagada';
    }

    return 'Pagada';
  };

  // Helper function to calculate time remaining in the "Pagada" state before moving to "Cerrada" (3 days limit)
  const getRemainingPaidTimeText = (client: ClientDebt): string => {
    if (!client.paidAt) return '3 días restantes';
    const paidDate = new Date(client.paidAt);
    const expireDate = new Date(paidDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const currentDate = new Date();
    const diffTime = expireDate.getTime() - currentDate.getTime();
    if (diffTime <= 0) return 'Moviendo a Cerrada...';
    
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      const hours = diffHours % 24;
      return `Quedan ${days}d ${hours}h de visibilidad`;
    }
    return `Quedan ${diffHours}h de visibilidad`;
  };

  // Filter and categorize clients
  const processedClients = clients.map(c => ({
    ...c,
    computedStatus: getClientCurrentState(c)
  }));

  const filteredClients = processedClients.filter(client => {
    const matchesBranch = branchFilter === 'All' || client.branch === branchFilter;
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          client.phone.includes(searchQuery) || 
                          client.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeStatusTab === 'Archivado') {
      return (client.computedStatus === 'Archivada' || client.computedStatus === 'Eliminada') && matchesBranch && matchesSearch;
    } else {
      if (client.computedStatus === 'Archivada' || client.computedStatus === 'Eliminada') {
        return false;
      }
      const matchesStatus = activeStatusTab === 'Todos' || client.computedStatus === activeStatusTab;
      return matchesBranch && matchesSearch && matchesStatus;
    }
  });

  // Calculate high-level stats visible in dashboard header
  const totalOutstandingBalance = processedClients
    .filter(c => c.computedStatus === 'Activa')
    .reduce((sum, c) => sum + c.balance, 0);

  const activeDebtorsCount = processedClients.filter(c => c.computedStatus === 'Activa').length;
  const paidRecentCount = processedClients.filter(c => c.computedStatus === 'Pagada').length;
  const closedCount = processedClients.filter(c => c.computedStatus === 'Cerrada').length;

  const selectedClient = processedClients.find(c => c.id === selectedClientId);

  // HANDLERS
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.name.trim()) {
      alert('Por favor, ingresa el nombre del cliente.');
      return;
    }

    const clientId = `CRED-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const formattedDateLabel = new Date(actionDate + 'T12:00:00')
      .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

    const historyItem: Movement[] = newClientForm.initialBalance > 0 ? [
      {
        id: `mov-${Date.now()}`,
        type: 'Inicial',
        label: 'Saldo inicial consolidado',
        date: formattedDateLabel,
        amount: newClientForm.initialBalance,
        statusLabel: 'SALDO INICIAL',
        notes: newClientForm.observaciones || 'Deuda registrada al crear cliente.'
      }
    ] : [];

    const newClient: ClientDebt = {
      id: clientId,
      name: newClientForm.name,
      phone: newClientForm.phone || 'Sin número',
      branch: newClientForm.branch,
      balance: newClientForm.initialBalance,
      daysOverdue: newClientForm.initialBalance > 0 ? 1 : 0,
      lastMovement: newClientForm.initialBalance > 0 ? `${formattedDateLabel} (Inicial)` : 'Sin movimientos',
      pedidosPendientes: newClientForm.initialBalance > 0 ? 1 : 0,
      status: 'Activa',
      paidAt: undefined,
      history: historyItem
    };

    onAddClient(newClient);
    const activeList = stores.filter(s => s.active);
    setNewClientForm({ 
      name: '', 
      phone: '', 
      branch: activeList[0]?.name || 'Mesa (gente que llega al local)', 
      initialBalance: 0,
      observaciones: 'Ficha de crédito inicial'
    });
    setShowAddClientModal(false);
    alert(`Cliente de crédito registrado con éxito bajo la ID: ${clientId}`);
  };

  const handleRegisterAbonoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || actionAmount <= 0) return;


    // Deduct balance (negative value)
    onUpdateClientBalance(
      selectedClientId, 
      -actionAmount, 
      actionNotes || `Abono de pago registrado`, 
      'Pago'
    );

    alert(`Se ha registrado de manera exitosa un abono de $${actionAmount.toFixed(2)} para ${selectedClient?.name}.`);
    
    // Cleanup
    setActionAmount(0);
    setActionNotes('');
    setShowAbonoModal(false);
  };

  const handleRegisterFullPayment = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.balance <= 0) return;
    setLiquidationClient(client);
    setShowLiquidationModal(true);
  };

  const confirmFullPayment = () => {
    if (!liquidationClient) return;
    
    // Retrieve registered admin name, or current user
    let adminName = 'Personal de Caja';
    try {
      const users = getLocalUsers();
      const activeUser = users.find(u => u.role === userRole);
      if (activeUser) {
        adminName = activeUser.name;
      }
    } catch {}

    const amount = liquidationClient.balance;
    onUpdateClientBalance(
      liquidationClient.id,
      -amount,
      `Liquidación Total de la deuda por $${amount.toFixed(2)}`,
      'Liquidación Total',
      adminName,
      liquidationClient.branch
    );

    alert(`Se ha registrado de manera exitosa la LIQUIDACIÓN TOTAL para ${liquidationClient.name}.`);
    setShowLiquidationModal(false);
    setLiquidationClient(null);
  };

  const handleArchiveClientClick = (client: ClientDebt) => {
    setArchiveClient(client);
    setShowArchiveModal(true);
  };

  const confirmArchiveClient = () => {
    if (!archiveClient) return;

    let adminName = 'Administrador';
    try {
      const users = getLocalUsers();
      const activeUser = users.find(u => u.role === userRole);
      if (activeUser) {
        adminName = activeUser.name;
      }
    } catch {}

    onUpdateClientBalance(
      archiveClient.id,
      0,
      `Cliente Archivado por Administrador`,
      'Ajuste',
      adminName,
      archiveClient.branch,
      'Archivada'
    );

    alert(`Se ha archivado de manera exitosa la ficha de ${archiveClient.name}.`);
    setShowArchiveModal(false);
    setArchiveClient(null);
    setSelectedClientId(null); // Go back to lists if currently on detail view
  };

  const handleDeleteDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToDeleteDebt) return;
    if (!deleteMotive.trim()) {
      alert('Por favor, indica un motivo para eliminar la deuda.');
      return;
    }

    const currentDate = new Date();
    const formattedTime = currentDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    // Retrieve registered admin name
    let adminName = 'Administrador';
    try {
      const users = getLocalUsers();
      const adminUser = users.find(u => u.role === 'Administrador');
      if (adminUser) adminName = adminUser.name;
    } catch {}

    const detailMsg = `Deuda Eliminada | Admin: ${adminName} | Motivo: ${deleteMotive} | Hora: ${formattedTime}`;

    // Zero out the debt
    onUpdateClientBalance(
      clientToDeleteDebt.id, 
      -clientToDeleteDebt.balance, 
      detailMsg, 
      'Deuda Eliminada',
      adminName,
      clientToDeleteDebt.branch,
      'Eliminada'
    );

    alert(`Deuda del cliente ${clientToDeleteDebt.name} eliminada exitosamente.`);
    setShowDeleteDebtModal(false);
    setClientToDeleteDebt(null);
    setDeleteMotive('');
  };

  const handleCreateManualDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || actionAmount <= 0) return;


    // Add balance
    onUpdateClientBalance(
      selectedClientId,
      actionAmount,
      actionNotes || 'Deuda registrada manualmente en almacén',
      'Pedido'
    );

    alert(`Nueva deuda de $${actionAmount.toFixed(2)} cargada correctamente en la ficha de ${selectedClient?.name}.`);
    
    // Cleanup
    setActionAmount(0);
    setActionNotes('');
    setShowDebtModal(false);
  };

  // Simulates passing of 3 days by rewriting paidAt of paid clients further back into the past
  // Excellent for evaluation / demonstration!
  const simulateThreeDaysPassing = (clientId: string) => {
    const target = clients.find(c => c.id === clientId);
    if (!target) return;
    
    // Set paidAt to 4 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 4);
    
    // Modify status to Cerrada directly to reflect simulation
    target.status = 'Cerrada';
    target.paidAt = pastDate.toISOString();
    
    alert(`[Simulación] Se retrocedió la fecha de pago de ${target.name} a hace 4 días. El cliente pasa automáticamente al estado "Cerrada" y se oculta de "Pagadas".`);
    // Force rerender
    setSearchQuery(prev => prev + ' ');
    setTimeout(() => setSearchQuery(prev => prev.trim()), 50);
  };

  return (
    <div id="creditos-main-container" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-950 font-sans">
            Módulo de Créditos y Liquidaciones (Fiados)
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-1">
            Visualiza deudores, gestiona abonos, liquida deudas al instante y consulta el historial completo de transacciones.
          </p>
        </div>
        
        <button
          onClick={() => {
            setActionDate(new Date().toISOString().split('T')[0]);
            setShowAddClientModal(true);
          }}
          className="bg-amber-600 hover:bg-amber-700 active:scale-97 text-white font-sans font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Nuevo Fíado (Deuda)</span>
        </button>
      </div>

      {/* METRIC BOXES SUMMARY CONTROLS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#fff4eb]/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl shadow-xs">
          <span className="text-[9.5px] font-bold font-mono text-amber-900 dark:text-amber-400 tracking-wider block">DEUDA TOTAL PENDIENTE</span>
          <p className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-300 font-mono mt-1">
            ${totalOutstandingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 rounded-xl shadow-xs">
          <span className="text-[9.5px] font-bold font-mono text-rose-800 dark:text-rose-400 tracking-wider block">CLIENTES DEUDORES (ACTIVOS)</span>
          <p className="text-xl sm:text-2xl font-black text-rose-950 dark:text-rose-300 font-mono mt-1">
            {activeDebtorsCount} cuentas
          </p>
        </div>

        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl shadow-xs">
          <span className="text-[9.5px] font-bold font-mono text-[#006e0a] dark:text-emerald-400 tracking-wider block">PAGADOS RECIENTES (3 DÍAS)</span>
          <p className="text-xl sm:text-2xl font-black text-[#004d07] dark:text-emerald-300 mt-1 font-mono">
            {paidRecentCount} liquidados
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-xs">
          <span className="text-[9.5px] font-bold font-mono text-slate-700 dark:text-slate-300 tracking-wider block">CUENTAS ARCHIVADAS (CERRADAS)</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {closedCount} historiales
          </p>
        </div>
      </div>

      {!selectedClientId ? (
        // CLIENT LIST TAB VIEW
        <div className="space-y-4">
          
          {/* CONTROL BAR: FILTERS, SEARCH AND TABS */}
          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm space-y-4">
            
            {/* Status tab selection */}
            <div className="flex border-b border-gray-150 overflow-x-auto gap-1">
              <button
                onClick={() => setActiveStatusTab('Activa')}
                className={`py-2 px-4 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeStatusTab === 'Activa' 
                    ? 'border-red-650 text-red-650 font-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                🔴 Deudas Activas ({activeDebtorsCount})
              </button>
              
              <button
                onClick={() => setActiveStatusTab('Pagada')}
                className={`py-2 px-4 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeStatusTab === 'Pagada' 
                    ? 'border-emerald-600 text-emerald-600 font-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                🟢 Pagadas (Visible 3 Días) ({paidRecentCount})
              </button>

              <button
                onClick={() => setActiveStatusTab('Cerrada')}
                className={`py-2 px-4 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeStatusTab === 'Cerrada' 
                    ? 'border-slate-800 text-slate-805 font-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                🔒 Cerradas (Saldadas +3 Días) ({closedCount})
              </button>

              <button
                onClick={() => setActiveStatusTab('Todos')}
                className={`py-2 px-4 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeStatusTab === 'Todos' 
                    ? 'border-blue-600 text-blue-600 font-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                📋 Todos los Clientes ({clients.filter(c => c.status !== 'Archivada' && c.status !== 'Eliminada').length})
              </button>

              {userRole === 'Administrador' && (
                <button
                  onClick={() => setActiveStatusTab('Archivado')}
                  className={`py-2 px-4 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeStatusTab === 'Archivado' 
                      ? 'border-purple-600 text-purple-650 font-black font-sans' 
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  📁 Créditos Archivados ({processedClients.filter(c => c.computedStatus === 'Archivada' || c.computedStatus === 'Eliminada').length})
                </button>
              )}
            </div>

            {/* Inputs & search bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Buscar por cliente, tienda o teléfono de deudas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-gray-950 pl-10 pr-4 py-2 bg-neutral-50/50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full bg-white text-gray-950 border border-gray-200 p-2 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="All">🏪 Todas las Tiendas</option>
                  {stores.map((st) => (
                    <option key={st.id} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => { setSearchQuery(''); setBranchFilter('All'); }}
                className="md:col-span-2 bg-[#f4f2f1] hover:bg-gray-200 p-2 rounded-xl text-xs font-bold text-gray-700 transition"
              >
                Limpiar Filtros
              </button>
            </div>

          </div>

          {/* MAIN DEBT BOARD / LISTING TABLE */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest font-mono">
                Registros de Cuentas de Crédito {activeStatusTab !== 'Todos' ? `[Estado: ${activeStatusTab}]` : '[Todos]'}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Moastrando {filteredClients.length} cuentas
              </span>
            </div>

            {filteredClients.length === 0 ? (
              <div className="text-center p-12 text-gray-400 text-sm font-sans space-y-2">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                <p>No se encontraron clientes de crédito en la pestaña {activeStatusTab === 'Todos' ? 'actual' : `"${activeStatusTab}"`}.</p>
                <p className="text-xs text-gray-450">Agrega un cliente usando el botón superior "Registrar Nuevo Fíado".</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-150">
                {filteredClients.map((client) => {
                  const lastMovementNotes = client.history && client.history.length > 0 
                    ? client.history[0].notes || client.history[0].label 
                    : 'Sin observaciones registradas';
                  
                  const lastMovementDate = client.history && client.history.length > 0
                    ? client.history[0].date
                    : 'N/A';

                  return (
                    <div 
                      key={client.id}
                      className={`p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-neutral-50/50 transition-all ${
                        client.computedStatus === 'Pagada' ? 'bg-emerald-50/10' : 
                        client.computedStatus === 'Cerrada' ? 'bg-slate-100/40 text-gray-500 opacity-80' : ''
                      }`}
                    >
                      {/* Name, phone, and store information */}
                      <div className="flex gap-3.5 items-start">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black select-none text-xs shrink-0 ${
                          client.computedStatus === 'Activa' ? 'bg-red-50 text-red-700' :
                          client.computedStatus === 'Pagada' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {client.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          {/* 1. NOMBRE */}
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#111] text-sm font-sans">{client.name}</span>
                            <span className="text-[10px] bg-slate-100 font-mono text-gray-500 px-1.5 py-0.5 rounded">ID: {client.id}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 font-sans text-gray-650 mt-1">
                            {/* 2. TIENDA */}
                            <span className="flex items-center gap-1">
                              <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Tienda: <strong>{client.branch}</strong></span>
                            </span>
                            
                            {/* 4. FECHA */}
                            <span className="flex items-center gap-1 font-mono">
                              <CalendarCheck className="w-3.5 h-3.5 text-gray-450 shrink-0" />
                              <span>Fecha: <strong className="text-[#333]">{lastMovementDate}</strong></span>
                            </span>

                            {/* Celular */}
                            <span className="flex items-center gap-1 font-mono">
                              <span>📞 {client.phone}</span>
                            </span>
                          </div>

                          {/* 5. OBSERVACIONES */}
                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 mt-2 max-w-xl text-[11px] leading-relaxed relative">
                            <span className="text-[9px] font-bold text-gray-450 uppercase block font-mono">Observaciones / Motivo Deuda:</span>
                            <span className="text-gray-700 italic block mt-0.5">"{lastMovementNotes}"</span>
                          </div>

                          {/* Display Visbility Rules Remaining for Pagadas */}
                          {client.computedStatus === 'Pagada' && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded font-mono mt-2 shadow-xs">
                              <Clock className="w-3 h-3" />
                              <span>{getRemainingPaidTimeText(client)}</span>
                            </div>
                          )}

                          {client.computedStatus === 'Cerrada' && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 font-bold bg-slate-200 px-2 py-0.5 rounded font-mono mt-2">
                              <span>🔒 Cuenta cerrada definitivamente</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. MONTO PENDIENTE & ACTIONS */}
                      <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-none border-gray-150">
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-gray-400 block uppercase">SALDO PENDIENTE:</span>
                          <span className={`text-lg font-mono font-black ${
                            client.balance > 0 ? 'text-[#904d00]' : 'text-emerald-700'
                          }`}>
                            ${client.balance.toFixed(2)}
                          </span>
                        </div>

                        {/* ACTIONS HUB FOR THIS ROW */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedClientId(client.id)}
                            className="bg-neutral-100 hover:bg-neutral-200 text-gray-700 px-3 py-1.5 p-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                            title="Ver Historial Completo"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Ver Historial</span>
                          </button>

                          {client.computedStatus === 'Activa' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedClientId(client.id);
                                  setShowAbonoModal(true);
                                }}
                                className="bg-[#006e0a] hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs font-sans cursor-pointer"
                              >
                                <span>Abonar</span>
                              </button>

                              <button
                                onClick={() => handleRegisterFullPayment(client.id)}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                Liquidar Pago Completo
                              </button>
                            </>
                          )}

                          {client.computedStatus === 'Pagada' && (
                            <>
                              <button
                                onClick={() => simulateThreeDaysPassing(client.id)}
                                className="bg-purple-100 text-purple-800 hover:bg-purple-150 text-[10px] font-mono font-bold py-1.5 px-2 rounded-lg"
                                title="Acelera el paso del tiempo 3 días para ver archivamiento automático"
                              >
                                🕒 Forzar Archivamiento (Cerrada)
                              </button>
                            </>
                          )}

                          {userRole === 'Administrador' && client.balance === 0 && client.computedStatus !== 'Archivada' && client.computedStatus !== 'Eliminada' && (
                            <button
                              type="button"
                              onClick={() => handleArchiveClientClick(client)}
                              className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer font-sans"
                              title="Archivar Ficha"
                            >
                              <span>🗑 Ocultar Ahora / Archivar</span>
                            </button>
                          )}

                          {userRole === 'Administrador' && client.balance > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setClientToDeleteDebt(client);
                                setDeleteMotive('');
                                setShowDeleteDebtModal(true);
                              }}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-700 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs font-sans cursor-pointer"
                              title="Eliminar deuda de inmediato (Solo Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar deuda inmediatamente</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        
        // CUSTOMER DETAIL VIEW (VER HISTORIAL)
        selectedClient && (
          <div className="space-y-6">
            
            {/* Quick Go Back */}
            <button
              onClick={() => setSelectedClientId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás a la Mesa de Créditos</span>
            </button>

            {/* Profile Folder Box */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 shadow-sm">
              <div className="flex gap-4 items-start sm:items-center">
                <div className="bg-neutral-100 text-[#904d00] text-2xl font-black w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0">
                  🍊
                </div>
                <div>
                  <h3 className="font-sans font-black text-xl text-gray-950 leading-tight">
                    {selectedClient.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5 font-mono">
                    <span>🏪 Sucursal: <strong>{selectedClient.branch}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>📞 Tel: <strong>{selectedClient.phone}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>ID: <strong>{selectedClient.id}</strong></span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black border uppercase relative ${
                      selectedClient.computedStatus === 'Activa' ? 'bg-red-50 text-red-700 border-red-200' :
                      selectedClient.computedStatus === 'Pagada' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {selectedClient.computedStatus === 'Activa' ? '🔴 Ficha Deudora Activa' : 
                       selectedClient.computedStatus === 'Pagada' ? '🟢 Pagada (Visible 3 días)' : '🔒 Cerrada / Archivado'}
                    </span>
                    
                    {selectedClient.computedStatus === 'Pagada' && (
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded font-mono border border-amber-100">
                        {getRemainingPaidTimeText(selectedClient)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Balances detailed frame */}
              <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl flex items-center justify-between gap-8 divide-x divide-amber-250 w-full lg:w-auto">
                <div>
                  <span className="text-[9.5px] font-bold text-gray-500 uppercase block font-mono">DEUDA DE CLIENTE</span>
                  <p className="text-2xl font-black text-amber-950 font-mono mt-0.5">${selectedClient.balance.toFixed(2)}</p>
                </div>
                <div className="pl-6 text-xs text-gray-550 space-y-1 font-mono">
                  <p>Estado Operativo: <strong className={selectedClient.balance > 0 ? "text-red-700" : "text-emerald-700"}>
                    {selectedClient.balance > 0 ? 'Con deudas' : 'Sin pendientes'}
                  </strong></p>
                  <p>Consumos totales: <strong className="text-gray-900">{selectedClient.history.length} movimientos</strong></p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE COMPREHENSIVE HUB OF ACTIONS */}
            {selectedClient.computedStatus === 'Archivada' || selectedClient.computedStatus === 'Eliminada' ? (
              <div className="bg-purple-100 border border-purple-200 p-4 rounded-xl text-purple-800 text-xs text-center font-bold font-sans">
                Este cliente está archivado. Consulta y búsqueda habilitadas para fines de auditoría; todas las operaciones financieras están bloqueadas.
              </div>
            ) : (
              <div className="space-y-3">
                <div id="client-actions-grid" className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  <button
                    onClick={() => {
                      if (selectedClient.balance === 0) {
                        alert('Este cliente no posee ninguna deuda pendiente por saldar.');
                        return;
                      }
                      setActionDate(new Date().toISOString().split('T')[0]);
                      setActionAmount(selectedClient.balance);
                      setActionNotes('Abono para liquidar balance');
                      setShowAbonoModal(true);
                    }}
                    disabled={selectedClient.balance === 0}
                    className={`py-3 px-4 font-sans font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow transition-all active:scale-[0.98] cursor-pointer ${
                      selectedClient.balance === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-[#006e0a] hover:bg-emerald-800 text-white'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Registrar Abono (Abono Manual)</span>
                  </button>

                  <button
                    onClick={() => handleRegisterFullPayment(selectedClient.id)}
                    disabled={selectedClient.balance === 0}
                    className={`py-3 px-4 font-sans font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow transition-all active:scale-[0.98] cursor-pointer ${
                      selectedClient.balance === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    <CheckSquare className="w-5 h-5" />
                    <span>Liquidación / Registrar Pago Completo</span>
                  </button>

                  <button
                    onClick={() => {
                      setActionDate(new Date().toISOString().split('T')[0]);
                      setActionAmount(0);
                      setActionNotes('');
                      setShowDebtModal(true);
                    }}
                    className="bg-amber-900 hover:bg-amber-950 text-white font-sans font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Deuda de Forma Manual</span>
                  </button>

                </div>

                {userRole === 'Administrador' && selectedClient.balance === 0 && (
                  <button
                    onClick={() => handleArchiveClientClick(selectedClient)}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-sans font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition-all active:scale-[0.98] cursor-pointer"
                    title="Archivar Ficha"
                  >
                    <span>🗑 Ocultar Ahora / Archivar Ficha de Crédito</span>
                  </button>
                )}
              </div>
            )}

            {/* MOSTRAR HISTORIAL COMPLETO */}
            <div id="full-history-card" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-gray-150">
                <h4 className="font-sans font-black text-slate-900 text-sm uppercase tracking-tight flex items-center gap-2">
                  <History className="w-4 h-4 text-[#904d00]" />
                  <span>Historial Completo de Movimientos</span>
                </h4>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded font-mono font-bold">
                  Suma total: {selectedClient.history.length} partidas de control
                </span>
              </div>

              <div className="divide-y divide-gray-150">
                {selectedClient.history.length === 0 ? (
                  <p id="no-history-text" className="text-center py-10 text-gray-400 text-xs font-mono">Sin transacciones registradas.</p>
                ) : (
                  selectedClient.history.map((mov) => (
                    <div key={mov.id} className="py-3.5 flex justify-between items-start gap-4 hover:bg-slate-50/60 px-2 rounded-lg transition-transform text-left">
                      <div className="flex gap-3 items-start">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                          mov.type === 'Pedido' ? 'bg-red-50 text-red-700' :
                          mov.type === 'Pago' ? 'bg-emerald-50 text-emerald-800' : 
                          mov.type === 'Liquidación Total' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-800'
                        }`}>
                          {mov.type === 'Pedido' ? 'D' : mov.type === 'Pago' ? 'A' : mov.type === 'Liquidación Total' ? 'L' : 'T'}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-xs font-bold text-gray-900 font-sans">{mov.label}</h5>
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold font-mono ${
                              mov.statusLabel === 'PEDIDO AGREGADO' ? 'bg-amber-100 text-amber-800' :
                              mov.statusLabel === 'PAGO RECEIBIDO' ? 'bg-green-100 text-green-800' :
                              mov.statusLabel === 'LIQUIDACIÓN TOTAL' ? 'bg-amber-150 text-amber-900' :
                              mov.statusLabel === 'DEUDA ELIMINADA' ? 'bg-rose-100 text-rose-800' :
                              'bg-gray-150 text-gray-650'
                            }`}>
                              {mov.statusLabel}
                            </span>
                          </div>
                          
                          {/* Observation in history */}
                          <p className="text-[10px] text-gray-400 font-mono mt-1">
                            Fecha de movimiento: <strong className="text-gray-700">{mov.date}</strong> 
                            {mov.notes && (
                              <span> • Observaciones: <strong className="text-gray-800 font-sans italic">"{mov.notes}"</strong></span>
                            )}
                            {mov.usuario && (
                              <span> • Registrado por: <strong className="text-slate-800 font-sans font-bold">{mov.usuario}</strong></span>
                            )}
                            {mov.sucursal && (
                              <span> • Sucursal: <strong className="text-slate-800 font-sans">{mov.sucursal}</strong></span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-black text-xs shrink-0 ${
                          mov.amount > 0 ? 'text-red-700 font-semibold' : 'text-emerald-700'
                        }`}>
                          {mov.amount > 0 ? '+' : ''}${mov.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )
      )}

      {/* MODAL: NEW CLIENT (REGISTRAR NUEVO FIADO) */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <form onSubmit={handleCreateClient} className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden text-xs">
            
            <div className="bg-amber-600 text-white p-4 font-sans font-extrabold flex justify-between items-center text-sm shadow">
              <span>Registrar Cuenta de Crédito de Cliente</span>
              <button type="button" onClick={() => setShowAddClientModal(false)} className="text-white hover:text-gray-200 font-black text-xs bg-black/20 p-1.5 px-3.5 rounded">Cerrar</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Nombre Completo del Cliente:</label>
                <input 
                  type="text"
                  required
                  placeholder="Por ej. Mariana Gonçalves"
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm({...newClientForm, name: e.target.value})}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-250 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Móvil de Contacto (Opcional):</label>
                  <input 
                    type="text"
                    placeholder="999-999-9999"
                    value={newClientForm.phone}
                    onChange={(e) => setNewClientForm({...newClientForm, phone: e.target.value})}
                    className="bg-white text-gray-900 w-full p-2.5 border border-gray-250 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1">Tienda de Asignación:</label>
                  <select 
                    value={newClientForm.branch}
                    onChange={(e) => setNewClientForm({...newClientForm, branch: e.target.value})}
                    className="bg-white text-gray-900 w-full p-2.5 border border-gray-250 rounded-xl font-bold"
                  >
                    {stores.filter(s => s.active).map((st) => (
                      <option key={st.id} value={st.name}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Monto de Deuda ($):</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={newClientForm.initialBalance || ''}
                    placeholder="0.00"
                    onChange={(e) => setNewClientForm({...newClientForm, initialBalance: parseFloat(e.target.value) || 0})}
                    className="bg-white text-gray-900 w-full p-2.5 border border-gray-250 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1">Fecha:</label>
                  <input 
                    type="date"
                    required
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    className="bg-white text-gray-900 w-full p-2.5 border border-gray-250 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1">Estado:</label>
                  <select 
                    value="Activa"
                    disabled
                    className="bg-gray-100 text-gray-650 w-full p-2.5 border border-gray-250 rounded-xl font-extrabold cursor-not-allowed"
                  >
                    <option value="Activa">Activa (Default)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#333] font-bold block mb-1">Observaciones Iniciales:</label>
                <textarea 
                  placeholder="Por ej: Consumidor de licuados diarios, solicitó crédito por nómina quincenal"
                  value={newClientForm.observaciones}
                  onChange={(e) => setNewClientForm({...newClientForm, observaciones: e.target.value})}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-250 rounded-xl max-h-20 min-h-12 focus:ring-1"
                />
              </div>
            </div>

            <div className="bg-gray-150 p-4 border-t border-gray-200 flex gap-2.5">
              <button 
                type="button" 
                onClick={() => setShowAddClientModal(false)}
                className="w-1/2 bg-white text-gray-700 py-2.5 border border-gray-300 rounded-xl hover:bg-neutral-150 text-xs font-bold transition"
              >
                Cerrar Ventana
              </button>
              <button 
                type="submit"
                className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-black shadow"
              >
                Registrar Fíado y Abrir Cuenta
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL: REGISTRAR ABONO (REGISTRAR ABONO) */}
      {showAbonoModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <form onSubmit={handleRegisterAbonoSubmit} className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden text-xs">
            
            <div className="bg-[#006e0a] text-white p-4 font-sans font-extrabold text-sm flex justify-between">
              <span>Registrar Abono - {selectedClient.name}</span>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <p className="text-gray-550">Saldo pendiente de cuenta: <strong className="text-amber-950 text-sm font-mono">${selectedClient.balance.toFixed(2)}</strong></p>
              </div>

              <div>
                <label className="text-gray-500 font-extrabold block mb-1">Monto a Abonar ($):</label>
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  max={selectedClient.balance}
                  value={actionAmount || ''}
                  onChange={(e) => setActionAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-200 rounded-xl font-bold font-mono text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Fecha de Recibo:</label>
                <input 
                  type="date"
                  required
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-gray-400 block font-bold mb-1">Observaciones / Notas del Abono:</label>
                <input 
                  type="text"
                  placeholder="Ej: Entregó billete $50, abono directo"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-150 flex gap-2">
              <button 
                type="button" 
                onClick={() => { setShowAbonoModal(false); setActionAmount(0); }}
                className="w-1/2 bg-white text-gray-700 py-2.5 border rounded-xl hover:bg-gray-100 font-bold transition"
              >
                Cerrar
              </button>
              <button 
                type="submit"
                disabled={actionAmount <= 0 || actionAmount > selectedClient.balance}
                className={`w-1/2 py-2.5 rounded-xl font-extrabold text-white shadow transition-all ${
                  actionAmount <= 0 || actionAmount > selectedClient.balance 
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#006e0a] hover:bg-emerald-800'
                }`}
              >
                Registrar Abono
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL: CARGAR DEUDA MANUAL (CREAR DEUDA MANUAL) */}
      {showDebtModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <form onSubmit={handleCreateManualDebtSubmit} className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden text-xs">
            
            <div className="bg-amber-900 text-white p-4 font-sans font-extrabold text-sm text-center">
              <span>Cargar Deuda Manual - {selectedClient.name}</span>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <span className="text-gray-500 font-medium block leading-relaxed">
                  Carga consumos de Alimentos, Bebidas o Snacks directamente a la ficha del cliente.
                </span>
                <p className="text-gray-550 mt-1">Saldo pendiente actual: <strong className="text-amber-950 font-mono">${selectedClient.balance.toFixed(2)}</strong></p>
              </div>

              <div>
                <label className="text-gray-500 font-extrabold block mb-1">Monto de la Deuda ($):</label>
                <input 
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  placeholder="0.00"
                  value={actionAmount || ''}
                  onChange={(e) => setActionAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-200 rounded-xl font-bold font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Fecha de la Deuda:</label>
                <input 
                  type="date"
                  required
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[#333] font-bold block mb-1 font-sans">Observaciones (¿Qué consumió?):</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Licuado de fresa, torta y sabritas"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="bg-white text-gray-905 w-full p-2.5 border border-gray-250 rounded-xl"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-150 flex gap-2">
              <button 
                type="button" 
                onClick={() => { setShowDebtModal(false); setActionAmount(0); }}
                className="w-1/2 bg-white text-gray-755 py-2.5 border rounded-xl hover:bg-gray-100 font-bold transition"
              >
                Cerrar
              </button>
              <button 
                type="submit"
                disabled={actionAmount <= 0}
                className={`w-1/2 py-2.5 rounded-xl font-black text-white shadow-md transition-all ${
                  actionAmount <= 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-900 hover:bg-amber-950'
                }`}
              >
                Cargar Cuenta
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL: SHIELD CONFIRMATION FOR DELETING ACTIVE DEBT (ADMIN ONLY) */}
      {showDeleteDebtModal && clientToDeleteDebt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs font-sans">
          <form onSubmit={handleDeleteDebtSubmit} className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-800">
            
            <div className="bg-rose-700 text-white p-4 font-sans font-extrabold flex justify-between items-center text-sm shadow animate-fade-in">
              <span>¿Deseas eliminar esta deuda permanentemente?</span>
              <button 
                type="button" 
                onClick={() => { setShowDeleteDebtModal(false); setClientToDeleteDebt(null); }} 
                className="text-white hover:text-rose-100 font-extrabold bg-rose-805 px-2.5 py-1 rounded cursor-pointer"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 space-y-1.5 font-sans leading-normal">
                <p className="font-bold text-xs">Información de la Cuenta:</p>
                <p>• <strong>Cliente:</strong> {clientToDeleteDebt.name}</p>
                <p>• <strong>ID:</strong> {clientToDeleteDebt.id}</p>
                <p>• <strong>Monto de Deuda Activa:</strong> ${clientToDeleteDebt.balance.toFixed(2)}</p>
                <p className="text-[10px] text-rose-700 font-semibold leading-normal pt-1 border-t border-rose-200/50">
                  Esta acción restablecerá el saldo actual del deudor a $0.00 de manera irrevocable y registrará un movimiento de ajuste administrativo en su historial.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-500 font-bold block">Motivo de la Eliminación (Requerido):</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Error de captura, condonación autorizada, liquidación en físico no reportada"
                  value={deleteMotive}
                  onChange={(e) => setDeleteMotive(e.target.value)}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-250 rounded-xl font-medium focus:ring-1 focus:ring-rose-500 animate-fade-in"
                />
              </div>
            </div>

            <div className="bg-gray-100 p-4 border-t border-gray-150 flex gap-2.5">
              <button 
                type="button" 
                onClick={() => { setShowDeleteDebtModal(false); setClientToDeleteDebt(null); }}
                className="w-1/2 bg-white text-gray-755 py-2.5 border rounded-xl hover:bg-gray-200 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="w-1/2 bg-rose-700 hover:bg-rose-800 text-white py-2.5 rounded-xl font-black hover:shadow-md active:scale-98 transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL: SHIELD CONFIRMATION FOR LIQUIDATION */}
      {showLiquidationModal && liquidationClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden text-slate-800">
            <div className="bg-amber-600 text-white p-4 font-sans font-extrabold text-center text-sm">
              <span>¿Registrar liquidación total de la deuda?</span>
            </div>
            <div className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <span className="text-gray-500 font-bold block uppercase tracking-wider text-[10px]">Cliente:</span>
                <span className="text-sm font-black text-slate-900 block">{liquidationClient.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 font-bold block uppercase tracking-wider text-[10px]">Deuda actual:</span>
                <span className="text-lg font-mono font-black text-amber-900 block">${liquidationClient.balance.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-gray-100 p-4 border-t border-gray-150 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowLiquidationModal(false);
                  setLiquidationClient(null);
                }}
                className="w-1/2 bg-white text-gray-700 py-2.5 border rounded-xl hover:bg-gray-200 font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmFullPayment}
                className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-black shadow-md transition-all cursor-pointer"
              >
                Confirmar Liquidación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SHIELD CONFIRMATION FOR MANUAL ARCHIVE */}
      {showArchiveModal && archiveClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden text-slate-800">
            <div className="bg-slate-700 text-white p-4 font-sans font-extrabold text-center text-sm">
              <span>¿Deseas ocultar inmediatamente esta ficha?</span>
            </div>
            <div className="p-5 space-y-3.5 text-left">
              <p className="font-semibold text-slate-800 text-xs">
                Cliente: <strong className="text-slate-900">{archiveClient.name}</strong>
              </p>
              <p className="text-gray-500 leading-normal text-[11px]">
                El historial de movimientos y pagos seguirá almacenado de forma segura en la base de datos de auditoría. Esta acción no elimina ningún dato.
              </p>
            </div>
            <div className="bg-gray-100 p-4 border-t border-gray-150 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowArchiveModal(false);
                  setArchiveClient(null);
                }}
                className="w-1/2 bg-white text-gray-700 py-2.5 border rounded-xl hover:bg-gray-200 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmArchiveClient}
                className="w-1/2 bg-slate-700 hover:bg-slate-800 text-white py-2.5 rounded-xl font-black shadow-md transition-all cursor-pointer"
              >
                Ocultar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
