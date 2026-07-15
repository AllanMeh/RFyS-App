import React, { useState, useMemo } from 'react';
import { StoreInfo } from '../types';
import { Search, X, Check, MapPin } from 'lucide-react';

interface StoreSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreInfo[];
  selectedStoreName: string;
  onSelectStore: (storeName: string) => void;
  title?: string;
}

export default function StoreSelectorModal({
  isOpen,
  onClose,
  stores = [],
  selectedStoreName,
  onSelectStore,
  title = "Seleccionar Sucursal"
}: StoreSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const activeStores = useMemo(() => {
    return stores.filter(s => s.active);
  }, [stores]);

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return activeStores;
    const query = searchQuery.toLowerCase().trim();
    return activeStores.filter(s => s.name.toLowerCase().includes(query));
  }, [activeStores, searchQuery]);

  // Helper to generate initials from store name
  const getInitials = (name: string) => {
    const cleanName = name.replace(/\(.*\)/, '').trim(); // Remove parentheses details
    const words = cleanName.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  // Helper to get a stable gradient color based on store name
  const getGradient = (name: string) => {
    const gradients = [
      'from-amber-400 to-orange-500 text-white',
      'from-orange-400 to-red-500 text-white',
      'from-red-400 to-rose-500 text-white',
      'from-pink-400 to-rose-500 text-white',
      'from-emerald-400 to-teal-500 text-white',
      'from-teal-400 to-cyan-500 text-white',
      'from-cyan-400 to-blue-500 text-white',
      'from-blue-400 to-indigo-500 text-white',
      'from-indigo-400 to-purple-500 text-white',
      'from-purple-400 to-fuchsia-500 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-150 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-slate-800 flex items-center justify-center text-orange-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-black text-sm text-gray-900 dark:text-white">{title}</h3>
              <p className="text-[10px] text-gray-400 font-semibold">{activeStores.length} sucursales disponibles</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-150 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar sucursal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/40 text-xs pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-semibold text-gray-800 dark:text-gray-100"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Grid List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/20">
          {filteredStores.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs font-medium">
              No se encontraron sucursales para "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStores.map((st) => {
                const isSelected = st.name === selectedStoreName;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      onSelectStore(st.name);
                      onClose();
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-orange-500/80 shadow-xs ring-1 ring-orange-500/20' 
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border-gray-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Logo/Avatar */}
                    <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shadow-xs border border-gray-100 dark:border-slate-800">
                      {st.image ? (
                        <img 
                          src={st.image} 
                          alt={st.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-xs bg-gradient-to-br ${getGradient(st.name)}`}>
                          {getInitials(st.name)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-gray-900 dark:text-gray-150 text-xs line-clamp-1">
                        {st.name}
                      </h4>
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block mt-0.5">
                        {st.name.toLowerCase().includes('mesa') ? 'Consumo Local' : 'Tienda / Sucursal'}
                      </span>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
