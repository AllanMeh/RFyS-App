/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { seedProductosToSupabase, type SeedResult } from '../lib/productosService';
import supabase from '../lib/supabase';
import { uploadAsset } from '../lib/storageService';
import { Product, Order, ClientDebt, UserAccount, Role, CajaStatus, StoreInfo, Coupon, ClientAccount } from '../types';
import { formatStoreName } from '../lib/database/sucursales';
import { 
  Package, 
  Plus, 
  Edit2, 
  Check, 
  X, 
  FileImage, 
  Trash2, 
  CalendarCheck, 
  Utensils, 
  Users, 
  TrendingUp, 
  Upload, 
  RotateCcw, 
  Shield, 
  DollarSign, 
  FileText,
  Bookmark,
  Cookie,
  Award,
  Calendar,
  Layers,
  Search,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Printer,
  Store,
  ArrowUp,
  ArrowDown,
  Database,
  RefreshCw,
  CloudUpload
} from 'lucide-react';
import AvatarUploader from './AvatarUploader';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  clients: ClientDebt[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  menuDelDia: string;
  onUpdateMenuDelDia: (text: string) => void;
  users: UserAccount[];
  onUpdateUserRole: (userId: string, newRole: Role) => void;
  isStoreClosed?: boolean;
  onSetStoreClosed?: (isClosed: boolean) => void;
  logoUrl?: string;
  onSetLogoUrl?: (url: string) => void;
  cajaState?: CajaStatus;
  onToggleClientPOV?: () => void;
  stores: StoreInfo[];
  onAddStore: (newStore: StoreInfo) => void;
  onUpdateStore: (updatedStore: StoreInfo) => void;
  onDeleteStore: (storeId: string) => void;
  onReorderStores: (newStores: StoreInfo[]) => void;
  polloStatus?: { pierna: boolean; muslo: boolean };
  onUpdatePolloStatus?: (status: { pierna: boolean; muslo: boolean }) => void;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  clientAccounts: ClientAccount[];
}

