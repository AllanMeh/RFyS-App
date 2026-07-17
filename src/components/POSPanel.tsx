/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, OrderItem, Order, ClientDebt, StoreInfo } from '../types';
import { formatStoreName } from '../lib/database/sucursales';
import { 
  ShoppingCart, Plus, Minus, Trash2, Search, Sparkles, Send, X, 
  ArrowRight, UserPlus, CreditCard, ChevronRight, Check, AlertCircle, 
  Coffee, RefreshCw, Clock, Store, User, BookOpen, AlertTriangle, Image as ImageIcon, Package
} from 'lucide-react';
import { CustomizationsRenderer } from './CustomizationsRenderer';

interface POSPanelProps {
  products: Product[];
  clients: ClientDebt[];
  onAddOrder: (newOrder: Order) => void;
  onAddClient: (newClient: ClientDebt) => void;
  isStoreClosed?: boolean;
  editingOrder?: Order | null;
  onSaveEditedOrder?: (updatedOrder: Order) => void;
  onCancelEdit?: () => void;
  stores: StoreInfo[];
  polloStatus?: { pierna: boolean; muslo: boolean };
}

// 6 Required Categories
type PosCategory = 'Bebidas Frías' | 'Frutas' | 'Tortas y Sándwiches' | 'Bebidas Calientes' | 'Comida' | 'Snacks';

interface HelperMenuItem {
  id: string;
  name: string;
  p: string;
  price: number;
  type: string;
  subType?: string;
  desc: string;
}

