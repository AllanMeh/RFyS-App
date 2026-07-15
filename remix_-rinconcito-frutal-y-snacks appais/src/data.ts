/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, ClientDebt, Order, CajaStatus } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    name: 'Licuado de Fresa',
    category: 'Licuados y Jugos',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=300&q=80',
    active: true,
    description: 'Licuado preparado con fresas frescas seleccionadas al momento.',
    customizationOptions: ['Sin Hielo', 'Miel Extra', 'Granola'],
    variants: ['Chico (16 oz)', 'Grande (1 Litro)'],
    ingredients: ['Fresa', 'Leche', 'Azúcar']
  },
  {
    id: 'prod-02',
    name: 'Licuado de Plátano con Chocomilk',
    category: 'Licuados y Jugos',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=300&q=80',
    active: true,
    description: 'Licuado cremoso de plátano con chocomilk tradicional de la casa.',
    customizationOptions: ['Sin Hielo', 'Leche de Almendra', 'Granola extra'],
    variants: ['Chico (16 oz)', 'Grande (1 Litro)'],
    ingredients: ['Plátano', 'Chocomilk', 'Leche']
  },
  {
    id: 'prod-03',
    name: 'Jugo de Naranja',
    category: 'Licuados y Jugos',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&q=80',
    active: true,
    description: 'Jugo natural 100% exprimido del día.',
    customizationOptions: ['Sin Hielo', 'Doble Vaso'],
    variants: ['Chico (16 oz)', 'Grande (1 Litro)'],
    ingredients: ['Naranja']
  },
  {
    id: 'prod-04',
    name: 'Jugo Verde',
    category: 'Licuados y Jugos',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1610970881699-44a5587caa90?w=300&q=80',
    active: true,
    description: 'Naranja, piña, pepino, apio, espinaca y jengibre.',
    customizationOptions: ['Sin Hielo', 'Con Piña', 'Doble Espinaca'],
    variants: ['Chico (16 oz)', 'Grande (1 Litro)'],
    ingredients: ['Naranja', 'Piña', 'Pepino', 'Apio', 'Espinaca', 'Jengibre']
  },
  {
    id: 'prod-05',
    name: 'Agua Fresca',
    category: 'Licuados y Jugos',
    price: 20.00,
    image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=300&q=80',
    active: true,
    description: 'Aguas frutales frescas del día preparadas en casa.',
    customizationOptions: ['Sin Hielo', 'Extra Azúcar'],
    variants: ['Chico (16 oz)', 'Grande (1 Litro)'],
    ingredients: ['Agua', 'Frutas de temporada']
  },
  {
    id: 'prod-06',
    name: 'Fruta en Vaso',
    category: 'Licuados y Jugos',
    price: 25.00,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80',
    active: true,
    description: 'Fruta fresca de temporada cortada en vaso con aderezos.',
    customizationOptions: ['Tajín', 'Chamoy', 'Miguelito', 'Limón', 'Sal'],
    variants: ['Vaso Regular'],
    ingredients: ['Melón', 'Papaya', 'Plátano', 'Piña', 'Pepino']
  },
  {
    id: 'prod-07',
    name: 'Fruta en Plato',
    category: 'Licuados y Jugos',
    price: 30.00,
    image: 'https://images.unsplash.com/photo-1511688868253-3a31f62b5bfd?w=300&q=80',
    active: true,
    description: 'Fruta fresca de temporada en plato con aderezos y complementos.',
    customizationOptions: ['Miel', 'Yogurt', 'Granola', 'Lechera'],
    variants: ['Plato Individual'],
    ingredients: ['Melón', 'Papaya', 'Plátano', 'Piña', 'Fresa']
  },
  {
    id: 'prod-08',
    name: 'Torta de Jamón',
    category: 'Comida y Snacks',
    price: 40.00,
    image: 'https://images.unsplash.com/photo-1539252555452-730190d63cc1?w=300&q=80',
    active: true,
    description: 'Bolillo crujiente caliente con jamón de pavo, jitomate y aderezos.',
    customizationOptions: ['Mayonesa', 'Lechuga', 'Jitomate', 'Queso amarillo', 'Chipotle'],
    variants: ['Sencilla', 'Doble Queso'],
    ingredients: ['Bolillo', 'Jamón de Pavo', 'Aguacate', 'Frijoles']
  },
  {
    id: 'prod-09',
    name: 'Torta Cubana',
    category: 'Comida y Snacks',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1509722015580-4061a393b822?w=300&q=80',
    active: true,
    description: 'Deliciosa torta cubana con jamón, pierna, salchicha, de todo un poco.',
    customizationOptions: ['Mayonesa', 'Lechuga', 'Jitomate', 'Quesillo', 'Chipotle'],
    variants: ['Familiar'],
    ingredients: ['Bolillo', 'Jamón', 'Pierna', 'Salchicha', 'Quesillo']
  },
  {
    id: 'prod-10',
    name: 'Sándwich',
    category: 'Comida y Snacks',
    price: 30.00,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80',
    active: true,
    description: 'Sándwich preparado al gusto en pan Sencillo o Doble.',
    customizationOptions: ['Mayonesa', 'Lechuga', 'Jitomate', 'Queso amarillo'],
    variants: ['Sencillo', 'Doble piso'],
    ingredients: ['Pan de caja', 'Jamón de Pavo', 'Queso']
  },
  {
    id: 'prod-11',
    name: 'Café de Olla',
    category: 'Otros',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80',
    active: true,
    description: 'Café de olla aromático endulzado con piloncillo y canela.',
    customizationOptions: ['Extra Canela'],
    variants: ['Taza Standard'],
    ingredients: ['Café', 'Canela', 'Piloncillo']
  },
  {
    id: 'prod-12',
    name: 'Nescafé',
    category: 'Otros',
    price: 17.00,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&q=80',
    active: true,
    description: 'Nescafé preparado caliente con leche opcional.',
    customizationOptions: ['Con Leche', 'Extra Azúcar'],
    variants: ['Taza Chica', 'Vaso Grande'],
    ingredients: ['Café soluble', 'Agua o Leche', 'Azúcar']
  },
  {
    id: 'prod-13',
    name: 'Té',
    category: 'Otros',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&q=80',
    active: true,
    description: 'Tés calientes surtidos de hierbabuena, manzanilla, limón etc.',
    customizationOptions: ['Limón', 'Manzanilla', 'Hierbabuena'],
    variants: ['Taza'],
    ingredients: ['Agua', 'Bolsa de té']
  },
  {
    id: 'prod-14',
    name: 'Suadero',
    category: 'Comida y Snacks',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Taco individual de Suadero confitado al estilo tradicional.',
    customizationOptions: ['Con Cebolla', 'Con Cilantro', 'Salsa Roja', 'Salsa Verde'],
    variants: ['Con copia', 'Sencillo'],
    ingredients: ['Carne de Suadero', 'Tortilla de maíz']
  },
  {
    id: 'prod-15',
    name: 'Bistec',
    category: 'Comida y Snacks',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Taco individual de Bistec de res a la plancha.',
    customizationOptions: ['Con Cebolla', 'Con Cilantro', 'Salsa Roja', 'Salsa Verde'],
    variants: ['Con copia', 'Sencillo'],
    ingredients: ['Bistec de res', 'Tortilla de maíz']
  },
  {
    id: 'prod-16',
    name: 'Chorizo',
    category: 'Comida y Snacks',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Taco individual de Chorizo especiado a la plancha.',
    customizationOptions: ['Con Cebolla', 'Con Cilantro', 'Salsa Roja', 'Salsa Verde'],
    variants: ['Con copia', 'Sencillo'],
    ingredients: ['Chorizo de cerdo', 'Tortilla de maíz']
  },
  {
    id: 'prod-17',
    name: 'Mole de Pollo',
    category: 'Comida y Snacks',
    price: 40.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Tacos de Mole de Pollo con arroz veracruzano de la casa.',
    customizationOptions: ['Con Arroz', 'Extra Ajónjoli'],
    variants: ['Orden 3 piezas', 'Pieza extra'],
    ingredients: ['Pollo deshebrado', 'Mole poblano', 'Tortilla']
  },
  {
    id: 'prod-18',
    name: 'Tacos Especiales ($45)',
    category: 'Comida y Snacks',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Orden de 3 tacos medianos de Suadero, Bistec o Chorizo.',
    customizationOptions: ['Con Todo', 'Sin Cebolla', 'Salsa aparte'],
    variants: ['Orden de 3'],
    ingredients: ['Suadero', 'Bistec', 'Chorizo', 'Tortillas']
  },
  {
    id: 'prod-19',
    name: 'Tacos de Guisado',
    category: 'Comida y Snacks',
    price: 40.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Por 3 piezas se cobra $40, por 6 piezas $80, consecutivamente. Pieza extra redondeada a múltiplo de 5.',
    customizationOptions: ['Chicharrón prensa', 'Huevo con jamón', 'Salchicha mexicana', 'Chorizo con papa'],
    variants: ['Orden de 3', 'Orden de 6'],
    ingredients: ['Guisados del día', 'Tortilla de maíz']
  },
  {
    id: 'prod-20',
    name: 'Huevos al Gusto',
    category: 'Comida y Snacks',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80',
    active: true,
    description: 'Dos huevos servidos con frijol y 6 tortillas. Adiciona tortillas.',
    customizationOptions: ['A la mexicana', 'Con Jamón', 'Con Salchicha', 'Estrellados'],
    variants: ['Sencillo'],
    ingredients: ['Huevos', 'Frijoles refritos', '6 Tortillas']
  },
  {
    id: 'prod-21',
    name: 'Platillo',
    category: 'Comida y Snacks',
    price: 80.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Gisados de la casa. Incluye arroz, frijol y 6 tortillas de mano.',
    customizationOptions: ['Con Mole de Pollo', 'Con Chicharrón verde', 'Huevo con jamón'],
    variants: ['Standard'],
    ingredients: ['Mero del guisado', 'Arroz', 'Frijol', '6 Tortillas']
  },
  {
    id: 'prod-22',
    name: 'Tacos Dorados',
    category: 'Comida y Snacks',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Orden de tacos dorados crujientes de pollo o papa.',
    customizationOptions: ['De Pollo', 'De Papa', 'Con Crema y Queso', 'Salsa roja', 'Lechuga'],
    variants: ['Orden de 3'],
    ingredients: ['Pollo o Papa', 'Tortilla frita', 'Queso y Crema']
  },
  {
    id: 'prod-23',
    name: 'Quesadillas de Papa',
    category: 'Comida y Snacks',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Deliciosas quesadillas de papa doraditas.',
    customizationOptions: ['Con Crema y Queso', 'Salsa verde', 'Lechuga'],
    variants: ['Orden de 3'],
    ingredients: ['Papa', 'Tortilla doblada frita']
  },
  {
    id: 'prod-24',
    name: 'Pescadillas',
    category: 'Comida y Snacks',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Ricas pescadillas fritas al estilo costero.',
    customizationOptions: ['Chile picado', 'Salsa', 'Limón'],
    variants: ['Orden de 3'],
    ingredients: ['Guisado de pescado', 'Tortilla frita']
  },
  {
    id: 'prod-25',
    name: 'Tostadas',
    category: 'Comida y Snacks',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Tostadas crujientes con pollo, papa o chorizo.',
    customizationOptions: ['De Pollo', 'De Papa', 'De Chorizo', 'Con Crema', 'Salsa'],
    variants: ['Orden de 3'],
    ingredients: ['Tostada deshidratada', 'Frijoles', 'Crema', 'Queso']
  },
  {
    id: 'prod-26',
    name: 'Picaditas',
    category: 'Comida y Snacks',
    price: 40.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Pellizcadas veracruzanas con salsa de tu elección y crema.',
    customizationOptions: ['Salsa Roja', 'Salsa Verde', 'Con Cebolla', 'Sin Cebolla'],
    variants: ['Sencilla'],
    ingredients: ['Masa de maíz pellizcada', 'Salsa', 'Queso', 'Cebolla']
  },
  {
    id: 'prod-27',
    name: 'Huaraches',
    category: 'Comida y Snacks',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Base de maíz con frijoles, queso, crema y carne arriba.',
    customizationOptions: ['Suadero', 'Bistec', 'Chorizo', 'Salsa Verde', 'Salsa Roja'],
    variants: ['Giga Huarache'],
    ingredients: ['Masa de maíz alargada', 'Frijoles', 'Carne', 'Crema', 'Queso']
  },
  {
    id: 'prod-28',
    name: 'Enchiladas',
    category: 'Comida y Snacks',
    price: 40.00,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    active: true,
    description: 'Enchiladas Suizas ($45), Guajillo o Verdes ($40) al gusto.',
    customizationOptions: ['Suizas (+ $5)', 'Salsa Guajillo', 'Salsa Verde', 'Con Pollo'],
    variants: ['Orden de 3'],
    ingredients: ['Tortillas', 'Pollo', 'Salsa', 'Queso gratinado']
  },
  {
    id: 'prod-29',
    name: 'Sabritas Originales',
    category: 'Sabritas y Galletas',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Bolsa de papas fritas Sabritas clásicas con salsa opcional.',
    customizationOptions: ['Con Salsa y Limón', 'Sin Salsa'],
    variants: ['Bolsa Individual'],
    ingredients: ['Papas', 'Aceite', 'Sal']
  },
  {
    id: 'prod-30',
    name: 'Sabritas Adobadas',
    category: 'Sabritas y Galletas',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Bolsa de Sabritas crujientes sabor adobo.',
    customizationOptions: ['Con Salsa y Limón', 'Sin Salsa'],
    variants: ['Bolsa Individual'],
    ingredients: ['Papas adobo', 'Sal']
  },
  {
    id: 'prod-31',
    name: 'Ruffles de Queso',
    category: 'Sabritas y Galletas',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Ruffles ondulados sabor queso intenso.',
    customizationOptions: ['Salsa y Limón'],
    variants: ['Bolsa Individual'],
    ingredients: ['Papas fritas onduladas', 'Sabor queso']
  },
  {
    id: 'prod-32',
    name: 'Doritos Nacho',
    category: 'Sabritas y Galletas',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Totopos Doritos sabor queso Nacho clásico.',
    customizationOptions: ['Salsa y Limón'],
    variants: ['Bolsa Individual'],
    ingredients: ['Totopo de maíz fritado', 'Sabor queso nacho']
  },
  {
    id: 'prod-33',
    name: 'Cheetos Torciditos',
    category: 'Sabritas y Galletas',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Botana de queso Cheetos Torciditos.',
    customizationOptions: ['Salsa', 'Salsa y Limón'],
    variants: ['Bolsa Individual'],
    ingredients: ['Cereal de maíz extruido', 'Sabor queso']
  },
  {
    id: 'prod-34',
    name: 'Takis Fuego',
    category: 'Sabritas y Galletas',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Takis sabor chile y limón extremo.',
    customizationOptions: ['Salsa extra', 'Limón'],
    variants: ['Bolsa Individual'],
    ingredients: ['Totopo de maíz enrollado frito', 'Sabor chile y limón']
  },
  {
    id: 'prod-35',
    name: 'Cacahuates Japoneses',
    category: 'Sabritas y Galletas',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Bolsa individual de cacahuates estilo japonés.',
    customizationOptions: ['Salsa', 'Limón'],
    variants: ['Bolsa Individual'],
    ingredients: ['Cacahuates', 'Soya', 'Capa de trigo tostada']
  },
  {
    id: 'prod-36',
    name: 'Cacahuates Enchilados',
    category: 'Sabritas y Galletas',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Peanuts cubiertos con sazonador de chile salado.',
    customizationOptions: ['Limón'],
    variants: ['Bolsa Individual'],
    ingredients: ['Cacahuates', 'Sazonador chile y sal']
  },
  {
    id: 'prod-37',
    name: 'Galletas Chokis',
    category: 'Sabritas y Galletas',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80',
    active: true,
    description: 'Deliciosas galletas con chispas de auténtico chocolate.',
    customizationOptions: [],
    variants: ['Paquete de galletas'],
    ingredients: ['Harina', 'Azúcar', 'Chispas de chocolate']
  },
  {
    id: 'prod-38',
    name: 'Galletas Oreo',
    category: 'Sabritas y Galletas',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80',
    active: true,
    description: 'Galletas de sándwich rellenas de crema dulce.',
    customizationOptions: [],
    variants: ['Paquete de galletas'],
    ingredients: ['Galleta de chocolate', 'Crema de vainilla']
  },
  {
    id: 'prod-39',
    name: 'Galletas Emperador Chocolate',
    category: 'Sabritas y Galletas',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80',
    active: true,
    description: 'Galletas Gamesa Emperador chocolate de chocolate.',
    customizationOptions: [],
    variants: ['Paquete de galletas'],
    ingredients: ['Sándwich de galleta', 'Crema de chocolate']
  },
  {
    id: 'prod-40',
    name: 'Galletas Emperador Limón',
    category: 'Sabritas y Galletas',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80',
    active: true,
    description: 'Galletas sándwich Gamesa Emperador sabor limón.',
    customizationOptions: [],
    variants: ['Paquete de galletas'],
    ingredients: ['Sándwich de galleta', 'Fudge de limón']
  },
  {
    id: 'prod-41',
    name: 'Panditas / Gominolas',
    category: 'Sabritas y Galletas',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
    active: true,
    description: 'Ositos de goma frutales deliciosos.',
    customizationOptions: [],
    variants: ['Bolsa Individual'],
    ingredients: ['Azúcar', 'Goma de fécula', 'Saborizantes artificiales']
  }
];