const LayoutConfigFieldsComponent: React.FC<{
  layout: string | undefined;
  productObj: any;
  updateFn: (updated: any) => void;
}> = ({
  layout,
  productObj,
  updateFn
}) => {
  // Helper parsing functions
  const parseLayout2Options = (text: string, existing: any[] = []) => {
    return text.split(',').map(item => {
      const [name, priceStr] = item.split(':');
      const price = parseFloat(priceStr?.trim()) || 0;
      const nameTrim = name?.trim();
      if (!nameTrim) return null;
      const exist = existing?.find(x => x.name === nameTrim);
      return { name: nameTrim, price, active: exist ? exist.active : true };
    }).filter(Boolean) as any[];
  };

  const parseLayout2Extras = (text: string, existing: any[] = []) => {
    return text.split(',').map(item => {
      const parts = item.split(':');
      const name = parts[0]?.trim();
      const price = parseFloat(parts[1]?.trim()) || 0;
      const perPiece = parts[2]?.trim().toLowerCase() === 'true';
      if (!name) return null;
      const exist = existing?.find(x => x.name === name);
      return { name, price, perPiece, active: exist ? exist.active : true };
    }).filter(Boolean) as any[];
  };

  const parseLayout3Preps = (text: string, existing: any[] = []) => {
    return text.split(',').map(item => {
      const [name, priceDiffStr] = item.split(':');
      const priceDiff = parseFloat(priceDiffStr?.trim()) || 0;
      const nameTrim = name?.trim();
      if (!nameTrim) return null;
      const exist = existing?.find(x => x.name === nameTrim);
      return { name: nameTrim, priceDiff, active: exist ? exist.active : true };
    }).filter(Boolean) as any[];
  };

  const parseRemovables = (text: string, existing: any[] = []) => {
    return text.split(',').map(name => {
      const nameTrim = name.trim();
      if (!nameTrim) return null;
      const exist = existing?.find(x => x.name === nameTrim);
      return { name: nameTrim, active: exist ? exist.active : true };
    }).filter(Boolean) as any[];
  };

  const parsePrepsOnly = (text: string, existing: any[] = []) => {
    return text.split(',').map(name => {
      const nameTrim = name.trim();
      if (!nameTrim) return null;
      const exist = existing?.find(x => x.name === nameTrim);
      return { name: nameTrim, active: exist ? exist.active : true };
    }).filter(Boolean) as any[];
  };

  // Local state for each text field, initialized once (or when key/layout changes)
  const [layout2OptionsText, setLayout2OptionsText] = useState(() => 
    productObj.layout2Options?.map((o: any) => `${o.name}:${o.price}`).join(', ') || ''
  );
  const [layout2ExtrasText, setLayout2ExtrasText] = useState(() => 
    productObj.layout2Extras?.map((o: any) => `${o.name}:${o.price}:${o.perPiece}`).join(', ') || ''
  );
  const [layout3PrepsText, setLayout3PrepsText] = useState(() => 
    productObj.layout3Preps?.map((o: any) => `${o.name}:${o.priceDiff || 0}`).join(', ') || ''
  );
  const [layout3RemovablesText, setLayout3RemovablesText] = useState(() => 
    productObj.layout3Removables?.map((o: any) => o.name).join(', ') || ''
  );
  const [layout4PrepsText, setLayout4PrepsText] = useState(() => 
    productObj.layout4Preps?.map((o: any) => o.name).join(', ') || ''
  );
  const [layout4RemovablesText, setLayout4RemovablesText] = useState(() => 
    productObj.layout4Removables?.map((o: any) => o.name).join(', ') || ''
  );
  const [layout5PresentationsText, setLayout5PresentationsText] = useState(() => 
    productObj.layout5Presentations?.map((o: any) => `${o.name}:${o.price}`).join(', ') || ''
  );
  const [layout5FruitsText, setLayout5FruitsText] = useState(() => 
    productObj.layout5Fruits?.map((o: any) => o.name).join(', ') || ''
  );
  const [layout5ExtrasText, setLayout5ExtrasText] = useState(() => 
    productObj.layout5Extras?.map((o: any) => `${o.name}:${o.price}`).join(', ') || ''
  );
  const [layout6ProteinsText, setLayout6ProteinsText] = useState(() => 
    productObj.layout6Proteins?.map((o: any) => `${o.name}:${o.price}`).join(', ') || ''
  );
  const [layout6RemovablesText, setLayout6RemovablesText] = useState(() => 
    productObj.layout6Removables?.map((o: any) => o.name).join(', ') || ''
  );
  const [layout6ExtrasText, setLayout6ExtrasText] = useState(() => 
    productObj.layout6Extras?.map((o: any) => `${o.name}:${o.price}`).join(', ') || ''
  );
  const [layout7SizesText, setLayout7SizesText] = useState(() => 
    productObj.layout7Sizes?.map((o: any) => `${o.name}:${o.price}`).join(', ') || ''
  );
  const [layout8SizesText, setLayout8SizesText] = useState(() => 
    productObj.layout8Sizes?.map((o: any) => `${o.name}:${o.price}`).join(', ') || ''
  );
  const [layout8FlavorsText, setLayout8FlavorsText] = useState(() => 
    productObj.layout8Flavors?.map((o: any) => o.name).join(', ') || ''
  );
  const [layout9SizesText, setLayout9SizesText] = useState(() => 
    productObj.layout9Sizes?.map((o: any) => `${o.name}:${o.price}`).join(', ') || ''
  );
  const [layout9FlavorsText, setLayout9FlavorsText] = useState(() => 
    productObj.layout9Flavors?.map((o: any) => o.name).join(', ') || ''
  );
  const [layout9ModifiersText, setLayout9ModifiersText] = useState(() => 
    productObj.layout9Modifiers?.map((o: any) => o.name).join(', ') || ''
  );
  const [customizationOptionsText, setCustomizationOptionsText] = useState(() => 
    productObj.customizationOptions?.join(', ') || ''
  );

  React.useEffect(() => {
    setLayout2OptionsText(productObj.layout2Options?.map((o: any) => `${o.name}:${o.price}`).join(', ') || '');
    setLayout2ExtrasText(productObj.layout2Extras?.map((o: any) => `${o.name}:${o.price}:${o.perPiece}`).join(', ') || '');
    setLayout3PrepsText(productObj.layout3Preps?.map((o: any) => `${o.name}:${o.priceDiff || 0}`).join(', ') || '');
    setLayout3RemovablesText(productObj.layout3Removables?.map((o: any) => o.name).join(', ') || '');
    setLayout4PrepsText(productObj.layout4Preps?.map((o: any) => o.name).join(', ') || '');
    setLayout4RemovablesText(productObj.layout4Removables?.map((o: any) => o.name).join(', ') || '');
    setLayout5PresentationsText(productObj.layout5Presentations?.map((o: any) => `${o.name}:${o.price}`).join(', ') || '');
    setLayout5FruitsText(productObj.layout5Fruits?.map((o: any) => o.name).join(', ') || '');
    setLayout5ExtrasText(productObj.layout5Extras?.map((o: any) => `${o.name}:${o.price}`).join(', ') || '');
    setLayout6ProteinsText(productObj.layout6Proteins?.map((o: any) => `${o.name}:${o.price}`).join(', ') || '');
    setLayout6RemovablesText(productObj.layout6Removables?.map((o: any) => o.name).join(', ') || '');
    setLayout6ExtrasText(productObj.layout6Extras?.map((o: any) => `${o.name}:${o.price}`).join(', ') || '');
    setLayout7SizesText(productObj.layout7Sizes?.map((o: any) => `${o.name}:${o.price}`).join(', ') || '');
    setLayout8SizesText(productObj.layout8Sizes?.map((o: any) => `${o.name}:${o.price}`).join(', ') || '');
    setLayout8FlavorsText(productObj.layout8Flavors?.map((o: any) => o.name).join(', ') || '');
    setLayout9SizesText(productObj.layout9Sizes?.map((o: any) => `${o.name}:${o.price}`).join(', ') || '');
    setLayout9FlavorsText(productObj.layout9Flavors?.map((o: any) => o.name).join(', ') || '');
    setLayout9ModifiersText(productObj.layout9Modifiers?.map((o: any) => o.name).join(', ') || '');
    setCustomizationOptionsText(productObj.customizationOptions?.join(', ') || '');
  }, [productObj.id, layout]);

  const isTortaOrSandwich = 
    layout === 'layout_6_proteina' || 
    (productObj.id && (
      productObj.id.includes('torta') || 
      productObj.name?.toLowerCase().includes('torta') || 
      productObj.id.includes('sand') || 
      productObj.name?.toLowerCase().includes('sándwich') || 
      productObj.name?.toLowerCase().includes('sandwich')
    ));

  if (!layout || layout === 'layout_1_simple') {
    return (
      <div className="bg-slate-50 p-3 rounded-xl border text-[11px] text-gray-550 leading-relaxed font-semibold">
        ℹ️ <strong>LAYOUT 1 — SIN CONFIGURACIÓN:</strong> El producto se agregará directamente al carrito al ser tocado. Solo requiere Nombre, Imagen, Categoría y Precio.
        {isTortaOrSandwich && (
          <div className="mt-2 border-t pt-2 space-y-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="layout-allow-presentation"
                checked={productObj.layoutAllowPresentation ?? false}
                onChange={(e) => updateFn({ ...productObj, layoutAllowPresentation: e.target.checked })}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="layout-allow-presentation" className="text-gray-600 font-bold font-sans cursor-pointer">Habilitar Tipo de Presentación (Sencillo / Doble / etc.)</label>
            </div>
            
            {(productObj.layoutAllowPresentation ?? false) && (
              <div className="grid grid-cols-2 gap-2 bg-white/70 p-2 rounded-lg border border-amber-200">
                <div>
                  <label className="text-gray-500 font-bold block">Presentación 1 (Nombre):</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Sencillo"
                    value={productObj.layoutPresentations?.[0]?.name || ''}
                    onChange={(e) => {
                      const current = [...(productObj.layoutPresentations || [])];
                      current[0] = { name: e.target.value, price: current[0]?.price ?? 30 };
                      updateFn({ ...productObj, layoutPresentations: current });
                    }}
                    className="bg-white text-gray-900 w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block">Precio 1 ($):</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 30"
                    value={productObj.layoutPresentations?.[0]?.price ?? ''}
                    onChange={(e) => {
                      const current = [...(productObj.layoutPresentations || [])];
                      current[0] = { name: current[0]?.name || 'Sencillo', price: parseFloat(e.target.value) || 0 };
                      updateFn({ ...productObj, layoutPresentations: current });
                    }}
                    className="bg-white text-gray-900 w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div className="mt-2">
                  <label className="text-gray-500 font-bold block">Presentación 2 (Nombre):</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Doble"
                    value={productObj.layoutPresentations?.[1]?.name || ''}
                    onChange={(e) => {
                      const current = [...(productObj.layoutPresentations || [])];
                      current[1] = { name: e.target.value, price: current[1]?.price ?? 45 };
                      updateFn({ ...productObj, layoutPresentations: current });
                    }}
                    className="bg-white text-gray-900 w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div className="mt-2">
                  <label className="text-gray-500 font-bold block">Precio 2 ($):</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 45"
                    value={productObj.layoutPresentations?.[1]?.price ?? ''}
                    onChange={(e) => {
                      const current = [...(productObj.layoutPresentations || [])];
                      current[1] = { name: current[1]?.name || 'Doble', price: parseFloat(e.target.value) || 0 };
                      updateFn({ ...productObj, layoutPresentations: current });
                    }}
                    className="bg-white text-gray-900 w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

    <div className="space-y-3 bg-amber-50/40 p-3 rounded-xl border border-amber-200/50 text-[11.5px]">

      {/* LAYOUT 2: SELECCIÓN POR CANTIDADES */}
      {layout === 'layout_2_cantidades' && (
        <>
          <div className="mb-3">
            <label className="text-gray-500 font-bold block mb-1">Ícono del layout en POS:</label>
            <select
              value={productObj.layoutIcon || 'none'}
              onChange={(e) => updateFn({ ...productObj, layoutIcon: e.target.value })}
              className="bg-white text-gray-900 w-full p-2 border border-gray-300 rounded-lg text-xs"
            >
              <option value="none">Sin icono</option>
              <option value="taco">Taco 🌮</option>
            </select>
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Opciones (Formato: Nombre:Precio, ej. Suadero:15, Bistec:15):</label>
            <input 
              type="text"
              placeholder="Suadero:15, Bistec:15, Chorizo:15"
              value={layout2OptionsText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout2OptionsText(val);
                updateFn({
                  ...productObj,
                  layout2Options: parseLayout2Options(val, productObj.layout2Options)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Opciones adicionales (Formato: Nombre:Precio:porPieza, ej. Doble tortilla:1:true):</label>
            <input 
              type="text"
              placeholder="Doble tortilla:1:true, Extra queso:5:false"
              value={layout2ExtrasText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout2ExtrasText(val);
                updateFn({
                  ...productObj,
                  layout2Extras: parseLayout2Extras(val, productObj.layout2Extras)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>

          {/* Active toggling list */}
          {productObj.layout2Options && productObj.layout2Options.length > 0 && (
            <div className="space-y-1 mt-2">
              <label className="text-[10px] font-black text-gray-400 uppercase font-bold">Habilitar / Deshabilitar Sabores:</label>
              <div className="flex flex-wrap gap-1.5">
                {productObj.layout2Options.map((opt: any, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      const updated = [...(productObj.layout2Options || [])];
                      updated[idx] = { ...opt, active: !opt.active };
                      updateFn({ ...productObj, layout2Options: updated });
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                      opt.active ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-rose-50 text-rose-700 border-rose-255'
                    }`}
                  >
                    {opt.active ? '🟢' : '🔴'} {opt.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* LAYOUT 3: PLATILLO */}
      {layout === 'layout_3_platillo' && (
        <>
          <div>
            <label className="text-gray-500 font-bold block">Preparaciones (Formato: Nombre:DiferenciaPrecio, ej. Mole de pollo:0, Cecina:10):</label>
            <input 
              type="text"
              placeholder="Mole de pollo:0, Cecina:10, Pechuga rellena:5"
              value={layout3PrepsText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout3PrepsText(val);
                updateFn({
                  ...productObj,
                  layout3Preps: parseLayout3Preps(val, productObj.layout3Preps)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Acompañamientos incluidos (Divididos por coma):</label>
            <input 
              type="text"
              placeholder="Arroz, Frijol, 6 tortillas, Salsa, Ensalada"
              value={layout3RemovablesText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout3RemovablesText(val);
                updateFn({
                  ...productObj,
                  layout3Removables: parseRemovables(val, productObj.layout3Removables)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Texto Informativo de Acompañamientos:</label>
            <input 
              type="text"
              placeholder="Incluye: Arroz, Frijol, 6 Tortillas, Salsa y ensalada"
              value={productObj.infoCardText || ''}
              onChange={(e) => updateFn({ ...productObj, infoCardText: e.target.value })}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox"
                id="layout3-extra-tortilla"
                checked={productObj.layout3ExtraTortilla ?? false}
                onChange={(e) => updateFn({ ...productObj, layout3ExtraTortilla: e.target.checked })}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded"
              />
              <label htmlFor="layout3-extra-tortilla" className="text-gray-600 font-bold font-sans">Habilitar Tortillas Extra</label>
            </div>
            <div>
              <label className="text-gray-500 font-bold block">Costo por Tortilla Extra ($):</label>
              <input 
                type="number"
                step="0.5"
                value={productObj.layout3TortillaPrice || 0}
                onChange={(e) => updateFn({ ...productObj, layout3TortillaPrice: parseFloat(e.target.value) || 0 })}
                className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox"
              id="layout3-allow-pollo-piece"
              checked={productObj.layout3AllowPolloPiece ?? false}
              onChange={(e) => updateFn({ ...productObj, layout3AllowPolloPiece: e.target.checked })}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded"
            />
            <label htmlFor="layout3-allow-pollo-piece" className="text-gray-605 font-bold font-sans">Habilitar Selección de Pieza de Pollo (Muslo/Pierna)</label>
          </div>
        </>
      )}

      {/* LAYOUT 4: HUEVOS AL GUSTO */}
      {layout === 'layout_4_huevos' && (
        <>
          <div>
            <label className="text-gray-500 font-bold block">Preparaciones (Divididas por coma):</label>
            <input 
              type="text"
              placeholder="Jamón, Salchicha, Tocino, Chorizo, A la mexicana, Estrellados"
              value={layout4PrepsText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout4PrepsText(val);
                updateFn({
                  ...productObj,
                  layout4Preps: parsePrepsOnly(val, productObj.layout4Preps)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Acompañamientos incluidos (Divididos por coma):</label>
            <input 
              type="text"
              placeholder="Frijol, Arroz, Ensalada"
              value={layout4RemovablesText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout4RemovablesText(val);
                updateFn({
                  ...productObj,
                  layout4Removables: parseRemovables(val, productObj.layout4Removables)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Texto Tarjeta Informativa (Verde):</label>
            <input 
              type="text"
              placeholder="Incluye por defecto: Frijol y 6 Tortillas calientes hechas a mano"
              value={productObj.infoCardText || ''}
              onChange={(e) => updateFn({ ...productObj, infoCardText: e.target.value })}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-gray-500 font-bold block">Tortillas Incluidas:</label>
              <input 
                type="number"
                value={productObj.layout4IncludedTortillas ?? 6}
                onChange={(e) => updateFn({ ...productObj, layout4IncludedTortillas: parseInt(e.target.value) || 0 })}
                className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-bold"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox"
                id="layout4-extra-tortilla"
                checked={productObj.layout4ExtraTortilla ?? false}
                onChange={(e) => updateFn({ ...productObj, layout4ExtraTortilla: e.target.checked })}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded"
              />
              <label htmlFor="layout4-extra-tortilla" className="text-gray-600 font-bold font-sans">Admitir Extra</label>
            </div>
            <div>
              <label className="text-gray-500 font-bold block">Precio Extra ($):</label>
              <input 
                type="number"
                step="0.5"
                value={productObj.layout4TortillaPrice || 0}
                onChange={(e) => updateFn({ ...productObj, layout4TortillaPrice: parseFloat(e.target.value) || 0 })}
                className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
          </div>
        </>
      )}

      {/* LAYOUT 5: FRUTAS */}
      {layout === 'layout_5_frutas' && (
        <>
          <div>
            <label className="text-gray-500 font-bold block">Presentaciones (Formato: Nombre:Precio, ej. Vaso:25, Plato:30):</label>
            <input 
              type="text"
              placeholder="Fruta en Vaso:25, Fruta en Plato:30"
              value={layout5PresentationsText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout5PresentationsText(val);
                updateFn({
                  ...productObj,
                  layout5Presentations: parseLayout2Options(val, productObj.layout5Presentations)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Frutas disponibles (Divididas por coma):</label>
            <input 
              type="text"
              placeholder="Melón, Papaya, Manzana, Plátano, Piña, Jícama, Pepino, Mango, Fresa"
              value={layout5FruitsText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout5FruitsText(val);
                updateFn({
                  ...productObj,
                  layout5Fruits: parsePrepsOnly(val, productObj.layout5Fruits)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Extras toppings (Formato: Nombre:Precio, ej. Miel:0, Granola:0, Yogurt:5):</label>
            <input 
              type="text"
              placeholder="Miel:0, Granola:0, Yogurt:5, Lechera:0, Chamoy:0, Tajín:0"
              value={layout5ExtrasText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout5ExtrasText(val);
                updateFn({
                  ...productObj,
                  layout5Extras: parseLayout2Options(val, productObj.layout5Extras)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>

          {/* Fruit active togglers */}
          {productObj.layout5Fruits && productObj.layout5Fruits.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase font-bold">Disponibilidad de Frutas:</label>
              <div className="flex flex-wrap gap-1">
                {productObj.layout5Fruits.map((f: any, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      const updated = [...(productObj.layout5Fruits || [])];
                      updated[idx] = { ...f, active: !f.active };
                      updateFn({ ...productObj, layout5Fruits: updated });
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${
                      f.active ? 'bg-emerald-50 text-emerald-700 border-emerald-205' : 'bg-rose-50 text-rose-700 border-rose-205'
                    }`}
                  >
                    {f.active ? '🟢' : '🔴'} {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extras active togglers */}
          {productObj.layout5Extras && productObj.layout5Extras.length > 0 && (
            <div className="space-y-1 mt-1">
              <label className="text-[10px] font-black text-gray-400 uppercase font-bold">Disponibilidad de Extras:</label>
              <div className="flex flex-wrap gap-1">
                {productObj.layout5Extras.map((ex: any, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      const updated = [...(productObj.layout5Extras || [])];
                      updated[idx] = { ...ex, active: !ex.active };
                      updateFn({ ...productObj, layout5Extras: updated });
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${
                      ex.active ? 'bg-emerald-50 text-emerald-700 border-emerald-205' : 'bg-rose-50 text-rose-700 border-rose-205'
                    }`}
                  >
                    {ex.active ? '🟢' : '🔴'} {ex.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* LAYOUT 6: PROTEÍNA + INGREDIENTES */}
      {layout === 'layout_6_proteina' && (
        <>
          <div>
            <label className="text-gray-500 font-bold block">Proteínas (Formato: Nombre:Precio, ej. Jamón:40, Salchicha:40):</label>
            <input 
              type="text"
              placeholder="Jamón:40, Salchicha:40, Tocino:45, Milanesa:45"
              value={layout6ProteinsText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout6ProteinsText(val);
                updateFn({
                  ...productObj,
                  layout6Proteins: parseLayout2Options(val, productObj.layout6Proteins)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
        </>
      )}

      {/* LAYOUT 7: BEBIDAS CALIENTES */}
      {layout === 'layout_7_calientes' && (
        <>
          <div>
            <label className="text-gray-500 font-bold block">Tamaños (Formato: Nombre:Precio, ej. Chico:15, Mediano:20):</label>
            <input 
              type="text"
              placeholder="Chico:15, Mediano:20, Grande:25"
              value={layout7SizesText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout7SizesText(val);
                updateFn({
                  ...productObj,
                  layout7Sizes: parseLayout2Options(val, productObj.layout7Sizes)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Opciones / Sabores (ej. Limón, Manzanilla, Té verde):</label>
            <input 
              type="text"
              placeholder="Limón, Manzanilla, Té verde, Frutal"
              value={customizationOptionsText}
              onChange={(e) => {
                const val = e.target.value;
                setCustomizationOptionsText(val);
                updateFn({
                  ...productObj,
                  customizationOptions: val.split(',').map(s => s.trim()).filter(Boolean)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="layout7-allow-milk"
                checked={productObj.layout7AllowMilk ?? false}
                onChange={(e) => updateFn({ ...productObj, layout7AllowMilk: e.target.checked })}
                className="w-4 h-4 text-amber-605 border-gray-300 rounded"
              />
              <label htmlFor="layout7-allow-milk" className="text-gray-600 font-bold font-sans">Admitir Leche</label>
            </div>
            <div>
              <label className="text-gray-500 font-bold block">Precio Leche ($):</label>
              <input 
                type="number"
                step="0.5"
                value={productObj.layout7MilkPrice || 0}
                onChange={(e) => updateFn({ ...productObj, layout7MilkPrice: parseFloat(e.target.value) || 0 })}
                className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="layout7-allow-sugar"
                checked={productObj.layout7AllowSugar ?? false}
                onChange={(e) => updateFn({ ...productObj, layout7AllowSugar: e.target.checked })}
                className="w-4 h-4 text-amber-605 border-gray-300 rounded"
              />
              <label htmlFor="layout7-allow-sugar" className="text-gray-600 font-bold font-sans">Selector Azúcar</label>
            </div>
          </div>
        </>
      )}

      {/* LAYOUT 8: AGUAS FRESCAS */}
      {layout === 'layout_8_aguas' && (
        <>
          <div>
            <label className="text-gray-500 font-bold block">Tamaños (Formato: Nombre:Precio, ej. Chica:20, Litro:35):</label>
            <input 
              type="text"
              placeholder="Chica:20, Litro:35"
              value={layout8SizesText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout8SizesText(val);
                updateFn({
                  ...productObj,
                  layout8Sizes: parseLayout2Options(val, productObj.layout8Sizes)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Sabores disponibles (Divididos por coma):</label>
            <input 
              type="text"
              placeholder="Limón, Jamaica, Horchata"
              value={layout8FlavorsText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout8FlavorsText(val);
                updateFn({
                  ...productObj,
                  layout8Flavors: parsePrepsOnly(val, productObj.layout8Flavors)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>

          {/* Flavor toggling */}
          {productObj.layout8Flavors && productObj.layout8Flavors.length > 0 && (
            <div className="space-y-1 mt-2">
              <label className="text-[10px] font-black text-gray-400 uppercase font-bold">Sabores Activos / Agotados:</label>
              <div className="flex flex-wrap gap-1.5">
                {productObj.layout8Flavors.map((fl: any, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      const updated = [...(productObj.layout8Flavors || [])];
                      updated[idx] = { ...fl, active: !fl.active };
                      updateFn({ ...productObj, layout8Flavors: updated });
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                      fl.active ? 'bg-emerald-50 text-emerald-700 border-emerald-205' : 'bg-rose-50 text-rose-700 border-rose-255'
                    }`}
                  >
                    {fl.active ? '🟢' : '🔴'} {fl.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* LAYOUT 9: JUGOS */}
      {layout === 'layout_9_jugos' && (
        <>
          <div>
            <label className="text-gray-500 font-bold block">Tamaños (Formato: Nombre:Precio, ej. 16 oz:45, 1 litro:90):</label>
            <input 
              type="text"
              placeholder="16 oz:45, 1 litro:90"
              value={layout9SizesText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout9SizesText(val);
                updateFn({
                  ...productObj,
                  layout9Sizes: parseLayout2Options(val, productObj.layout9Sizes)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Sabores de jugo (Divididos por coma):</label>
            <input 
              type="text"
              placeholder="Naranja, Betabel, Zanahoria, Verde"
              value={layout9FlavorsText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout9FlavorsText(val);
                updateFn({
                  ...productObj,
                  layout9Flavors: parsePrepsOnly(val, productObj.layout9Flavors)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="text-gray-500 font-bold block">Modificadores extra (Divididos por coma):</label>
            <input 
              type="text"
              placeholder="Sin Hielo, Doble Colado, Con Limón"
              value={layout9ModifiersText}
              onChange={(e) => {
                const val = e.target.value;
                setLayout9ModifiersText(val);
                updateFn({
                  ...productObj,
                  layout9Modifiers: parsePrepsOnly(val, productObj.layout9Modifiers)
                });
              }}
              className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>

          {/* Flavor toggling */}
          {productObj.layout9Flavors && productObj.layout9Flavors.length > 0 && (
            <div className="space-y-1 mt-2">
              <label className="text-[10px] font-black text-gray-400 uppercase font-bold">Sabores Activos / Agotados:</label>
              <div className="flex flex-wrap gap-1.5">
                {productObj.layout9Flavors.map((fl: any, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      const updated = [...(productObj.layout9Flavors || [])];
                      updated[idx] = { ...fl, active: !fl.active };
                      updateFn({ ...productObj, layout9Flavors: updated });
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                      fl.active ? 'bg-emerald-50 text-emerald-700 border-emerald-205' : 'bg-rose-50 text-rose-700 border-rose-205'
                    }`}
                  >
                    {fl.active ? '🟢' : '🔴'} {fl.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* PRESENTATION OPTIONS CONFIG FOR TORTAS & SANDWICHES (LAYOUT 6) */}
      {isTortaOrSandwich && (
        <div className="space-y-2 border-t border-dashed border-gray-300 pt-3 mt-3">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="layout-allow-presentation"
              checked={productObj.layoutAllowPresentation ?? false}
              onChange={(e) => updateFn({ ...productObj, layoutAllowPresentation: e.target.checked })}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="layout-allow-presentation" className="text-gray-650 font-bold cursor-pointer">Habilitar Tipo de Presentación (Sencillo / Doble / etc.)</label>
          </div>
          
          {(productObj.layoutAllowPresentation ?? false) && (
            <div className="grid grid-cols-2 gap-2 bg-white/70 p-2 rounded-lg border border-amber-200">
              <div>
                <label className="text-gray-500 font-bold block">Presentación 1 (Nombre):</label>
                <input 
                  type="text" 
                  placeholder="Ej: Sencillo"
                  value={productObj.layoutPresentations?.[0]?.name || ''}
                  onChange={(e) => {
                    const current = [...(productObj.layoutPresentations || [])];
                    current[0] = { name: e.target.value, price: current[0]?.price ?? 30 };
                    updateFn({ ...productObj, layoutPresentations: current });
                  }}
                  className="bg-white text-gray-900 w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-gray-500 font-bold block">Precio 1 ($):</label>
                <input 
                  type="number" 
                  placeholder="Ej: 30"
                  value={productObj.layoutPresentations?.[0]?.price ?? ''}
                  onChange={(e) => {
                    const current = [...(productObj.layoutPresentations || [])];
                    current[0] = { name: current[0]?.name || 'Sencillo', price: parseFloat(e.target.value) || 0 };
                    updateFn({ ...productObj, layoutPresentations: current });
                  }}
                  className="bg-white text-gray-900 w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div className="mt-2">
                <label className="text-gray-500 font-bold block">Presentación 2 (Nombre):</label>
                <input 
                  type="text" 
                  placeholder="Ej: Doble"
                  value={productObj.layoutPresentations?.[1]?.name || ''}
                  onChange={(e) => {
                    const current = [...(productObj.layoutPresentations || [])];
                    current[1] = { name: e.target.value, price: current[1]?.price ?? 45 };
                    updateFn({ ...productObj, layoutPresentations: current });
                  }}
                  className="bg-white text-gray-900 w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div className="mt-2">
                <label className="text-gray-500 font-bold block">Precio 2 ($):</label>
                <input 
                  type="number" 
                  placeholder="Ej: 45"
                  value={productObj.layoutPresentations?.[1]?.price ?? ''}
                  onChange={(e) => {
                    const current = [...(productObj.layoutPresentations || [])];
                    current[1] = { name: current[1]?.name || 'Doble', price: parseFloat(e.target.value) || 0 };
                    updateFn({ ...productObj, layoutPresentations: current });
                  }}
                  className="bg-white text-gray-900 w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* UNIVERSAL INGREDIENTS CONFIGURATION FOR ALL LAYOUTS */}
      <div className="space-y-4 border-t border-dashed border-gray-300 pt-4 mt-4">
        <h4 className="font-bold text-gray-700 text-[11px] uppercase">Configuración Universal de Ingredientes</h4>
        
        <div>
          <label className="text-gray-500 font-bold block">Ingredientes Base Incluidos (Formato: Nombre, Nombre):</label>
          <input 
            type="text"
            placeholder="Ej: Pan, Mayonesa, Frijoles"
            value={(productObj.baseIngredients || []).join(', ')}
            onChange={(e) => {
              const val = e.target.value;
              updateFn({
                ...productObj,
                baseIngredients: val.split(',').map(s => s.trim()).filter(Boolean)
              });
            }}
            className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="text-gray-500 font-bold block">Ingredientes Removibles (Formato: Nombre, Nombre):</label>
          <input 
            type="text"
            placeholder="Ej: Cebolla, Jitomate, Picante"
            value={(productObj.removableIngredients || []).join(', ')}
            onChange={(e) => {
              const val = e.target.value;
              updateFn({
                ...productObj,
                removableIngredients: val.split(',').map(s => s.trim()).filter(Boolean)
              });
            }}
            className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="text-gray-500 font-bold block">Ingredientes Extra Opcionales (Formato: Nombre:Precio, ej. Queso:10):</label>
          <input 
            type="text"
            placeholder="Ej: Queso Extra:10, Aguacate:15"
            value={(productObj.extraIngredients || []).map((x: any) => `${x.name}:${x.price}`).join(', ')}
            onChange={(e) => {
              const val = e.target.value;
              const parsed = val.split(',').map(item => {
                const [name, priceStr] = item.split(':');
                const price = parseFloat(priceStr?.trim()) || 0;
                const nameTrim = name?.trim();
                if (!nameTrim) return null;
                return { name: nameTrim, price };
              }).filter(Boolean);
              updateFn({
                ...productObj,
                extraIngredients: parsed
              });
            }}
            className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
          />
        </div>
      </div>

    </div>
  );
};





export default function AdminPanel({
  products,
  orders,
  clients,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  menuDelDia,
  onUpdateMenuDelDia,
  users,
  onUpdateUserRole,
  isStoreClosed = false,
  onSetStoreClosed,
  logoUrl = '',
  onSetLogoUrl,
  cajaState,
  onToggleClientPOV,
  stores = [],
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  onReorderStores,
  polloStatus = { pierna: true, muslo: true },
  onUpdatePolloStatus,
  coupons,
  setCoupons,
  clientAccounts
}: AdminPanelProps) {
  
  // Tab within the administration area
  const [activeAdminTab, setActiveAdminTab] = useState<'Productos' | 'MenuDia' | 'Snacks' | 'Usuarios' | 'Reportes' | 'HistorialCortes' | 'Tiendas' | 'Cupones' | 'Supabase'>('Productos');

  // ── Supabase Seed State ──────────────────────────────────────────────────────
  const [seedStatus, setSeedStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const isSupabaseConfigured = Boolean(supabase);
  
  // Store Catalog States
  const [showAddStoreForm, setShowAddStoreForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editStoreName, setEditStoreName] = useState('');

  const handleMoveStore = (index: number, direction: number) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= stores.length) return;

    const reordered = [...stores];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;

    const updated = reordered.map((store, i) => ({
      ...store,
      order: i + 1
    }));

    onReorderStores(updated);
  };

  const handleAddStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const nextId = `store-${Date.now()}`;
    const newStore: StoreInfo = {
      id: nextId,
      name: newStoreName.trim(),
      active: true,
      order: stores.length + 1
    };

    onAddStore(newStore);
    setNewStoreName('');
    setShowAddStoreForm(false);
  };

  const handleEditStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStoreName.trim() || !editingStoreId) return;

    const store = stores.find(s => s.id === editingStoreId);
    if (store) {
      onUpdateStore({
        ...store,
        name: editStoreName.trim()
      });
    }

    setEditingStoreId(null);
    setEditStoreName('');
  };

  // Local states for filtering and product management
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modal controllers
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCorte, setSelectedCorte] = useState<any>(null);

  // Coupon management states
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponSearchFilter, setCouponSearchFilter] = useState('');

  // Create Coupon Form State
  const [newCopName, setNewCopName] = useState('');
  const [newCopCode, setNewCopCode] = useState('');
  const [newCopType, setNewCopType] = useState<'porcentaje' | 'fijo'>('porcentaje');
  const [newCopValue, setNewCopValue] = useState<number>(0);
  const [newCopValidUntil, setNewCopValidUntil] = useState('2026-12-31');
  const [newCopActive, setNewCopActive] = useState(true);
  const [newCopSelectedClients, setNewCopSelectedClients] = useState<string[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  
  // State for image file reader uploader
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string>('');

  // Form state for creating a new product
  const [newProductForm, setNewProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '', // category is empty by default to make selection mandatory
    price: 35,
    image: '',
    active: true,
    description: '',
    productLayout: 'layout_1_simple',
    applyRounding: true
  });

  // State for raw customization options input
  const [customizationInput, setCustomizationInput] = useState('');
  const [variantsInput, setVariantsInput] = useState('');
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [baseIngredientsInput, setBaseIngredientsInput] = useState('');
  const [extraIngredientsInput, setExtraIngredientsInput] = useState('');
  const [removableIngredientsInput, setRemovableIngredientsInput] = useState('');

  // Menú del día local control
  const [tempMenuText, setTempMenuText] = useState(menuDelDia);
  const [isEditingMenuText, setIsEditingMenuText] = useState(false);

  // Daily menu temporary plate form
  const [showAddTemporalModal, setShowAddTemporalModal] = useState(false);
  const [temporalPlateForm, setTemporalPlateForm] = useState({
    name: '',
    price: 49.00,
    description: 'Especial del día - Servido únicamente hoy',
    category: 'Comida y Snacks' as 'Comida y Snacks' | 'Licuados y Jugos' | 'Otros',
    image: ''
  });

  // SUPABASE STORAGE UPLOAD HANDLER
  const uploadImageFile = async (file: File, isEditing = false) => {
    if (!supabase) {
      alert("Supabase no configurado. No se pueden subir imágenes.");
      return;
    }
    
    // Preview temporal mientras sube
    const tempPreview = URL.createObjectURL(file);
    if (isEditing && editingProduct) {
      setEditingProduct({ ...editingProduct, image: tempPreview });
    } else {
      setUploadedImageBase64(tempPreview);
      setNewProductForm(prev => ({ ...prev, image: tempPreview }));
    }

    try {
      const publicUrl = await uploadAsset(file, 'product-images');

      if (isEditing && editingProduct) {
        setEditingProduct(prev => prev ? ({ ...prev, image: publicUrl }) : null);
      } else {
        setUploadedImageBase64(publicUrl);
        setNewProductForm(prev => ({ ...prev, image: publicUrl }));
      }
    } catch (err: any) {
      console.error("Error subiendo imagen:", err);
      alert("No se pudo subir la imagen: " + err.message);
      
      if (isEditing && editingProduct) {
        setEditingProduct(prev => prev ? ({ ...prev, image: '' }) : null);
      } else {
        setUploadedImageBase64('');
        setNewProductForm(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (file) uploadImageFile(file, isEditing);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, isEditing = false) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImageFile(file, isEditing);
  };

  // Remove image option (Eliminar imagen)
  const handleRemoveImage = (isEditing = false) => {
    if (isEditing && editingProduct) {
      setEditingProduct({
        ...editingProduct,
        image: ''
      });
      alert('Se eliminó la imagen del producto.');
    } else {
      setUploadedImageBase64('');
      setNewProductForm(prev => ({ ...prev, image: '' }));
      alert('Se eliminó la imagen nueva.');
    }
  };

  // PRODUCT MANAGEMENT DIRECTIVES
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name) return;
    if (!newProductForm.category) {
      alert("La categoría es obligatoria. Por favor selecciona una.");
      return;
    }
    const newProd: Product = {
      ...newProductForm,
      image: newProductForm.image || '',
      id: `prod-${Date.now()}`
    } as Product;

    onAddProduct(newProd);
    setShowAddModal(false);
    
    // Clean form
    setNewProductForm({
      name: '',
      category: '',
      price: 35,
      image: '',
      active: true,
      description: '',
      productLayout: 'layout_1_simple',
      applyRounding: true
    });
    setCustomizationInput('');
    setVariantsInput('');
    setIngredientsInput('');
    setBaseIngredientsInput('');
    setExtraIngredientsInput('');
    setRemovableIngredientsInput('');
    setUploadedImageBase64('');
    alert(`Producto "${newProd.name}" agregado exitosamente al catálogo en tiempo real.`);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      if (!editingProduct.category) {
        alert("La categoría es obligatoria. Por favor selecciona una.");
        return;
      }
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
      alert(`Información de "${editingProduct.name}" actualizada de forma global e instantánea.`);
    }
  };

  const handleToggleProductState = (prod: Product) => {
    const updated = { ...prod, active: !prod.active };
    onUpdateProduct(updated);
    alert(`Estado de disponibilidad para "${prod.name}" cambiado a: ${updated.active ? 'Disponible / Activo' : 'Agotado / Desactivado'}`);
  };

  const handlePriceQuickUpdate = (product: Product, newPrice: number) => {
    if (newPrice <= 0) return;
    onUpdateProduct({
      ...product,
      price: newPrice
    });
  };

  const handleCreateCouponsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCopCode.trim()) return;
    if (newCopSelectedClients.length === 0) {
      alert("Por favor, selecciona al menos un cliente para asignar el cupón.");
      return;
    }

    const newCoupons: Coupon[] = newCopSelectedClients.map((clientId, index) => ({
      id: `cop-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      code: newCopCode.trim().toUpperCase(),
      name: newCopName.trim() || 'Cupón de Descuento',
      type: newCopType,
      value: Number(newCopValue) || 0,
      validUntil: newCopValidUntil,
      clientId: clientId,
      used: false,
      active: newCopActive
    }));

    setCoupons(prev => [...prev, ...newCoupons]);
    setShowCreateCouponModal(false);

    // Reset Form
    setNewCopName('');
    setNewCopCode('');
    setNewCopType('porcentaje');
    setNewCopValue(0);
    setNewCopValidUntil('2026-12-31');
    setNewCopActive(true);
    setNewCopSelectedClients([]);
    setClientSearchQuery('');
  };

  const handleEditCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon || !editingCoupon.code.trim()) return;

    setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? {
      ...editingCoupon,
      code: editingCoupon.code.toUpperCase().trim(),
      name: editingCoupon.name?.trim() || 'Cupón de Descuento'
    } : c));

    setEditingCoupon(null);
  };

  const handleDeleteCoupon = (couponId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este cupón?")) {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
      if (supabase) {
        supabase.from('cupones').delete().eq('id', couponId).then(({ error }) => {
          if (error) console.error('[Supabase Sync] Error al eliminar cupón de Supabase:', error.message);
        });
      }
    }
  };

  const handleDeleteProductExecute = (productId: string, productName: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setProductToDelete(prod);
    }
  };

  // PLATILLOS TEMPORALES DEL MENÚ DEL DÍA DIRECTIVES
  const handleAddTemporalPlate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!temporalPlateForm.name) return;

    const keyId = `tmp-${Date.now()}`;
    // Define temporary product inside catalog as active
    const tempProduct: Product = {
      id: keyId,
      name: `[Especial Hoy] ${temporalPlateForm.name}`,
      category: temporalPlateForm.category,
      price: temporalPlateForm.price,
      image: temporalPlateForm.image,
      active: true,
      description: temporalPlateForm.description,
      customizationOptions: ['Porción regular'] // Marker for temporary
    };

    onAddProduct(tempProduct);
    
    // Also, append text description to the daily menu list
    const addedText = `\n⭐ ${temporalPlateForm.name} ($${temporalPlateForm.price.toFixed(2)}) - ${temporalPlateForm.description}`;
    onUpdateMenuDelDia(menuDelDia + addedText);
    setTempMenuText(menuDelDia + addedText);

    setShowAddTemporalModal(false);
    setTemporalPlateForm({
      name: '',
      price: 49.00,
      description: 'Especial del día - Servido únicamente hoy',
      category: 'Comida y Snacks',
      image: ''
    });
    alert(`Platillo temporal "${tempProduct.name}" creado. Se ha agregado al menú del día y al POS de forma automática.`);
  };

  const handleSaveRawMenuText = () => {
    onUpdateMenuDelDia(tempMenuText);
    setIsEditingMenuText(false);
    alert('Texto del Menú del Día Rinconcito actualizado de forma directa.');
  };

  // SNACKS ENHANCED SYSTEM (Módulo de Sabritas y Galletas)
  const handleAddSabritaSnack = (brandName: string, price: number) => {
    const idNum = Math.floor(100 + Math.random() * 900);
    const newSnack: Product = {
      id: `sab-${Date.now()}`,
      name: `Sabritas ${brandName} #${idNum}`,
      category: 'Sabritas y Galletas',
      price: price,
      image: '',
      active: true,
      description: 'Bolsa de Sabritas original para snacks breves.',
      customizationOptions: ['Con Salsa Picante', 'Limón y Sal']
    };

    onAddProduct(newSnack);
    alert(`Botana de Sabritas "${newSnack.name}" registrada con precio de $${price.toFixed(2)}.`);
  };

  const handleAddGalletaSnack = (cookieName: string, price: number) => {
    const idNum = Math.floor(100 + Math.random() * 900);
    const newSnack: Product = {
      id: `gal-${Date.now()}`,
      name: `Galletas ${cookieName} #${idNum}`,
      category: 'Sabritas y Galletas',
      price: price,
      image: '',
      active: true,
      description: 'Galleta empaquetada dulce excelente para postres.',
      customizationOptions: []
    };

    onAddProduct(newSnack);
    alert(`Paquete de Galletas "${newSnack.name}" registrado con precio de $${price.toFixed(2)}.`);
  };

  // RENDER FILTERED LIST FOR MAIN PRODUCTS TABLE
  const filteredProductsList = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredCoupons = coupons.filter(c => {
    const query = couponSearchFilter.toLowerCase().trim();
    if (!query) return true;
    
    const client = clientAccounts.find(account => account.id === c.clientId || account.phone === c.clientId);
    const clientName = client ? client.name.toLowerCase() : '';
    const clientPhone = client ? client.phone.toLowerCase() : '';
    const couponName = (c.name || '').toLowerCase();
    const couponCode = c.code.toLowerCase();
    
    return couponName.includes(query) || 
           couponCode.includes(query) || 
           clientName.includes(query) || 
           clientPhone.includes(query) ||
           c.clientId.toLowerCase().includes(query);
  });

  // -----------------------------------------------------------------------------------------------------------------------
  // REPORT CALCULATIONS (Ventas del día, semanales, mensuales, más vendidos, créditos activos)
  // -----------------------------------------------------------------------------------------------------------------------
  
  // 1. VENTAS DEL DÍA
  const salesOrdersToday = orders.filter(o => o.paymentStatus === 'Pagado');
  const totalSalesAmountToday = salesOrdersToday.reduce((sum, o) => sum + o.total, 0) + 12450.00; // adding base mock to preserve scale
  const ordersCountToday = salesOrdersToday.length + 48;

  // 2. VENTAS SEMANALES (Mon - Sun simulation graph)
  const weeklyData = [
    { day: 'Lunes', amount: 8400 },
    { day: 'Martes', amount: 9600 },
    { day: 'Miércoles', amount: 11200 },
    { day: 'Jueves', amount: 10500 },
    { day: 'Viernes', amount: totalSalesAmountToday > 12000 ? totalSalesAmountToday - 2000 : 12450 },
    { day: 'Sábado (Hoy)', amount: totalSalesAmountToday },
    { day: 'Domingo', amount: 0 }
  ];
  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.amount, 0);

  // 3. VENTAS MENSUALES (Progression of current month)
  const monthlyTotalSum = weeklyTotal + 45200.00; // Cumulative current cycle

  // 4. PRODUCTOS MÁS VENDIDOS (Ranking list)
  const calculatedTopSellers = [
    { name: 'Licuado de Fresa Especial', qty: 34, revenue: 1530.00, percentage: 95, color: 'bg-rose-500' },
    { name: 'Club Sandwich Clásico', qty: 28, revenue: 2100.00, percentage: 80, color: 'bg-amber-600' },
    { name: 'Jugo Verde Revitalizante', qty: 26, revenue: 1300.00, percentage: 75, color: 'bg-emerald-600' },
    { name: 'Torta Rústica de Jamón', qty: 19, revenue: 1140.00, percentage: 55, color: 'bg-orange-500' },
    { name: 'Papas Sabritas Crujientes', qty: 15, revenue: 330.00, percentage: 40, color: 'bg-yellow-500' }
  ];

  // 5. CRÉDITOS ACTIVOS (List of debtors)
  const activeCreditDebtors = clients.filter(c => c.balance > 0);

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-amber-500 font-sans font-black text-gray-900 text-[10px] rounded-full uppercase tracking-wider">MODO CONTROL TOTAL</span>
            <span className="text-slate-400 text-xs">Alineado en tiempo real</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight font-sans mt-1">
            Panel de Administración del Negocio
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Gestiona productos, modifica precios, cambia imágenes, controla roles de usuarios y supervisa estadísticas.
          </p>
        </div>

        {/* Quick action triggers hidden per rules */}
        <div className="flex gap-2 w-full md:w-auto">
        </div>
      </div>

      {/* HORIZONTAL TAB BAR */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-1 bg-white p-2 rounded-2xl border border-gray-150 shadow-sm scrollbar-thin">
        <button
          onClick={() => setActiveAdminTab('Productos')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'Productos' 
              ? 'bg-amber-100 text-[#904d00]' 
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Gestión de Productos ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('MenuDia')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'MenuDia' 
              ? 'bg-amber-100 text-[#904d00]' 
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menú del Día Rinconcito</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('Snacks')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'Snacks' 
              ? 'bg-amber-100 text-[#904d00]' 
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <Cookie className="w-4 h-4" />
          <span>Automatización de Snacks</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('Usuarios')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'Usuarios' 
              ? 'bg-amber-100 text-[#904d00]' 
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios y Personal ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('Reportes')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'Reportes' 
              ? 'bg-amber-100 text-[#904d00]' 
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Estadísticas y Reportes</span>
        </button>

        <button
          id="tab-history-cutes-btn"
          onClick={() => setActiveAdminTab('HistorialCortes')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'HistorialCortes' 
              ? 'bg-amber-100 text-[#904d00]' 
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Historial de Cortes ({cajaState?.historialCierres?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('Tiendas')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'Tiendas' 
              ? 'bg-amber-100 text-[#904d00]' 
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Catálogo de Tiendas ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('Cupones')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'Cupones' 
              ? 'bg-amber-100 text-[#904d00]' 
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Cupones ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('Supabase')}
          className={`py-2 px-4.5 text-xs font-bold font-sans rounded-lg transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'Supabase'
              ? 'bg-emerald-100 text-emerald-800'
              : 'text-gray-600 hover:bg-neutral-50 hover:text-black'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase Sync</span>
          {isSupabaseConfigured && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* SECCIÓN DE AJUSTES GENERALES (ESTADO Y LOGO) */}
      <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h3 className="font-sans font-black text-gray-900 text-sm">
              Ajustes de Operación & Logo de la Tienda
            </h3>
          </div>
          <p className="text-xs text-gray-500 max-w-md font-semibold leading-relaxed">
            Administra el estado de disponibilidad del negocio ("Cerrar tienda") y personaliza el logo que se muestra en la cabecera operacional de la PWA.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-end">
          {onToggleClientPOV && (
            <button
              onClick={onToggleClientPOV}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm h-full"
            >
              👁️ Ver como Cliente
            </button>
          )}
          {/* CONTROL DE ESTADO DE LA TIENDA */}
          <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl space-y-1.5 flex flex-col justify-between max-w-xs w-full">
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Estado del POS / Pedidos</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSetStoreClosed?.(false)}
                className={`flex-1 font-sans font-extrabold text-[10px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  !isStoreClosed 
                    ? 'bg-emerald-600 text-white shadow-xs border-emerald-700' 
                    : 'bg-white text-gray-600 hover:bg-emerald-50 border-gray-250'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${!isStoreClosed ? 'bg-white animate-pulse' : 'bg-emerald-600'}`}></div>
                <span>ONLINE / ABIERTA</span>
              </button>
              <button
                type="button"
                onClick={() => onSetStoreClosed?.(true)}
                className={`flex-1 font-sans font-extrabold text-[10px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2 ${
                  isStoreClosed 
                    ? 'bg-red-100 text-red-950 border-red-600 font-bold shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-red-55 border-gray-250'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isStoreClosed ? 'bg-red-650 animate-pulse' : 'bg-red-400'}`}></div>
                <span>CERRADA (PEDIDOS OFF)</span>
              </button>
            </div>
          </div>

          {/* CONTROL DE LOGO PERSONALIZADO */}
          <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl space-y-1.5 flex flex-col justify-between w-full max-w-md">
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Logo de la PWA (Subir archivo PNG/JPG/WEBP)</span>
            <div className="flex gap-2 items-center">
              <input
                type="file"
                id="logo-file-upload-input"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onSetLogoUrl?.(URL.createObjectURL(file)); // preview
                    uploadAsset(file, 'store-logos')
                      .then((url) => onSetLogoUrl?.(url))
                      .catch((err) => {
                        console.error('Error uploading logo:', err);
                        alert("Error subiendo logo: " + err.message);
                        onSetLogoUrl?.('');
                      });
                  }
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('logo-file-upload-input')?.click()}
                className="flex-grow bg-white hover:bg-orange-50 text-orange-950 font-bold border border-orange-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                📤 Subir Foto / Logo del Negocio
              </button>
              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => onSetLogoUrl?.('')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-black border border-gray-250 cursor-pointer"
                  title="Restablecer logo por defecto"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: PRODUCT CATALOGUE */}
      {activeAdminTab === 'Productos' && (
        <div className="space-y-4">
          
          {/* Filters controls */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar producto por ID, nombre o descripción..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 text-gray-950 dark:text-gray-100 pl-9 pr-4 py-2 border border-gray-250 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="md:col-span-4 lg:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-white text-gray-950 border border-gray-250 p-2 rounded-xl text-xs"
              >
                <option value="All">🍔 Todas las Categorías</option>
                <option value="Bebidas frías">Bebidas frías</option>
                <option value="Bebidas calientes">Bebidas calientes</option>
                <option value="Frutas">Frutas</option>
                <option value="Comidas">Comidas</option>
                <option value="Tortas y Sándwiches">Tortas y Sándwiches</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 items-center">
              <span className="text-[11px] font-mono text-slate-500 font-bold hidden xl:inline-block">
                {filteredProductsList.length}/{products.length} ítems
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="bg-[#904d00] hover:bg-amber-900 text-white flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar producto
              </button>
            </div>
          </div>

          {/* MAIN CATALOG TABLE CARD */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-xs">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 text-[10px] font-mono uppercase tracking-widest font-bold">
                    <th className="p-4 w-12 text-center">ID</th>
                    <th className="p-4">Imagen / Nombre</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4 text-right w-36">Precio de Venta</th>
                    <th className="p-4 text-center w-40">Estatus</th>
                    <th className="p-4 text-right pr-6 w-56">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredProductsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-gray-400 font-sans">
                        No se encontraron productos correspondientes con los filtros ingresados.
                      </td>
                    </tr>
                  ) : (
                    filteredProductsList.map((prod) => (
                      <tr key={prod.id} className="hover:bg-neutral-50/50 transition-colors">
                        
                        {/* ID */}
                        <td className="p-4 text-center font-mono text-[10px] text-gray-400 font-bold">
                          {prod.id.split('-')[1] || prod.id}
                        </td>

                        {/* Image / Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={prod.image} 
                              alt={prod.name} 
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-slate-50 shadow-xs flex-shrink-0"
                            />
                            <div>
                              <span className="font-extrabold text-gray-950 block text-[12.5px] font-sans leading-snug">{prod.name}</span>
                              <span className="text-[10px] text-gray-500 max-w-[280px] block line-clamp-1">{prod.description || 'Sin descripción'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="bg-amber-50 text-[#904d00] border border-amber-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase">
                            {prod.category}
                          </span>
                        </td>

                        {/* Price update direct input */}
                        <td className="p-4 text-right font-mono">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-gray-400 font-bold">$</span>
                            <input 
                              type="number"
                              min="1"
                              step="0.5"
                              value={prod.price}
                              onChange={(e) => handlePriceQuickUpdate(prod, parseFloat(e.target.value) || 0)}
                              className="w-16 bg-neutral-100 text-gray-950 p-1 border border-neutral-300 rounded text-right font-bold text-xs"
                              title="Modificar precio directamente"
                            />
                          </div>
                        </td>

                        {/* Status toggling */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleProductState(prod)}
                            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase cursor-pointer transition ${
                              prod.active 
                                ? 'bg-emerald-50 text-[#006e0a] border border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {prod.active ? '🟢 Disponible / Activa' : '🔴 Agotado / Inactivo'}
                          </button>
                        </td>

                        {/* Actions hub */}
                        <td className="p-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                            }}
                            className="bg-neutral-100 hover:bg-[#ffecc3]/60 text-amber-950 font-bold p-1.5 px-3 rounded-lg border border-neutral-200 transition"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => handleToggleProductState(prod)}
                            className="bg-slate-50 hover:bg-slate-100 text-gray-750 px-2.5 py-1.5 border border-gray-200 rounded-lg text-[10.5px]"
                          >
                            {prod.active ? 'Agotar' : 'Re-activar'}
                          </button>

                          <button
                            onClick={() => handleDeleteProductExecute(prod.id, prod.name)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold p-1.5 px-3 rounded-lg border border-rose-200 transition"
                            title="Eliminar Producto"
                          >
                            🗑 Eliminar
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MENÚ DEL DÍA SPECIALS */}
      {activeAdminTab === 'MenuDia' && (
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-4 max-w-4xl mx-auto">
          <div className="flex justify-between items-center pb-2 border-b">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 font-sans">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Guisos y Platillos del Día</span>
            </h3>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-sans mt-2">
            Selecciona los platillos que estarán disponibles hoy. Esto actualizará su disponibilidad en el sistema y generará automáticamente el texto del Menú del Día para los clientes.
          </p>

          <div className="bg-amber-50/50 rounded-2xl border border-amber-200 p-4 space-y-3 mt-4">
            <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider block font-sans flex items-center gap-1">
              <span>🍗</span>
              <span>Disponibilidad de Pollo (Piezas en Cocina)</span>
            </h4>
            <p className="text-[11px] text-amber-800 font-medium leading-normal">
              Activa o desactiva la disponibilidad de piezas de pollo. Cuando alguna esté desactivada, se mostrará como Agotada al cliente.
            </p>
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={polloStatus.muslo}
                  onChange={(e) => {
                    if (onUpdatePolloStatus) {
                      onUpdatePolloStatus({ ...polloStatus, muslo: e.target.checked });
                    }
                  }}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span>Muslo Disponible</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={polloStatus.pierna}
                  onChange={(e) => {
                    if (onUpdatePolloStatus) {
                      onUpdatePolloStatus({ ...polloStatus, pierna: e.target.checked });
                    }
                  }}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span>Pierna Disponible</span>
              </label>
            </div>
          </div>

          <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-2">
            {products.filter(p => p.category === 'Comidas' || p.category === 'Comida y Snacks').map(plate => (
              <label key={plate.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-gray-150 rounded-xl cursor-pointer hover:bg-amber-50/50 transition">
                <input 
                  type="checkbox"
                  checked={plate.active}
                  onChange={() => handleToggleProductState(plate)}
                  className="w-4 h-4 text-[#904d00] focus:ring-[#904d00] border-gray-300 rounded"
                />
                <div className="flex items-center gap-3 flex-1">
                  <img src={plate.image} alt={plate.name} className="w-10 h-10 object-cover rounded-lg border" />
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">{plate.name}</span>
                    <span className="text-xs text-gray-500 font-mono">${plate.price.toFixed(2)}</span>
                  </div>
                </div>
              </label>
            ))}
            {products.filter(p => p.category === 'Comidas' || p.category === 'Comida y Snacks').length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No hay platillos en la categoría "Comidas".</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                const availablePlates = products.filter(p => (p.category === 'Comidas' || p.category === 'Comida y Snacks') && p.active);
                const generatedMenuText = availablePlates.length > 0 
                  ? availablePlates.map(p => `🍲 ${p.name}`).join('\n')
                  : 'Sin platillos disponibles el día de hoy.';
                onUpdateMenuDelDia(generatedMenuText);
                alert('¡Menú del día actualizado y sincronizado al panel de clientes con éxito!');
              }}
              className="bg-[#006e0a] hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl w-full flex items-center justify-center gap-2 transition shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Guardar y Publicar Menú
            </button>
          </div>
        </div>
      )}
      {/* TAB CONTENT: SNACK PRESETS CONTROLLER */}
      {activeAdminTab === 'Snacks' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm font-sans">
              Snack Automation Panel (Sabritas & Galletas)
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Satisface el antojo del cliente de forma ágil. Presiona cualquier botón rápido para registrar una bolsa de Sabritas o paquete de Galletas nueva y habilitarla inmediatamente en el POS con precios de venta regulados.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Sabritas quick trigger */}
              <div className="border border-amber-200 bg-[#ffa500]/5 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1 font-sans">
                  <Bookmark className="w-4 h-4" />
                  <span>Nuevas Sabritas Crujientes (Papas, Ruffles...)</span>
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button 
                    onClick={() => handleAddSabritaSnack('Papitas Sal', 22.00)}
                    className="bg-white border hover:bg-amber-100 p-2 rounded-lg font-bold text-gray-800 text-left cursor-pointer"
                  >
                    🟡 Sabritas Amarillas ($22.00)
                  </button>
                  <button 
                    onClick={() => handleAddSabritaSnack('Ruffles Queso', 23.00)}
                    className="bg-white border hover:bg-amber-100 p-2 rounded-lg font-bold text-gray-800 text-left cursor-pointer"
                  >
                    🟠 Ruffles Queso ($23.05)
                  </button>
                  <button 
                    onClick={() => handleAddSabritaSnack('Doritos Nacho', 22.00)}
                    className="bg-white border hover:bg-amber-100 p-2 rounded-lg font-bold text-gray-800 text-left cursor-pointer"
                  >
                    🔴 Doritos Nacho ($22.00)
                  </button>
                  <button 
                    onClick={() => handleAddSabritaSnack('Cheetos Queso', 19.50)}
                    className="bg-white border hover:bg-amber-100 p-2 rounded-lg font-bold text-gray-800 text-left cursor-pointer"
                  >
                    🟠 Cheetos Flamin' Hot ($19.50)
                  </button>
                </div>
              </div>

              {/* Cookies quick trigger */}
              <div className="border border-emerald-205 bg-emerald-50/20 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1 font-sans">
                  <Cookie className="w-4 h-4" />
                  <span>Nuevas Galletas Dulces (Oreo, Chokis...)</span>
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button 
                    onClick={() => handleAddGalletaSnack('Oreo Clásicas', 20.00)}
                    className="bg-white border hover:bg-emerald-100 p-2 rounded-lg font-bold text-gray-800 text-left cursor-pointer"
                  >
                    🍪 Oreo Tradicional ($20.00)
                  </button>
                  <button 
                    onClick={() => handleAddGalletaSnack('Chokis Chocolate', 18.00)}
                    className="bg-white border hover:bg-emerald-100 p-2 rounded-lg font-bold text-gray-800 text-left cursor-pointer"
                  >
                    🍪 Chokis Chispas ($18.00)
                  </button>
                  <button 
                    onClick={() => handleAddGalletaSnack('Emperador Choc', 21.00)}
                    className="bg-white border hover:bg-emerald-100 p-2 rounded-lg font-bold text-gray-800 text-left cursor-pointer"
                  >
                    🍫 Emperador Chocolate ($21.00)
                  </button>
                  <button 
                    onClick={() => handleAddGalletaSnack('Galletas María', 15.00)}
                    className="bg-white border hover:bg-emerald-100 p-2 rounded-lg font-bold text-gray-800 text-left cursor-pointer"
                  >
                    📦 Marías Gamesa ($15.00)
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Rapid Snack price editing list */}
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm font-sans">
              Lista Integrada de Snacks Registrados: Edición Rápida de Precios
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {products.filter(p => p.category === 'Sabritas y Galletas').length === 0 ? (
                <div className="text-center py-6 text-gray-400 font-sans col-span-3 text-xs">
                  No hay snacks registrados en el catálogo. Usa los botones rápidos superiores para crear botanas en segundos.
                </div>
              ) : (
                products.filter(p => p.category === 'Sabritas y Galletas').map((snack) => (
                  <div key={snack.id} className="bg-neutral-50/50 p-3 border border-gray-200 rounded-xl flex items-center justify-between text-xs font-sans">
                    <div className="space-y-0.5 max-w-[150px]">
                      <span className="font-extrabold text-gray-900 block line-clamp-1">{snack.name}</span>
                      <span className={`text-[9.5px] font-bold font-mono ${snack.active ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {snack.active ? 'Activo' : 'Agotado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <span>$</span>
                      <input 
                        type="number"
                        min="1"
                        step="0.5"
                        value={snack.price}
                        onChange={(e) => handlePriceQuickUpdate(snack, parseFloat(e.target.value) || 0)}
                        className="w-16 bg-white border p-1 rounded font-black text-right focus:ring-1 focus:ring-amber-500 text-gray-900 text-xs"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: ACTIVE USER ACCOUNTS */}
      {activeAdminTab === 'Usuarios' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h3 className="font-extrabold text-[#904d00] text-sm font-sans flex items-center gap-2">
                <Users className="w-4.5 h-4.5" />
                <span>Control de Usuarios del Personal y Roles Operativos</span>
              </h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">Controla qué pantallas es capaz de visualizar cada miembro del equipo de acuerdo con su rol.</p>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 uppercase tracking-widest text-[9.5px] font-mono font-bold">
                  <th className="p-3 pl-4">Nombre Completo</th>
                  <th className="p-3">Cuenta (Alias)</th>
                  <th className="p-3">Móvil</th>
                  <th className="p-3 text-right">Rol Operativo Asignado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {users.map((account) => (
                  <tr key={account.id} className="hover:bg-neutral-50/50">
                    <td className="p-3 pl-4 font-bold text-gray-950 font-sans flex items-center gap-2.5">
                      <AvatarUploader
                        avatar={account.avatar}
                        avatarUrl={account.avatarUrl}
                        name={account.name}
                        size="xs"
                        editable={false}
                      />
                      <span>{account.name}</span>
                    </td>
                    <td className="p-3 font-mono text-gray-500">@{account.username}</td>
                    <td className="p-3 font-mono text-gray-500">{account.phone}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5 bg-[#fbf5f2] rounded-lg p-1 px-2 border border-amber-250">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <select
                          value={account.role}
                          onChange={(e) => {
                            onUpdateUserRole(account.id, e.target.value as Role);
                            alert(`Rol de @${account.username} actualizado a ${e.target.value}. Se verá afectado al instante.`);
                          }}
                          className="bg-transparent border-none text-xs font-extrabold text-[#904d00] focus:ring-0 cursor-pointer p-0 select-none focus:outline-none"
                        >
                          <option value="Administrador">👑 Administrador</option>
                          <option value="Líder">🎖️ Líder</option>
                          <option value="Empleado">🧑‍🍳 Empleado / Caja</option>
                          <option value="Repartidor">🏍️ Repartidor</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB CONTENT: ADVANCED OPERATIONS REPORTS */}
      {activeAdminTab === 'Reportes' && (
        <div className="space-y-6">
          
          {/* Main 3 High-Level Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white border rounded-2xl p-5 shadow-xs font-sans">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase block tracking-wider">Reporte 1: Ventas del Día</span>
              <div className="mt-2.5 flex justify-between items-baseline">
                <span className="text-2.5xl font-black text-slate-900 font-mono">${totalSalesAmountToday.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">+{ordersCountToday} tickets</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">Suma total consolidada de cobros en POS, liquidaciones y saldos activos en caja.</p>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-xs font-sans">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase block tracking-wider">Reporte 2: Ventas Semanales</span>
              <div className="mt-2.5 flex justify-between items-baseline">
                <span className="text-2.5xl font-black text-[#904d00] font-mono">${weeklyTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold">Ciclo Activo</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">Ventas semanales acumuladas correspondientes al periodo de Lunes a Domingo vigente.</p>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-xs font-sans">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase block tracking-wider">Reporte 3: Ventas Mensuales</span>
              <div className="mt-2.5 flex justify-between items-baseline">
                <span className="text-2.5xl font-black text-slate-950 font-mono">${monthlyTotalSum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">Junio 2026</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">Corte de caja estimado global de los últimos 30 días naturales de transacciones operativas.</p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Visual native weekly chart */}
            <div className="bg-white border border-gray-250 p-5 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-extrabold text-xs uppercase text-slate-700 font-mono">Progreso de Ventas de la Semana (Representación Visual)</h4>
              
              <div className="space-y-3 pt-2">
                {weeklyData.map((d, idx) => {
                  const maxAmt = Math.max(...weeklyData.map(v => v.amount)) || 1;
                  const percentWidth = Math.max(8, Math.round((d.amount / maxAmt) * 100));

                  return (
                    <div key={idx} className="space-y-1 font-sans text-xs">
                      <div className="flex justify-between text-[11px] font-medium text-gray-600 font-mono">
                        <span>{d.day}</span>
                        <span className="font-bold text-gray-900">${d.amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            d.day.includes('Sábado') ? 'bg-[#ff8c00]' : 'bg-slate-400'
                          }`}
                          style={{ width: `${percentWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ranking of products (Reporte 4: Productos más vendidos) */}
            <div className="bg-white border border-gray-250 p-5 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-extrabold text-xs uppercase text-slate-700 font-mono">Reporte 4: Ranking - Productos más Vendidos</h4>
              
              <div className="space-y-4">
                {calculatedTopSellers.map((item, index) => (
                  <div key={index} className="space-y-1 text-xs">
                    <div className="flex justify-between font-sans">
                      <span className="font-bold text-gray-950">{index + 1}. {item.name}</span>
                      <span className="text-gray-500 font-medium font-mono">{item.qty} unids. / <strong className="text-gray-900">${item.revenue.toFixed(2)}</strong></span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Report 5: Créditos Activos Summary */}
          <div className="bg-white border border-gray-205 p-5 rounded-2xl shadow-sm space-y-4 font-sans">
            <div className="border-b pb-2.5">
              <h4 className="font-extrabold text-xs uppercase text-slate-700 font-mono">Reporte 5: Cartera de Créditos Activos (Saldos Fiados)</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Cartera de cobro vigente que se encuentra activa y que debe ser supervisada.</p>
            </div>

            {activeCreditDebtors.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs">No hay deudas activas pendientes de cobro.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {activeCreditDebtors.map((client) => {
                  const lastMove = client.history && client.history.length > 0 ? client.history[0].notes || client.history[0].label : 'Sin notas';
                  return (
                    <div key={client.id} className="bg-slate-50 border p-3.5 rounded-xl border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-gray-950 font-sans block">{client.name}</strong>
                          <span className="text-[10px] text-gray-400">{formatStoreName(client.branch)}</span>
                        </div>
                        <span className="text-md font-bold font-mono text-[#bb171d]">${client.balance.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t border-gray-150 mt-2.5 pt-1.5 text-[10px] text-gray-500 space-y-0.5 font-mono">
                        <p>Días vencido: <strong className="text-gray-900">{client.daysOverdue} días</strong></p>
                        <p className="truncate">Causa: <span className="italic">"{lastMove}"</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {activeAdminTab === 'HistorialCortes' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 font-sans text-xs">
          <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 font-sans">
                <FileText className="w-5 h-5 text-amber-700 font-bold" />
                <span>Historial de Cortes de Caja</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed font-semibold">
                Consulta los reportes consolidados y estadísticas archivadas al realizar cada corte de caja definitivo.
              </p>
            </div>
          </div>

          {!cajaState?.historialCierres || cajaState.historialCierres.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <span className="text-3xl block">📁</span>
              <p className="font-bold text-gray-400">No se han registrado cortes de caja definitivos aún en el sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-gray-200 rounded-xl bg-slate-50/50">
              <table className="w-full text-left font-sans text-[11.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-gray-600 font-extrabold uppercase text-[9px] border-b-2 border-gray-200">
                    <th className="p-3 pl-4">ID Corte</th>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Total Ventas</th>
                    <th className="p-3">Diferencia</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3 pr-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cajaState.historialCierres.map((c) => {
                    const diffValue = c.diferencia || 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors bg-white font-semibold">
                        <td className="p-3.5 pl-4 font-bold font-mono text-gray-900">{c.id}</td>
                        <td className="p-3.5 text-gray-600">
                          {c.fecha} {c.hora && <span className="text-[10px] text-gray-400 font-mono">({c.hora})</span>}
                        </td>
                        <td className="p-3.5 font-bold font-mono text-gray-900">
                          ${c.ventas.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`p-3.5 font-bold font-mono ${diffValue < 0 ? 'text-rose-650' : diffValue > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {diffValue >= 0 ? '+' : ''}${diffValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-gray-700">{c.usuario}</td>
                        <td className="p-3.5 pr-4 text-center">
                          <button
                            id={`btn-open-corte-${c.id}`}
                            onClick={() => setSelectedCorte(c)}
                            className="bg-amber-50 hover:bg-amber-100 text-[#904d00] font-sans font-extrabold px-3.5 py-1.5 border border-amber-200 rounded-lg shadow-2xs transition cursor-pointer text-[10.5px]"
                          >
                            Ver Reporte Detallado
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'Tiendas' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-black font-sans text-gray-900">Catálogo de Tiendas (Sucursales)</h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                Administra las sucursales del negocio. Puedes agregar nuevas sucursales, editarlas, cambiar su orden de visualización y activar/desactivar su disponibilidad.
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddStoreForm(true);
                setNewStoreName('');
              }}
              className="bg-[#904d00] hover:bg-amber-950 text-white font-sans font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-97 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Sucursal</span>
            </button>
          </div>

          {showAddStoreForm && (
            <form onSubmit={handleAddStoreSubmit} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-4 max-w-md">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider font-sans">Nueva Sucursal</h4>
                <button type="button" onClick={() => setShowAddStoreForm(false)} className="text-gray-400 hover:text-gray-900 font-bold">X</button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Nombre de la Sucursal:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Liverpool, Martí"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 p-2.5 rounded-xl text-xs focus:outline-none text-gray-900 font-sans font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStoreForm(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#904d00] hover:bg-amber-950 text-white text-xs font-bold py-2 rounded-xl"
                >
                  Guardar Sucursal
                </button>
              </div>
            </form>
          )}

          {editingStoreId && (
            <form onSubmit={handleEditStoreSubmit} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-4 max-w-md">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider font-sans">Editar Sucursal</h4>
                <button type="button" onClick={() => setEditingStoreId(null)} className="text-gray-400 hover:text-gray-900 font-bold">X</button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Nombre de la Sucursal:</label>
                <input
                  type="text"
                  required
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 p-2.5 rounded-xl text-xs focus:outline-none text-gray-900 font-sans font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStoreId(null)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#904d00] hover:bg-amber-950 text-white text-xs font-bold py-2 rounded-xl"
                >
                  Actualizar Nombre
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-150">
              {stores.map((store, index) => (
                <div key={store.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-neutral-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-amber-850 bg-amber-50 border border-amber-200`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900 font-sans">{formatStoreName(store.name)}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          store.active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {store.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block">ID: {store.id} | Orden: {store.order}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveStore(index, -1)}
                      className="bg-neutral-50 hover:bg-neutral-100 disabled:opacity-40 p-2 border border-gray-200 rounded-lg text-gray-550 cursor-pointer animate-none"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === stores.length - 1}
                      onClick={() => handleMoveStore(index, 1)}
                      className="bg-neutral-50 hover:bg-neutral-100 disabled:opacity-40 p-2 border border-gray-200 rounded-lg text-gray-550 cursor-pointer animate-none"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingStoreId(store.id);
                        setEditStoreName(store.name);
                      }}
                      className="bg-neutral-50 hover:bg-neutral-100 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onUpdateStore({
                          ...store,
                          active: !store.active
                        });
                      }}
                      className={`px-3 py-2 border rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                        store.active 
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' 
                          : 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <span>{store.active ? 'Desactivar' : 'Activar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que deseas eliminar la sucursal "${store.name}"?`)) {
                          onDeleteStore(store.id);
                        }
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 border border-rose-150 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'Cupones' && (
        <div className="space-y-6 animate-fade-in text-xs">
          {/* HEADER CARD */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-black font-sans text-gray-900">Gestión Manual de Cupones</h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                Crea, edita, elimina y asigna cupones de descuento a los clientes registrados en la plataforma.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateCouponModal(true);
                setNewCopName('');
                setNewCopCode('');
                setNewCopType('porcentaje');
                setNewCopValue(0);
                setNewCopValidUntil('2026-12-31');
                setNewCopActive(true);
                setNewCopSelectedClients([]);
                setClientSearchQuery('');
              }}
              className="bg-[#904d00] hover:bg-amber-950 text-white font-sans font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-97 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cupón</span>
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar cupones por código, nombre o cliente asignado..."
              value={couponSearchFilter}
              onChange={(e) => setCouponSearchFilter(e.target.value)}
              className="bg-transparent border-0 text-xs focus:outline-none w-full text-gray-900 font-sans font-bold"
            />
            {couponSearchFilter && (
              <button 
                onClick={() => setCouponSearchFilter('')}
                className="text-gray-400 hover:text-gray-600 font-bold font-sans"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* LIST OF COUPONS */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-150 text-[10px] uppercase font-black tracking-wider text-gray-500 font-sans">
                    <th className="p-4">Nombre / Código</th>
                    <th className="p-4">Tipo Descuento</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Cliente Asignado</th>
                    <th className="p-4">Vencimiento</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Uso</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans font-bold text-gray-700 text-xs">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-gray-400 text-xs font-semibold">
                        No se encontraron cupones.
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => {
                      const client = clientAccounts.find(
                        a => a.id === coupon.clientId || a.phone === coupon.clientId
                      );
                      const isExpired = new Date(coupon.validUntil) < new Date(new Date().setHours(0,0,0,0));
                      const isActive = coupon.active !== false;

                      return (
                        <tr key={coupon.id} className="hover:bg-neutral-50/50 transition">
                          <td className="p-4">
                            <div className="font-extrabold text-gray-900 text-xs">{coupon.name || 'Cupón de Descuento'}</div>
                            <div className="font-mono text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 inline-block mt-0.5">
                              🎟️ {coupon.code}
                            </div>
                          </td>
                          <td className="p-4 uppercase text-[10px]">
                            {coupon.type === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                          </td>
                          <td className="p-4 text-[#904d00]">
                            {coupon.type === 'porcentaje' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                          </td>
                          <td className="p-4">
                            {client ? (
                              <div>
                                <div className="text-gray-950">{client.name}</div>
                                <div className="text-[10px] text-gray-400">{client.phone}</div>
                              </div>
                            ) : coupon.clientId === 'all_clients' ? (
                              <span className="text-emerald-700 font-black">Todos los Clientes</span>
                            ) : (
                              <span className="text-gray-400 font-semibold italic">Cliente ID: {coupon.clientId}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={isExpired ? "text-rose-600" : "text-gray-600"}>
                              {coupon.validUntil}
                            </span>
                            {isExpired && (
                              <span className="text-[9px] font-bold text-rose-500 ml-1.5 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Expirado</span>
                            )}
                          </td>
                          <td className="p-4">
                            {isActive ? (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] uppercase border border-emerald-200">Activo</span>
                            ) : (
                              <span className="bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full text-[9px] uppercase border border-neutral-250">Inactivo</span>
                            )}
                          </td>
                          <td className="p-4">
                            {coupon.used ? (
                              <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[9px] uppercase border border-rose-200">Usado</span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[9px] uppercase border border-amber-200">Disponible</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingCoupon(coupon)}
                                className="bg-neutral-50 hover:bg-neutral-100 border border-gray-200 text-gray-700 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-700 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: CREATE MANUAL COUPON */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs">
          <form onSubmit={handleCreateCouponsSubmit} className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-md w-full overflow-hidden">
            
            <div className="bg-[#904d00] text-white p-4 font-sans font-extrabold flex justify-between items-center text-sm shadow">
              <span>Crear y Asignar Nuevo Cupón</span>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateCouponModal(false);
                  setNewCopSelectedClients([]);
                }} 
                className="text-white hover:text-gray-150"
              >
                X
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="text-gray-500 font-bold">Nombre del Cupón:</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Descuento Especial de Cumpleaños"
                  value={newCopName}
                  onChange={(e) => setNewCopName(e.target.value)}
                  className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-bold font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold">Código del Cupón:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. REGALO20"
                    value={newCopCode}
                    onChange={(e) => setNewCopCode(e.target.value)}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold">Fecha de Vencimiento:</label>
                  <input 
                    type="date" 
                    required
                    value={newCopValidUntil}
                    onChange={(e) => setNewCopValidUntil(e.target.value)}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-sans font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold">Tipo de Descuento:</label>
                  <select
                    value={newCopType}
                    onChange={(e) => setNewCopType(e.target.value as any)}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-sans font-bold"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Cantidad Fija ($)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 font-bold">Valor del Descuento:</label>
                  <input 
                    type="number" 
                    required
                    min={0.01}
                    step="any"
                    value={newCopValue || ''}
                    onChange={(e) => setNewCopValue(parseFloat(e.target.value) || 0)}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-sans font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newCopActive"
                  checked={newCopActive}
                  onChange={(e) => setNewCopActive(e.target.checked)}
                  className="rounded border-gray-350 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="newCopActive" className="text-gray-700 font-bold cursor-pointer select-none">Cupón Activo (Disponible para uso)</label>
              </div>

              <div className="border-t border-gray-150 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Asignar a Clientes ({newCopSelectedClients.length} seleccionados):</label>
                  <div className="flex gap-2 font-bold font-sans">
                    <button
                      type="button"
                      onClick={() => setNewCopSelectedClients(clientAccounts.map(c => c.id))}
                      className="text-[#904d00] hover:underline text-[10px] cursor-pointer"
                    >
                      Todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewCopSelectedClients([])}
                      className="text-[#904d00] hover:underline text-[10px] cursor-pointer"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>
                
                <input
                  type="text"
                  placeholder="Filtrar clientes por nombre o teléfono..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="bg-white text-gray-900 w-full p-2 border border-gray-300 rounded-lg text-xs font-sans font-bold"
                />

                <div className="max-h-[150px] overflow-y-auto border border-gray-200 rounded-lg p-2 divide-y divide-gray-50 bg-slate-50 scrollbar-thin">
                  {clientAccounts.filter(client => {
                    const q = clientSearchQuery.toLowerCase().trim();
                    return client.name.toLowerCase().includes(q) || client.phone.includes(q);
                  }).length === 0 ? (
                    <div className="text-center py-5 text-gray-400 font-semibold">No se encontraron clientes.</div>
                  ) : (
                    clientAccounts
                      .filter(client => {
                        const q = clientSearchQuery.toLowerCase().trim();
                        return client.name.toLowerCase().includes(q) || client.phone.includes(q);
                      })
                      .map(client => {
                        const isChecked = newCopSelectedClients.includes(client.id);
                        return (
                          <div 
                            key={client.id} 
                            onClick={() => {
                              if (isChecked) {
                                setNewCopSelectedClients(prev => prev.filter(id => id !== client.id));
                              } else {
                                setNewCopSelectedClients(prev => [...prev, client.id]);
                              }
                            }}
                            className="flex items-center gap-2.5 py-2 px-1 hover:bg-amber-50/50 cursor-pointer transition rounded"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                            />
                            <AvatarUploader
                              avatar={client.avatar}
                              avatarUrl={client.avatarUrl}
                              name={client.name}
                              size="xs"
                              editable={false}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-900 truncate">{client.name}</div>
                              <div className="text-[10px] text-gray-400 font-semibold">{client.phone} | {formatStoreName(client.defaultStore)}</div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-gray-200 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateCouponModal(false);
                  setNewCopSelectedClients([]);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold font-sans cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#904d00] hover:bg-amber-950 text-white px-5 py-2 rounded-xl text-xs font-bold font-sans shadow cursor-pointer"
              >
                Asignar y Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: EDIT COUPON */}
      {editingCoupon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs">
          <form onSubmit={handleEditCouponSubmit} className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden">
            
            <div className="bg-amber-700 text-white p-4 font-sans font-extrabold flex justify-between items-center text-sm shadow">
              <span>Editar Cupón - {editingCoupon.code}</span>
              <button 
                type="button" 
                onClick={() => setEditingCoupon(null)} 
                className="text-white hover:text-gray-150"
              >
                X
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="text-gray-500 font-bold">Nombre del Cupón:</label>
                <input 
                  type="text" 
                  required
                  value={editingCoupon.name || ''}
                  onChange={(e) => setEditingCoupon({...editingCoupon, name: e.target.value})}
                  className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-bold font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold">Código:</label>
                  <input 
                    type="text" 
                    required
                    value={editingCoupon.code}
                    onChange={(e) => setEditingCoupon({...editingCoupon, code: e.target.value})}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold">Fecha de Vencimiento:</label>
                  <input 
                    type="date" 
                    required
                    value={editingCoupon.validUntil}
                    onChange={(e) => setEditingCoupon({...editingCoupon, validUntil: e.target.value})}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-sans font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold">Tipo de Descuento:</label>
                  <select
                    value={editingCoupon.type}
                    onChange={(e) => setEditingCoupon({...editingCoupon, type: e.target.value as any})}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-sans font-bold"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Cantidad Fija ($)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 font-bold">Valor del Descuento:</label>
                  <input 
                    type="number" 
                    required
                    min={0.01}
                    step="any"
                    value={editingCoupon.value || ''}
                    onChange={(e) => setEditingCoupon({...editingCoupon, value: parseFloat(e.target.value) || 0})}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-sans font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-500 font-bold">Propietario del Cupón (Cliente):</label>
                <select
                  value={editingCoupon.clientId}
                  onChange={(e) => setEditingCoupon({...editingCoupon, clientId: e.target.value})}
                  className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs font-sans font-bold"
                >
                  <option value="all_clients">Todos los Clientes (General)</option>
                  {clientAccounts.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editCopActive"
                  checked={editingCoupon.active !== false}
                  onChange={(e) => setEditingCoupon({...editingCoupon, active: e.target.checked})}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="editCopActive" className="text-gray-700 font-bold cursor-pointer select-none">Cupón Activo</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editCopUsed"
                  checked={editingCoupon.used}
                  onChange={(e) => setEditingCoupon({...editingCoupon, used: e.target.checked})}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="editCopUsed" className="text-gray-700 font-bold cursor-pointer select-none">Cupón ya Usado</label>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-gray-200 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold font-sans cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-2 rounded-xl text-xs font-bold font-sans shadow cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: CREATE NEW PRODUCT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs">
          <form onSubmit={handleAddProductSubmit} className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden">
            
            <div className="bg-[#904d00] text-white p-4 font-sans font-extrabold text-sm flex justify-between items-center">
              <span>Agregar Nuevo Producto</span>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-white hover:text-gray-200 font-bold">X</button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="text-gray-500 font-bold">Nombre del Alimento / Snack:</label>
                <input 
                  type="text" 
                  required
                  placeholder="Por ej. Jugo Verde Súper"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                  className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold">Categoría:</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value as any})}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="Bebidas frías">Bebidas frías</option>
                    <option value="Bebidas calientes">Bebidas calientes</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Comidas">Comidas</option>
                    <option value="Tortas y Sándwiches">Tortas y Sándwiches</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 font-bold">Precio de Venta ($):</label>
                  <input 
                    type="number" 
                    min="1" 
                    step="0.5" 
                    required
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({...newProductForm, price: parseFloat(e.target.value) || 0})}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Diseño de Layout / Configurador:</label>
                <select
                  value={newProductForm.productLayout || 'layout_1_simple'}
                  onChange={(e) => setNewProductForm({...newProductForm, productLayout: e.target.value as any})}
                  className="bg-white text-gray-900 w-full p-2 border border-gray-300 rounded-lg font-bold"
                >
                  <option value="layout_1_simple">LAYOUT 1 — SIN CONFIGURACIÓN (Simple)</option>
                  <option value="layout_2_cantidades">LAYOUT 2 — SELECCIÓN POR CANTIDADES</option>
                  <option value="layout_3_platillo">LAYOUT 3 — PLATILLO</option>
                  <option value="layout_4_huevos">LAYOUT 4 — HUEVOS AL GUSTO</option>
                  <option value="layout_5_frutas">LAYOUT 5 — FRUTAS</option>
                  <option value="layout_6_proteina">LAYOUT 6 — PROTEÍNA + INGREDIENTES</option>
                  <option value="layout_7_calientes">LAYOUT 7 — BEBIDAS CALIENTES</option>
                  <option value="layout_8_aguas">LAYOUT 8 — AGUAS FRESCAS</option>
                  <option value="layout_9_jugos">LAYOUT 9 — JUGOS</option>
                </select>
              </div>

              <LayoutConfigFieldsComponent
                key={`${newProductForm.id || 'new'}_${newProductForm.productLayout}`}
                layout={newProductForm.productLayout}
                productObj={newProductForm}
                updateFn={setNewProductForm}
              />

              <div>
                <label className="text-gray-500 font-bold">Descripción / Vista catálogo:</label>
                <input 
                  type="text" 
                  placeholder="Ej: Mezcla verde con piña, kale y espinaca"
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({...newProductForm, description: e.target.value})}
                  className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60 mt-3">
                <input 
                  type="checkbox"
                  id="new-product-apply-rounding"
                  checked={newProductForm.applyRounding ?? true}
                  onChange={(e) => setNewProductForm({ ...newProductForm, applyRounding: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="new-product-apply-rounding" className="text-gray-700 font-bold text-xs cursor-pointer">
                  Aplicar regla de redondeo a múltiplo de 5 superior en caja
                </label>
              </div>

              {/* IMAGE UPLOAD & PREVIEW */}
              <div className="space-y-1">
                <label className="text-gray-500 font-bold block">Imagen de Producto (Cambiar / Subir / Eliminar):</label>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, false)}
                  className="border-2 border-dashed border-gray-250 hover:border-amber-450 bg-slate-50 p-3 rounded-lg text-center cursor-pointer transition-colors relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, false)}
                    className="hidden"
                  />
                  
                  {newProductForm.image ? (
                    <div className="flex items-center justify-center gap-3">
                      <img 
                        src={newProductForm.image} 
                        alt="Previsualización" 
                        className="w-12 h-12 object-cover rounded-lg border bg-white"
                      />
                      <div className="text-left">
                        <span className="text-[10px] text-gray-400 block font-bold">Imagen Listo</span>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(false); }}
                          className="text-xs text-rose-600 font-bold hover:underline"
                        >
                          Eliminar Imagen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 mx-auto text-gray-400" />
                      <p className="text-[10px] text-gray-500">Arrastra una foto aquí o haz clic para subir</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-150 flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="w-1/2 bg-white text-gray-700 py-2.5 border rounded-lg hover:bg-gray-100 font-bold"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="w-1/2 bg-[#904d00] hover:bg-amber-900 text-white py-2.5 rounded-lg font-bold shadow"
              >
                Agregar Producto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: EDIT PRODUCT (FULL FORM WITH UPLOAD / IMAGE REMOVE & CUSTOM NAMES) */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs">
          <form onSubmit={handleEditProductSubmit} className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden">
            
            <div className="bg-amber-700 text-white p-4 font-sans font-extrabold flex justify-between items-center text-sm shadow">
              <span>Editar Producto - {editingProduct.name}</span>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-white hover:text-gray-150">X</button>
            </div>

            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="text-gray-500 font-bold">Nombre del Producto:</label>
                <input 
                  type="text" 
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold">Categoría:</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value as any})}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="Bebidas frías">Bebidas frías</option>
                    <option value="Bebidas calientes">Bebidas calientes</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Comidas">Comidas</option>
                    <option value="Tortas y Sándwiches">Tortas y Sándwiches</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 font-bold">Precio ($):</label>
                  <input 
                    type="number" 
                    min="1" 
                    step="0.5" 
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                    className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-500 font-bold">Descripción / Catálogo:</label>
                <input 
                  type="text" 
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="bg-white text-gray-900 w-full mt-1 p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60 mt-3">
                <input 
                  type="checkbox"
                  id="edit-product-apply-rounding"
                  checked={editingProduct.applyRounding ?? true}
                  onChange={(e) => setEditingProduct({ ...editingProduct, applyRounding: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="edit-product-apply-rounding" className="text-gray-700 font-bold text-xs cursor-pointer">
                  Aplicar regla de redondeo a múltiplo de 5 superior en caja
                </label>
              </div>

              {/* IMAGE CHANGE, BASE64 UPLOADER AND DELETION ZONE */}
              <div className="space-y-1">
                <label className="text-gray-500 font-bold block">Imagen de Producto (Subir / Cambiar / Eliminar):</label>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, true)}
                  className="border-2 border-dashed border-orange-200 hover:border-amber-400 bg-orange-50/10 p-3 rounded-lg text-center cursor-pointer transition-colors relative"
                  onClick={() => editFileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={editFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, true)}
                    className="hidden"
                  />
                  
                  <div className="flex items-center justify-center gap-3">
                    <img 
                      src={editingProduct.image} 
                      alt="Miniatura" 
                      className="w-12 h-12 object-cover rounded-lg border bg-white shadow"
                    />
                    <div className="text-left font-sans">
                      <span className="text-[10px] text-gray-500 block">Modificar archivo o URL</span>
                      <div className="flex gap-2.5 mt-0.5">
                        <span className="text-[10.5px] text-amber-700 font-bold hover:underline">Subir Nueva</span>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(true); }}
                          className="text-[10.5px] text-rose-600 font-bold hover:underline"
                        >
                          Eliminar Imagen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Diseño de Layout / Configurador:</label>
                <select
                  value={editingProduct.productLayout || 'layout_1_simple'}
                  onChange={(e) => setEditingProduct({...editingProduct, productLayout: e.target.value as any})}
                  className="bg-white text-gray-900 w-full p-2 border border-gray-300 rounded-lg text-xs font-bold"
                >
                  <option value="layout_1_simple">LAYOUT 1 — SIN CONFIGURACIÓN (Simple)</option>
                  <option value="layout_2_cantidades">LAYOUT 2 — SELECCIÓN POR CANTIDADES</option>
                  <option value="layout_3_platillo">LAYOUT 3 — PLATILLO</option>
                  <option value="layout_4_huevos">LAYOUT 4 — HUEVOS AL GUSTO</option>
                  <option value="layout_5_frutas">LAYOUT 5 — FRUTAS</option>
                  <option value="layout_6_proteina">LAYOUT 6 — PROTEÍNA + INGREDIENTES</option>
                  <option value="layout_7_calientes">LAYOUT 7 — BEBIDAS CALIENTES</option>
                  <option value="layout_8_aguas">LAYOUT 8 — AGUAS FRESCAS</option>
                  <option value="layout_9_jugos">LAYOUT 9 — JUGOS</option>
                </select>
              </div>

              <LayoutConfigFieldsComponent
                key={`${editingProduct.id || 'edit'}_${editingProduct.productLayout}`}
                layout={editingProduct.productLayout}
                productObj={editingProduct}
                updateFn={setEditingProduct}
              />
            </div>

            <div className="bg-gray-55 p-4 border-t border-gray-150 flex gap-2">
              <button 
                type="button" 
                onClick={() => setEditingProduct(null)}
                className="w-1/2 bg-white text-gray-700 py-2.5 border rounded-lg hover:bg-neutral-100 font-bold"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="w-1/2 bg-[#006e0a] hover:bg-emerald-800 text-white py-2.5 rounded-lg font-bold shadow"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: ADD DAILY TEMPORARY SPECIALS (AGREGAR PLATILLOS TEMPORALES) */}
      {showAddTemporalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs font-sans">
          <form onSubmit={handleAddTemporalPlate} className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden text-slate-800">
            <div className="bg-amber-600 text-white p-4 font-extrabold text-sm text-center">
              <span>Agregar Platillo Temporal del Día</span>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Nombre Especial del Platillo:</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Licuado de Fresa Premium con yogurt de Búfala"
                  value={temporalPlateForm.name}
                  onChange={(e) => setTemporalPlateForm({...temporalPlateForm, name: e.target.value})}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Precio de Venta ($):</label>
                  <input 
                    type="number" 
                    min="1" 
                    step="0.5" 
                    required
                    value={temporalPlateForm.price}
                    onChange={(e) => setTemporalPlateForm({...temporalPlateForm, price: parseFloat(e.target.value) || 0})}
                    className="bg-white text-gray-900 w-full p-2.5 border border-gray-300 rounded-xl font-mono font-extrabold"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1">Categoría POS:</label>
                  <select
                    value={temporalPlateForm.category}
                    onChange={(e) => setTemporalPlateForm({...temporalPlateForm, category: e.target.value as any})}
                    className="bg-white text-gray-900 w-full p-2.5 border border-gray-300 rounded-xl"
                  >
                    <option value="Comida y Snacks">🥗 Comida y Snacks</option>
                    <option value="Licuados y Jugos">🍹 Licuados y Jugos</option>
                    <option value="Otros">🥪 Otros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Descripción corta (Se añadirá al Menú):</label>
                <textarea
                  required
                  placeholder="Ej: Mezcla exquisita de frutas con miel y granola orgánica crocante"
                  value={temporalPlateForm.description}
                  onChange={(e) => setTemporalPlateForm({...temporalPlateForm, description: e.target.value})}
                  className="bg-white text-gray-900 w-full p-2.5 border border-gray-300 rounded-xl max-h-20"
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Imagen URL del Platillo:</label>
                <input 
                  type="text" 
                  value={temporalPlateForm.image}
                  onChange={(e) => setTemporalPlateForm({...temporalPlateForm, image: e.target.value})}
                  className="bg-white text-gray-900 w-full p-2 border border-gray-300 rounded-lg text-[10px]"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-150 flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowAddTemporalModal(false)}
                className="w-1/2 bg-white text-gray-755 py-2.5 border rounded-xl hover:bg-gray-100 font-bold"
              >
                Cerrar
              </button>
              <button 
                type="submit"
                className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-extrabold shadow"
              >
                Agregar Especial
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: DETALLE DE CORTE DE CAJA */}
      {selectedCorte && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-2xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-800 text-white p-4 font-sans font-extrabold flex justify-between items-center text-sm shadow">
              <span>Reporte de Corte Definitivo</span>
              <button 
                type="button" 
                onClick={() => setSelectedCorte(null)} 
                className="text-white hover:text-gray-300 font-black cursor-pointer bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded"
              >
                X
              </button>
            </div>

            <div id="print-ticket-area" className="p-6 space-y-4 overflow-y-auto scrollbar-thin bg-neutral-50/50 flex-1">
              
              {/* TICKET STYLE CONTAINER */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4 font-mono select-text relative">
                {/* Simulated ticket top header */}
                <div className="text-center space-y-1">
                  <h4 className="font-black text-gray-900 leading-none tracking-tight text-sm">RINCONCITO FRUTAL</h4>
                  <p className="text-[10px] text-gray-400">Snacks & Bebidas Saludables</p>
                  <p className="text-[9.5px] text-gray-400">--- TICKET DE CIERRE ---</p>
                </div>

                <div className="border-t border-b border-dashed border-gray-300 py-2.5 my-2 space-y-1 text-[10.5px] text-gray-600">
                  <p><span className="font-bold text-gray-800">Corte ID:</span> {selectedCorte.id}</p>
                  <p><span className="font-bold text-gray-800">Fecha:</span> {selectedCorte.fecha}</p>
                  <p><span className="font-bold text-gray-800">Hora:</span> {selectedCorte.hora || 'No registrada'}</p>
                  <p><span className="font-bold text-gray-800">Usuario Perf:</span> {selectedCorte.usuario}</p>
                </div>

                {/* VENTAS POR CATEGORÍA */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">1. Ventas por Categoría:</span>
                  <div className="space-y-1 pl-1 text-[11px] text-gray-700">
                    <div className="flex justify-between">
                      <span>• Licuados y Jugos:</span>
                      <strong className="text-gray-900">${(selectedCorte.ventasCategorias?.licuadosJugos || 0).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Comida y Lonches:</span>
                      <strong className="text-gray-900">${(selectedCorte.ventasCategorias?.comida || 0).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Snacks y Sabritas:</span>
                      <strong className="text-gray-900">${(selectedCorte.ventasCategorias?.snacks || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* RESUMEN OPERACIONAL */}
                <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">2. Operación del Día:</span>
                  <div className="space-y-1 pl-1 text-[11px] text-gray-700">
                    <div className="flex justify-between">
                      <span>• Total Pedidos:</span>
                      <strong className="text-gray-900">{selectedCorte.pedidosCorte || 0} recibidos</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Créditos Fiados:</span>
                      <strong className="text-rose-700">${(selectedCorte.creditosOtorgados || 0).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Efectivo Final:</span>
                      <strong className="text-gray-950">${(selectedCorte.efectivoFinal || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* FINANCIALS & DISCREPANCY */}
                <div className="border-t border-dashed border-gray-250 pt-2.5 my-2.5 space-y-1 font-mono">
                  <div className="flex justify-between text-[11.5px] font-black text-gray-900">
                    <span>TOTAL VENTAS NETAS:</span>
                    <span>${selectedCorte.ventas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-[11.5px] font-black items-center mt-2">
                    <span>DIFERENCIA (ARQUEO):</span>
                    <span className={`${selectedCorte.diferencia < 0 ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50'} px-2 py-0.5 rounded font-bold`}>
                      {selectedCorte.diferencia >= 0 ? '+' : ''}${selectedCorte.diferencia.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* TOP 3 PRODUCTOS */}
                <div className="space-y-1.5 pt-2.5 border-t border-dashed border-gray-250">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">3. Top 3 Más Vendidos:</span>
                  {selectedCorte.topProductos && selectedCorte.topProductos.length > 0 ? (
                    <div className="space-y-1.5 pl-1 text-[10.5px] text-gray-700 font-mono">
                      {selectedCorte.topProductos.map((prod: any, i: number) => (
                        <div key={i} className="flex justify-between items-baseline font-mono text-xs">
                          <span className="text-gray-900 font-sans font-bold leading-normal truncate max-w-[200px]">{i+1}. {prod.name}</span>
                          <span className="text-gray-600 shrink-0 select-all font-bold">x{prod.quantity} unids.</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic pl-1 leading-normal">Sin estadísticas de productos registradas en este corte.</p>
                  )}
                </div>

                {/* 4. EXPENSES AND WITHDRAWALS BREAKDOWN */}
                <div className="space-y-1.5 pt-2.5 border-t border-dashed border-gray-250">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">4. Gastos y Retiros del Periodo:</span>
                  {selectedCorte.gastosRetiros && selectedCorte.gastosRetiros.length > 0 ? (
                    <div className="space-y-3 pl-1 text-[10.5px] text-gray-700 font-mono">
                      {selectedCorte.gastosRetiros.map((mov: any) => {
                        const itemDate = new Date(mov.timestamp);
                        const formattedDate = isNaN(itemDate.getTime()) ? 'Reciente' : itemDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
                        const formattedTime = isNaN(itemDate.getTime()) ? '' : itemDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <div key={mov.id} className="border-b border-dotted border-gray-200 pb-2.5 last:border-0 last:pb-0 text-left">
                            <div className="flex justify-between font-bold text-[#111]">
                              <span>
                                {mov.type === 'Gasto' ? '🎟️ GASTO' : '🏦 RETIRO'}
                              </span>
                              <span className={mov.type === 'Gasto' ? 'text-rose-700 font-bold' : 'text-slate-700 font-bold'}>
                                ${mov.amount.toFixed(2)}
                              </span>
                            </div>
                            
                            {mov.type === 'Gasto' ? (
                              <div className="text-[9.5px] text-gray-500 mt-1 leading-relaxed pl-1">
                                <p><span className="font-semibold text-gray-700">Concepto:</span> {mov.concept}</p>
                                <p><span className="font-semibold text-gray-700 font-mono">Registro:</span> {formattedDate} {formattedTime} por {mov.usuario || selectedCorte.usuario}</p>
                              </div>
                            ) : (
                              <div className="text-[9.5px] text-gray-500 mt-1 leading-relaxed pl-1">
                                <p><span className="font-semibold text-gray-700">Entregó (Cajero):</span> {mov.usuario || selectedCorte.usuario}</p>
                                <p><span className="font-semibold text-gray-700">Recibió (Líder):</span> {mov.clientName || 'Líder de Turno'}</p>
                                <p><span className="font-semibold text-gray-700 font-mono">Registro:</span> {formattedDate} {formattedTime}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic pl-1 leading-normal">Sin gastos ni retiros registrados en este periodo.</p>
                  )}
                </div>

                {/* Footnotes */}
                <div className="pt-3 text-[9px] text-center text-gray-400 uppercase font-bold border-t border-dashed border-gray-200">
                  *** Fin de Reporte ***
                </div>
              </div>

            </div>

            <div className="bg-gray-100 p-4 border-t border-gray-150 flex gap-2">
              <button 
                type="button" 
                onClick={() => setSelectedCorte(null)}
                className="w-1/2 bg-white text-gray-755 py-2.5 border rounded-xl hover:bg-gray-200 font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button 
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-1/2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:shadow-md active:scale-98 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Reporte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-sm w-full overflow-hidden text-slate-800">
            <div className="bg-rose-50 p-4 border-b border-rose-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-black text-rose-800 font-mono tracking-wider block">Confirmación Requerida</span>
                <h3 className="font-sans font-black text-rose-950 text-sm sm:text-base leading-none mt-0.5">Eliminar Producto</h3>
              </div>
              <button 
                onClick={() => setProductToDelete(null)}
                className="text-gray-450 hover:text-gray-900 bg-white p-1 rounded-full border border-gray-150 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                ¿Estás seguro de que deseas eliminar permanentemente el producto <strong>"{productToDelete.name}"</strong>?
              </p>
              <div className="bg-red-50 text-red-900 border border-red-100 rounded-xl p-3 text-[10.5px] font-semibold leading-relaxed">
                🚨 <strong>Atención:</strong> Esta acción eliminará por completo el producto de la base de datos local, incluyendo sus variantes, imágenes y configuraciones. Desaparecerá de inmediato de POS, Cocina, Vista Cliente y Menú del Día sin requerir recargar la página.
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-2">
              <button 
                type="button" 
                onClick={() => setProductToDelete(null)}
                className="w-1/2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-black py-2.5 rounded-xl text-center cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (onDeleteProduct) {
                    onDeleteProduct(productToDelete.id);
                  }
                  setProductToDelete(null);
                }}
                className="w-1/2 bg-red-650 hover:bg-red-700 border border-red-700 text-white text-xs font-black py-2.5 rounded-xl text-center shadow-md cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPABASE SYNC TAB ─────────────────────────────────────────── */}
      {activeAdminTab === 'Supabase' && (
        <div className="space-y-5">

          {/* Header */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-base font-sans">Sincronización con Supabase</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Importa el catálogo actual al servidor en la nube. Seguro de ejecutar múltiples veces — usa UPSERT,
                no crea duplicados. El catálogo local sigue funcionando sin interrupciones.
              </p>
            </div>
          </div>

          {/* Estado de conexión */}
          <div className={`border rounded-2xl p-4 flex items-center gap-3 ${
            isSupabaseConfigured
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <span className={`w-3 h-3 rounded-full shrink-0 ${
              isSupabaseConfigured ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
            }`} />
            <div>
              <p className={`text-xs font-black ${
                isSupabaseConfigured ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                {isSupabaseConfigured ? 'Cliente Supabase configurado ✓' : 'Supabase no configurado'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isSupabaseConfigured
                  ? 'VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY detectados correctamente.'
                  : 'Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env'}
              </p>
            </div>
          </div>

          {/* Estado de autenticación para escritura */}
          {isSupabaseConfigured && (
            <div className="border rounded-2xl p-4 flex items-center gap-3 bg-amber-50 border-amber-200">
              <span className="w-3 h-3 rounded-full shrink-0 bg-amber-500" />
              <div>
                <p className="text-xs font-black text-amber-800">
                  🔒 Escritura deshabilitada — Sin sesión de Supabase Auth
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  La lectura del catálogo funciona correctamente. Para sincronizar o escribir datos en Supabase,
                  implementa autenticación de usuarios (Supabase Auth) en una fase futura.
                </p>
              </div>
            </div>
          )}

          {/* Panel de seed */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-slate-600" />
              <h4 className="font-black text-sm text-gray-900 font-sans">Importar catálogo a Supabase</h4>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 space-y-1 border border-slate-200">
              <p>• <strong>Productos a importar:</strong> {products.length} productos del catálogo actual</p>
              <p>• <strong>Operación:</strong> UPSERT — actualiza si existe, inserta si no</p>
              <p>• <strong>Seguro:</strong> No elimina ni modifica el catálogo local</p>
              <p>• <strong>Repetible:</strong> Puedes ejecutarlo cuantas veces quieras</p>
            </div>

            {/* Resultado de la última ejecución */}
            {seedResult && (
              <div className={`rounded-xl p-3 text-xs border ${
                seedStatus === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <p className="font-black mb-1">
                  {seedStatus === 'success' ? '✅ Sincronización completada' : '❌ Sincronización con errores'}
                </p>
                <p>Sincronizados: <strong>{seedResult.upserted}/{seedResult.total}</strong> productos en <strong>{seedResult.durationMs} ms</strong></p>
                {seedResult.errors.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    <p className="font-bold">Errores:</p>
                    {seedResult.errors.map((e, i) => (
                      <p key={i} className="font-mono text-[10px]">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              id="supabase-seed-btn"
              disabled={!isSupabaseConfigured || seedStatus === 'running'}
              onClick={async () => {
                setSeedStatus('running');
                setSeedResult(null);
                try {
                  const result = await seedProductosToSupabase(products);
                  setSeedResult(result);
                  setSeedStatus(result.errors.length === 0 ? 'success' : 'error');
                } catch (err: any) {
                  setSeedResult({ total: products.length, upserted: 0, errors: [err?.message || 'Error desconocido'], durationMs: 0 });
                  setSeedStatus('error');
                }
              }}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
                !isSupabaseConfigured
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : seedStatus === 'running'
                  ? 'bg-slate-100 text-slate-500 cursor-wait border border-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md cursor-pointer'
              }`}
            >
              {seedStatus === 'running' ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /><span>Sincronizando...</span></>
              ) : (
                <><CloudUpload className="w-4 h-4" /><span>Sincronizar {products.length} productos → Supabase</span></>
              )}
            </button>

            {!isSupabaseConfigured && (
              <p className="text-center text-[11px] text-rose-600 font-bold">
                ⚠️ Configura Supabase en .env antes de sincronizar
              </p>
            )}
          </div>

          {/* Instrucciones para aplicar la migración SQL */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <h4 className="font-black text-sm text-gray-900 font-sans">Requisito previo: Aplicar migración SQL</h4>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Antes de sincronizar por primera vez, asegúrate de haber creado la tabla <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">productos</code> en
              tu proyecto de Supabase ejecutando el siguiente SQL en el <strong>SQL Editor del panel de Supabase</strong>:
            </p>
            <div className="bg-slate-900 rounded-xl p-3 text-[10px] font-mono text-slate-300 leading-relaxed">
              <p className="text-slate-500">-- Ir a: Supabase Dashboard → SQL Editor → New Query</p>
              <p className="text-slate-500">-- Pegar el contenido de:</p>
              <p className="text-emerald-400">supabase/migrations/20260626000001_create_productos.sql</p>
              <p className="text-slate-500">-- Clic en Run ▶</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
