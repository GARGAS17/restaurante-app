-- ==========================================
-- SCRIPT DE INICIALIZACIÓN DE RESTOMONEY
-- ==========================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para crear toda la base de datos desde cero.
-- ==========================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. ELIMINAR TABLAS SI EXISTEN (Para un inicio limpio)
-- ==========================================
DROP TABLE IF EXISTS public.detalles_orden_activa CASCADE;
DROP TABLE IF EXISTS public.metricas_ventas CASCADE;
DROP TABLE IF EXISTS public.ordenes_activas CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.configuracion_restaurante CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;
DROP TYPE IF EXISTS public.rol_usuario CASCADE;

-- Eliminar usuarios de prueba si existían
DELETE FROM auth.users WHERE email IN ('admin@restomoney.com', 'mesera@restomoney.com', 'cocina@restomoney.com');

-- ==========================================
-- 3. CREACIÓN DE TABLAS
-- ==========================================

-- Tabla de Configuración Global
CREATE TABLE public.configuracion_restaurante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cantidad_mesas INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos (El Menú)
CREATE TABLE public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('corriente', 'asados')),
    stock_diario INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Órdenes (Cabecera)
CREATE TABLE public.ordenes_activas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo TEXT NOT NULL CHECK (tipo IN ('mesa', 'llevar')),
    identificador TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'entregado', 'pagado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Detalles de Órdenes (Los platos de cada orden)
CREATE TABLE public.detalles_orden_activa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID NOT NULL REFERENCES public.ordenes_activas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1
);

-- Tabla de Métricas (Histórico de platos vendidos)
CREATE TABLE public.metricas_ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL,
    tipo_venta TEXT NOT NULL CHECK (tipo_venta IN ('mesa', 'llevar')),
    entregado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tipo de dato para los roles (Crea un menú desplegable en Supabase)
CREATE TYPE public.rol_usuario AS ENUM ('admin', 'mesera', 'cocina');

-- Tabla de Perfiles de Usuario (Roles)
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    rol public.rol_usuario NOT NULL
);

-- ==========================================
-- 4. ACTIVAR SEGURIDAD A NIVEL DE FILAS (RLS)
-- Como es un SaaS privado, solo permitimos operaciones
-- a los usuarios que hayan iniciado sesión.
-- ==========================================
ALTER TABLE public.configuracion_restaurante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_activas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_orden_activa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Políticas Universales para el personal
CREATE POLICY "Acceso total a personal autenticado" ON public.configuracion_restaurante FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a personal autenticado" ON public.productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a personal autenticado" ON public.ordenes_activas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a personal autenticado" ON public.detalles_orden_activa FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a personal autenticado" ON public.metricas_ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para los Perfiles
CREATE POLICY "Lectura de perfiles a personal autenticado" ON public.perfiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Edición de perfiles a personal autenticado" ON public.perfiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Inserción de perfiles para sistema" ON public.perfiles FOR INSERT WITH CHECK (true);

-- ==========================================
-- 5. INSERTAR DATOS INICIALES (SEEDING)
-- ==========================================

-- Configuración Inicial: 15 Mesas
INSERT INTO public.configuracion_restaurante (cantidad_mesas) VALUES (15);

-- Platos Básicos de Ejemplo
INSERT INTO public.productos (nombre, categoria, stock_diario, activo) VALUES
('Ajiaco Santafereño', 'corriente', 25, true),
('Bandeja Paisa', 'corriente', 20, true),
('Sopa de Mondongo', 'corriente', 15, true),
('Pollo Asado (Medio)', 'corriente', 30, true),
('Churrasco', 'asados', 8, true),
('Costillas BBQ', 'asados', 12, true),
('Picada Familiar', 'asados', 5, true),
('Punta de Anca', 'asados', 10, true);

-- ==========================================
-- 6. AUTOMATIZACIÓN DE PERFILES (TRIGGER)
-- Crea automáticamente un perfil cuando agregas un usuario
-- en el panel de Authentication de Supabase.
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    INITCAP(SPLIT_PART(NEW.email, '@', 1)), -- Usa la primera parte del correo como nombre (Ej: 'admin')
    CASE
      WHEN NEW.email LIKE 'admin@%' THEN 'admin'::public.rol_usuario
      WHEN NEW.email LIKE 'cocina@%' THEN 'cocina'::public.rol_usuario
      ELSE 'mesera'::public.rol_usuario
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 7. RECORDATORIO DE CREACIÓN DE USUARIOS
-- ==========================================
-- IMPORTANTE: Para agregar personal, simplemente ve a "Authentication" -> "Users" 
-- en tu panel de Supabase y crea los usuarios usando estos correos:
-- - admin@restomoney.com
-- - mesera@restomoney.com
-- - cocina@restomoney.com
-- 
-- ¡El Trigger automático que creamos arriba se encargará de crearles su 
-- perfil y asignarles el rol correcto automáticamente!

-- ==========================================
-- 8. FUNCIONES RPC (Procedimientos Almacenados)
-- ==========================================
-- Función atómica para decrementar inventario evitando Race Conditions
CREATE OR REPLACE FUNCTION decrementar_stock(p_producto_id UUID, p_cantidad INT)
RETURNS void AS $$
BEGIN
  UPDATE public.productos
  SET stock_diario = GREATEST(0, stock_diario - p_cantidad)
  WHERE id = p_producto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ¡Base de datos inicializada con éxito!