export const INITIAL_CLIENTS: ClientDebt[] = [
  {
    id: 'CRED-4421',
    name: 'Mariana Gonçalves',
    phone: '+55 11 98822-1100',
    branch: 'Martí',
    balance: 845.20,
    daysOverdue: 45,
    lastMovement: '24 May (Pedido)',
    pedidosPendientes: 3,
    status: 'Activa',
    history: [
      {
        id: 'mov-03',
        type: 'Pedido',
        label: 'Pedido #10245 – Licuados',
        date: '24 May',
        amount: 45.00,
        statusLabel: 'PEDIDO AGREGADO',
        notes: '3x Licuados medianos para oficina central'
      },
      {
        id: 'mov-02',
        type: 'Pago',
        label: 'Pago recibido',
        date: '22 May',
        amount: -100.00,
        statusLabel: 'PAGO RECEIBIDO',
        notes: 'Pago en efectivo abonado en caja'
      },
      {
        id: 'mov-01',
        type: 'Ajuste',
        label: 'Ajuste de Saldo',
        date: '20 May',
        amount: 20.00,
        statusLabel: 'AJUSTE',
        notes: 'Corrección por error de carga. Pagado hace 2 días, Archivará en 1 día'
      },
      {
        id: 'mov-00',
        type: 'Inicial',
        label: 'Saldo inicial consolidado',
        date: '15 May, 2024',
        amount: 780.20,
        statusLabel: 'SALDO INICIAL',
        notes: 'Deuda previa a la implementación de la aplicación.'
      }
    ]
  },
  {
    id: 'CRED-5231',
    name: 'Ricardo Torres',
    phone: '+55 11 94522-8877',
    branch: 'Óptica Devlyn',
    balance: 125.00,
    daysOverdue: 4,
    lastMovement: '15 Jun (Pedido)',
    pedidosPendientes: 1,
    status: 'Activa',
    history: [
      {
        id: 'mov-rt-1',
        type: 'Pedido',
        label: 'Pedido #10260 – Snacks',
        date: '15 Jun',
        amount: 125.00,
        statusLabel: 'PEDIDO AGREGADO',
        notes: '1x Club Sandwich, 1x Sabritas, 1x Coca Cola'
      }
    ]
  },
  {
    id: 'CRED-9123',
    name: 'Felipe Mendes',
    phone: '+55 11 91234-5678',
    branch: 'Martí',
    balance: 0.00,
    daysOverdue: 0,
    lastMovement: '24 Oct (Pago)',
    pedidosPendientes: 0,
    status: 'Pagada',
    paidAt: '2026-06-17T12:00:00Z', // 2 days ago relative to our 2026-06-19T14:54 local time
    history: [
      {
        id: 'mov-fm-2',
        type: 'Pago',
        label: 'Pago total de cuenta',
        date: '24 Oct',
        amount: -320.00,
        statusLabel: 'PAGO RECEIBIDO',
        notes: 'Saldado total por Felipe'
      },
      {
        id: 'mov-fm-1',
        type: 'Pedido',
        label: 'Consumo acumulado',
        date: '20 Oct',
        amount: 320.00,
        statusLabel: 'PEDIDO AGREGADO',
        notes: 'Desayuno corporativo'
      }
    ]
  },
  {
    id: 'CRED-3329',
    name: 'Amanda Lima',
    phone: '+55 11 97766-5544',
    branch: 'Martí',
    balance: 412.30,
    daysOverdue: 12,
    lastMovement: '07 Jun (Pedido)',
    pedidosPendientes: 2,
    status: 'Activa',
    history: [
      {
        id: 'mov-al-1',
        type: 'Pedido',
        label: 'Pedido #10221 – Especialidades',
        date: '07 Jun',
        amount: 412.30,
        statusLabel: 'PEDIDO AGREGADO',
        notes: 'Pedido grupal de jugos y comida de fin de semana'
      }
    ]
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: '#10245',
    items: [
      {
        product: INITIAL_PRODUCTS[0], // Licuado de Fresa Especial ($45)
        quantity: 3,
        customizations: ['Extra Fresa', 'Leche Almendra'],
        subtotal: 135.00
      }
    ],
    subtotal: 135.00,
    discount: 0,
    total: 135.00,
    status: 'Listo',
    paymentStatus: 'Pendiente',
    clientName: 'Mariana Gonçalves',
    clientId: 'CRED-4421',
    timestamp: '2026-06-19T10:30:00Z'
  },
  {
    id: '#10246',
    items: [
      {
        product: INITIAL_PRODUCTS[1], // Jugo Verde ($50)
        quantity: 2,
        customizations: ['Sin Hielo'],
        subtotal: 100.00
      },
      {
        product: INITIAL_PRODUCTS[4], // Club Sandwich ($75)
        quantity: 1,
        customizations: ['Extra Tocino'],
        subtotal: 75.00
      }
    ],
    subtotal: 175.00,
    discount: 10.00,
    total: 165.00,
    status: 'En preparación',
    paymentStatus: 'Pagado',
    paymentMethod: 'Tarjeta',
    clientName: 'Carlos Gómez',
    timestamp: '2026-06-19T14:40:00Z'
  },
  {
    id: '#10247',
    items: [
      {
        product: INITIAL_PRODUCTS[5], // Torta ($60)
        quantity: 1,
        customizations: ['Sin Picante'],
        subtotal: 60.00
      }
    ],
    subtotal: 60.00,
    discount: 0,
    total: 60.00,
    status: 'Pendiente',
    paymentStatus: 'Pendiente',
    clientName: 'Alejandra Ruiz',
    timestamp: '2026-06-19T14:50:00Z'
  }
];

