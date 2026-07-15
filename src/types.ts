/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  active: boolean;
  description?: string;
  customizationOptions?: string[]; // e.g. ["Sin Hielo", "Extra Chamoy", "Extra Tajín", "Con Chile", "Doble Queso"]
  variants?: string[]; // e.g. ["Vaso chico", "Litro"]
  ingredients?: string[]; // e.g. ["Piña", "Apio", "Espárrago"]
  tieneVariantes?: boolean;
  agotado?: boolean;
  noDisponibleHoy?: boolean;
  oculto?: boolean;
  orden?: number;
  productType?: 'simple' | 'custom' | 'tacos_guisado' | 'tacos_especial' | 'huevos' | 'sandwich' | 'torta' | 'platillo' | 'frutas' | 'licuado' | 'jugo' | 'agua' | 'cafe_olla' | 'nescafe' | 'te';
  baseIngredients?: string[];
  extraIngredients?: { name: string; price: number }[];
  removableIngredients?: string[];
  allowComments?: boolean;

  // Layout selection
  productLayout?: 
    | 'layout_1_simple' 
    | 'layout_2_cantidades' 
    | 'layout_3_platillo' 
    | 'layout_4_huevos' 
    | 'layout_5_frutas' 
    | 'layout_6_proteina' 
    | 'layout_7_calientes' 
    | 'layout_8_aguas' 
    | 'layout_9_jugos';

  // Layout 2 properties (Selección por cantidades)
  layout2Options?: { name: string; price: number; active: boolean }[];
  layout2Extras?: { name: string; price: number; perPiece: boolean; active: boolean }[];
  applyRounding?: boolean;

  // Layout 3 properties (Platillo)
  layout3Preps?: { name: string; priceDiff?: number; active: boolean }[];
  layout3Removables?: { name: string; active: boolean }[];
  layout3ExtraTortilla?: boolean;
  layout3TortillaPrice?: number;
  layout3AllowPolloPiece?: boolean;

  // Layout 4 properties (Huevos al gusto)
  layout4Preps?: { name: string; active: boolean }[];
  layout4Removables?: { name: string; active: boolean }[];
  layout4ExtraTortilla?: boolean;
  layout4TortillaPrice?: number;
  layout4IncludedTortillas?: number;

  // Layout 5 properties (Frutas)
  layout5Presentations?: { name: string; price: number; active: boolean }[];
  layout5Fruits?: { name: string; active: boolean }[];
  layout5Extras?: { name: string; price: number; active: boolean }[];

  // Layout 6 properties (Proteína + Ingredientes)
  layout6Proteins?: { name: string; price: number; active: boolean }[];
  layout6Removables?: { name: string; active: boolean }[];
  layout6Extras?: { name: string; price: number; active: boolean }[];

  // Layout 7 properties (Bebidas Calientes)
  layout7Sizes?: { name: string; price: number; active: boolean }[];
  layout7AllowMilk?: boolean;
  layout7MilkPrice?: number;
  layout7AllowSugar?: boolean;

  // Layout 8 properties (Aguas Frescas)
  layout8Sizes?: { name: string; price: number; active: boolean }[];
  layout8Flavors?: { name: string; active: boolean }[];

  // Layout 9 properties (Jugos)
  layout9Sizes?: { name: string; price: number; active: boolean }[];
  layout9Flavors?: { name: string; active: boolean }[];
  layout9Modifiers?: { name: string; active: boolean }[];

  // Extra helper text
  infoCardText?: string;

  // Presentation configuration for Tortas / Sándwiches
  layoutAllowPresentation?: boolean;
  layoutPresentations?: { name: string; price: number }[];
}


export interface OrderItem {
  product: Product;
  quantity: number;
  customizations: string[]; // e.g. ["Sin Hielo", "Extra Tajín"]
  subtotal: number;
}

