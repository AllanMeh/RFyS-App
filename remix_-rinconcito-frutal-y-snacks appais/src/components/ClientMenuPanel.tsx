import React from 'react';
import { Product } from '../types';

interface ClientMenuPanelProps {
  products: Product[];
  isStoreClosed: boolean;
  menuDelDia: string;
  logoUrl: string;
  onExit: () => void;
}

export default function ClientMenuPanel({
  products,
  isStoreClosed,
  menuDelDia,
  logoUrl,
  onExit
}: ClientMenuPanelProps) {
  
  // Group products by category
  const activeProducts = products.filter(p => p.active);
  const getCategory = (cat: string) => activeProducts.filter(p => p.category === cat);
  
  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans relative pb-24 dark:bg-slate-900 dark:text-gray-100">
      
      {/* Floating Exit Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={onExit}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border-[4px] border-white dark:border-slate-800 transition"
        >
          <span>👁️ Volver a Administrador</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 p-6 sticky top-0 z-40 transition-colors">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Rinconcito Frutal" className="h-16 w-16 object-cover rounded-2xl mb-3 shadow-md" />
          ) : (
            <div className="h-16 w-16 bg-[#904d00]/10 text-[#904d00] flex justify-center items-center rounded-2xl mb-3 font-black text-2xl">
              RF
            </div>
          )}
          <h1 className="text-2xl font-black text-[#904d00] dark:text-amber-500 tracking-tight">Rinconcito Frutal</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Sabor que se siente, calidad que se prueba</p>
          
          {isStoreClosed && (
            <div className="mt-4 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-bold px-4 py-1.5 rounded-full text-xs">
              ⚠️ Actualmente cerrado. No estamos recibiendo pedidos.
            </div>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto p-4 space-y-8 mt-4">
        
        {/* Menu del dia section */}
        {menuDelDia && (
          <section>
            <div className="bg-[#904d00] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-9xl opacity-10">🍲</div>
              <h2 className="text-xl font-black mb-4 relative z-10">El Menú de Hoy</h2>
              <div className="whitespace-pre-line text-sm font-medium leading-relaxed bg-black/10 p-4 rounded-xl border border-white/20 relative z-10 text-amber-50">
                {menuDelDia}
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Categories */}
        {['Bebidas frías', 'Bebidas calientes', 'Frutas', 'Comidas', 'Tortas y Sándwiches', 'Snacks', 'Licuados y Jugos', 'Comida y Snacks'].map((cat) => {
          const catProducts = getCategory(cat);
          if (catProducts.length === 0) return null;

          return (
            <section key={cat}>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-slate-700 pb-2 mb-4 capitalize flex items-center gap-2">
                {cat}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catProducts.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-xs border border-gray-200 dark:border-slate-700 flex gap-4 transition-colors">
                    {p.image && (
                      <div className="w-20 h-20 shrink-0">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-full h-full object-cover rounded-xl shadow-xs"
                        />
                      </div>
                    )}
                    <div className="flex flex-col justify-center flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-[15px] leading-tight">{p.name}</h4>
                      {p.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                      <strong className="text-[#904d00] dark:text-amber-500 font-bold block mt-2 text-sm">${p.price.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

    </div>
  );
}
