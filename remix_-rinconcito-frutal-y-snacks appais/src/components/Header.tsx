/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Role, ActiveTab, UserAccount } from '../types';
import { Shield, Sparkles, User, RefreshCw, Circle } from 'lucide-react';

interface HeaderProps {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  onRefreshAll: () => void;
  activeTab: ActiveTab;
  users?: UserAccount[];
  isStoreClosed?: boolean;
  logoUrl?: string;
  onNavigateToProfile?: () => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function Header({ currentRole, setCurrentRole, onRefreshAll, activeTab, users, isStoreClosed = false, logoUrl, onNavigateToProfile, isDarkMode, toggleDarkMode }: HeaderProps) {
  const isDashboard = activeTab === 'Dashboard';

  const userWithRole = users?.find(u => u.role === currentRole);
  const avatarEl = userWithRole?.avatarUrl ? (
    <img src={userWithRole.avatarUrl} alt={userWithRole.name} className="w-full h-full rounded-full object-cover" />
  ) : (
    <span>{currentRole[0]}</span>
  );

  const renderLogo = (sizeClass: string) => {
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt="Logo" 
          referrerPolicy="no-referrer"
          className={`${sizeClass} rounded-lg object-contain bg-white/40 p-0.5 border border-orange-200/40`} 
        />
      );
    }
    return <span className={sizeClass === 'w-6 h-6' ? 'text-base' : 'text-xl'}>🍊</span>;
  };

  if (!isDashboard) {
    return (
      <header className="bg-orange-100/90 backdrop-blur-sm text-slate-800 py-2.5 px-4 shadow-sm sticky top-0 z-50 border-b border-orange-205 transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          {/* Brand Logo and Title (Compact) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center">
              {renderLogo('w-6 h-6')}
            </div>
            <div className="flex items-center gap-1.5 font-sans">
              <span className="font-sans font-black text-xs tracking-tight text-orange-950 hidden xs:inline font-sans">
                Rinconcito Frutal
              </span>
              <span className="text-[10px] bg-orange-200 text-orange-900 uppercase font-mono px-2 py-0.5 rounded border border-orange-300 font-bold">
                {activeTab}
              </span>
            </div>
          </div>

          {/* Action controls & Roles (Compact) */}
          <div className="flex items-center gap-1.5 xs:gap-3">
            {/* Status Badge */}
            {isStoreClosed ? (
              <div className="flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase">
                <span>🔴 CERRADO</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 bg-emerald-55 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase">
                <span>🟢 ONLINE</span>
              </div>
            )}

            <button
              onClick={onRefreshAll}
              className="flex items-center gap-1 bg-orange-200 hover:bg-orange-300 active:scale-95 transition-all text-orange-950 text-[10px] font-black px-2.5 py-1 rounded-lg border border-orange-300 font-mono cursor-pointer"
              title="Sincronizar y Reiniciar Datos"
            >
              <RefreshCw className="w-3 h-3 text-orange-850" />
              <span className="hidden md:inline">ACTUALIZAR</span>
            </button>

            {/* Role selector dropdown */}
            <div className="flex items-center gap-1.5 bg-orange-200 px-2 py-1 rounded-lg border border-orange-300">
              <Shield className="w-3.5 h-3.5 text-orange-800" />
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as Role)}
                className="bg-transparent text-orange-950 font-sans text-xs font-black focus:outline-none cursor-pointer border-none p-0 pr-1 hover:text-orange-900"
              >
                <option value="Administrador" className="text-gray-900 font-sans">Admin 👑</option>
                <option value="Líder" className="text-gray-900 font-sans">Líder 🎖️</option>
                <option value="Empleado" className="text-gray-900 font-sans">Empleado 🧑‍🍳</option>
                <option value="Repartidor" className="text-gray-900 font-sans">Repartidor 🚚</option>
              </select>
            </div>

            {/* Dark Mode Toggle */}
            {toggleDarkMode && (
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 dark:bg-yellow-100 text-yellow-300 dark:text-orange-500 hover:scale-105 active:scale-95 transition-all shadow-sm"
                title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            )}

            {/* User profile identifier */}
            <button
              onClick={onNavigateToProfile}
              className="w-8 h-8 bg-orange-50 hover:bg-orange-100 hover:scale-105 active:scale-95 transition-all rounded-full flex items-center justify-center text-orange-900 font-bold text-xs overflow-hidden border border-orange-205 shadow-sm cursor-pointer"
              title={`Ver Mi Perfil (${currentRole}: ${userWithRole?.name || ''})`}
            >
              {avatarEl}
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-orange-100 text-slate-800 py-3.5 px-4 shadow-sm sticky top-0 z-50 border-b border-orange-205 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="bg-orange-200 p-2 rounded-2xl border border-orange-300/60 shadow-xs">
            {renderLogo('w-8 h-8')}
          </div>
          <div>
            <h1 className="font-sans text-xl sm:text-2xl font-black tracking-tight text-orange-950 flex items-center gap-2">
              Rinconcito Frutal <span className="font-normal text-orange-800 text-sm hidden sm:inline">& Snacks</span>
            </h1>
            <p className="text-xs text-orange-700 font-mono tracking-wider font-bold">PWA OPERATIVA DE JUGUERÍA</p>
          </div>
        </div>

        {/* Action controls & Roles */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-center">
          {/* Status Badge */}
          {isStoreClosed ? (
            <div className="flex items-center gap-1.5 bg-red-100 text-red-800 border border-red-200 px-3 py-1.2 rounded-full text-xs font-mono font-bold tracking-tight uppercase shadow-xs">
              <span>🔴 TIENDA CERRADA</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-55 text-emerald-800 border border-emerald-200 px-3 py-1.2 rounded-full text-xs font-mono font-bold tracking-tight uppercase shadow-xs">
              <span>🟢 ONLINE</span>
            </div>
          )}

          <button
            onClick={onRefreshAll}
            className="flex items-center gap-1 bg-orange-200 hover:bg-orange-300 active:scale-95 transition-all text-orange-950 text-xs font-black px-3 py-1.5 rounded-lg border border-orange-300 font-mono cursor-pointer"
            title="Sincronizar y Reiniciar Datos"
          >
            <RefreshCw className="w-3.5 h-3.5 text-orange-850" />
            <span className="hidden xs:inline">ACTUALIZAR TODO</span>
          </button>

          {/* Role selector dropdown */}
          <div className="flex items-center gap-2 bg-orange-200 px-3 py-1.5 rounded-xl border border-orange-300">
            <Shield className="w-4 h-4 text-orange-800" />
            <label className="text-[11px] uppercase font-mono tracking-wider text-orange-800 font-black hidden md:inline">ROL:</label>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as Role)}
              className="bg-transparent text-orange-950 font-sans text-sm font-black focus:outline-none cursor-pointer border-none p-0 pr-1 hover:text-orange-900"
            >
              <option value="Administrador" className="text-gray-900 font-sans">Administrador 👑</option>
              <option value="Líder" className="text-gray-900 font-sans">Líder 🎖️</option>
              <option value="Empleado" className="text-gray-900 font-sans">Empleado 🧑‍🍳</option>
              <option value="Repartidor" className="text-gray-900 font-sans">Repartidor 🚚</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          {toggleDarkMode && (
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 dark:bg-yellow-100 text-yellow-300 dark:text-orange-500 hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-700 dark:border-yellow-200"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          )}

          {/* User profile identifier */}
          <button
            onClick={onNavigateToProfile}
            className="flex items-center gap-2 bg-orange-200/50 hover:bg-orange-250 p-0.5 rounded-full border border-orange-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={`Ver Mi Perfil (${currentRole}: ${userWithRole?.name || ''})`}
          >
            <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center text-orange-900 font-bold text-xs overflow-hidden border border-orange-205 shadow-sm">
              {avatarEl}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