export const INITIAL_CAJA: CajaStatus = {
  ventasDelDia: 12450.00,
  pedidosPagados: 48,
  pedidosPendientes: 5,
  dineroEntregadoALider: 0.00,
  entregasPendientesALider: [],
  fondoCaja: 1500.00,
  historialCierres: [
    {
      id: 'CR-001',
      fecha: '18 Jun 2026',
      ventas: 11400.00,
      entregado: 4000.00,
      diferencia: 0.00,
      usuario: 'Ana Lucía',
      gastosRetiros: [
        {
          id: 'ext-gasto-18-1',
          type: 'Gasto',
          concept: 'Sabritas y refrescos para personal',
          amount: 180.00,
          timestamp: '2026-06-18T12:45:00Z',
          category: 'Alimentos',
          usuario: 'Ana Lucía',
          sucursal: 'Martí'
        },
        {
          id: 'ext-entrega-18-2',
          type: 'Entrega',
          concept: 'Entrega parcial a Líder: Daniel Pérez',
          amount: 2000.00,
          timestamp: '2026-06-18T15:30:00Z',
          clientName: 'Daniel Pérez',
          usuario: 'Ana Lucía',
          sucursal: 'Martí'
        }
      ]
    },
    {
      id: 'CR-002',
      fecha: '17 Jun 2026',
      ventas: 13200.00,
      entregado: 5000.00,
      diferencia: -15.00,
      usuario: 'Pedro Páramo',
      gastosRetiros: [
        {
          id: 'ext-gasto-17-1',
          type: 'Gasto',
          concept: 'Hielo y Vasos desechables',
          amount: 120.00,
          timestamp: '2026-06-17T10:15:00Z',
          category: 'Insumos',
          usuario: 'Pedro Páramo',
          sucursal: 'Coppel'
        },
        {
          id: 'ext-entrega-17-2',
          type: 'Entrega',
          concept: 'Traspaso a líder: Mariana L.',
          amount: 3000.00,
          timestamp: '2026-06-17T16:40:00Z',
          clientName: 'Mariana L.',
          usuario: 'Pedro Páramo',
          sucursal: 'Coppel'
        }
      ]
    }
  ]
};
