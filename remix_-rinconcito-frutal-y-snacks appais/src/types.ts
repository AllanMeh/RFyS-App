/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  category: 'Bebidas frías' | 'Bebidas calientes' | 'Frutas' | 'Comidas' | 'Tortas y Sándwiches' | 'Snacks' | 'Comida y Snacks' | 'Licuados y Jugos' | 'Otros' | 'Sabritas y Galletas';
  price: number;
  image: string;
  active: boolean;
  description?: string;
  customizationOptions?: string[]; // e.g. ["Sin Hielo", "Extra Chamoy", "Extra Tajín", "Con Chile", "Doble Queso"]
  variants?: string[]; // e.g. ["Vaso chico", "Litro"]
  ingredients?: string[]; // e.g. ["Piña", "Apio", "Espárrago"]
  tieneVariantes?: boolean;
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
  }[];
}

export type Role = 'Administrador' | 'Líder' | 'Empleado' | 'Repartidor';

export type ActiveTab = 'Dashboard' | 'POS' | 'Cocina' | 'Entregas' | 'Caja' | 'Créditos' | 'Administración' | 'Cuenta';

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  username: string;
  role: Role;
  registeredAt: string;
  avatarUrl?: string;
  password?: string;
  status?: 'Activa' | 'Suspendida';
}

export const STORES_LIST = [
  "Martí", "Santander", "Shasa", "Sportico", "Quarry", "McDonald's", "La Fe", 
  "Shi-Wei-Xian", "Mama Quina", "KFC", "Bagels & Sushi", "Carnitas Esteban", 
  "Todo Moda", "New Era", "Churrería Porfirio", "Mumuso", "Hang-Ten", "Piccolo", 
  "Julio", "Ford", "AT&T", "Cinépolis", "Casino", "Liz Minelli", "Óptica Devlyn", 
  "Mens Fashion", "MOBO", "TechHouse", "Dolphy", "Nutrisa", "OXXO", "Super Naturista", 
  "Bombilla", "Nouvocell", "Bizzarro", "Óptica LUX", "King Bird", "GNC", "Telcel", 
  "Banamex", "Coqueta & Audaz", "Pizza Hut", "Dorothy", "Starbucks", 
  "TIENDA", "PUESTOS", "Mesa (gente que llega al local)"
].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
