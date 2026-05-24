# Contexto del Proyecto: Sistema de Comandas Rápidas y Control de Inventario

Actúa como un Arquitecto de Software y Desarrollador Full-Stack Senior. Vamos a construir una aplicación web para la gestión de comandas en un restaurante. El sistema utiliza tickets efímeros (sin "carrito de compra"): las órdenes existen mientras se preparan y, al entregarse, se eliminan del panel activo, guardando únicamente estadísticas.

El desarrollo se realizará paso a paso, aplicando Clean Architecture.

## 🛠 Stack Tecnológico
* **Frontend:** React (con Vite), Tailwind CSS.
* **Gestión de Estado global:** Zustand.
* **Backend / Base de Datos:** Supabase (PostgreSQL), utilizando Row Level Security (RLS) y suscripciones en tiempo real.
* **UI/Componentes:** Antigravity.

## 🧩 Definición de Módulos y Lógica de Negocio

La aplicación se divide en 4 módulos principales:

### 1. Módulo de Administrador (Métricas, Menú e Inventario)
* **Menú Categorizado:** El menú se divide estrictamente en dos categorías: **Corriente** y **Asados**.
* **Control de Inventario Diario:** En la edición del menú, el administrador establece la cantidad exacta (stock) de cada plato disponible para el día. 
* **Métricas del Día/Mes:** Registro en una tabla separada de estadísticas:
    * Cantidad de pedidos atendidos/entregados por cada mesera.
    * Cantidad total vendida de cada plato.

### 2. Módulo de Mesera (Comandas Colaborativas y Liberación)
* **Toma de Pedidos:** Interfaz rápida. Selecciona la Mesa (o "Para Llevar"), marca los platos deseados y envía la comanda a cocina.
* **Descuento Automático de Stock:** Al registrar el pedido, el sistema resta la cantidad pedida del inventario del día. Si el stock de un plato llega a cero (0), este desaparece o se bloquea automáticamente en la app para no permitir más pedidos.
* **Visibilidad Compartida:** Todas las meseras ven **todas las comandas activas** del restaurante, permitiendo trabajo en equipo (una puede tomar la orden y otra puede entregarla).
* **Liberación de Pedido:** Una vez la cocina entrega los platos, cualquier mesera disponible presiona "Liberar". Esta acción:
    1. Elimina la orden de las vistas activas (desaparece de cocina y de la pantalla de meseras).
    2. Registra los datos de la venta en la tabla de estadísticas.

### 3. Módulo de Cocina (Visualización de Comandas)
* **Vista Dividida Simultánea:** Dos paneles visibles al mismo tiempo:
    * Panel A: **MESA** (Muestra los platos solicitados y el número de mesa).
    * Panel B: **PARA LLEVAR** (Muestra los platos solicitados para entregar).
* **Dinámica:** Las órdenes aparecen al instante y desaparecen automáticamente en el momento en que una mesera las "libera".

### 4. Módulo de Entrega (Para Llevar)
* **Visualización:** Lista ordenada por llegada exclusiva para los pedidos "Para Llevar".
* **Flujo:** La mesera ingresa el pedido "Para llevar", aparece aquí y en la columna B de la cocina. Cuando se entrega al cliente, se libera la orden, eliminándola del sistema y sumando a las métricas.

## 🗺 Plan de Acción (Paso a Paso)

Necesito que me guíes paso a paso. No me des todo el código de una vez, acompáñame en esta secuencia:

* **Paso 1: Arquitectura de Base de Datos en Supabase.** Diseñar las tablas. Se requiere una tabla para `ordenes_activas`, otra para `metricas_ventas` y una tabla de `productos` que incluya la columna `stock_diario` para la automatización del menú. Incluir SQL inicial.
* **Paso 2: Estructura del Proyecto y Clean Architecture.** Definición de carpetas en React/Vite.
* **Paso 3: Desarrollo de la Capa Global.** Configurar autenticación y stores de Zustand.
* **Paso 4: Módulo de Mesera.** Creación de comandas, lógica de descuento de stock en tiempo real y el botón "Liberar".
* **Paso 5: Módulo de Cocina y Tiempo Real.** Suscripciones de Supabase para la sincronización de las vistas compartidas (Mesas y Para Llevar).
* **Paso 6: Módulo de Administrador.** Dashboard de estadísticas e interfaz para recargar el inventario diario.

