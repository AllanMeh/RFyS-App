/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveTab, Role } from '../types';
import { LayoutDashboard, Tablet, ChefHat, Truck, Coins, BookOpen, Settings, Lock, User } from 'lucide-react';
import { theme } from '../theme';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentRole: Role;
  readyCount: number;
  cocinaCount: number;
}

export default function BottomNav({ activeTab, setActiveTab, currentRole, readyCount, cocinaCount }: BottomNavProps) {
  
  // Tab specification list
  const tabItems: { id: ActiveTab; label: string; icon: any; rolesPermitted: Role[] }[] = [
    { 
      id: 'Dashboard', 
      label: 'Inicio', 
      icon: LayoutDashboard, 
      rolesPermitted: ['Administrador', 'Líder', 'Empleado', 'Repartidor'] 
    },
    { 
      id: 'POS', 
      label: 'POS', 
      icon: Tablet, 
      rolesPermitted: ['Administrador', 'Empleado', 'Repartidor'] 
    },
    { 
      id: 'Cocina', 
      label: 'Cocina', 
      icon: ChefHat, 
      rolesPermitted: ['Administrador', 'Líder', 'Empleado', 'Repartidor'] 
    },
    { 
      id: 'Entregas', 
      label: 'Entregas', 
      icon: Truck, 
      rolesPermitted: ['Administrador', 'Empleado', 'Repartidor'] 
    },
    { 
      id: 'Caja', 
      label: 'Caja', 
      icon: Coins, 
      rolesPermitted: ['Administrador', 'Líder', 'Empleado', 'Repartidor'] 
    },
    { 
      id: 'Créditos', 
      label: 'Créditos', 
      icon: BookOpen, 
      rolesPermitted: ['Administrador', 'Líder', 'Repartidor'] 
    },
    ...(currentRole === 'Administrador' ? [
      { 
        id: 'Administración' as ActiveTab, 
        label: 'Admin', 
        icon: Settings, 
        rolesPermitted: ['Administrador'] as Role[]
      }
    ] : [])
  ];

  const visibleTabs = tabItems.filter((t) => t.rolesPermitted.includes(currentRole));

  return (
    <nav className={`${theme.nav.bg} border-t ${theme.border.default} fixed bottom-0 left-0 right-0 z-50 shadow-lg px-2 sm:px-6 py-2.5 transition-all`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isPermitted = true; // Handled by filter already

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-center py-1 rounded-xl transition-all relative ${
                isActive 
                  ? `${theme.nav.activeBg} ${theme.nav.activeText} font-bold p-1 max-w-[120px] scale-105` 
                  : `${theme.nav.inactiveText} hover:text-gray-900 hover:bg-neutral-50 p-1 font-medium`
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? theme.text.brand : 'text-gray-500'}`} />
                
                {/* Visual Lock overlay for restricted tabs */}
                {!isPermitted && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 scale-75 shadow">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}

                {/* Hot badge counters */}
                {tab.id === 'Cocina' && cocinaCount > 0 && isPermitted && (
                  <span className="absolute -top-2 -right-3 bg-[#bb171d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {cocinaCount}
                  </span>
                )}

                {tab.id === 'Entregas' && readyCount > 0 && isPermitted && (
                  <span className="absolute -top-2 -right-3 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {readyCount}
                  </span>
                )}
              </div>
              
              <span className="text-[10px] sm:text-xs tracking-tight font-sans block">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