export interface Order {
  id: string; // e.g. "#10245"
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado' | 'Cancelado';
  paymentStatus: 'Pendiente' | 'Pagado' | 'Crédito';
  paymentMethod?: 'Efectivo' | 'Tarjeta' | 'Crédito' | 'Mixto';
  mixedPayment?: { cash: number; card: number };
  clientName?: string;
  clientId?: string;
  timestamp: string; // ISO String
  notes?: string;
}

export interface Movement {
  id: string;
  type: 'Pedido' | 'Pago' | 'Ajuste' | 'Inicial' | 'Liquidación Total' | 'Deuda Eliminada';
  label: string;
  date: string;
  amount: number;
  statusLabel: 'PEDIDO AGREGADO' | 'PAGO RECEIBIDO' | 'AJUSTE' | 'SALDO INICIAL' | 'LIQUIDACIÓN TOTAL' | 'DEUDA ELIMINADA';
  notes?: string;
  usuario?: string;
  sucursal?: string;
}

export interface ExtraMovement {
  id: string;
  type: 'Abono' | 'Gasto' | 'PagoDirecto' | 'Entrega';
  concept: string;
  amount: number;
  paymentMethod?: 'Efectivo' | 'Tarjeta';
  timestamp: string;
  clientName?: string;
  clientId?: string;
  category?: string;
  usuario?: string; // Who registered it
  sucursal?: string; // Where it was registered
}

export interface ClientDebt {
  id: string; // e.g. "#CRED-4421"
  name: string;
  phone: string;
  branch: string; // e.g. "Station #1 - Central"
  balance: number;
  daysOverdue: number;
  lastMovement: string; // date label
  pedidosPendientes: number;
  status: 'Activa' | 'Pagada' | 'Cerrada' | 'Archivada' | 'Eliminada';
  paidAt?: string; // Date string to track the "paid and visible for 3 days" rule
  history: Movement[];
}

export interface CajaStatus {
  ventasDelDia: number;
  pedidosPagados: number;
  pedidosPendientes: number;
  dineroEntregadoALider: number;
  entregasPendientesALider?: {
    id: string;
    amount: number;
    time: string;
    employee: string;
  }[];
  fondoCaja: number;
    historialCierres: {
      id: string;
      fecha: string;
      hora?: string;
      ventas: number;
      entregado?: number;
      ventasCategorias?: {
        licuadosJugos: number;
        comida: number;
        snacks: number;
      };
      pedidosCorte?: number;
      creditosOtorgados?: number;
      efectivoFinal?: number;
      diferencia: number;
      usuario: string;
      topProductos?: { name: string; quantity: number }[];
      gastosRetiros?: ExtraMovement[];
      gastos?: number;
      creditos?: number;
      efectivo?: number;
      dineroEntregado?: number;
    }[];
}

export type Role = 'Administrador' | 'Líder' | 'Empleado' | 'Repartidor' | 'Cliente';

export type ActiveTab = 'Dashboard' | 'POS' | 'Cocina' | 'Entregas' | 'Caja' | 'Créditos' | 'Administración' | 'Cuenta';

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  username: string;
  role: Role;
  registeredAt: string;
  avatarUrl?: string;
  avatar?: string;
  password?: string;
  status?: 'Activa' | 'Suspendida';
}

export interface Coupon {
  id: string;
  code: string;
  type: 'porcentaje' | 'fijo';
  value: number;
  validUntil: string;
  clientId: string;
  used: boolean;
  name?: string;
  active?: boolean;
}

export interface NotificationPreferences {
  orderStatus: boolean;  // Estado de pedidos (En camino, Entregado)
  menuDelDia: boolean;   // Menú del día
  cupones: boolean;      // Cupones recibidos
  promociones: boolean;  // Promociones (futuras funciones)
}

export interface ClientAccount {
  id: string;
  name: string;
  email?: string;
  phone: string;
  password?: string;
  defaultStore: string;
  avatarUrl?: string;
  avatar?: string;
  notificationPrefs?: NotificationPreferences;
  notificationsPromptShown?: boolean;
}


export interface StoreInfo {
  id: string;
  name: string;
  image?: string;
  order: number;
  active: boolean;
}