¿Entendido? Si estás listo, por favor comencemos únicamente con el **Paso 1**. Proporcióname el diseño relacional y el SQL para Supabase.


-- =====================================================================================
-- 1. DEFINICIÓN DE ENUMS (Tipos de datos controlados)
-- =====================================================================================
CREATE TYPE rol_usuario AS ENUM ('admin', 'mesera', 'cocina');
CREATE TYPE categoria_plato AS ENUM ('corriente', 'asados');
CREATE TYPE tipo_orden AS ENUM ('mesa', 'llevar');

-- =====================================================================================
-- 2. CREACIÓN DE TABLAS
-- =====================================================================================

-- 2.1 Perfiles de Usuario (Se vincula con auth.users de Supabase)
CREATE TABLE perfiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol rol_usuario NOT NULL
);

-- 2.2 Productos / Menú (Con control estricto de inventario diario)
CREATE TABLE productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria categoria_plato NOT NULL,
    stock_diario INT NOT NULL CHECK (stock_diario >= 0), -- Evita inventario negativo
    activo BOOLEAN DEFAULT true
);

-- 2.3 Órdenes Activas (La cabecera de la comanda efímera)
CREATE TABLE ordenes_activas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo tipo_orden NOT NULL,
    identificador TEXT NOT NULL, -- Ej: "Mesa 4" o "Carlos (Llevar)"
    creado_por UUID REFERENCES perfiles(id),
    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 Detalles de la Orden Activa 
CREATE TABLE detalles_orden_activa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    orden_id UUID REFERENCES ordenes_activas(id) ON DELETE CASCADE, -- Si se borra la orden, se borra el detalle
    producto_id UUID REFERENCES productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0)
);

-- 2.5 Métricas de Ventas (El histórico que no se borra)
CREATE TABLE metricas_ventas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mesera_id UUID REFERENCES perfiles(id),
    producto_id UUID REFERENCES productos(id),
    cantidad INT NOT NULL,
    tipo_venta tipo_orden NOT NULL,
    entregado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 3. HABILITACIÓN DE SEGURIDAD A NIVEL DE FILAS (RLS)
-- =====================================================================================

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_activas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_orden_activa ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_ventas ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- 4. POLÍTICAS BÁSICAS DE RLS
-- =====================================================================================

-- Productos: Todos los usuarios autenticados pueden verlos (lectura)
CREATE POLICY "Lectura de menú general" 
ON productos FOR SELECT 
USING (auth.role() = 'authenticated');

-- Órdenes Activas: Todos los usuarios autenticados pueden verlas, crearlas y eliminarlas (Colaborativo)
CREATE POLICY "Gestión colaborativa de comandas" 
ON ordenes_activas FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Gestión de detalles de comandas" 
ON detalles_orden_activa FOR ALL 
USING (auth.role() = 'authenticated');

-- Métricas: Las meseras pueden insertar al liberar, pero solo lectura de sus propias métricas (o el admin de todas)
CREATE POLICY "Inserción de métricas post-liberación" 
ON metricas_ventas FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

src/
├── domain/                # 1. Capa de Dominio (Reglas del Negocio)
│   ├── entities/          # Tipos y modelos de datos (ej. Orden.ts, Producto.ts)
│   └── repositories/      # Interfaces (Contratos) de los repositorios
│
├── application/           # 2. Capa de Aplicación (Casos de Uso y Estado)
│   ├── useCases/          # Lógica pura (ej. LiberarOrdenUseCase.ts, DescontarStockUseCase.ts)
│   └── store/             # Gestores de estado global (Zustand: useOrderStore.ts)
│
├── infrastructure/        # 3. Capa de Infraestructura (Servicios Externos)
│   ├── api/               # Cliente de Supabase (supabaseClient.ts)
│   └── repositories/      # Implementación real que hace las queries a Supabase
│
└── presentation/          # 4. Capa de Presentación (UI con React y Tailwind)
    ├── components/        # Componentes UI reutilizables (Tarjetas Antigravity, Botones)
    ├── layouts/           # Estructuras de página (Layout con Navbar/Sidebar)
    ├── pages/             # Las vistas de los módulos (CocinaPage, MeseraPage, AdminPage)
    └── hooks/             # Custom hooks para conectar la UI con los Casos de Uso