export default function POSPanel({ 
  products, 
  clients, 
  onAddOrder, 
  isStoreClosed = false,
  editingOrder = null,
  onSaveEditedOrder,
  onCancelEdit,
  stores = [],
  polloStatus = { pierna: true, muslo: true }
}: POSPanelProps) {
  if (isStoreClosed) {
    return (
      <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-red-200/60 p-12 max-w-2xl mx-auto text-center space-y-6 shadow-md mt-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-650 mx-auto border border-red-200 shadow-sm">
          <Store className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-red-950 font-sans tracking-tight">
            Servicio de Tienda Cerrado
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm font-medium max-w-md mx-auto leading-relaxed">
            Administración ha desactivado la toma de pedidos. En este momento no se admiten nuevos tickets en el Punto de Venta (POS).
          </p>
        </div>
        <div className="bg-red-50 text-red-900 border border-red-105 rounded-2xl p-4 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
          💡 Para reanudar el registro de pedidos, un Administrador debe habilitar la tienda desde la pestaña de <strong>Administración</strong>.
        </div>
      </div>
    );
  }

  // Navigation categories
  const categories: PosCategory[] = [
    'Bebidas Frías',
    'Frutas',
    'Tortas y Sándwiches',
    'Bebidas Calientes',
    'Comida',
    'Snacks'
  ];
  const [activeCategory, setActiveCategory] = useState<PosCategory>('Bebidas Frías');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryCardBg = (cat: PosCategory) => {
    switch(cat) {
      case 'Bebidas Frías': return 'bg-[#fffbeb] hover:bg-[#fff2cc] border-amber-200'; // fresh sweet orange/honey style (no more blue)
      case 'Frutas': return 'bg-[#fff5f5] hover:bg-[#ffe3e3] border-red-200'; // light watermelon/papaya soft pinkish-red
      case 'Tortas y Sándwiches': return 'bg-[#fffdf0] hover:bg-[#fef9c3] border-yellow-250'; // warm freshly baked bread yellow
      case 'Bebidas Calientes': return 'bg-[#faf6f0] hover:bg-[#eedfcc] border-orange-200'; // cozy cinnamon warm white/beige
      case 'Comida': return 'bg-[#fff8f2] hover:bg-[#ffebd6] border-orange-200'; // soft warm orange
      case 'Snacks': return 'bg-[#f4fcf0] hover:bg-[#e1f5db] border-emerald-250'; // fresh lime green snack style
      default: return 'bg-[#fffcf9] hover:bg-[#fdf3e9] border-orange-100';
    }
  };

  // DATOS DEL PEDIDO (Order Metadata)
  const [clientSearch, setClientSearch] = useState('');
  const [clientName, setClientName] = useState('');
  const [tienda, setTienda] = useState(() => {
    const activeList = stores.filter(s => s.active);
    return activeList[0]?.name || 'Mesa (gente que llega al local)';
  });

  useEffect(() => {
    const activeList = stores.filter(s => s.active);
    if (activeList.length > 0) {
      const isCurrentActive = activeList.some(s => s.name === tienda);
      if (!isCurrentActive) {
        setTienda(activeList[0].name);
      }
    }
  }, [stores]);

  const [horaEntrega, setHoraEntrega] = useState('Ahora');
  const [observaciones, setObservaciones] = useState('');

  // Cart State Management
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Crédito' | 'Mixto'>('Efectivo');
  const [isCreditCheckout, setIsCreditCheckout] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [mixedCashAmount, setMixedCashAmount] = useState<number>(0);

  // Load order details into POS if editingOrder is active
  useEffect(() => {
    if (editingOrder) {
      setCart(editingOrder.items);
      setDiscountAmount(editingOrder.discount);
      
      // Parse customer name and store/notes
      let cleanName = editingOrder.clientName || '';
      // Support matching branch name inside parentheses
      const match = cleanName.match(/\(([^)]+)\)$/);
      if (match) {
        cleanName = cleanName.replace(/\s*\([^)]+\)$/, '').trim();
      }
      setClientName(cleanName);

      // Parse metadata notes
      if (editingOrder.notes) {
        const parts = editingOrder.notes.split(' | ');
        const tiendaPart = parts.find(p => p.startsWith('Tienda:'));
        if (tiendaPart) {
          setTienda(tiendaPart.replace('Tienda:', '').trim());
        }
        const entregaPart = parts.find(p => p.startsWith('Entrega:'));
        if (entregaPart) {
          setHoraEntrega(entregaPart.replace('Entrega:', '').trim());
        }
        const obsPart = parts.find(p => p.startsWith('Obs:'));
        if (obsPart) {
          setObservaciones(obsPart.replace('Obs:', '').trim());
        }
      }

      const isCredit = editingOrder.paymentStatus === 'Crédito';
      setIsCreditCheckout(isCredit);
      setPaymentMethod(isCredit ? 'Crédito' : (editingOrder.paymentMethod || 'Efectivo'));
      if (editingOrder.mixedPayment) {
        setMixedCashAmount(editingOrder.mixedPayment.cash);
      } else {
        setMixedCashAmount(0);
      }
      if (isCredit && editingOrder.clientId) {
        setSelectedClientId(editingOrder.clientId);
      } else {
        setSelectedClientId('');
      }
    } else {
      setCart([]);
      setClientName('');
      setTienda('Mesa (gente que llega al local)');
      setHoraEntrega('Ahora');
      setObservaciones('');
      setIsCreditCheckout(false);
      setPaymentMethod('Efectivo');
      setSelectedClientId('');
      setDiscountAmount(0);
      setMixedCashAmount(0);
    }
  }, [editingOrder]);

  // Dynamic customizer state fields
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedCustomOptions, setSelectedCustomOptions] = useState<string[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);

  // Customizer Builder Modal State
  const [activeBuilder, setActiveBuilder] = useState<string | null>(null);
  
  // Customizer state fields
  const [dobleTortilla, setDobleTortilla] = useState<boolean>(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [withMilk, setWithMilk] = useState<boolean>(false);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [selectedFruits, setSelectedFruits] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [pizzaToggle, setPizzaToggle] = useState<'Orden' | 'Pieza'>('Orden');
  const [pieceQuantity, setPieceQuantity] = useState<number>(1);
  const [tacoQuantities, setTacoQuantities] = useState<Record<string, number>>({});
  const [tortillasQty, setTortillasQty] = useState<number>(6);
  const [excludedDefaults, setExcludedDefaults] = useState<string[]>([]);
  const [sinAzucar, setSinAzucar] = useState<boolean>(false);
  const [sugarSpoons, setSugarSpoons] = useState<number>(0);
  const [selectedPolloPiece, setSelectedPolloPiece] = useState<'Muslo' | 'Pierna' | ''>('');

  // Tacos de Guisado pricing logic
  const getTacos40Price = (qty: number, orderPrice: number = 40): number => {
    if (qty % 3 === 0) {
      return (qty / 3) * orderPrice;
    } else {
      const rawValue = (orderPrice / 3) * qty;
      return Math.ceil(rawValue / 5) * 5;
    }
  };

  // Helper to identify "Comida" products for rounding
  const isComidaProduct = (productId: string) => {
    return productId.includes('pos-com-') || productId.includes('tacos45') || productId.includes('tacos40');
  };

  // Dynaimc delivery time slot generator
  const getAvailableHours = () => {
    const slots = [
      { label: 'Ahora', hour: 0, minute: 0 },
      { label: '7:00 AM', hour: 7, minute: 0 },
      { label: '7:30 AM', hour: 7, minute: 30 },
      { label: '8:00 AM', hour: 8, minute: 0 },
      { label: '8:30 AM', hour: 8, minute: 30 },
      { label: '9:00 AM', hour: 9, minute: 0 },
      { label: '9:30 AM', hour: 9, minute: 30 },
      { label: '10:00 AM', hour: 10, minute: 0 },
      { label: '10:30 AM', hour: 10, minute: 30 },
      { label: '11:00 AM', hour: 11, minute: 0 },
      { label: '11:30 AM', hour: 11, minute: 30 },
      { label: '12:00 PM', hour: 12, minute: 0 },
      { label: '12:30 PM', hour: 12, minute: 30 },
      { label: '1:00 PM', hour: 13, minute: 0 },
      { label: '1:30 PM', hour: 13, minute: 30 },
      { label: '2:00 PM', hour: 14, minute: 0 },
      { label: '2:30 PM', hour: 14, minute: 30 },
      { label: '3:00 PM', hour: 15, minute: 0 },
      { label: '3:30 PM', hour: 15, minute: 30 },
      { label: '4:00 PM', hour: 16, minute: 0 },
      { label: '4:30 PM', hour: 16, minute: 30 },
      { label: '5:00 PM', hour: 17, minute: 0 },
    ];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return slots.filter((slot) => {
      if (slot.label === 'Ahora') return true;
      if (currentHour > slot.hour) return false;
      if (currentHour === slot.hour && currentMinute > slot.minute) return false;
      return true;
    });
  };

  // Dynamic categories helper mapping
  const mapProductToPosCategory = (category?: string): PosCategory => {
    const normalized = (category || '').toLowerCase().trim();
    if (normalized.includes('fría') || normalized.includes('fria') || normalized.includes('licuado') || normalized.includes('jugo')) {
      return 'Bebidas Frías';
    }
    if (normalized.includes('caliente')) {
      return 'Bebidas Calientes';
    }
    if (normalized.includes('fruta')) {
      return 'Frutas';
    }
    if (normalized.includes('torta') || normalized.includes('sándwich') || normalized.includes('sandwich')) {
      return 'Tortas y Sándwiches';
    }
    if (normalized.includes('snack') || normalized.includes('sabrita') || normalized.includes('galleta') || normalized.includes('cookie')) {
      return 'Snacks';
    }
    return 'Comida';
  };

  const getProductTypeAndSubType = (product: Product): { type: string; subType?: string } => {
    if (product.productLayout) {
      if (product.productLayout === 'layout_1_simple') return { type: 'simple' };
      if (product.productLayout === 'layout_2_cantidades') return { type: 'cantidades' };
      if (product.productLayout === 'layout_3_platillo') return { type: 'platillo' };
      if (product.productLayout === 'layout_4_huevos') return { type: 'huevos' };
      if (product.productLayout === 'layout_5_frutas') return { type: 'frutas' };
      if (product.productLayout === 'layout_6_proteina') return { type: 'proteina' };
      if (product.productLayout === 'layout_7_calientes') return { type: 'calientes' };
      if (product.productLayout === 'layout_8_aguas') return { type: 'aguas' };
      if (product.productLayout === 'layout_9_jugos') return { type: 'jugos' };
    }

    if (product.productType) {
      if (product.productType === 'tacos_guisado') return { type: 'tacos40' };
      if (product.productType === 'tacos_especial') return { type: 'tacos45' };
      if (product.productType === 'cafe_olla') return { type: 'caliente_olla' };
      if (product.productType === 'frutas') return { type: 'fruta' };
      if (product.productType === 'custom') return { type: 'dynamic' };
      if (product.productType === 'simple') return { type: 'dynamic' };
      return { type: product.productType };
    }

    const name = (product.name || '').toLowerCase();
    const id = product.id || '';

    if (id.includes('choc') || name.includes('chocomilk') || (name.includes('licuado') && !name.includes('fresa') && !name.includes('especial'))) {
      return { type: 'licuado' };
    }
    if (id.includes('fres') || name.includes('licuado de fresa')) {
      return { type: 'licuado' };
    }
    if (id.includes('jugo') || name.includes('jugo')) {
      return { type: 'jugo' };
    }
    if (id.includes('agua') || name.includes('agua fresca')) {
      return { type: 'agua' };
    }
    if (id.includes('fru-vaso') || name.includes('fruta en vaso')) {
      return { type: 'fruta' };
    }
    if (id.includes('fru-plato') || name.includes('fruta en plato')) {
      return { type: 'fruta' };
    }
    if (id.includes('torta') || name.includes('torta')) {
      return { type: 'torta' };
    }
    if (id.includes('sand') || name.includes('sándwich') || name.includes('sandwich')) {
      return { type: 'sandwich' };
    }
    if (id.includes('olla') || name.includes('café de olla') || name.includes('cafe de olla')) {
      return { type: 'caliente_olla' };
    }
    if (id.includes('nesc') || name.includes('nescafé') || name.includes('nescafe')) {
      return { type: 'nescafe' };
    }
    if (id.includes('te') || name.includes('té') || name.includes('te ')) {
      return { type: 'te' };
    }
    if (id.includes('t45') || name.includes('tacos especiales')) {
      return { type: 'tacos45' };
    }
    if (id.includes('t40') || name.includes('tacos de guisado')) {
      return { type: 'tacos40' };
    }
    if (id.includes('huevos') || name.includes('huevos al gusto') || name.includes('huevo')) {
      return { type: 'huevos' };
    }
    if (id.includes('pla') || name.includes('platillo')) {
      return { type: 'platillo' };
    }
    if (name.includes('dorados') || name.includes('dorado')) {
      return { type: 'antojito', subType: 'Tacos dorados' };
    }
    if (name.includes('quesadilla') || name.includes('quesadillas')) {
      return { type: 'antojito', subType: 'Quesadillas de papa' };
    }
    if (name.includes('pescadilla') || name.includes('pescadillas')) {
      return { type: 'antojito', subType: 'Pescadillas' };
    }
    if (name.includes('tostada') || name.includes('tostadas')) {
      return { type: 'antojito', subType: 'Tostadas' };
    }
    if (name.includes('picaditas') || name.includes('picadita') || name.includes('pellizcadas')) {
      return { type: 'antojito', subType: 'Picaditas' };
    }
    if (name.includes('huarache') || name.includes('huaraches')) {
      return { type: 'antojito', subType: 'Huaraches' };
    }
    if (name.includes('enchilada') || name.includes('enchiladas')) {
      return { type: 'antojito', subType: 'Enchiladas' };
    }
    const category = (product.category || '').toLowerCase();
    if (category.includes('snack') || category.includes('sabrita') || category.includes('galleta') || category.includes('cookie')) {
      return { type: 'snack' };
    }
    return { type: 'dynamic' };
  };

  const getProductsForCategory = (cat: PosCategory) => {
    return products.filter(p => {
      const mappedCat = mapProductToPosCategory(p.category);
      return mappedCat === cat && p.active !== false;
    });
  };

  const sortProducts = (list: Product[]) => {
    return [...list].sort((a, b) => {
      const orderA = a.orden ?? 99999;
      const orderB = b.orden ?? 99999;
      return orderA - orderB;
    });
  };

  // Helper selectors and customizers
  const fruitsOptions = ['Melón', 'Papaya', 'Manzana', 'Plátano', 'Piña', 'Jícama', 'Pepino', 'Mango', 'Fresa'];
  const extraToppings = ['Miel', 'Granola', 'Yogurt', 'Lechera', 'Tajín', 'Chamoy', 'Miguelito', 'Salsa', 'Limón', 'Sal'];

  const breadStyles = ['Jamón', 'Salchicha', 'Tocino', 'Milanesa', 'Ensalada de Pollo', 'Ensalada de Atún', 'Chorizo', 'Queso Oaxaca'];
  const breadIngredients = ['Mayonesa', 'Lechuga', 'Jitomate', 'Queso amarillo'];

  // Filter based on search query. If query is active, search GLOBALLY across all categories.
  const rawItems = searchQuery.trim() !== ''
    ? products.filter(p => 
        p.active !== false &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : getProductsForCategory(activeCategory);

  const availableItems = sortProducts(rawItems);

  const productHasCustomization = (item: Product) => {
    const isPollo = item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'));
    if (isPollo) return true;

    if (item.productLayout) {
      return item.productLayout !== 'layout_1_simple';
    }
    if (item.productType === 'simple') return false;
    if (item.productType && item.productType !== 'custom') return true;
    
    const { type } = getProductTypeAndSubType(item);
    if (type !== 'dynamic') return true;

    if (item.tieneVariantes) return true;
    if (item.variants && item.variants.length > 0) return true;
    if (item.ingredients && item.ingredients.length > 0) return true;
    if (item.baseIngredients && item.baseIngredients.length > 0) return true;
    if (item.extraIngredients && item.extraIngredients.length > 0) return true;
    if (item.removableIngredients && item.removableIngredients.length > 0) return true;
    if (item.customizationOptions && item.customizationOptions.length > 0) return true;
    return false;
  };

  const shouldNotRound = (product: Product) => {
    if (!product) return false;
    const layout = product.productLayout;
    if (layout === 'layout_3_platillo' || layout === 'layout_4_huevos' || layout === 'layout_7_calientes' || layout === 'layout_8_aguas' || layout === 'layout_9_jugos') {
      return true;
    }
    if (layout === 'layout_2_cantidades' && product.applyRounding === false) {
      return true;
    }
    const type = product.productType;
    if (type === 'cafe_olla' || type === 'nescafe' || type === 'te') {
      return true;
    }
    const name = (product.name || '').toLowerCase();
    const id = (product.id || '').toLowerCase();
    if (id.includes('olla') || name.includes('café de olla') || name.includes('cafe de olla') ||
        id.includes('nesc') || name.includes('nescafé') || name.includes('nescafe') ||
        id.includes('te') || name.includes('té') || name.includes('te ')) {
      return true;
    }
    return false;
  };

  // Triggering the Configuration Modal For Builders
  const handleItemClick = (item: Product) => {
    const { type, subType } = getProductTypeAndSubType(item);

    const hasCustomization = productHasCustomization(item);

    if (!hasCustomization) {
      setCart(prev => {
        const existingIdx = prev.findIndex(i => i.product.id === item.id);
        if (existingIdx > -1) {
          return prev.map((itemInCart, idx) => {
            if (idx === existingIdx) {
              const nextQty = itemInCart.quantity + 1;
              const rawSub = nextQty * item.price;
              return {
                ...itemInCart,
                quantity: nextQty,
                subtotal: shouldNotRound(item) ? rawSub : Math.ceil(rawSub / 5) * 5
              };
            }
            return itemInCart;
          });
        } else {
          const newCartItem: OrderItem = {
            product: item,
            quantity: 1,
            customizations: [],
            subtotal: shouldNotRound(item) ? item.price : Math.ceil(item.price / 5) * 5
          };
          return [...prev, newCartItem];
        }
      });
      return;
    }

    setActiveBuilder(item.id);
    setSelectedSize('');
    setSelectedFlavor('');
    setSelectedVariant('');
    setSelectedCustomOptions([]);
    setExcludedIngredients([]);
    setDobleTortilla(false);
    setWithMilk(false);
    setCustomOptions([]);
    setSelectedFruits([]);
    setSelectedExtras([]);
    setPizzaToggle('Orden');
    setPieceQuantity(1);
    setTacoQuantities({});
    setTortillasQty(6);
    setExcludedDefaults([]);
    setSinAzucar(false);
    setSugarSpoons(0);
    setSelectedPolloPiece('');
    
    // Initialize chicken piece selector
    const isChicken = item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'));
    if (isChicken) {
      if (polloStatus?.muslo) {
        setSelectedPolloPiece('Muslo');
      } else if (polloStatus?.pierna) {
        setSelectedPolloPiece('Pierna');
      } else {
        setSelectedPolloPiece('');
      }
    } else {
      setSelectedPolloPiece('');
    }

    // Initialize standard fields
    setSelectedVariant(item.variants?.[0] || '');
    setSelectedCustomOptions([]);
    setExcludedIngredients([]);

    // Initialize layout-specific states
    if (type === 'cantidades') {
      const initialTacoQuantities: Record<string, number> = {};
      item.layout2Options?.forEach(o => {
        initialTacoQuantities[o.name] = 0;
      });
      setTacoQuantities(initialTacoQuantities);
      setDobleTortilla(false);
      setSelectedExtras([]);
    } else if (type === 'platillo' && item.productLayout === 'layout_3_platillo') {
      setSelectedFlavor(item.layout3Preps?.[0]?.name || '');
      setExcludedDefaults([]);
      setTortillasQty(6);
    } else if (type === 'huevos' && item.productLayout === 'layout_4_huevos') {
      setSelectedFlavor(item.layout4Preps?.[0]?.name || '');
      setExcludedDefaults([]);
      setTortillasQty(6); // Default 6 tortillas included
    } else if (type === 'frutas' && item.productLayout === 'layout_5_frutas') {
      setSelectedSize(item.layout5Presentations?.[0]?.name || '');
      setSelectedFruits([]);
      setSelectedExtras([]);
    } else if (type === 'proteina' && item.productLayout === 'layout_6_proteina') {
      setSelectedFlavor(item.layout6Proteins?.[0]?.name || '');
      setExcludedDefaults([]);
      setSelectedExtras([]);
      if (item.layoutAllowPresentation && item.layoutPresentations && item.layoutPresentations.length > 0) {
        setSelectedSize(item.layoutPresentations[0].name);
      } else {
        setSelectedSize('');
      }
    } else if (type === 'calientes' && item.productLayout === 'layout_7_calientes') {
      setSelectedSize(item.layout7Sizes?.[0]?.name || '');
      setWithMilk(false);
      setCustomOptions([]); // sin azúcar and extra milk options
      setTortillasQty(0); // spoon count
      setSelectedFlavor(item.customizationOptions?.[0] || ''); // Initialize tea flavor
    } else if (type === 'aguas' && item.productLayout === 'layout_8_aguas') {
      setSelectedSize(item.layout8Sizes?.[0]?.name || '');
      setSelectedFlavor(item.layout8Flavors?.filter(f => f.active)?.[0]?.name || '');
    } else if (type === 'jugos' && item.productLayout === 'layout_9_jugos') {
      setSelectedSize(item.layout9Sizes?.[0]?.name || '');
      setSelectedFlavor(item.layout9Flavors?.filter(f => f.active)?.[0]?.name || '');
      setCustomOptions([]);
    }

    if (type === 'jugo') {
      setSelectedSize('16 oz');
      setSelectedFlavor('Naranja');
      setCustomOptions([]);
    } else if (type === 'agua') {
      setSelectedSize('Chica');
      setSelectedFlavor('Limón');
      setCustomOptions([]);
    } else if (type === 'fruta') {
      setSelectedSize(item.id.includes('plato') ? 'Plato' : 'Vaso');
      setSelectedFruits([]);
      setSelectedExtras([]);
    } else if (type === 'torta') {
      const showPres = item.layoutAllowPresentation ?? false;
      const presentations = item.layoutPresentations && item.layoutPresentations.length > 0 
        ? item.layoutPresentations 
        : [{ name: 'Sencillo', price: 40 }, { name: 'Doble', price: 55 }];
      setSelectedSize(showPres ? presentations[0].name : '');
      setSelectedFlavor('Jamón'); // choosing type
      setSelectedExtras([]); // reset extras
      setExcludedDefaults([]); // clear exclusions
    } else if (type === 'sandwich') {
      const presentations = item.layoutPresentations && item.layoutPresentations.length > 0 
        ? item.layoutPresentations 
        : [{ name: 'Sencillo', price: 30 }, { name: 'Doble', price: 45 }];
      setSelectedSize(presentations[0].name); // sencillo or doble
      setSelectedFlavor('Jamón'); // type
      setSelectedExtras([]);
      setExcludedDefaults([]);
    } else if (type === 'caliente_olla') {
      setSelectedSize('Chico');
      setWithMilk(false);
    } else if (type === 'nescafe') {
      setSelectedSize('Chico');
      setWithMilk(false);
    } else if (type === 'te') {
      setSelectedSize('Chico');
      setSelectedFlavor('Hierbabuena');
    } else if (type === 'tacos45') {
      setSelectedFlavor('Suadero');
      setPizzaToggle('Pieza');
      setPieceQuantity(1);
      setTacoQuantities({
        'Suadero': 0,
        'Bistec': 0,
        'Chorizo': 0
      });
    } else if (type === 'tacos40') {
      setSelectedFlavor('Chicharrón en salsa verde');
      setPizzaToggle('Pieza');
      setPieceQuantity(1);
      setTacoQuantities({
        'Chicharrón en salsa verde': 0,
        'Salchicha a la mexicana': 0,
        'Huevo con jamón': 0,
        'Huevo con salchicha': 0,
        'Huevo con chorizo': 0,
        'Tinga de pollo': 0,
        'Mole de pollo': 0,
        'Chorizo con papa': 0
      });
    } else if (type === 'huevos') {
      setSelectedFlavor('Jamón');
      setTortillasQty(6);
    } else if (type === 'platillo') {
      setSelectedFlavor('Mole de pollo');
      setExcludedDefaults([]);
    } else if (type === 'antojito') {
      if (subType === 'Tacos dorados') {
        setSelectedFlavor('Pollo');
      } else if (subType === 'Tostadas') {
        setSelectedFlavor('Pollo');
      } else if (subType === 'Picaditas') {
        setSelectedFlavor('Verdes');
      } else if (subType === 'Huaraches') {
        setSelectedFlavor('Suadero');
      } else if (subType === 'Enchiladas') {
        setSelectedFlavor('Suizas');
      }
    } else if (type === 'snack') {
      setCustomOptions([]);
    }
  };

  // Real-time calculation inside build state
  const getCurrentCalculatedPrice = () => {
    if (!activeBuilder) return 0;
    
    // Find item
    const item = products.find(x => x.id === activeBuilder);
    if (!item) return 0;

    if (item.productLayout) {
      switch (item.productLayout) {
        case 'layout_1_simple':
          return item.price;

        case 'layout_2_cantidades': {
          let totalQty = 0;
          let sum = 0;
          item.layout2Options?.forEach(opt => {
            const qty = tacoQuantities[opt.name] || 0;
            if (qty > 0 && opt.active !== false) {
              sum += qty * opt.price;
              totalQty += qty;
            }
          });
          item.layout2Extras?.forEach(ext => {
            if (selectedExtras.includes(ext.name) && ext.active !== false) {
              const isDobleTortilla = ext.name.toLowerCase().includes('doble tortilla');
              const extPrice = isDobleTortilla && ext.price === 0 ? 1.00 : ext.price;
              const isPerPiece = isDobleTortilla ? true : ext.perPiece;
              if (isPerPiece) {
                sum += totalQty * extPrice;
              } else {
                sum += extPrice;
              }
            }
          });
          return sum;
        }

        case 'layout_3_platillo': {
          let price = item.price;
          const prep = item.layout3Preps?.find(p => p.name === selectedFlavor);
          if (prep && prep.active !== false) {
            price += prep.priceDiff || 0;
          }
          const extraTortillas = Math.max(0, tortillasQty - 6);
          price += extraTortillas * 1;
          return price;
        }

        case 'layout_4_huevos': {
          let price = item.price;
          const extraTortillas = Math.max(0, tortillasQty - 6);
          price += extraTortillas * 1;
          return price;
        }

        case 'layout_5_frutas': {
          const pres = item.layout5Presentations?.find(p => p.name === selectedSize);
          let price = pres ? pres.price : item.price;
          item.layout5Extras?.forEach(ext => {
            if (selectedExtras.includes(ext.name) && ext.active !== false) {
              price += ext.price;
            }
          });
          return price;
        }

        case 'layout_6_proteina': {
          let basePrice = item.price;
          if (item.layoutAllowPresentation && item.layoutPresentations && item.layoutPresentations.length > 0) {
            const pres = item.layoutPresentations.find(p => p.name === selectedSize) || item.layoutPresentations[0];
            basePrice = pres.price;
          } else {
            const prot = item.layout6Proteins?.find(p => p.name === selectedFlavor);
            if (prot) basePrice = prot.price;
          }
          let price = basePrice;
          item.layout6Extras?.forEach(ext => {
            if (selectedExtras.includes(ext.name) && ext.active !== false) {
              price += ext.price;
            }
          });
          return price;
        }

        case 'layout_7_calientes': {
          const sz = item.layout7Sizes?.find(s => s.name === selectedSize);
          let price = sz ? sz.price : item.price;
          if (item.layout7AllowMilk && withMilk) {
            price += item.layout7MilkPrice || 0;
          }
          return price;
        }

        case 'layout_8_aguas': {
          const sz = item.layout8Sizes?.find(s => s.name === selectedSize);
          let price = sz ? sz.price : item.price;
          return price;
        }

        case 'layout_9_jugos': {
          const sz = item.layout9Sizes?.find(s => s.name === selectedSize);
          let price = sz ? sz.price : item.price;
          return price;
        }
      }
    }

    const { type } = getProductTypeAndSubType(item);

    switch (type) {
      case 'licuado':
        return 45;
      
      case 'jugo':
        return selectedSize === '16 oz' ? 45 : 90;
      
      case 'agua':
        return selectedSize === 'Chica' ? 20 : 35;
      
      case 'fruta':
        return selectedSize === 'Vaso' ? 25 : 30;
      
      case 'torta': {
        const showPres = item.layoutAllowPresentation ?? false;
        const presentations = item.layoutPresentations && item.layoutPresentations.length > 0
          ? item.layoutPresentations
          : [{ name: 'Sencillo', price: 40 }, { name: 'Doble', price: 55 }];
        const pres = showPres ? (presentations.find(p => p.name === selectedSize) || presentations[0]) : null;
        const base = pres ? pres.price : item.price;
        const extraCount = selectedExtras.length;
        const extraPrice = extraCount * 5;
        return base + extraPrice;
      }

      case 'sandwich': {
        const presentations = item.layoutPresentations && item.layoutPresentations.length > 0
          ? item.layoutPresentations
          : [{ name: 'Sencillo', price: 30 }, { name: 'Doble', price: 45 }];
        const pres = presentations.find(p => p.name === selectedSize) || presentations[0];
        const base = pres.price;
        const extraCount = selectedExtras.length;
        const extraPrice = extraCount * 5;
        return base + extraPrice;
      }

      case 'caliente_olla': {
        const base = selectedSize === 'Chico' ? 15 : 20;
        const extra = withMilk ? (selectedSize === 'Chico' ? 2 : 5) : 0;
        return base + extra;
      }

      case 'nescafe': {
        const base = selectedSize === 'Chico' ? 17 : 25;
        const extra = withMilk ? (selectedSize === 'Chico' ? 3 : 2) : 0;
        return base + extra;
      }

      case 'te':
        return selectedSize === 'Chico' ? 15 : 20;

      case 'tacos45': {
        const totalQty = (Object.values(tacoQuantities) as number[]).reduce((acc: number, val: number) => acc + val, 0);
        const baseCost = totalQty * (item.price / 3);
        const extraTortilla = dobleTortilla ? totalQty * 1 : 0;
        return baseCost + extraTortilla;
      }

      case 'tacos40': {
        const totalQty = (Object.values(tacoQuantities) as number[]).reduce((acc: number, val: number) => acc + val, 0);
        const baseCost = getTacos40Price(totalQty, item.price);
        const extraTortilla = dobleTortilla ? totalQty * 1 : 0;
        return baseCost + extraTortilla;
      }

      case 'huevos': {
        const extraT = Math.max(0, tortillasQty - 6);
        return 65 + extraT;
      }

      case 'platillo':
        return 80;

      case 'antojito':
        if (item.name.toLowerCase().includes('enchiladas')) {
          if (selectedFlavor === 'Suizas') return 45;
          return 40;
        }
        return item.price;

      default: {
        let basePrice = item.price;
        if (selectedVariant) {
          const match = selectedVariant.match(/\(\$([0-9.]+)\)/);
          if (match) {
            basePrice = parseFloat(match[1]);
          }
        }
        return basePrice;
      }
    }
  };

  // Add customized item to shopping cart list
  const handleAddBuiltItemToCart = () => {
    const item = products.find(x => x.id === activeBuilder);
    if (!item) return;

    if (item.productLayout) {
      let derivedName = item.name;
      let detailsList: string[] = [];
      const calculatedPrice = getCurrentCalculatedPrice();

      switch (item.productLayout) {
        case 'layout_2_cantidades': {
          const ops: string[] = [];
          item.layout2Options?.forEach(opt => {
            const qty = tacoQuantities[opt.name] || 0;
            if (qty > 0 && opt.active !== false) {
              ops.push(`${qty} ${opt.name}`);
            }
          });
          if (ops.length > 0) {
            detailsList.push(ops.join(', '));
          }
          item.layout2Extras?.forEach(ext => {
            if (selectedExtras.includes(ext.name) && ext.active !== false) {
              detailsList.push(`Con ${ext.name}`);
            }
          });
          break;
        }

        case 'layout_3_platillo': {
          detailsList.push(`Prep: ${selectedFlavor}`);
          const removed = (item.layout3Removables || []).filter(r => excludedDefaults.includes(r.name)).map(r => r.name);
          if (removed && removed.length > 0) {
            detailsList.push(`Sin: ${removed.join(', ')}`);
          }
          if (tortillasQty !== 6) {
            detailsList.push(`${tortillasQty} Tortillas`);
          }
          break;
        }

        case 'layout_4_huevos': {
          detailsList.push(`Prep: ${selectedFlavor}`);
          const removed = (item.layout4Removables || []).filter(r => excludedDefaults.includes(r.name)).map(r => r.name);
          if (removed && removed.length > 0) {
            detailsList.push(`Sin: ${removed.join(', ')}`);
          }
          if (tortillasQty > 0) {
            detailsList.push(`+${tortillasQty} Tortillas`);
          }
          break;
        }

        case 'layout_5_frutas': {
          derivedName = `${item.name} (${selectedSize})`;
          const activeFruits = selectedFruits.filter(f => {
            const fConfig = item.layout5Fruits?.find(x => x.name === f);
            return fConfig && fConfig.active !== false;
          });
          detailsList.push(`Frutas: ${activeFruits.join(', ') || 'Surtidas'}`);
          const activeExtras = selectedExtras.filter(e => {
            const eConfig = item.layout5Extras?.find(x => x.name === e);
            return eConfig && eConfig.active !== false;
          });
          if (activeExtras.length > 0) {
            detailsList.push(`Extras: ${activeExtras.join(', ')}`);
          }
          break;
        }

        case 'layout_6_proteina': {
          const flavorAndExtras = selectedExtras.length > 0
            ? `${selectedFlavor} y ${selectedExtras.join(' y ')}`
            : selectedFlavor;
          derivedName = item.layoutAllowPresentation && selectedSize
            ? `${item.name} ${selectedSize} (${flavorAndExtras})`
            : `${item.name} (${flavorAndExtras})`;
          
          const removed = item.layout6Removables?.filter(r => excludedDefaults.includes(r.name)).map(r => r.name);
          if (removed && removed.length > 0) {
            detailsList.push(`Sin: ${removed.join(', ')}`);
          }
          const activeExtras = selectedExtras.filter(e => {
            const eConfig = item.layout6Extras?.find(x => x.name === e);
            return eConfig && eConfig.active !== false;
          });
          if (activeExtras.length > 0) {
            detailsList.push(`Extras: ${activeExtras.join(', ')}`);
          }
          break;
        }

        case 'layout_7_calientes': {
          derivedName = selectedFlavor
            ? `${item.name} de ${selectedFlavor} (${selectedSize})`
            : `${item.name} (${selectedSize})`;
          if (item.layout7AllowMilk && withMilk) {
            detailsList.push('Con Leche');
          }
          if (item.layout7AllowSugar) {
            if (sinAzucar) {
              detailsList.push('Sin azúcar');
            } else if (sugarSpoons > 0) {
              detailsList.push(`${sugarSpoons} Cda(s) de Azúcar`);
            }
          }
          break;
        }

        case 'layout_8_aguas': {
          derivedName = `${item.name} de ${selectedFlavor} (${selectedSize})`;
          break;
        }

        case 'layout_9_jugos': {
          derivedName = `${item.name} de ${selectedFlavor} (${selectedSize})`;
          const activeModifiers = customOptions.filter(o => {
            const oConfig = item.layout9Modifiers?.find(x => x.name === o);
            return oConfig && oConfig.active !== false;
          });
          if (activeModifiers.length > 0) {
            detailsList.push(activeModifiers.join(', '));
          }
          break;
        }
      }

      const isPollo = item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'));
      if (isPollo && selectedPolloPiece) {
        detailsList.push(`Pieza: ${selectedPolloPiece}`);
      }

      const compiledProduct: Product = {
        id: item.id,
        name: derivedName,
        category: item.category,
        price: calculatedPrice,
        image: item.image,
        active: true,
        description: detailsList.join(' | ') || item.description
      };

      const rawSubtotal = calculatedPrice;
      const finalSubtotal = shouldNotRound(item)
        ? rawSubtotal 
        : Math.ceil(rawSubtotal / 5) * 5;

      const newCartItem: OrderItem = {
        product: compiledProduct,
        quantity: 1,
        customizations: detailsList,
        subtotal: finalSubtotal
      };

      setCart(prev => [...prev, newCartItem]);
      setActiveBuilder(null);
      return;
    }

    const { type, subType } = getProductTypeAndSubType(item);

    // Handle special multi-sabor taco builder addition
    if (type === 'tacos45') {
      const itemsToAdd: OrderItem[] = [];
      (Object.entries(tacoQuantities) as [string, number][]).forEach(([flavor, val]: [string, number]) => {
        const q = val;
        if (q > 0) {
          const itemPrice = item.price / 3;
          const rawSubtotal = q * itemPrice;
          const tortillaExtra = dobleTortilla ? q * 1 : 0;
          const calculatedSubtotal = Math.ceil(rawSubtotal / 5) * 5 + tortillaExtra;
          
          const compiledProduct: Product = {
            id: `pos-${type}-${flavor.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
            name: `Taco de ${flavor}${dobleTortilla ? ' (Doble Tortilla)' : ''}`,
            category: 'Comida y Snacks',
            price: itemPrice,
            image: item.image || '',
            active: true,
            description: `${q} Pieza(s)${dobleTortilla ? ' con Doble Tortilla' : ''}`
          };

          itemsToAdd.push({
            product: compiledProduct,
            quantity: q,
            customizations: dobleTortilla ? ['Doble tortilla'] : [],
            subtotal: calculatedSubtotal
          });
        }
      });

      if (itemsToAdd.length > 0) {
        setCart(prev => [...prev, ...itemsToAdd]);
      }
      setActiveBuilder(null);
      return;
    }

    if (type === 'tacos40') {
      const selectedFlavorsList: string[] = [];
      let totalPieces = 0;
      (Object.entries(tacoQuantities) as [string, number][]).forEach(([flavor, val]: [string, number]) => {
        if (val > 0) {
          selectedFlavorsList.push(`${flavor} (${val} pz)`);
          totalPieces += val;
        }
      });

      if (totalPieces > 0) {
        const baseSubtotal = getTacos40Price(totalPieces, item.price);
        const calculatedSubtotal = baseSubtotal + (dobleTortilla ? totalPieces * 1 : 0);

        const compiledProduct: Product = {
          id: `pos-com-t40-${Date.now()}`,
          name: `Tacos de Guisado${dobleTortilla ? ' (Doble Tortilla)' : ''}`,
          category: 'Comida y Snacks',
          price: item.price / 3,
          image: item.image || '',
          active: true,
          description: `${totalPieces} Pieza(s)${dobleTortilla ? ' con Doble Tortilla' : ''}`
        };

        const customizationsArr = [`Guisados: ${selectedFlavorsList.join(', ')}`];
        if (dobleTortilla) {
          customizationsArr.push('Doble tortilla');
        }

        const newCartItem: OrderItem = {
          product: compiledProduct,
          quantity: totalPieces,
          customizations: customizationsArr,
          subtotal: calculatedSubtotal
        };

        setCart(prev => [...prev, newCartItem]);
      }
      setActiveBuilder(null);
      return;
    }

    let derivedName = item.name;
    let detailsList: string[] = [];
    const calculatedPrice = getCurrentCalculatedPrice();

    if (type === 'licuado') {
      derivedName = item.name;
      if (customOptions.length > 0) detailsList.push(...customOptions);
    } else if (type === 'jugo') {
      derivedName = `Jugo ${selectedFlavor} (${selectedSize})`;
      if (customOptions.length > 0) detailsList.push(...customOptions);
    } else if (type === 'agua') {
      derivedName = `Agua de ${selectedFlavor} (${selectedSize})`;
      if (customOptions.length > 0) detailsList.push(...customOptions);
    } else if (type === 'fruta') {
      derivedName = selectedSize === 'Vaso' ? 'Fruta en Vaso' : 'Fruta en Plato';
      detailsList.push(`Frutas: ${selectedFruits.join(', ') || 'Surtidas'}`);
      if (selectedExtras.length > 0) detailsList.push(`Extras: ${selectedExtras.join(', ')}`);
    } else if (type === 'torta') {
      const baseName = item.name.toLowerCase().includes('torta') ? 'Torta' : 'Sándwich';
      const flavorAndExtras = selectedExtras.length > 0 
        ? `${selectedFlavor} y ${selectedExtras.join(' y ')}`
        : selectedFlavor;
      derivedName = `${baseName} de ${flavorAndExtras}`;
      if (excludedDefaults.length > 0) {
        detailsList.push(`Sin: ${excludedDefaults.join(', ')}`);
      }
      if (selectedExtras.length > 0) {
        detailsList.push(`Extras extra (+): ${selectedExtras.join(', ')}`);
      }
    } else if (type === 'sandwich') {
      const baseName = item.name.toLowerCase().includes('torta') ? 'Torta' : 'Sándwich';
      const flavorAndExtras = selectedExtras.length > 0 
        ? `${selectedFlavor} y ${selectedExtras.join(' y ')}`
        : selectedFlavor;
      derivedName = `${baseName} ${selectedSize} (${flavorAndExtras})`;
      if (excludedDefaults.length > 0) {
        detailsList.push(`Sin: ${excludedDefaults.join(', ')}`);
      }
      if (selectedExtras.length > 0) {
        detailsList.push(`Extras extra (+): ${selectedExtras.join(', ')}`);
      }
    } else if (type === 'caliente_olla') {
      derivedName = `Café de Olla (${selectedSize}${withMilk ? ' con Leche' : ''})`;
    } else if (type === 'nescafe') {
      derivedName = `Nescafé (${selectedSize}${withMilk ? ' con Leche' : ''})`;
    } else if (type === 'te') {
      derivedName = `Té de ${selectedFlavor} (${selectedSize})`;
    } else if (type === 'huevos') {
      derivedName = `Huevos con ${selectedFlavor}`;
      detailsList.push(`${tortillasQty} Tortillas incluidas`);
    } else if (type === 'platillo') {
      derivedName = `Platillo: ${selectedFlavor}`;
      if (excludedDefaults.length > 0) {
        detailsList.push(`Sin acompañamientos: ${excludedDefaults.join(', ')}`);
      }
    } else if (type === 'antojito') {
      derivedName = `${subType} - ${selectedFlavor}`;
    } else if (type === 'snack') {
      derivedName = item.name;
      if (customOptions.length > 0) detailsList.push(...customOptions);
    } else if (type === 'dynamic') {
      derivedName = item.name;
      if (selectedVariant) {
        detailsList.push(`Variante: ${selectedVariant}`);
      }
      if (selectedCustomOptions.length > 0) {
        detailsList.push(...selectedCustomOptions);
      }
      if (excludedIngredients.length > 0) {
        detailsList.push(`Sin: ${excludedIngredients.join(', ')}`);
      }
    }

    const isPollo = item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'));
    if (isPollo && selectedPolloPiece) {
      detailsList.push(`Pieza: ${selectedPolloPiece}`);
    }

    const compiledProduct: Product = {
      id: item.id,
      name: derivedName,
      category: item.category,
      price: calculatedPrice,
      image: item.image,
      active: true,
      description: detailsList.join(' | ') || item.description
    };

    const rawSubtotal = calculatedPrice;
    const finalSubtotal = shouldNotRound(item) ? rawSubtotal : Math.ceil(rawSubtotal / 5) * 5;

    const newCartItem: OrderItem = {
      product: compiledProduct,
      quantity: 1,
      customizations: detailsList,
      subtotal: finalSubtotal
    };

    setCart(prev => [...prev, newCartItem]);
    setActiveBuilder(null);
  };

  const updateQuantity = (index: number, change: number) => {
    setCart(prev => {
      const updated = prev.map((item, idx) => {
        if (idx === index) {
          const nextQty = item.quantity + change;
          let sub = 0;
          if (item.product.id.includes('tacos40') || item.product.id.includes('t40')) {
            const hasDoble = item.customizations?.some(c => c.toLowerCase().includes('doble tortilla')) || item.product.name.toLowerCase().includes('doble');
            const orderPrice = item.product.price * 3;
            const baseSub = getTacos40Price(nextQty, orderPrice);
            sub = Math.ceil((baseSub + (hasDoble ? nextQty * 1 : 0)) / 5) * 5;
          } else if (item.product.id.includes('tacos45') || item.product.id.includes('t45')) {
            const hasDoble = item.customizations?.some(c => c.toLowerCase().includes('doble tortilla')) || item.product.name.toLowerCase().includes('doble');
            const baseSub = nextQty * item.product.price;
            sub = Math.ceil((baseSub + (hasDoble ? nextQty * 1 : 0)) / 5) * 5;
          } else {
            const rawSubtotal = nextQty * item.product.price;
            sub = shouldNotRound(item.product) ? rawSubtotal : Math.ceil(rawSubtotal / 5) * 5;
          }
          return {
            ...item,
            quantity: nextQty,
            subtotal: sub
          };
        }
        return item;
      });
      return updated.filter(item => item.quantity > 0);
    });
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Compute invoice pricing
  const subtotal = cart.reduce((sub, item) => sub + item.subtotal, 0);
  const total = Math.max(0, Math.ceil((subtotal - discountAmount) / 5) * 5);

  // Submit Order details to cocina and database queues
  const handleKitchenDispatchOrder = (paymentType: 'Efectivo' | 'Tarjeta' | 'Crédito' | 'Mixto') => {
    if (cart.length === 0) return;

    if (paymentType === 'Crédito' && !selectedClientId) {
      alert('Por favor selecciona un deudor registrado para cargar el fiado a cuenta.');
      return;
    }

    if (paymentType === 'Mixto') {
      if (mixedCashAmount <= 0 || mixedCashAmount >= total) {
        alert('Para pago mixto, el monto en efectivo debe ser mayor a 0 y menor al total del pedido.');
        return;
      }
    }

    const rawName = paymentType === 'Crédito' 
      ? (clients.find(c => c.id === selectedClientId)?.name || clientName)
      : clientName;
    const baseClientName = rawName && rawName.trim() ? rawName.trim() : 'cliente';
    const finalClientName = baseClientName.replace(/\s*\([^)]*\)/g, '').trim();

    // Build consolidated notes containing customer order constraints
    const customerNotesMeta = [
      `Tienda: ${tienda}`,
      `Entrega: ${horaEntrega}`,
      observaciones ? `Obs: ${observaciones}` : null
    ].filter(Boolean).join(' | ');

    const mixedPayment = paymentType === 'Mixto' 
      ? { cash: mixedCashAmount, card: total - mixedCashAmount } 
      : undefined;

    if (editingOrder) {
      const updatedOrder: Order = {
        ...editingOrder,
        items: cart,
        subtotal,
        discount: discountAmount,
        total,
        paymentStatus: paymentType === 'Crédito' ? 'Crédito' : 'Pagado',
        paymentMethod: paymentType,
        mixedPayment,
        clientName: finalClientName,
        clientId: paymentType === 'Crédito' ? selectedClientId : undefined,
        notes: customerNotesMeta
      };

      if (onSaveEditedOrder) {
        onSaveEditedOrder(updatedOrder);
      }
      return;
    }

    const orderId = `#${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      id: orderId,
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      status: 'Pendiente',
      paymentStatus: paymentType === 'Crédito' ? 'Crédito' : 'Pagado',
      paymentMethod: paymentType,
      mixedPayment,
      clientName: finalClientName,
      clientId: paymentType === 'Crédito' ? selectedClientId : undefined,
      timestamp: new Date().toISOString(),
      notes: customerNotesMeta
    };

    onAddOrder(newOrder);

    // Reset checkout states
    setCart([]);
    setClientName('');
    setObservaciones('');
    setHoraEntrega('Ahora');
    setDiscountAmount(0);
    setIsCreditCheckout(false);
    setSelectedClientId('');
    setMixedCashAmount(0);
    alert(`Se envió el Pedido ${orderId} para ${finalClientName} con éxito a cocina.`);
  };


  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COMPARTMENT: CATEGORY TABS AND ITEM SELECTORS (col-span-8) */}
      <div className="xl:col-span-8 space-y-5">
        
        {/* Real-time search filter and visual tips */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
          <div className="relative w-full sm:max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar en menú rápido de desayunos, tortas o licuados..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-gray-900 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/35 text-xs font-semibold"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-sans font-extrabold text-[#006e0a] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span>¡TOMA RÁPIDA DE TIENDA!</span>
          </div>
        </div>

        {/* 6 Category Tabs Selector */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-amber-50/60 p-2 rounded-2xl border border-amber-200/45">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery('');
              }}
              className={`py-3 rounded-xl text-xs font-black transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border ${
                activeCategory === cat 
                  ? 'bg-amber-100 text-orange-950 border-amber-300 shadow-xs' 
                  : 'bg-white border-orange-100/55 text-gray-700 hover:bg-orange-50/50 hover:text-orange-750'
              }`}
            >
              <span className="text-sm">
                {cat === 'Bebidas Frías' && '❄️'}
                {cat === 'Frutas' && '🍓'}
                {cat === 'Tortas y Sándwiches' && '🥪'}
                {cat === 'Bebidas Calientes' && '☕'}
                {cat === 'Comida' && '🌮'}
                {cat === 'Snacks' && '🍿'}
              </span>
              <span className="text-[10px] sm:text-[11px] tracking-tight">{cat}</span>
            </button>
          ))}
        </div>

        {/* Product Selection List Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableItems.map((item) => {
            const { type } = getProductTypeAndSubType(item);
            const mappedCat = mapProductToPosCategory(item.category);
            const imageSrc = item.image || '';
            const description = item.description || 'Sin ingredientes asignados.';
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`rounded-2xl border p-4 hover:border-orange-400 hover:shadow-md transition-all flex flex-col text-left group cursor-pointer relative overflow-hidden ${getCategoryCardBg(mappedCat)}`}
              >
                <div className="mt-2 flex-grow flex gap-3.5 items-start">
                  {imageSrc ? (
                    <img 
                      src={imageSrc} 
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover bg-white/70 border border-orange-200/50 shrink-0 shadow-xs group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-orange-100/50 border border-orange-200/50 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-6 h-6 text-orange-300" />
                    </div>
                  )}
                  <div className="flex-grow space-y-0.5 min-w-0">
                    <h4 className="font-sans font-extrabold text-gray-900 text-xs sm:text-[13px] group-hover:text-orange-950 flex items-center gap-1 leading-tight line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-semibold leading-relaxed line-clamp-2">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100/60 w-full">
                  <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono">
                    ${item.price.toFixed(2)}
                    {item.price === 45 && type === 'jugo' && ' (S-M)'}
                    {item.price === 20 && type === 'agua' && ' (S-M)'}
                  </span>
                  
                  <span className="text-[11px] font-black text-orange-700 bg-orange-50/50 group-hover:bg-[#904d00] group-hover:text-white px-2.5 py-1 rounded-lg transition-colors border border-orange-100">
                    Agregar →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* RIGHT COMPARTMENT: CUSTOMER INPUTS & ACTIVE CART PREVIEW (col-span-4) */}
      <div className="xl:col-span-4 space-y-4">

        {/* DATOS DEL PEDIDO CARD */}
        <div className="bg-slate-100 rounded-3xl border border-gray-200 shadow-md p-4 space-y-3.5">
          <div className="flex items-center gap-1.5 pb-2 border-b border-gray-150">
            <BookOpen className="w-4 h-4 text-[#904d00]" />
            <h3 className="font-sans font-black text-xs text-gray-950 uppercase tracking-wider">DATOS DEL PEDIDO</h3>
          </div>

          <div className="space-y-2.5">
            {/* Nombre del Cliente */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                🧑‍💼 Nombre del Cliente:
              </label>
              <input
                type="text"
                placeholder="Escribe el nombre o se enviará como 'cliente'..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="bg-white text-gray-950 w-full text-xs p-2.5 border border-gray-200 rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Método de Pago */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                💳 Método de Pago:
              </label>
              <div className="grid grid-cols-4 gap-1 px-0.5">
                {(['Efectivo', 'Tarjeta', 'Mixto', 'Crédito'] as const).map(pm => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm);
                      setIsCreditCheckout(pm === 'Crédito');
                      if (pm !== 'Mixto') setMixedCashAmount(0);
                    }}
                    className={`text-[10px] font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                      (pm === 'Crédito' && isCreditCheckout) || (pm !== 'Crédito' && !isCreditCheckout && paymentMethod === pm)
                        ? (pm === 'Crédito' ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#006e0a] text-white border-[#006e0a]')
                        : 'bg-white text-gray-750 border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs for Pago Mixto */}
            {!isCreditCheckout && paymentMethod === 'Mixto' && (
              <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl space-y-2">
                <label className="text-[9.5px] font-black text-emerald-800 uppercase tracking-wider block">
                  Cálculo de Pago Mixto:
                </label>
                <div className="flex gap-2 items-center">
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold text-gray-500 block">En Efectivo</span>
                    <input 
                      type="number" 
                      min="0"
                      step="0.5"
                      value={mixedCashAmount || ''}
                      onChange={(e) => setMixedCashAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="bg-white border flex-1 border-gray-300 rounded-md text-xs font-semibold px-2 py-1.5 w-full focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 flex-1 opacity-80 cursor-not-allowed">
                    <span className="text-[10px] font-bold text-gray-500 block">En Tarjeta</span>
                    <div className="bg-gray-50 border border-gray-200 rounded-md text-xs font-bold px-2 py-1.5 text-gray-600 w-full">
                      ${Math.max(0, total - mixedCashAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selector de Cliente de Crédito (si aplica) */}
            {isCreditCheckout && (
              <div className="bg-amber-50/55 border border-amber-200 p-2 rounded-xl space-y-1">
                <label className="text-[9.5px] font-black text-[#904d00] uppercase tracking-wider block">
                  👤 Cliente Deudor (Fiado):
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setSelectedClientId(cid);
                    const found = clients.find(c => c.id === cid);
                    if (found) {
                      setClientName(found.name);
                    }
                  }}
                  className="bg-white text-gray-950 font-semibold w-full text-[11px] p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">-- Elige un Cliente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Saldo: ${c.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tienda y Hora de Entrega */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  🏪 Tienda / Sucursal:
                </label>
                <select
                  value={tienda}
                  onChange={(e) => setTienda(e.target.value)}
                  className="bg-white text-gray-800 font-semibold w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {stores.filter(s => s.active).map((st) => (
                    <option key={st.id} value={st.name}>
                      {formatStoreName(st.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  ⏱️ Hora de Entrega:
                </label>
                <select
                  value={horaEntrega}
                  onChange={(e) => setHoraEntrega(e.target.value)}
                  className="bg-white text-gray-800 font-semibold w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {getAvailableHours().map((hl) => (
                    <option key={hl.label} value={hl.label}>
                      {hl.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comentarios de Despacho */}
            <div>
              <label className="text-[10px] font-bold text-[#904d00] uppercase tracking-wider block mb-1">
                💬 Comentarios:
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Llevar cubiertos, salsa aparte..."
                className="bg-white text-gray-850 font-bold w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>

          </div>
        </div>

        {/* MI PEDIDO ACTIVO / SHOPPING CART LIST */}
        <div className="bg-slate-100 rounded-3xl border border-gray-200 shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-gray-150">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#904d00]" />
              <span className="font-sans font-black text-gray-950 uppercase tracking-tight text-xs">PEDIDO ACTUAL</span>
            </div>
            <span className="text-[11px] bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full font-black">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} Pzs
            </span>
          </div>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs font-sans leading-relaxed">
                El carrito de la compra está vacío.<br />Selecciona categorías a la izquierda y presiona configurar.
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="bg-amber-50/20 rounded-xl p-3 border border-amber-100 flex flex-col gap-1.5 hover:bg-amber-50/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-gray-900 leading-tight">
                        {item.product.name}
                      </h4>
                      {item.customizations.length > 0 && (
                        <CustomizationsRenderer 
                          customizations={item.customizations}
                          listClassName="flex flex-col gap-0.5 mt-1 pl-1"
                          itemClassName="text-[10px] text-slate-500 font-mono italic flex items-start gap-1 leading-tight"
                          bulletClassName="text-slate-400 mt-[1px]"
                        />
                      )}
                    </div>
                    <button 
                      onClick={() => removeCartItem(index)}
                      className="text-gray-300 hover:text-red-600 p-0.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-1 border-t border-dashed border-gray-150 pt-2 scale-95">
                    <span className="text-xs font-black font-mono text-emerald-950">
                      ${item.subtotal.toFixed(2)}
                    </span>

                    <div className="flex items-center gap-2.5 bg-white rounded-lg border border-gray-200 p-0.5">
                      <button 
                        onClick={() => updateQuantity(index, -1)}
                        className="w-5 h-5 bg-slate-50 hover:bg-slate-200 text-gray-700 font-extrabold flex items-center justify-center text-xs rounded"
                      >
                        -
                      </button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(index, 1)}
                        className="w-5 h-5 bg-slate-50 hover:bg-slate-200 text-gray-700 font-extrabold flex items-center justify-center text-xs rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing computation summary */}
          {cart.length > 0 && (
            <div className="space-y-1.5 border-t pt-3 text-xs">
              <div className="flex justify-between text-gray-550 font-mono font-bold">
                <span>Subtotal parcial:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-sans font-black text-sm text-gray-950 border-t pt-2 border-dashed">
                <span>Total General:</span>
                <span className="text-lg font-black font-mono text-emerald-800">${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Checkout action handles */}
          {cart.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              {editingOrder ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleKitchenDispatchOrder(isCreditCheckout ? 'Crédito' : paymentMethod)}
                    className="w-full bg-[#904d00] hover:bg-[#5c3100] text-white font-sans font-black text-sm py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-150 cursor-pointer uppercase shadow-md"
                  >
                    <span>📁 Guardar Cambios</span>
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-sans font-extrabold text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-center transition cursor-pointer"
                  >
                    ✕ Cancelar Edición
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleKitchenDispatchOrder(paymentMethod)}
                  className="w-full bg-[#006e0a] hover:bg-emerald-800 text-white font-sans font-black text-sm py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-97 cursor-pointer uppercase shadow-md animate-pulse"
                >
                  <Send className="w-5 h-5 text-emerald-100" />
                  <span>Enviar a Cocina</span>
                </button>
              )}

              {!editingOrder && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Deseas eliminar todo el pedido actual?')) {
                      setCart([]);
                      setDiscountAmount(0);
                      setClientName('');
                      setObservaciones('');
                      setPaymentMethod('Efectivo');
                      setIsCreditCheckout(false);
                      setSelectedClientId('');
                      setMixedCashAmount(0);
                      setClientSearch('');
                      setHoraEntrega('Ahora');
                    }
                  }}
                  className="w-full text-center text-xs text-red-650 hover:text-red-800 font-extrabold cursor-pointer py-2 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                >
                  Limpiar pedido
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* DETAILED INTERACTIVE PRODUCT BUILDER MODAL */}
      {activeBuilder && (() => {
        const itemBase = products.find(x => x.id === activeBuilder);
        if (!itemBase) return null;
        const item = { ...itemBase, ...getProductTypeAndSubType(itemBase) };

        const calculatedPrice = getCurrentCalculatedPrice();
                const displayedPrice = shouldNotRound(item)
          ? calculatedPrice
          : Math.ceil(calculatedPrice / 5) * 5;

        const totalPieces = (
          item.productLayout === 'layout_2_cantidades' || 
          item.type === 'tacos45' || 
          item.type === 'tacos40'
        ) 
          ? (Object.values(tacoQuantities) as number[]).reduce((acc, val) => acc + val, 0)
          : 0;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden transform scale-100 transition-transform">
              
              {/* Header */}
              <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-black text-[#904d00] font-mono tracking-wider block">OPCIONES DE PREPARACIÓN</span>
                  <h3 className="font-sans font-black text-gray-900 text-sm sm:text-base leading-none mt-0.5">{item.name}</h3>
                </div>
                <button 
                  onClick={() => setActiveBuilder(null)}
                  className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-full border border-gray-150 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic scrollable content specialized per product type */}
              <div className="p-5 space-y-4 flex-grow overflow-y-auto">
                
                {item.productLayout ? (
                  <>
                    {/* Layout 2: Selección por cantidades */}
                    {item.productLayout === 'layout_2_cantidades' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {item.layout2Options?.filter(o => o.active !== false)?.map(opt => {
                            const qty = tacoQuantities[opt.name] || 0;
                            return (
                              <div key={opt.name} className="bg-white rounded-xl border border-gray-155 p-3 flex items-center justify-between shadow-sm hover:border-amber-300 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-lg select-none">
                                    🌮
                                  </div>
                                  <div>
                                    <span className="text-xs font-sans font-black text-gray-900 block">{opt.name}</span>
                                    <span className="text-[10px] text-gray-400 font-mono tracking-tight">${opt.price.toFixed(2)} c/u</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {qty > 0 && (
                                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                      ${(qty * opt.price).toFixed(2)}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTacoQuantities(prev => ({ ...prev, [opt.name]: Math.max(0, qty - 1) }))}
                                      className="bg-slate-50 border border-gray-200 hover:bg-red-50 hover:text-red-650 w-7 h-7 font-black text-xs flex items-center justify-center rounded-lg cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold w-5 text-center text-gray-900">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => setTacoQuantities(prev => ({ ...prev, [opt.name]: qty + 1 }))}
                                      className="bg-slate-55 border border-gray-200 hover:bg-green-50 hover:text-green-600 w-7 h-7 font-black text-xs flex items-center justify-center rounded-lg cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {item.layout2Extras && item.layout2Extras.filter(e => e.active !== false).length > 0 && (
                          <div className="bg-amber-50/30 rounded-2xl border border-amber-100 p-3 space-y-2 mt-2">
                            <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block font-bold">Opciones Adicionales:</label>
                            <div className="grid grid-cols-1 gap-2">
                              {item.layout2Extras.filter(e => e.active !== false).map(ext => {
                                const isSel = selectedExtras.includes(ext.name);
                                const isDobleTortilla = ext.name.toLowerCase().includes('doble tortilla');
                                const extPrice = isDobleTortilla && ext.price === 0 ? 1.00 : ext.price;
                                const isPerPiece = isDobleTortilla ? true : ext.perPiece;
                                return (
                                  <button
                                    type="button"
                                    key={ext.name}
                                    onClick={() => setSelectedExtras(prev => prev.includes(ext.name) ? prev.filter(x => x !== ext.name) : [...prev, ext.name])}
                                    className={`p-2.5 rounded-xl border text-xs font-bold text-left justify-between flex items-center transition ${
                                      isSel ? 'bg-amber-50 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <div className="flex flex-col text-left">
                                      <span className="font-extrabold">{ext.name}</span>
                                      <span className="text-[9px] text-gray-400 font-normal">
                                        {isPerPiece ? `+$${extPrice.toFixed(2)} por cada pieza de taco` : `+$${extPrice.toFixed(2)} cargo fijo`}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-black ${isSel ? 'text-[#904d00]' : 'text-gray-400'}`}>
                                      {isSel ? '✓ Activado' : '+ Agregar'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 3: Platillo */}
                    {item.productLayout === 'layout_3_platillo' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Elige la preparación:</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {item.layout3Preps?.filter(p => p.active !== false)?.map(prep => (
                              <button
                                type="button"
                                key={prep.name}
                                onClick={() => setSelectedFlavor(prep.name)}
                                className={`p-2.5 rounded-xl border text-[11px] font-black text-left leading-tight transition-all ${
                                  selectedFlavor === prep.name ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span>🍛 {prep.name}</span>
                                  {prep.priceDiff && prep.priceDiff !== 0 ? (
                                    <span className="text-[9px] font-mono text-amber-800 bg-white px-1.5 py-0.5 rounded border border-amber-150">
                                      {prep.priceDiff > 0 ? '+' : ''}${prep.priceDiff}
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.infoCardText && (
                          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-[11px] font-semibold text-emerald-950">
                            {item.infoCardText}
                          </div>
                        )}

                        {item.layout3Removables && item.layout3Removables.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Quitar acompañamientos (opcional):</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.layout3Removables.map(sd => {
                                const isExcluded = excludedDefaults.includes(sd.name);
                                return (
                                  <button
                                    type="button"
                                    key={sd.name}
                                    onClick={() => setExcludedDefaults(prev => prev.includes(sd.name) ? prev.filter(x => x !== sd.name) : [...prev, sd.name])}
                                    className={`p-2 rounded-xl border text-xs font-bold text-left justify-between flex items-center transition ${
                                      isExcluded ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-750'
                                    }`}
                                  >
                                    <span>{sd.name}</span>
                                    <span className="text-[10px] font-black">{isExcluded ? '❌ Quitado' : '✅ Incluido'}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {true && (
                          <div className="flex justify-between items-center py-2 bg-neutral-50 px-3.5 rounded-xl border border-gray-200">
                            <div>
                              <span className="text-xs font-bold text-gray-800 block">Tortillas:</span>
                              <span className="text-[10px] text-gray-500 block">Incluye 6. Extra a +$1 c/u</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTortillasQty(p => Math.max(0, p - 1))}
                                className="bg-white border w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-black w-6 text-center">{tortillasQty}</span>
                              <button
                                type="button"
                                onClick={() => setTortillasQty(p => p + 1)}
                                className="bg-white border w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 4: Huevos al gusto */}
                    {item.productLayout === 'layout_4_huevos' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Elige la preparación:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(item.layout4Preps || []).filter(p => p.active !== false).map(prep => (
                              <button
                                type="button"
                                key={prep.name}
                                onClick={() => setSelectedFlavor(prep.name)}
                                className={`p-2.5 rounded-xl border text-xs font-black text-center transition-all ${
                                  selectedFlavor === prep.name ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                🍳 {prep.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.infoCardText && (
                          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-[11px] font-semibold text-emerald-950">
                            {item.infoCardText}
                          </div>
                        )}

                        {item.layout4Removables && item.layout4Removables.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Quitar acompañamientos (opcional):</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.layout4Removables.map(sd => {
                                const isExcluded = excludedDefaults.includes(sd.name);
                                return (
                                  <button
                                    type="button"
                                    key={sd.name}
                                    onClick={() => setExcludedDefaults(prev => prev.includes(sd.name) ? prev.filter(x => x !== sd.name) : [...prev, sd.name])}
                                    className={`p-2 rounded-xl border text-xs font-bold text-left justify-between flex items-center transition ${
                                      isExcluded ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-755'
                                    }`}
                                  >
                                    <span>{sd.name}</span>
                                    <span className="text-[10px] font-black">{isExcluded ? '❌ Quitado' : '✅ Incluido'}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {true && (
                          <div className="flex justify-between items-center py-2 bg-neutral-50 px-3.5 rounded-xl border border-gray-200">
                            <div>
                              <span className="text-xs font-bold text-gray-800 block">Tortillas:</span>
                              <span className="text-[10px] text-gray-500 block">Incluye 6. Extra a +$1 c/u</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTortillasQty(p => Math.max(0, p - 1))}
                                className="bg-white border w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-black w-6 text-center">{tortillasQty}</span>
                              <button
                                type="button"
                                onClick={() => setTortillasQty(p => p + 1)}
                                className="bg-white border w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 5: Frutas */}
                    {item.productLayout === 'layout_5_frutas' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Presentación:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.layout5Presentations?.filter(p => p.active !== false)?.map(pres => (
                              <button
                                type="button"
                                key={pres.name}
                                onClick={() => setSelectedSize(pres.name)}
                                className={`p-2.5 rounded-xl border text-xs font-black text-center transition-all ${
                                  selectedSize === pres.name ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                {pres.name} (${pres.price.toFixed(2)})
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Elegir Frutas (libre selección):</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {item.layout5Fruits?.filter(f => f.active !== false)?.map(fruit => {
                              const active = selectedFruits.includes(fruit.name);
                              return (
                                <button
                                  type="button"
                                  key={fruit.name}
                                  onClick={() => setSelectedFruits(p => p.includes(fruit.name) ? p.filter(x => x !== fruit.name) : [...p, fruit.name])}
                                  className={`p-2 rounded-xl text-[10px] font-bold text-center border transition ${
                                    active ? 'bg-[#006e0a] text-white border-[#006e0a]' : 'bg-white border-gray-200 text-gray-750'
                                  }`}
                                >
                                  {fruit.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {item.layout5Extras && item.layout5Extras.filter(e => e.active !== false).length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1 font-bold">Aderezos / Extras sugeridos:</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {item.layout5Extras.filter(e => e.active !== false).map(ext => {
                                const active = selectedExtras.includes(ext.name);
                                return (
                                  <button
                                    type="button"
                                    key={ext.name}
                                    onClick={() => setSelectedExtras(p => p.includes(ext.name) ? p.filter(x => x !== ext.name) : [...p, ext.name])}
                                    className={`p-2 rounded-xl text-[10px] font-bold text-center border transition ${
                                      active ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-750'
                                    }`}
                                  >
                                    {ext.name} {ext.price > 0 ? `(+$${ext.price})` : ''}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 6: Proteína + Ingredientes */}
                    {item.productLayout === 'layout_6_proteina' && (
                      <div className="space-y-4">
                        {item.layoutAllowPresentation && item.layoutPresentations && item.layoutPresentations.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2 font-bold">Presentación:</label>
                            <div className="flex flex-col gap-2 p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                              {item.layoutPresentations.map((pres) => (
                                <label
                                  key={pres.name}
                                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                    selectedSize === pres.name
                                      ? 'bg-amber-100/70 border-amber-400 text-[#904d00] font-black'
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="layout6-presentation"
                                      checked={selectedSize === pres.name}
                                      onChange={() => setSelectedSize(pres.name)}
                                      className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-bold">{pres.name}</span>
                                  </div>
                                  <span className="text-xs font-mono font-bold">${pres.price.toFixed(2)}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Elegir relleno / proteína principal:</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {item.layout6Proteins?.filter(p => p.active !== false)?.map(prot => (
                              <button
                                type="button"
                                key={prot.name}
                                onClick={() => setSelectedFlavor(prot.name)}
                                className={`p-2.5 rounded-xl border text-[10px] font-black text-center border transition ${
                                  selectedFlavor === prot.name ? 'bg-amber-100 border-amber-400 text-[#904d00] font-black' : 'bg-white border-gray-200 text-gray-750'
                                }`}
                              >
                                {prot.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.layout6Removables && item.layout6Removables.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1 font-bold">Quitar ingredientes (incluidos por defecto):</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.layout6Removables.map(sd => {
                                const isExcluded = excludedDefaults.includes(sd.name);
                                return (
                                  <button
                                    type="button"
                                    key={sd.name}
                                    onClick={() => setExcludedDefaults(prev => prev.includes(sd.name) ? prev.filter(x => x !== sd.name) : [...prev, sd.name])}
                                    className={`p-2.5 rounded-xl border text-xs font-bold text-left justify-between flex items-center transition ${
                                      isExcluded ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <span>{sd.name}</span>
                                    <span className="text-[10px] font-bold text-gray-400">{isExcluded ? '❌ Quitado' : '✅ Incluido'}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {item.layout6Extras && item.layout6Extras.filter(e => e.active !== false).length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1 font-bold">Ingredientes extra adicionales:</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {item.layout6Extras.filter(e => e.active !== false).map(ext => {
                                const isSel = selectedExtras.includes(ext.name);
                                return (
                                  <button
                                    type="button"
                                    key={ext.name}
                                    onClick={() => setSelectedExtras(prev => prev.includes(ext.name) ? prev.filter(x => x !== ext.name) : [...prev, ext.name])}
                                    className={`p-2 rounded-xl text-[10px] text-center border transition ${
                                      isSel ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-extrabold' : 'bg-white border-gray-200 text-gray-750'
                                    }`}
                                  >
                                    {ext.name}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[10px] text-gray-450 mt-1 font-semibold">
                              * Los ingredientes adicionales seleccionados sumarán su costo correspondiente al preparado.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 7: Bebidas calientes */}
                    {item.productLayout === 'layout_7_calientes' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Tamaño:</label>
                          <div className="grid grid-cols-3 gap-2">
                            {item.layout7Sizes?.filter(s => s.active !== false)?.map(sz => (
                              <button
                                type="button"
                                key={sz.name}
                                onClick={() => setSelectedSize(sz.name)}
                                className={`p-3 rounded-xl border text-xs font-black text-center transition ${
                                  selectedSize === sz.name ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-750'
                                }`}
                              >
                                {sz.name} (${sz.price.toFixed(2)})
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.customizationOptions && item.customizationOptions.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block font-bold">Elige el sabor / tipo:</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.customizationOptions.map(flavor => (
                                <button
                                  type="button"
                                  key={flavor}
                                  onClick={() => setSelectedFlavor(flavor)}
                                  className={`p-2.5 rounded-xl border text-xs font-black text-center transition ${
                                    selectedFlavor === flavor 
                                      ? 'bg-[#904d00] text-white border-[#904d00]' 
                                      : 'bg-white border-gray-200 text-gray-750'
                                  }`}
                                >
                                  {flavor}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.layout7AllowMilk && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setWithMilk(prev => !prev)}
                              className={`w-full p-3 rounded-xl border text-xs font-black flex items-center justify-between transition-all ${
                                withMilk 
                                  ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs' 
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base select-none">🥛</span>
                                <span className="text-left font-sans">
                                  <span className="block font-bold">¿Agregar Leche?</span>
                                  <span className="block text-[10px] text-gray-500 font-normal">
                                    Suma +${item.layout7MilkPrice || 0} pesos
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {withMilk ? (
                                  <span className="bg-amber-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">CON LECHE</span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2.5 py-0.5 rounded-full font-medium">SIN LECHE</span>
                                )}
                              </div>
                            </button>
                          </div>
                        )}

                        {item.layout7AllowSugar && (
                          <div className="space-y-2 border-t pt-3">
                            <div className="flex items-center gap-2.5 select-none">
                              <input 
                                type="checkbox" 
                                id="sugar-free-chk"
                                checked={sinAzucar} 
                                onChange={(e) => {
                                  setSinAzucar(e.target.checked);
                                  if (e.target.checked) setSugarSpoons(0);
                                }}
                                className="w-4.5 h-4.5 text-amber-605 border-gray-300 rounded focus:ring-amber-500 cursor-pointer" 
                              />
                              <label htmlFor="sugar-free-chk" className="text-xs font-sans font-black text-gray-800 cursor-pointer">
                                Sin azúcar
                              </label>
                            </div>

                            <div className={`flex justify-between items-center py-2 bg-neutral-50 px-3.5 rounded-xl border border-gray-200 transition ${
                              sinAzucar ? 'opacity-55 cursor-not-allowed pointer-events-none' : ''
                            }`}>
                              <div>
                                <span className="text-xs font-bold text-gray-850 block">Cucharadas de azúcar:</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={sinAzucar}
                                  onClick={() => setSugarSpoons(p => Math.max(0, p - 1))}
                                  className="bg-white border w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black w-6 text-center">{sugarSpoons}</span>
                                <button
                                  type="button"
                                  disabled={sinAzucar}
                                  onClick={() => setSugarSpoons(p => p + 1)}
                                  className="bg-white border w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 8: Aguas frescas */}
                    {item.productLayout === 'layout_8_aguas' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Tamaño:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.layout8Sizes?.filter(s => s.active !== false)?.map(sz => (
                              <button
                                type="button"
                                key={sz.name}
                                onClick={() => setSelectedSize(sz.name)}
                                className={`p-2.5 rounded-xl border text-xs font-black text-center transition ${
                                  selectedSize === sz.name ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-750'
                                }`}
                              >
                                {sz.name} (${sz.price.toFixed(2)})
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Elegir sabor:</label>
                          <div className="grid grid-cols-3 gap-2">
                            {item.layout8Flavors?.filter(f => f.active !== false)?.map(fl => (
                              <button
                                type="button"
                                key={fl.name}
                                onClick={() => setSelectedFlavor(fl.name)}
                                className={`p-2.5 rounded-xl border text-[11px] text-center font-bold transition ${
                                  selectedFlavor === fl.name ? 'bg-amber-100 border-amber-400 text-[#904d00] font-black' : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                {fl.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Layout 9: Jugos */}
                    {item.productLayout === 'layout_9_jugos' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Tamaño:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.layout9Sizes?.filter(s => s.active !== false)?.map(sz => (
                              <button
                                type="button"
                                key={sz.name}
                                onClick={() => setSelectedSize(sz.name)}
                                className={`p-2.5 rounded-xl border text-xs font-black text-center transition ${
                                  selectedSize === sz.name ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-750'
                                }`}
                              >
                                {sz.name} (${sz.price.toFixed(2)})
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Elegir sabor principal:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.layout9Flavors?.filter(f => f.active !== false)?.map(fl => (
                              <button
                                type="button"
                                key={fl.name}
                                onClick={() => setSelectedFlavor(fl.name)}
                                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                                  selectedFlavor === fl.name ? 'bg-amber-100 border-amber-400 text-[#904d00] font-black' : 'bg-white border-gray-150 text-gray-700'
                                }`}
                              >
                                {fl.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.layout9Modifiers && item.layout9Modifiers.filter(o => o.active !== false).length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Modificadores opcionales:</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.layout9Modifiers.filter(o => o.active !== false).map(opt => {
                                const isSel = customOptions.includes(opt.name);
                                return (
                                  <button
                                    type="button"
                                    key={opt.name}
                                    onClick={() => setCustomOptions(prev => prev.includes(opt.name) ? prev.filter(x => x !== opt.name) : [...prev, opt.name])}
                                    className={`p-2 rounded-xl text-left border text-xs font-bold transition ${
                                      isSel ? 'bg-amber-50 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-705'
                                    }`}
                                  >
                                    {opt.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* 1. LICUADOS */}
                    {item.type === 'licuado' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Extras Opcionales (+):</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Extra Chocomilk', 'Leche Almendra', 'Sin Hielo', 'Doble porción'].map(opt => {
                        const isSel = customOptions.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => setCustomOptions(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                            className={`p-2 rounded-xl text-left border text-xs font-bold transition-all ${
                              isSel ? 'bg-amber-50 border-amber-400 text-[#904d00]' : 'bg-white border-gray-205 text-gray-700'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. JUGOS */}
                {item.type === 'jugo' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Elegir tamaño:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['16 oz ($45)', '1 litro ($90)'].map(sz => {
                          const value = sz.includes('16 oz') ? '16 oz' : '1 litro';
                          return (
                            <button
                              key={sz}
                              onClick={() => setSelectedSize(value)}
                              className={`p-2.5 rounded-xl border text-xs font-black text-center ${
                                selectedSize === value ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-black">Seleccionar Sabor:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Naranja', 'Betabel', 'Zanahoria', 'Verde'].map(sb => (
                          <button
                            key={sb}
                            onClick={() => setSelectedFlavor(sb)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center ${
                              selectedFlavor === sb ? 'bg-amber-100 border-amber-400 text-[#904d00] font-black' : 'bg-white border-gray-150 text-gray-700'
                            }`}
                          >
                            {sb}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Modificadores extra:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Sin Hielo', 'Doble Colado', 'Con Limón'].map(opt => {
                          const isSel = customOptions.includes(opt);
                          return (
                            <button
                              key={opt}
                              onClick={() => setCustomOptions(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                              className={`p-2 rounded-xl text-left border text-xs font-bold ${
                                isSel ? 'bg-amber-50 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-705'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. AGUAS FRESCAS */}
                {item.type === 'agua' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Elegir tamaño de agua:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Chica ($20)', 'Litro ($35)'].map(sz => {
                          const value = sz.includes('Chica') ? 'Chica' : 'Litro';
                          return (
                            <button
                              key={sz}
                              onClick={() => setSelectedSize(value)}
                              className={`p-2.5 rounded-xl border text-xs font-black text-center ${
                                selectedSize === value ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Sabor de agua:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Limón', 'Pepino con limón', 'Piña', 'Guayaba', 'Melón', 'Naranja', 'Jamaica'].map(sb => (
                          <button
                            key={sb}
                            onClick={() => setSelectedFlavor(sb)}
                            className={`p-2 rounded-xl border text-[10px] text-center font-bold font-sans ${
                              selectedFlavor === sb ? 'bg-amber-100 border-amber-400 text-[#904d00] font-black' : 'bg-white border-gray-200 text-gray-700'
                            }`}
                          >
                            {sb}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. FRUTA PREPARADA */}
                {item.type === 'fruta' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Presentación elegante elegida:</label>
                      <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs font-black text-amber-900">
                        <span>{selectedSize === 'Vaso' ? '🥤 Fruta en Vaso' : '🍽️ Fruta en Plato'}</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">${selectedSize === 'Vaso' ? '25' : '30'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Elegir Frutas (Múltiples):</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {fruitsOptions.map(f => {
                          const active = selectedFruits.includes(f);
                          return (
                            <button
                              type="button"
                              key={f}
                              onClick={() => setSelectedFruits(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])}
                              className={`p-2 rounded-xl text-[10px] font-bold text-center border ${
                                active ? 'bg-[#006e0a] text-white border-[#006e0a]' : 'bg-white border-gray-200 text-gray-750'
                              }`}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Elegir Combinación de Extras:</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {extraToppings.map(ex => {
                          const active = selectedExtras.includes(ex);
                          return (
                            <button
                              type="button"
                              key={ex}
                              onClick={() => setSelectedExtras(p => p.includes(ex) ? p.filter(x => x !== ex) : [...p, ex])}
                              className={`p-2 rounded-xl text-[10px] font-bold text-center border ${
                                active ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-750'
                              }`}
                            >
                              {ex}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. TORTA BASE */}
                {item.type === 'torta' && (
                  <div className="space-y-4">
                    {(item.layoutAllowPresentation ?? false) && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Tipo de presentación:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(item.layoutPresentations && item.layoutPresentations.length > 0
                            ? item.layoutPresentations
                            : [{ name: 'Sencillo', price: 40 }, { name: 'Doble', price: 55 }]
                          ).map(p => (
                            <button
                              type="button"
                              key={p.name}
                              onClick={() => setSelectedSize(p.name)}
                              className={`p-2.5 rounded-xl border text-xs font-black text-center transition ${
                                selectedSize === p.name ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-750'
                              }`}
                            >
                              {p.name} (${p.price.toFixed(2)})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Relleno / Proteína principal ($40):</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {breadStyles.map(st => (
                          <button
                            type="button"
                            key={st}
                            onClick={() => setSelectedFlavor(st)}
                            className={`p-2 rounded-xl text-[10px] font-black text-center border ${
                              selectedFlavor === st ? 'bg-amber-100 border-amber-400 text-[#904d00] font-black' : 'bg-white border-gray-200 text-gray-750'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Quitar ingredientes (incluidos por defecto):</label>
                      <div className="grid grid-cols-2 gap-2">
                        {breadIngredients.map(ing => {
                          const isExcluded = excludedDefaults.includes(ing);
                          return (
                            <button
                              type="button"
                              key={ing}
                              onClick={() => setExcludedDefaults(prev => prev.includes(ing) ? prev.filter(x => x !== ing) : [...prev, ing])}
                              className={`p-2.5 rounded-xl border text-xs font-bold text-left justify-between flex items-center ${
                                isExcluded ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              <span>{ing}</span>
                              <span className="text-[10px] font-bold text-gray-400">{isExcluded ? '❌ Quitada' : '✅ Incluido'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Extras Adicionales (+ $5 c/u):</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {breadStyles.filter(b => b !== selectedFlavor).map(ex => {
                          const isSel = selectedExtras.includes(ex);
                          return (
                            <button
                              type="button"
                              key={ex}
                              onClick={() => setSelectedExtras(prev => prev.includes(ex) ? prev.filter(x => x !== ex) : [...prev, ex])}
                              className={`p-2 rounded-xl text-[10px] text-center border ${
                                isSel ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-extrabold' : 'bg-white border-gray-200 text-gray-750'
                              }`}
                            >
                              {ex}
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 font-semibold">
                        * Cada ingrediente extra adicional costará $5 pesos.
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SANDWICH */}
                {item.type === 'sandwich' && (
                  <div className="space-y-4">
                    {(item.layoutAllowPresentation !== false) && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Tipo de presentación:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(item.layoutPresentations && item.layoutPresentations.length > 0
                            ? item.layoutPresentations
                            : [{ name: 'Sencillo', price: 30 }, { name: 'Doble', price: 45 }]
                          ).map(p => (
                            <button
                              type="button"
                              key={p.name}
                              onClick={() => setSelectedSize(p.name)}
                              className={`p-2.5 rounded-xl border text-xs font-black text-center ${
                                selectedSize === p.name ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              {p.name} (${p.price.toFixed(2)})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Relleno principal:</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {breadStyles.map(st => (
                          <button
                            type="button"
                            key={st}
                            onClick={() => setSelectedFlavor(st)}
                            className={`p-2 rounded-xl text-[10px] font-black text-center border ${
                              selectedFlavor === st ? 'bg-amber-100 border-amber-400 text-[#904d00] font-black' : 'bg-white border-gray-200 text-gray-750'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Quitar ingredientes estándar:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {breadIngredients.map(ing => {
                          const isExcluded = excludedDefaults.includes(ing);
                          return (
                            <button
                              type="button"
                              key={ing}
                              onClick={() => setExcludedDefaults(prev => prev.includes(ing) ? prev.filter(x => x !== ing) : [...prev, ing])}
                              className={`p-2.5 rounded-xl border text-xs font-bold text-left justify-between flex items-center ${
                                isExcluded ? 'bg-red-50 border-red-200 text-red-850' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              <span>{ing}</span>
                              <span className="text-[10px] font-black text-gray-400">{isExcluded ? '❌ Quitada' : '✅ Incluido'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1 font-bold">Ingredientes extras (+$5 c/u):</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {breadStyles.filter(b => b !== selectedFlavor).map(ex => {
                          const isSel = selectedExtras.includes(ex);
                          return (
                            <button
                              type="button"
                              key={ex}
                              onClick={() => setSelectedExtras(prev => prev.includes(ex) ? prev.filter(x => x !== ex) : [...prev, ex])}
                              className={`p-2 rounded-xl text-[10px] text-center border ${
                                isSel ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-extrabold' : 'bg-white border-gray-200 text-gray-750'
                              }`}
                            >
                              {ex}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}


                {/* 10. TACOS 45 ORDEN (Tacos Especiales) */}
                {item.type === 'tacos45' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50/55 rounded-2xl border border-amber-100 p-3">
                      <p className="text-xs text-amber-900 font-sans font-semibold leading-relaxed">
                        🌮 <strong>Tacos Especiales ($${item.price.toFixed(2)}/orden):</strong> Selección individual por pieza a <strong>$${(item.price / 3).toFixed(2)} pesos</strong> cada una. Puedes mezclar sabores al gusto en tu pedido.
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2.5">
                        Selecciona las piezas por sabor:
                      </label>
                      <div className="space-y-2">
                        {['Suadero', 'Bistec', 'Chorizo'].map(fl => {
                          const qty = tacoQuantities[fl] || 0;
                          return (
                            <div key={fl} className="bg-white rounded-xl border border-gray-155 p-3.5 flex items-center justify-between shadow-sm hover:border-amber-300 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">🌮</span>
                                <div>
                                  <span className="text-sm font-sans font-black text-gray-900 block">{fl}</span>
                                  <span className="text-[10px] text-gray-400 font-mono tracking-tight">$${(item.price / 3).toFixed(2)} c/u</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3.5">
                                {qty > 0 && (
                                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                                    $${(qty * (item.price / 3)).toFixed(2)}
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setTacoQuantities(prev => ({ ...prev, [fl]: Math.max(0, qty - 1) }))}
                                    className="bg-slate-50 border border-gray-200 hover:bg-red-50 hover:text-red-600 w-8 h-8 font-black text-sm flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-bold w-6 text-center text-gray-900">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setTacoQuantities(prev => ({ ...prev, [fl]: qty + 1 }))}
                                    className="bg-slate-50 border border-gray-200 hover:bg-green-50 hover:text-green-600 w-8 h-8 font-black text-sm flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Checkbox Doble Tortilla for Tacos Especiales */}
                    <div className="bg-amber-50/40 rounded-2xl border border-amber-100 p-4 shadow-xs mt-2">
                      <div className="flex gap-2.5 items-center select-none">
                        <input 
                          type="checkbox" 
                          id="doble-tortilla-45"
                          checked={dobleTortilla} 
                          onChange={(e) => setDobleTortilla(e.target.checked)}
                          className="w-4.5 h-4.5 text-amber-605 border-gray-300 rounded focus:ring-amber-500 cursor-pointer" 
                        />
                        <div className="cursor-pointer" onClick={() => setDobleTortilla(prev => !prev)}>
                          <label htmlFor="doble-tortilla-45" className="text-sm font-sans font-black text-gray-901 cursor-pointer">
                            Doble tortilla
                          </label>
                          <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider leading-relaxed">
                            Añade un costo adicional de $1.00 peso a cada pieza seleccionada
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. TACOS 40 ORDEN (Tacos de Guisado) */}
                {item.type === 'tacos40' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50/55 rounded-2xl border border-amber-100 p-3">
                      <p className="text-xs text-amber-900 font-sans font-semibold leading-relaxed">
                        🌮 <strong>Tacos de Guisado:</strong> Por cada 3 piezas se cobra $${item.price.toFixed(2)}, por 6 piezas $${(item.price * 2).toFixed(2)}, consecutivamente. Las piezas intermedias se calculan a precio base y se redondean hacia arriba al múltiplo de 5 más cercano. ¡Arma tu orden mixta!
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2.5">
                        Selecciona las piezas por sabor:
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                        {[
                          'Chicharrón en salsa verde', 'Salchicha a la mexicana', 
                          'Huevo con jamón', 'Huevo con salchicha', 
                          'Huevo con chorizo', 'Tinga de pollo', 
                          'Mole de pollo', 'Chorizo con papa'
                        ].map(fl => {
                          const qty = tacoQuantities[fl] || 0;
                          const calculatedFlavorPrice = getTacos40Price(qty, item.price);
                          return (
                            <div key={fl} className="bg-white rounded-xl border border-gray-155 p-2.5 flex items-center justify-between shadow-sm hover:border-amber-300 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🌮</span>
                                <div>
                                  <span className="text-xs font-sans font-black text-gray-900 block leading-tight">{fl}</span>
                                  <span className="text-[9px] text-gray-400 font-mono tracking-tight">$${(item.price / 3).toFixed(2)} c/u (base)</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {qty > 0 && (
                                  <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    ${calculatedFlavorPrice}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setTacoQuantities(prev => ({ ...prev, [fl]: Math.max(0, qty - 1) }))}
                                    className="bg-slate-50 border border-gray-200 hover:bg-red-50 hover:text-red-600 w-7 h-7 font-black text-xs flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-bold w-5 text-center text-gray-900">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setTacoQuantities(prev => ({ ...prev, [fl]: qty + 1 }))}
                                    className="bg-slate-55 border border-gray-200 hover:bg-green-50 hover:text-green-600 w-7 h-7 font-black text-xs flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Checkbox Doble Tortilla for Tacos de Guisado */}
                    <div className="bg-amber-50/40 rounded-2xl border border-amber-100 p-4 shadow-xs mt-2">
                      <div className="flex gap-2.5 items-center select-none">
                        <input 
                          type="checkbox" 
                          id="doble-tortilla-40"
                          checked={dobleTortilla} 
                          onChange={(e) => setDobleTortilla(e.target.checked)}
                          className="w-4.5 h-4.5 text-amber-605 border-gray-300 rounded focus:ring-amber-500 cursor-pointer" 
                        />
                        <div className="cursor-pointer" onClick={() => setDobleTortilla(prev => !prev)}>
                          <label htmlFor="doble-tortilla-40" className="text-sm font-sans font-black text-gray-901 cursor-pointer">
                            Doble tortilla
                          </label>
                          <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider leading-relaxed">
                            Añade un costo adicional de $1.00 peso a cada pieza seleccionada
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 12. HUEVOS AL GUSTO */}
                {item.type === 'huevos' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-black">Elegir preparación ($65):</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Jamón', 'Salchicha', 'Tocino', 'Chorizo', 'A la mexicana', 'Estrellados'].map(fl => (
                          <button
                            key={fl}
                            onClick={() => setSelectedFlavor(fl)}
                            className={`p-2.5 rounded-xl border text-xs font-black text-center ${
                              selectedFlavor === fl ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200" text-gray-700'
                            }`}
                          >
                            🍳 {fl}
                          </button>
                        ))}
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-[11px] font-semibold text-emerald-950 mt-2">
                        Incluye por defecto: Frijol y 6 Tortillas calientes hechas a mano.
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 bg-neutral-50 px-3.5 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Cantidad total de Tortillas:</span>
                        <span className="text-[10px] text-gray-500 block">+$1 por tortilla extra arriba de 6</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTortillasQty(p => Math.max(0, p - 1))}
                          className="bg-white border w-8 h-8 font-bold text-sm flex items-center justify-center rounded"
                        >
                          -
                        </button>
                        <span className="text-xs font-black w-6 text-center">{tortillasQty}</span>
                        <button
                          type="button"
                          onClick={() => setTortillasQty(p => p + 1)}
                          className="bg-white border w-8 h-8 font-bold text-sm flex items-center justify-center rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 13. PLATILLOS $80 */}
                {item.type === 'platillo' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Elegir Platillo ($80):</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          'Mole de pollo', 'Barbacoa de pollo', 'Encacahuatado de pollo', 
                          'Pollo a la mexicana', 'Entomatado de puerco', 'Carne enchilada', 
                          'Cecina', 'Pechuga rellena', 'Pechuga frita', 'Pechuga asada', 
                          'Pechuga empanizada'
                        ].map(fl => (
                          <button
                            key={fl}
                            onClick={() => setSelectedFlavor(fl)}
                            className={`p-2 rounded-xl border text-[10px] font-black text-left leading-tight ${
                              selectedFlavor === fl ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                            }`}
                          >
                            🍛 {fl}
                          </button>
                        ))}
                      </div>
                      <div className="bg-amber-50/50 p-2.5 rounded-xl text-[10px] text-[#904d00] font-semibold mt-1">
                        Incluye: Arroz, Frijol, 6 Tortillas, Salsa y ensalada (donde aplique).
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Quitar acompañamientos incluidos:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Arroz', 'Frijol', '6 tortillas', 'Salsa', 'Ensalada'].map(sd => {
                          const isExcluded = excludedDefaults.includes(sd);
                          return (
                            <button
                              type="button"
                              key={sd}
                              onClick={() => setExcludedDefaults(prev => prev.includes(sd) ? prev.filter(x => x !== sd) : [...prev, sd])}
                              className={`p-2 rounded-xl border text-xs font-bold text-left justify-between flex items-center ${
                                isExcluded ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              <span>{sd}</span>
                              <span className="text-[10px] font-black">{isExcluded ? '❌ Quitar' : '✅ Incluido'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 14. ANTOJITOS DISPATCHER */}
                {item.type === 'antojito' && (
                  <div className="space-y-4">
                    {item.subType === 'Tacos dorados' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold font-mono">Tipo de Relleno:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Pollo', 'Papa'].map(sb => (
                            <button
                              key={sb}
                              onClick={() => setSelectedFlavor(sb)}
                              className={`p-3 rounded-xl border text-xs font-black text-center ${
                                selectedFlavor === sb ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              🌮 {sb}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.subType === 'Tostadas' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Tipo de Tostada:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Pollo', 'Papa', 'Chorizo'].map(sb => (
                            <button
                              key={sb}
                              onClick={() => setSelectedFlavor(sb)}
                              className={`p-3 rounded-xl border text-xs font-black text-center ${
                                selectedFlavor === sb ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              🥑 {sb}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.subType === 'Picaditas' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Salsa de la Picadita (Lleva Crema):</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['Verdes', 'Guajillo', 'Jitomate', 'Crema'].map(sb => (
                            <button
                              key={sb}
                              onClick={() => setSelectedFlavor(sb)}
                              className={`p-2 rounded-xl border text-[10px] font-black text-center ${
                                selectedFlavor === sb ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              🌶️ {sb}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.subType === 'Huaraches' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Ingrediente principal de Huarache:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Suadero', 'Bistec', 'Chorizo'].map(sb => (
                            <button
                              key={sb}
                              onClick={() => setSelectedFlavor(sb)}
                              className={`p-3 rounded-xl border text-xs font-black text-center ${
                                selectedFlavor === sb ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              🥓 {sb}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.subType === 'Enchiladas' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 font-bold font-sans">Variedad de Enchilada:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { f: 'Suizas', label: 'Suizas ($45)' },
                            { f: 'Guajillo', label: 'Guajillo ($40)' },
                            { f: 'Verdes', label: 'Verdes ($40)' },
                            { f: 'Jitomate', label: 'Jitomate ($40)' }
                          ].map(eb => (
                            <button
                              key={eb.f}
                              onClick={() => setSelectedFlavor(eb.f)}
                              className={`p-3 rounded-xl border text-xs font-black text-center ${
                                selectedFlavor === eb.f ? 'bg-amber-100 border-amber-400 text-[#904d00]' : 'bg-white border-gray-150 text-gray-700'
                              }`}
                            >
                              🧀 {eb.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 15. SNACKS BASIC ADD-ON OPTIONS */}
                {item.type === 'snack' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block font-bold">Aderezos / Extras sugeridos:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Con salsa Valentina', 'Con limón fresco', 'Con Miguelito chilito', 'Doble porción'].map(opt => {
                        const isSel = customOptions.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => setCustomOptions(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left ${
                              isSel ? 'bg-amber-50 border-amber-400 text-[#904d00]' : 'bg-white border-gray-200 text-gray-700'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {(item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'))) && (
              <div className="space-y-2 border-t border-gray-150 pt-3">
                <label className="text-[10px] font-black text-gray-550 uppercase tracking-wider block font-bold">
                  🍗 Pieza de Pollo (Elige una):
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!polloStatus?.muslo}
                    onClick={() => setSelectedPolloPiece('Muslo')}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-black text-center transition-all ${
                      selectedPolloPiece === 'Muslo'
                        ? 'bg-[#904d00] text-white border-[#904d00]'
                        : polloStatus?.muslo
                          ? 'bg-white border-gray-200 text-gray-750'
                          : 'bg-gray-100 text-gray-450 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Muslo {!polloStatus?.muslo && '(Agotado)'}
                  </button>
                  <button
                    type="button"
                    disabled={!polloStatus?.pierna}
                    onClick={() => setSelectedPolloPiece('Pierna')}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-black text-center transition-all ${
                      selectedPolloPiece === 'Pierna'
                        ? 'bg-[#904d00] text-white border-[#904d00]'
                        : polloStatus?.pierna
                          ? 'bg-white border-gray-200 text-gray-750'
                          : 'bg-gray-100 text-gray-450 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Pierna {!polloStatus?.pierna && '(Agotado)'}
                  </button>
                </div>
                {(!polloStatus?.muslo && !polloStatus?.pierna) && (
                  <p className="text-[10px] text-red-500 font-bold">⚠️ Piezas de pollo agotadas temporalmente.</p>
                )}
              </div>
            )}

              </div>
              {/* ─── STICKY FOOTER — always visible, never scrolls ─── */}
              <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                <div className="text-left w-full sm:w-auto flex items-center gap-4">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium block">Subtotal:</span>
                    <span className="text-xl font-mono font-black text-emerald-800">${displayedPrice.toFixed(2)}</span>
                  </div>
                  {totalPieces > 0 && (
                    <div className="border-l border-gray-300 pl-4">
                      <span className="text-[11px] text-gray-500 font-medium block">Piezas:</span>
                      <span className="text-xl font-mono font-black text-amber-800">{totalPieces}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveBuilder(null)}
                    className="w-1/2 sm:w-28 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-black py-2.5 rounded-xl text-center cursor-pointer transition-colors"
                  >
                    Salir
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBuiltItemToCart}
                    className="w-1/2 sm:w-44 bg-[#904d00] hover:bg-amber-900 border border-amber-800 text-white text-xs font-black py-2.5 rounded-xl text-center shadow-md flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>✓ Agregar a Orden</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
