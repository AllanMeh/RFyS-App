# QA Checklist: Plan de Pruebas Funcionales

Este documento es una guía estructurada para validar manualmente el funcionamiento de toda la aplicación. Imprime o copia este archivo y marca el resultado de cada prueba.

**Opciones de Estado:**
- ☐ Pendiente
- ✅ Correcto
- ❌ Error

---

## 1. Login y Autenticación

### 1.1 Iniciar sesión exitosamente
- **Pasos:** Ingresar credenciales válidas y hacer clic en Iniciar Sesión.
- **Resultado Esperado:** Redirección al panel principal con el rol correspondiente.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 1.2 Inicio de sesión inválido
- **Pasos:** Ingresar una contraseña o usuario incorrecto.
- **Resultado Esperado:** Mensaje de error claro y no permite el acceso.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 1.3 Cerrar sesión
- **Pasos:** Hacer clic en "Cerrar sesión" desde el perfil.
- **Resultado Esperado:** La sesión se destruye y redirige a la pantalla de Login.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 2. Empleados y Cuentas

### 2.1 Crear nuevo empleado
- **Pasos:** Ir a Administración -> Usuarios, agregar datos, asignar rol y guardar.
- **Resultado Esperado:** El usuario aparece en la lista de empleados inmediatamente.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 2.2 Modificar rol de empleado
- **Pasos:** Cambiar el rol de un empleado existente (ej. de Empleado a Líder).
- **Resultado Esperado:** El cambio se refleja en la lista y los permisos se actualizan en el próximo login.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 2.3 Eliminar empleado
- **Pasos:** Seleccionar "Eliminar" en un usuario.
- **Resultado Esperado:** El usuario desaparece de la lista y se le deniega acceso al sistema.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 3. Productos

### 3.1 Crear producto nuevo
- **Pasos:** Ir a Administración -> Productos, presionar "Agregar producto", llenar formulario (precio, categoría) y guardar.
- **Resultado Esperado:** El producto se muestra en la lista de productos y en el POS.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 3.2 Modificar producto
- **Pasos:** Editar precio y nombre de un producto, guardar cambios.
- **Resultado Esperado:** Los datos nuevos se visualizan tanto en catálogo como en el POS.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 3.3 Configuración de Extras y Variantes
- **Pasos:** Agregar variantes de tamaño o extras (ej. "Extra hielo") a un producto.
- **Resultado Esperado:** Al seleccionar el producto en el POS, muestra el modal de configuración correctamente.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 4. Categorías

### 4.1 Filtro por Categorías en POS
- **Pasos:** En el POS, hacer clic en una categoría (ej. "Bebidas frías").
- **Resultado Esperado:** Solo se muestran los productos que pertenecen a dicha categoría.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 4.2 Navegación sin perder carrito
- **Pasos:** Agregar un producto al carrito, cambiar de categoría, agregar otro producto.
- **Resultado Esperado:** El carrito mantiene ambos productos de diferentes categorías sin borrar el progreso.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 5. POS (Punto de Venta)

### 5.1 Agregar productos al carrito
- **Pasos:** Hacer clic sobre varios productos distintos.
- **Resultado Esperado:** Aparecen listados en la barra lateral con cantidad = 1.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 5.2 Modificar cantidades
- **Pasos:** En el carrito, usar botones de "+" y "-" para un producto.
- **Resultado Esperado:** La cantidad se actualiza y el subtotal matemático se recalcula instantáneamente (con redondeo si aplica).
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 5.3 Cobrar en efectivo
- **Pasos:** Con un carrito lleno, presionar cobrar, seleccionar Efectivo, y confirmar.
- **Resultado Esperado:** El pedido se envía a cocina (si aplica), se limpia el carrito y se emite ticket.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 6. Cocina

### 6.1 Recibir nuevo pedido
- **Pasos:** Tras crear un pedido en POS, abrir la pestaña de Cocina.
- **Resultado Esperado:** Aparece el ticket en la columna "Pendiente" con los extras y comentarios correctos.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 6.2 Flujo de preparación
- **Pasos:** Mover el pedido a "En preparación", luego a "Listo" y finalmente "Entregado".
- **Resultado Esperado:** El ticket avanza visualmente por las columnas sin errores.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 7. Caja