💻 Paso 3: Desarrollo de la Capa Global (Supabase y Zustand)
En este paso vamos a conectar nuestra aplicación con la base de datos y a configurar el gestor de estado global para que la interfaz pueda reaccionar a los datos.

1. Conexión a Supabase (Capa de Infraestructura)
Primero, necesitamos configurar el cliente de Supabase. Crea el archivo en la ruta correspondiente y asegúrate de tener tus variables de entorno (.env.local) configuradas con la URL y la Key pública de tu proyecto.

📂 Ruta: src/infrastructure/api/supabase.ts

TypeScript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

// Cliente exportado para ser usado por los repositorios
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
2. Gestor de Estado Global de Comandas (Capa de Aplicación)
Como necesitamos que las meseras y la cocina vean los pedidos activos, utilizaremos Zustand. Este store mantendrá la lista de órdenes en la memoria del frontend y se actualizará cuando hagamos las suscripciones en tiempo real más adelante.

📂 Ruta: src/application/store/useOrderStore.ts

TypeScript
import { create } from 'zustand';

// Tipos basados en nuestra base de datos (Dominio)
export type TipoOrden = 'mesa' | 'llevar';

export interface OrdenActiva {
  id: string;
  tipo: TipoOrden;
  identificador: string;
  creado_at: string;
  detalles: any[]; // Aquí irán los platos solicitados
}

interface OrderState {
  ordenesActivas: OrdenActiva[];
  setOrdenes: (ordenes: OrdenActiva[]) => void;
  agregarOrden: (orden: OrdenActiva) => void;
  removerOrden: (id: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  ordenesActivas: [],
  
  // Carga inicial de datos
  setOrdenes: (ordenes) => set({ ordenesActivas: ordenes }),
  
  // Cuando ingresa un nuevo ticket (lo usaremos con WebSockets)
  agregarOrden: (orden) => 
    set((state) => ({ ordenesActivas: [...state.ordenesActivas, orden] })),
    
  // Cuando una mesera "Libera" un pedido y se elimina de la pantalla
  removerOrden: (id) => 
    set((state) => ({ 
      ordenesActivas: state.ordenesActivas.filter((o) => o.id !== id) 
    })),
}));
3. Gestor de Estado para el Menú e Inventario
Para que el menú reaccione inmediatamente cuando un plato se quede sin stock_diario, también creamos un store para los productos.

📂 Ruta: src/application/store/useMenuStore.ts

TypeScript
import { create } from 'zustand';

export type CategoriaPlato = 'corriente' | 'asados';

export interface Producto {
  id: string;
  nombre: string;
  categoria: CategoriaPlato;
  stock_diario: number;
  activo: boolean;
}

interface MenuState {
  menu: Producto[];
  setMenu: (productos: Producto[]) => void;
  descontarStockLocal: (productoId: string, cantidad: number) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menu: [],
  
  setMenu: (productos) => set({ menu: productos }),
  
  // Optimistic UI: Descontamos visualmente antes de que la BD responda para mayor fluidez
  descontarStockLocal: (productoId, cantidad) =>
    set((state) => ({
      menu: state.menu.map((prod) =>
        prod.id === productoId
          ? { ...prod, stock_diario: Math.max(0, prod.stock_diario - cantidad) }
          : prod
      ),
    })),
}));
Con estas dos piezas clave (el cliente de BD y el estado global en memoria), ya tenemos los cimientos sólidos.

link de conversacion
    https://gemini.google.com/share/07fe9e5d710d