/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, OrderItem, Order, ClientDebt, STORES_LIST } from '../types';
import { 
  ShoppingCart, Plus, Minus, Trash2, Search, Sparkles, Send, X, 
  ArrowRight, UserPlus, CreditCard, ChevronRight, Check, AlertCircle, 
  Coffee, RefreshCw, Clock, Store, User, BookOpen, AlertTriangle
} from 'lucide-react';

interface POSPanelProps {
  products: Product[];
  clients: ClientDebt[];
  onAddOrder: (newOrder: Order) => void;
  onAddClient: (newClient: ClientDebt) => void;
  isStoreClosed?: boolean;
  editingOrder?: Order | null;
  onSaveEditedOrder?: (updatedOrder: Order) => void;
  onCancelEdit?: () => void;
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
  onAddClient, 
  isStoreClosed = false,
  editingOrder = null,
  onSaveEditedOrder,
  onCancelEdit
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
  const [tienda, setTienda] = useState('Mesa (gente que llega al local)');
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

  // Tacos de Guisado pricing logic
  const getTacos40Price = (qty: number): number => {
    if (qty % 3 === 0) {
      return (qty / 3) * 40;
    } else {
      const rawValue = (40 / 3) * qty;
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

  // Simple local inventory lists
  const listBebidasFrias: HelperMenuItem[] = [
    { id: 'pos-bf-choc', name: 'Plátano con Chocomilk', p: 'Bebidas Frías', price: 45, type: 'licuado', desc: 'Licuado cremoso de plátano con chocomilk tradicional de la casa.' },
    { id: 'pos-bf-fres', name: 'Licuado de Fresa', p: 'Bebidas Frías', price: 45, type: 'licuado', desc: 'Licuado preparado con fresas frescas seleccionadas al momento.' },
    { id: 'pos-bf-jugo', name: 'Jugo', p: 'Bebidas Frías', price: 45, type: 'jugo', desc: 'Jugo natural. Escoge tu tamaño favorito de 16 oz o 1 Litro.' },
    { id: 'pos-bf-agua', name: 'Agua Fresca', p: 'Bebidas Frías', price: 20, type: 'agua', desc: 'Aguas frutales frescas del día preparadas en casa.' }
  ];

  const listFrutas: HelperMenuItem[] = [
    { id: 'pos-fru-vaso', name: 'Fruta en Vaso', p: 'Frutas', price: 25, type: 'fruta', desc: 'Fruta fresca de temporada cortada en vaso con aderezos y complementos.' },
    { id: 'pos-fru-plato', name: 'Fruta en Plato', p: 'Frutas', price: 30, type: 'fruta', desc: 'Fruta fresca de temporada servida en plato con aderezos y complementos.' }
  ];

  const listTortas: HelperMenuItem[] = [
    { id: 'pos-ty-torta', name: 'Torta', p: 'Tortas y Sándwiches', price: 40, type: 'torta', desc: 'Crujiente bolillo caliente. Selecciona el tipo de carne y rellenos.' },
    { id: 'pos-ty-sand', name: 'Sándwich', p: 'Tortas y Sándwiches', price: 30, type: 'sandwich', desc: 'Sándwich preparado al gusto en pan Sencillo o Doble.' }
  ];

  const listBebidasCalientes: HelperMenuItem[] = [
    { id: 'pos-cal-olla', name: 'Café de Olla', p: 'Bebidas Calientes', price: 15, type: 'caliente_olla', desc: 'Café de olla aromático endulzado con piloncillo y canela.' },
    { id: 'pos-cal-nesc', name: 'Nescafé', p: 'Bebidas Calientes', price: 17, type: 'nescafe', desc: 'Nescafé preparado caliente con leche opcional.' },
    { id: 'pos-cal-te', name: 'Té', p: 'Bebidas Calientes', price: 15, type: 'te', desc: 'Tés calientes surtidos de hierbabuena, manzanilla, limón etc.' }
  ];

  const listComida: HelperMenuItem[] = [
    { id: 'pos-com-t45', name: 'Tacos Especiales ($45)', p: 'Comida', price: 45, type: 'tacos45', desc: 'Orden de 3 tacos medianos de Suadero, Bistec o Chorizo.' },
    { id: 'pos-com-t40', name: 'Tacos de Guisado', p: 'Comida', price: 40, type: 'tacos40', desc: 'Por 3 piezas se cobra $40, por 6 piezas $80, consecutivamente. Pieza extra redondeada a múltiplo de 5.' },
    { id: 'pos-com-huv', name: 'Huevos al Gusto', p: 'Comida', price: 65, type: 'huevos', desc: 'Dos huevos servidos con frijol y 6 tortillas. Adiciona tortillas.' },
    { id: 'pos-com-pla', name: 'Platillo', p: 'Comida', price: 80, type: 'platillo', desc: 'Gisados de la casa. Incluye arroz, frijol y 6 tortillas de mano.' },
    { id: 'pos-com-dor', name: 'Tacos Dorados', p: 'Comida', price: 45, type: 'antojito', subType: 'Tacos dorados', desc: 'Orden de tacos dorados crujientes de pollo o papa.' },
    { id: 'pos-com-que', name: 'Quesadillas de Papa', p: 'Comida', price: 45, type: 'antojito', subType: 'Quesadillas de papa', desc: 'Deliciosas quesadillas de papa doraditas.' },
    { id: 'pos-com-pes', name: 'Pescadillas', p: 'Comida', price: 45, type: 'antojito', subType: 'Pescadillas', desc: 'Ricas pescadillas fritas al estilo costero.' },
    { id: 'pos-com-tos', name: 'Tostadas', p: 'Comida', price: 45, type: 'antojito', subType: 'Tostadas', desc: 'Tostadas crujientes con pollo, papa o chorizo.' },
    { id: 'pos-com-pic', name: 'Picaditas', p: 'Comida', price: 40, type: 'antojito', subType: 'Picaditas', desc: 'Pellizcadas veracruzanas con salsa de tu elección y crema.' },
    { id: 'pos-com-hua', name: 'Huaraches', p: 'Comida', price: 55, type: 'antojito', subType: 'Huaraches', desc: 'Palo de maíz con suadero, bistec o chorizo arriba.' },
    { id: 'pos-com-enc', name: 'Enchiladas', p: 'Comida', price: 40, type: 'antojito', subType: 'Enchiladas', desc: 'Enchiladas Suizas ($45), Guajillo o Verdes ($40) al gusto.' }
  ];

  const listSnacks: HelperMenuItem[] = [
    { id: 'pos-sna-sa-or', name: 'Sabritas Originales', p: 'Snacks', price: 22, type: 'snack', desc: 'Bolsa de papas fritas Sabritas clásicas con salsa opcional.' },
    { id: 'pos-sna-sa-ad', name: 'Sabritas Adobadas', p: 'Snacks', price: 22, type: 'snack', desc: 'Bolsa de Sabritas crujientes sabor adobo.' },
    { id: 'pos-sna-ru-qu', name: 'Ruffles de Queso', p: 'Snacks', price: 22, type: 'snack', desc: 'Ruffles ondulados sabor queso intenso.' },
    { id: 'pos-sna-do-na', name: 'Doritos Nacho', p: 'Snacks', price: 22, type: 'snack', desc: 'Totopos Doritos sabor queso Nacho clásico.' },
    { id: 'pos-sna-ch-to', name: 'Cheetos Torciditos', p: 'Snacks', price: 22, type: 'snack', desc: 'Botana de queso Cheetos Torciditos.' },
    { id: 'pos-sna-ta-fu', name: 'Takis Fuego', p: 'Snacks', price: 22, type: 'snack', desc: 'Takis sabor chile y limón extremo.' },
    { id: 'pos-sna-ca-ja', name: 'Cacahuates Japoneses', p: 'Snacks', price: 18, type: 'snack', desc: 'Bolsa individual de cacahuates estilo japones.' },
    { id: 'pos-sna-ca-en', name: 'Cacahuates Enchilados', p: 'Snacks', price: 18, type: 'snack', desc: 'Peanuts cubiertos con sazonador de chile salado.' },
    { id: 'pos-sna-ga-ch', name: 'Galletas Chokis', p: 'Snacks', price: 18, type: 'snack', desc: 'Galletas con chispas de auténtico chocolate.' },
    { id: 'pos-sna-ga-or', name: 'Galletas Oreo', p: 'Snacks', price: 18, type: 'snack', desc: 'Galletas de sándwich rellenas de crema dulce.' },
    { id: 'pos-sna-ga-em', name: 'Galletas Emperador Chocolate', p: 'Snacks', price: 18, type: 'snack', desc: 'Galletas Gamesa Emperador chocolate de chocolate.' },
    { id: 'pos-sna-ga-el', name: 'Galletas Emperador Limón', p: 'Snacks', price: 18, type: 'snack', desc: 'Galletas sándwich Gamesa Emperador sabor limón.' },
    { id: 'pos-sna-pa-go', name: 'Panditas / Gominolas', p: 'Snacks', price: 18, type: 'snack', desc: 'Ositos de goma frutales deliciosos.' }
  ];

  // Helper selectors and customizers
  const fruitsOptions = ['Melón', 'Papaya', 'Manzana', 'Plátano', 'Piña', 'Jícama', 'Pepino', 'Mango', 'Fresa'];
  const extraToppings = ['Miel', 'Granola', 'Yogurt', 'Lechera', 'Tajín', 'Chamoy', 'Miguelito', 'Salsa', 'Limón', 'Sal'];

  const breadStyles = ['Jamón', 'Salchicha', 'Tocino', 'Milanesa', 'Ensalada de Pollo', 'Ensalada de Atún', 'Chorizo', 'Queso Oaxaca'];
  const breadIngredients = ['Mayonesa', 'Lechuga', 'Jitomate', 'Queso amarillo'];

  // All item lists grouped by category
  const getCategoryItems = (cat: PosCategory) => {
    switch(cat) {
      case 'Bebidas Frías': return listBebidasFrias;
      case 'Frutas': return listFrutas;
      case 'Tortas y Sándwiches': return listTortas;
      case 'Bebidas Calientes': return listBebidasCalientes;
      case 'Comida': return listComida;
      case 'Snacks': return listSnacks;
    }
  };

  const getItemImage = (item: HelperMenuItem) => {
    // Try to find matching configured product inside standard list supplied by Admin
    const match = products?.find(p => {
      const pName = p.name.toLowerCase();
      const iName = item.name.toLowerCase();
      const sType = (item.subType || '').toLowerCase();
      return (
        pName.includes(iName) || 
        iName.includes(pName) ||
        (sType && pName.includes(sType))
      );
    });
    
    if (match && match.image) {
      return match.image;
    }
    
    // Categorized backup defaults
    switch (item.p) {
      case 'Bebidas Frías':
        return 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=300&q=80';
      case 'Frutas':
        return 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80';
      case 'Tortas y Sándwiches':
        if (item.id === 'pos-ty-sand') {
          return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80';
        }
        return 'https://images.unsplash.com/photo-1539252555452-730190d63cc1?w=300&q=80';
      case 'Bebidas Calientes':
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80';
      case 'Comida':
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80';
      case 'Snacks':
        if (item.name.toLowerCase().includes('galleta') || item.name.toLowerCase().includes('oreo') || item.name.toLowerCase().includes('chokis')) {
          return 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80';
        }
        return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80';
      default:
        return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80';
    }
  };

  // Filter based on search query. If query is active, search GLOBALLY across all categories.
  const availableItems = searchQuery.trim() !== ''
    ? [...listBebidasFrias, ...listFrutas, ...listTortas, ...listBebidasCalientes, ...listComida, ...listSnacks].filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getCategoryItems(activeCategory);

  // Triggering the Configuration Modal For Builders
  const handleItemClick = (item: any) => {
    // Find the real configured product in our catalog to check for the 'tieneVariantes' flag
    const realProd = products?.find(p => p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase());

    const isSnack = item.p === 'Snacks' || 
                    item.name.toLowerCase().includes('sabritas') || 
                    item.name.toLowerCase().includes('galleta') || 
                    item.name.toLowerCase().includes('oreo') || 
                    item.name.toLowerCase().includes('ruffles') || 
                    item.name.toLowerCase().includes('doritos') || 
                    item.name.toLowerCase().includes('cheetos') || 
                    item.name.toLowerCase().includes('takis') || 
                    item.name.toLowerCase().includes('cacahuate') || 
                    item.name.toLowerCase().includes('panditas') || 
                    item.name.toLowerCase().includes('chokis') ||
                    item.name.toLowerCase().includes('galletas') ||
                    item.name.toLowerCase().includes('chocolates') ||
                    item.name.toLowerCase().includes('paquete');

    const isLicuadoNoVariants = item.type === 'licuado' && (
      item.name.toLowerCase() === 'licuado de fresa' ||
      item.name.toLowerCase().includes('plátano') ||
      item.name.toLowerCase().includes('vainilla') ||
      item.name.toLowerCase().includes('chocolate')
    );

    // If 'tieneVariantes' is explicitly set to false, or it is a simple snack/licuado and not explicitly set to true
    const hasVariants = realProd?.tieneVariantes !== undefined 
      ? realProd.tieneVariantes 
      : !(isSnack || isLicuadoNoVariants);

    if (!hasVariants) {
      // Adding directly to cart
      const compiledProduct: Product = {
        id: realProd?.id || item.id,
        name: realProd?.name || item.name,
        category: (realProd?.category || 'Otros') as any,
        price: realProd?.price || item.price,
        image: realProd?.image || getItemImage(item),
        active: realProd?.active ?? true,
        description: realProd?.description || item.desc,
        tieneVariantes: false
      };

      const newCartItem: OrderItem = {
        product: compiledProduct,
        quantity: 1,
        customizations: [],
        subtotal: compiledProduct.price
      };

      setCart(prev => [...prev, newCartItem]);
      return;
    }

    setActiveBuilder(item.id);
    setDobleTortilla(false); // Reset tortilla extra value on open
    
    // Initialize corresponding defaults
    if (item.type === 'jugo') {
      setSelectedSize('16 oz');
      setSelectedFlavor('Naranja');
      setCustomOptions([]);
    } else if (item.type === 'agua') {
      setSelectedSize('Chica');
      setSelectedFlavor('Limón');
      setCustomOptions([]);
    } else if (item.type === 'fruta') {
      setSelectedSize(item.id === 'pos-fru-plato' ? 'Plato' : 'Vaso');
      setSelectedFruits([]);
      setSelectedExtras([]);
    } else if (item.type === 'torta') {
      setSelectedFlavor('Jamón'); // choosing type
      setSelectedExtras([]); // reset extras
      setExcludedDefaults([]); // clear exclusions
    } else if (item.type === 'sandwich') {
      setSelectedSize('Sencillo'); // sencillo or doble
      setSelectedFlavor('Jamón'); // type
      setSelectedExtras([]);
      setExcludedDefaults([]);
    } else if (item.type === 'caliente_olla') {
      setSelectedSize('Chico');
      setWithMilk(false);
    } else if (item.type === 'nescafe') {
      setSelectedSize('Chico');
      setWithMilk(false);
    } else if (item.type === 'te') {
      setSelectedSize('Chico');
      setSelectedFlavor('Hierbabuena');
    } else if (item.type === 'tacos45') {
      setSelectedFlavor('Suadero');
      setPizzaToggle('Pieza');
      setPieceQuantity(1);
      setTacoQuantities({
        'Suadero': 0,
        'Bistec': 0,
        'Chorizo': 0
      });
    } else if (item.type === 'tacos40') {
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
    } else if (item.type === 'huevos') {
      setSelectedFlavor('Jamón');
      setTortillasQty(6);
    } else if (item.type === 'platillo') {
      setSelectedFlavor('Mole de pollo');
      setExcludedDefaults([]);
    } else if (item.type === 'antojito') {
      if (item.subType === 'Tacos dorados') {
        setSelectedFlavor('Pollo');
      } else if (item.subType === 'Tostadas') {
        setSelectedFlavor('Pollo');
      } else if (item.subType === 'Picaditas') {
        setSelectedFlavor('Verdes');
      } else if (item.subType === 'Huaraches') {
        setSelectedFlavor('Suadero');
      } else if (item.subType === 'Enchiladas') {
        setSelectedFlavor('Suizas');
      }
    } else if (item.type === 'snack') {
      setCustomOptions([]);
    }
  };

  // Real-time calculation inside build state
  const getCurrentCalculatedPrice = () => {
    if (!activeBuilder) return 0;
    
    // Find item
    const all = [...listBebidasFrias, ...listFrutas, ...listTortas, ...listBebidasCalientes, ...listComida, ...listSnacks];
    const item = all.find(x => x.id === activeBuilder);
    if (!item) return 0;

    switch (item.type) {
      case 'licuado':
        return 45;
      
      case 'jugo':
        return selectedSize === '16 oz' ? 45 : 90;
      
      case 'agua':
        return selectedSize === 'Chica' ? 20 : 35;
      
      case 'fruta':
        return selectedSize === 'Vaso' ? 25 : 30;
      
      case 'torta': {
        // Base is 40
        // Extras: First addition adds 5 pesos
        const extraCount = selectedExtras.length;
        const extraPrice = extraCount * 5;
        return 40 + extraPrice;
      }

      case 'sandwich': {
        // Sencillo 30, Doble 45
        const base = selectedSize === 'Sencillo' ? 30 : 45;
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
        const baseCost = totalQty * 15;
        const extraTortilla = dobleTortilla ? totalQty * 1 : 0;
        return baseCost + extraTortilla;
      }

      case 'tacos40': {
        const totalQty = (Object.values(tacoQuantities) as number[]).reduce((acc: number, val: number) => acc + val, 0);
        const baseCost = getTacos40Price(totalQty);
        const extraTortilla = dobleTortilla ? totalQty * 1 : 0;
        return baseCost + extraTortilla;
      }

      case 'huevos': {
        // Base price is 65. Extra tortilla above 6 is +1 each
        const extraT = Math.max(0, tortillasQty - 6);
        return 65 + extraT;
      }

      case 'platillo':
        return 80;

      case 'antojito':
        if (item.subType === 'Enchiladas') {
          if (selectedFlavor === 'Suizas') return 45;
          return 40; // others
        }
        return item.price; // defaults for antojitos

      default:
        return item.price;
    }
  };

  // Add customized item to shopping cart list
  const handleAddBuiltItemToCart = () => {
    const all = [...listBebidasFrias, ...listFrutas, ...listTortas, ...listBebidasCalientes, ...listComida, ...listSnacks];
    const item = all.find(x => x.id === activeBuilder);
    if (!item) return;

    // Handle special multi-sabor taco builder addition
    if (item.type === 'tacos45') {
      const itemsToAdd: OrderItem[] = [];
      (Object.entries(tacoQuantities) as [string, number][]).forEach(([flavor, val]: [string, number]) => {
        const q = val;
        if (q > 0) {
          const itemPrice = 15;
          const rawSubtotal = q * 15;
          const tortillaExtra = dobleTortilla ? q * 1 : 0;
          const calculatedSubtotal = Math.ceil(rawSubtotal / 5) * 5 + tortillaExtra;
          
          const compiledProduct: Product = {
            id: `pos-${item.type}-${flavor.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
            name: `Taco de ${flavor}${dobleTortilla ? ' (Doble Tortilla)' : ''}`,
            category: 'Comida y Snacks',
            price: itemPrice,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
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

    if (item.type === 'tacos40') {
      const selectedFlavorsList: string[] = [];
      let totalPieces = 0;
      (Object.entries(tacoQuantities) as [string, number][]).forEach(([flavor, val]: [string, number]) => {
        if (val > 0) {
          selectedFlavorsList.push(`${flavor} (${val} pz)`);
          totalPieces += val;
        }
      });

      if (totalPieces > 0) {
        const baseSubtotal = getTacos40Price(totalPieces);
        const calculatedSubtotal = baseSubtotal + (dobleTortilla ? totalPieces * 1 : 0);

        const compiledProduct: Product = {
          id: `pos-com-t40-${Date.now()}`,
          name: `Tacos de Guisado${dobleTortilla ? ' (Doble Tortilla)' : ''}`,
          category: 'Comida y Snacks',
          price: 13.333333333333334,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
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

    if (item.type === 'licuado') {
      derivedName = item.name;
      if (customOptions.length > 0) detailsList.push(...customOptions);
    } else if (item.type === 'jugo') {
      derivedName = `Jugo ${selectedFlavor} (${selectedSize})`;
      if (customOptions.length > 0) detailsList.push(...customOptions);
    } else if (item.type === 'agua') {
      derivedName = `Agua de ${selectedFlavor} (${selectedSize})`;
      if (customOptions.length > 0) detailsList.push(...customOptions);
    } else if (item.type === 'fruta') {
      derivedName = selectedSize === 'Vaso' ? 'Fruta en Vaso' : 'Fruta en Plato';
      detailsList.push(`Frutas: ${selectedFruits.join(', ') || 'Surtidas'}`);
      if (selectedExtras.length > 0) detailsList.push(`Extras: ${selectedExtras.join(', ')}`);
    } else if (item.type === 'torta') {
      derivedName = `Torta de ${selectedFlavor}`;
      if (excludedDefaults.length > 0) {
        detailsList.push(`Sin: ${excludedDefaults.join(', ')}`);
      }
      if (selectedExtras.length > 0) {
        detailsList.push(`Extras extra (+): ${selectedExtras.join(', ')}`);
      }
    } else if (item.type === 'sandwich') {
      derivedName = `Sándwich ${selectedSize} (${selectedFlavor})`;
      if (excludedDefaults.length > 0) {
        detailsList.push(`Sin: ${excludedDefaults.join(', ')}`);
      }
      if (selectedExtras.length > 0) {
        detailsList.push(`Extras extra (+): ${selectedExtras.join(', ')}`);
      }
    } else if (item.type === 'caliente_olla') {
      derivedName = `Café de Olla (${selectedSize}${withMilk ? ' con Leche' : ''})`;
    } else if (item.type === 'nescafe') {
      derivedName = `Nescafé (${selectedSize}${withMilk ? ' con Leche' : ''})`;
    } else if (item.type === 'te') {
      derivedName = `Té de ${selectedFlavor} (${selectedSize})`;
    } else if (item.type === 'huevos') {
      derivedName = `Huevos con ${selectedFlavor}`;
      detailsList.push(`${tortillasQty} Tortillas incluidas`);
    } else if (item.type === 'platillo') {
      derivedName = `Platillo: ${selectedFlavor}`;
      if (excludedDefaults.length > 0) {
        detailsList.push(`Sin acompañamientos: ${excludedDefaults.join(', ')}`);
      }
    } else if (item.type === 'antojito') {
      derivedName = `${item.subType} - ${selectedFlavor}`;
    } else if (item.type === 'snack') {
      derivedName = item.name;
      if (customOptions.length > 0) detailsList.push(...customOptions);
    }

    // Map to backend category for consistency
    let backendCat: 'Licuados y Jugos' | 'Comida y Snacks' | 'Sabritas y Galletas' | 'Otros' = 'Otros';
    if (activeCategory === 'Bebidas Frías' || activeCategory === 'Frutas') {
      backendCat = 'Licuados y Jugos';
    } else if (activeCategory === 'Tortas y Sándwiches' || activeCategory === 'Comida') {
      backendCat = 'Comida y Snacks';
    } else if (activeCategory === 'Snacks') {
      backendCat = 'Sabritas y Galletas';
    }

    const compiledProduct: Product = {
      id: `pos-${item.id}-${Date.now()}`,
      name: derivedName,
      category: backendCat,
      price: calculatedPrice,
      image: getItemImage(item),
      active: true,
      description: detailsList.join(' | ') || item.desc
    };

    const rawSubtotal = calculatedPrice;
    const finalSubtotal = (activeCategory === 'Comida' || isComidaProduct(compiledProduct.id))
      ? Math.ceil(rawSubtotal / 5) * 5
      : rawSubtotal;

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
      const updated = [...prev];
      const item = updated[index];
      item.quantity += change;
      if (item.quantity <= 0) {
        updated.splice(index, 1);
      } else {
        if (item.product.id.includes('tacos40')) {
          const hasDoble = item.customizations?.some(c => c.toLowerCase().includes('doble tortilla')) || item.product.name.toLowerCase().includes('doble');
          const baseSub = getTacos40Price(item.quantity);
          item.subtotal = baseSub + (hasDoble ? item.quantity * 1 : 0);
        } else if (item.product.id.includes('tacos45')) {
          const hasDoble = item.customizations?.some(c => c.toLowerCase().includes('doble tortilla')) || item.product.name.toLowerCase().includes('doble');
          const baseSub = item.quantity * 15;
          item.subtotal = baseSub + (hasDoble ? item.quantity * 1 : 0);
        } else {
          const rawSubtotal = item.quantity * item.product.price;
          if (isComidaProduct(item.product.id)) {
            item.subtotal = Math.ceil(rawSubtotal / 5) * 5;
          } else {
            item.subtotal = rawSubtotal;
          }
        }
      }
      return updated;
    });
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Compute invoice pricing
  const subtotal = cart.reduce((sub, item) => sub + item.subtotal, 0);
  const total = Math.max(0, subtotal - discountAmount);

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
    const finalClientName = tienda ? `${baseClientName} (${tienda})` : baseClientName;

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

  // Auto select client matching Search Dropdowns
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(clientSearch.toLowerCase())
  );

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
          {availableItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`rounded-2xl border p-4 hover:border-orange-400 hover:shadow-md transition-all flex flex-col text-left group cursor-pointer relative overflow-hidden ${getCategoryCardBg(item.p as PosCategory)}`}
            >
              <div className="absolute top-2 right-2 bg-orange-100 text-orange-850 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                {item.type}
              </div>
              
              <div className="mt-2 flex-grow flex gap-3.5 items-start">
                <img 
                  src={getItemImage(item)} 
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover bg-white/70 border border-orange-200/50 shrink-0 shadow-xs group-hover:scale-105 transition-transform" 
                />
                <div className="flex-grow space-y-0.5 min-w-0">
                  <h4 className="font-sans font-extrabold text-gray-900 text-xs sm:text-[13px] group-hover:text-orange-950 flex items-center gap-1 leading-tight line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100/60 w-full">
                <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono">
                  ${item.price.toFixed(2)}
                  {item.price === 45 && item.type === 'jugo' && ' (S-M)'}
                  {item.price === 20 && item.type === 'agua' && ' (S-M)'}
                </span>
                
                <span className="text-[11px] font-black text-orange-700 bg-orange-50/50 group-hover:bg-[#904d00] group-hover:text-white px-2.5 py-1 rounded-lg transition-colors border border-orange-100">
                  Agregar →
                </span>
              </div>
            </button>
          ))}
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
                  {STORES_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
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
                        <p className="text-[9px] text-gray-500 font-mono italic">
                          {item.customizations.join(' | ')}
                        </p>
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
                  onClick={() => {
                    if (confirm('¿Vaciar y limpiar la orden actual de la mesa?')) {
                      setCart([]);
                      setDiscountAmount(0);
                      setClientName('');
                      setObservaciones('');
                    }
                  }}
                  className="w-full text-center text-[10px] text-gray-400 hover:text-red-650 font-extrabold cursor-pointer py-1"
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
        const all = [...listBebidasFrias, ...listFrutas, ...listTortas, ...listBebidasCalientes, ...listComida, ...listSnacks];
        const item = all.find(x => x.id === activeBuilder);
        if (!item) return null;

        const calculatedPrice = getCurrentCalculatedPrice();
        const isComida = activeCategory === 'Comida' || isComidaProduct(item.id);
        const displayedPrice = isComida ? Math.ceil(calculatedPrice / 5) * 5 : calculatedPrice;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden transform scale-100 transition-transform">
              
              {/* Header */}
              <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center">
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
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                
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
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Elegir Presentación de Pan:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Sencillo ($30)', 'Doble ($45)'].map(sz => {
                          const value = sz.includes('Sencillo') ? 'Sencillo' : 'Doble';
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

                {/* 7. CALIENTES - CAFÉ DE OLLA */}
                {item.type === 'caliente_olla' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Tamaño de vaso:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Chico ($15)', 'Mediano ($20)'].map(sz => {
                          const value = sz.includes('Chico') ? 'Chico' : 'Mediano';
                          return (
                            <button
                              type="button"
                              key={sz}
                              onClick={() => setSelectedSize(value)}
                              className={`p-3 rounded-xl border text-xs font-black text-center ${
                                selectedSize === value ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-750'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

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
                              {selectedSize === 'Chico' ? 'Suma +$2 pesos (Total: $17)' : 'Suma +$5 pesos (Total: $25)'}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {withMilk ? (
                            <span className="bg-amber-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">SÍ CON LECHE</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 text-[10px] px-2.5 py-0.5 rounded-full font-medium">SIN LECHE</span>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. CALIENTES - NESCAFÉ */}
                {item.type === 'nescafe' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Tamaño de vaso:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Chico ($17)', 'Mediano ($25)'].map(sz => {
                          const value = sz.includes('Chico') ? 'Chico' : 'Mediano';
                          return (
                            <button
                              type="button"
                              key={sz}
                              onClick={() => setSelectedSize(value)}
                              className={`p-3 rounded-xl border text-xs font-black text-center ${
                                selectedSize === value ? 'bg-[#904d00] text-white border-[#904d00]' : 'bg-white border-gray-200 text-gray-750'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

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
                              {selectedSize === 'Chico' ? 'Suma +$3 pesos (Total: $20)' : 'Suma +$2 pesos (Total: $27)'}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {withMilk ? (
                            <span className="bg-amber-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">SÍ CON LECHE</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 text-[10px] px-2.5 py-0.5 rounded-full font-medium">SIN LECHE</span>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 9. CALIENTES - TÉS */}
                {item.type === 'te' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Tamaño de taza:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Chico ($15)', 'Mediano ($20)'].map(sz => {
                          const value = sz.includes('Chico') ? 'Chico' : 'Mediano';
                          return (
                            <button
                              key={sz}
                              onClick={() => setSelectedSize(value)}
                              className={`p-3 rounded-xl border text-xs font-black text-center ${
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Sabor medicinal / frutal:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Hierbabuena', 'Manzanilla', 'Limón', 'Tila', 'Jengibre con limón', 'Té verde', 'Frutal'].map(fl => (
                          <button
                            key={fl}
                            onClick={() => setSelectedFlavor(fl)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center ${
                              selectedFlavor === fl ? 'bg-amber-100 border-amber-400 text-[#904d00] font-black' : 'bg-white border-gray-150 text-gray-700'
                            }`}
                          >
                            {fl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. TACOS 45 ORDEN (Tacos Especiales) */}
                {item.type === 'tacos45' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50/55 rounded-2xl border border-amber-100 p-3">
                      <p className="text-xs text-amber-900 font-sans font-semibold leading-relaxed">
                        🌮 <strong>Tacos Especiales ($45/orden):</strong> Selección individual por pieza a <strong>$15 pesos</strong> cada una. Puedes mezclar sabores al gusto en tu pedido.
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
                                  <span className="text-[10px] text-gray-400 font-mono tracking-tight">$15.00 c/u</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3.5">
                                {qty > 0 && (
                                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                                    ${qty * 15}
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
                        🌮 <strong>Tacos de Guisado:</strong> Por cada 3 piezas se cobra $40, por 6 piezas $80, consecutivamente. Las piezas intermedias se calculan a precio base y se redondean hacia arriba al múltiplo de 5 más cercano. ¡Arma tu orden mixta!
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
                          const calculatedFlavorPrice = getTacos40Price(qty);
                          return (
                            <div key={fl} className="bg-white rounded-xl border border-gray-155 p-2.5 flex items-center justify-between shadow-sm hover:border-amber-300 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🌮</span>
                                <div>
                                  <span className="text-xs font-sans font-black text-gray-900 block leading-tight">{fl}</span>
                                  <span className="text-[9px] text-gray-400 font-mono tracking-tight">$13.33 c/u (base)</span>
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

              </div>

              {/* Real-time Subtotal display and Modal confirmation buttons */}
              <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-[11px] text-gray-500 font-medium block">Total de Preparado:</span>
                  <span className="text-xl font-mono font-black text-emerald-800">${displayedPrice.toFixed(2)}</span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => setActiveBuilder(null)}
                    className="w-1/2 sm:w-28 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-black py-2.5 rounded-xl text-center cursor-pointer"
                  >
                    Salir
                  </button>
                  
                  <button 
                    onClick={handleAddBuiltItemToCart}
                    className="w-1/2 sm:w-44 bg-[#904d00] hover:bg-amber-900 border border-amber-800 text-white text-xs font-black py-2.5 rounded-xl text-center shadow-md flex items-center justify-center gap-1 cursor-pointer"
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