### 7.1 Visualizar ventas del día
- **Pasos:** Ir a Caja, observar "Ventas del día".
- **Resultado Esperado:** Refleja la sumatoria correcta de los pedidos cobrados.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 7.2 Corte de Caja (Cierre)
- **Pasos:** Realizar corte de caja ingresando el efectivo físico contado.
- **Resultado Esperado:** Se calcula la diferencia (sobrante/faltante), se genera reporte del corte y la caja se reinicia para el siguiente turno.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 8. Créditos

### 8.1 Apertura de crédito
- **Pasos:** En el POS, cobrar un pedido eligiendo "Crédito" y asignarlo a un cliente.
- **Resultado Esperado:** El cliente aparece en "Créditos" con el balance de esa orden sumado a su deuda.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 8.2 Abonar a deuda
- **Pasos:** Ir a Créditos, buscar cliente, ingresar monto a abonar en efectivo.
- **Resultado Esperado:** La deuda total disminuye acorde al monto, y el pago se registra en Caja como ingreso extra.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 8.3 Liquidación
- **Pasos:** Pagar el total exacto restante de un cliente.
- **Resultado Esperado:** La cuenta marca $0 y cambia el status a "Pagada" manteniéndose 3 días en el historial.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 9. Clientes

### 9.1 Perfil de cliente
- **Pasos:** Ir al panel de Clientes (Cuentas), crear un nuevo perfil de cliente con datos básicos.
- **Resultado Esperado:** Se guarda en la lista para futuras asignaciones (créditos o lealtad).
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 10. Reportes

### 10.1 Resumen de Ticket Promedio
- **Pasos:** Ir a panel Dashboard/Estadísticas.
- **Resultado Esperado:** Los gráficos muestran tickets generados y ventas divididas por tipo de pago.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 11. Configuración

### 11.1 Ajuste de Tienda Cerrada
- **Pasos:** Marcar "Tienda Cerrada" en Configuración.
- **Resultado Esperado:** No se permite realizar cobros nuevos en el POS (o los marca Cancelados/Rechazados visualmente).
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 11.2 Menú del día
- **Pasos:** Editar el texto del Menú del Día.
- **Resultado Esperado:** El texto cambia en el banner informativo de la pantalla principal/POS.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 12. Sucursales

### 12.1 Cambiar entre sucursales
- **Pasos:** Agregar dos sucursales. Asignar operaciones a la sucursal alterna.
- **Resultado Esperado:** Los pedidos de la Sucursal B no interfieren con la lista de la Sucursal A (o muestran la etiqueta pertinente según arquitectura).
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 13. Imágenes

### 13.1 Subir Logo y Avatares
- **Pasos:** Subir una imagen JPG/PNG al logo de negocio en Configuración y a la foto de Perfil.
- **Resultado Esperado:** Las imágenes cargan, se previsualizan y persisten correctamente.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 14. Offline (Prueba Sin Conexión)

### 14.1 Crear Pedido Offline
- **Pasos:** Desconectar red/Wi-Fi del equipo. Crear un pedido y cobrarlo en el POS.
- **Resultado Esperado:** El pedido avanza sin interrupción visual o congelamiento de la app (se guarda en memoria local).
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 15. Sincronización

### 15.1 Resincronización al volver a estar online
- **Pasos:** Reconectar el equipo a la red/Wi-Fi después de crear datos offline.
- **Resultado Esperado:** En background, los datos cacheados suben a la BD (Supabase). Al recargar la web en otro dispositivo, los datos del pedido creado offline deben reflejarse.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

---

## 16. PWA (Progressive Web App)

### 16.1 Instalación Local
- **Pasos:** Entrar desde Chrome (Android/PC) o Safari (iOS), presionar "Instalar / Agregar a Pantalla de Inicio".
- **Resultado Esperado:** Se instala exitosamente con el icono/logo configurado.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error

### 16.2 Uso como app independiente
- **Pasos:** Abrir la app desde el acceso directo (sin barra de navegador visible).
- **Resultado Esperado:** Funciona a pantalla completa sin elementos de navegador externos y de manera fluida.
- **Estado:** ☐ Pendiente | ✅ Correcto | ❌ Error
