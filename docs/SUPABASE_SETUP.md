# Configuración de Supabase para la Aplicación

## 📋 Resumen
La aplicación está configurada para usar Supabase como base de datos, pero las tablas necesitan ser creadas manualmente en tu proyecto de Supabase.

## 🔧 Configuración Actual
- **URL de Supabase**: `https://udtlqjmrtbcpdqknwuro.supabase.co`
- **Estado**: Conectado pero sin tablas creadas
- **Comportamiento**: Usa datos locales como fallback cuando las tablas no existen

## 📊 Tablas Requeridas
Para que la aplicación muestre productos desde Supabase, necesitas crear estas tablas:

### Tablas de Productos
1. `cocteles` - Para la sección de Coctelería
2. `refrescos` - Para Refrescos
3. `licores` - Para Licores
4. `cervezas` - Para Cervezas
5. `pizzas` - Para Pizzas
6. `alitas` - Para Alitas
7. `sopas` - Para Sopas
8. `ensaladas` - Para Ensaladas
9. `carnes` - Para Carnes
10. `cafe` - Para Café
11. `postres` - Para Postres

## 🏗️ Estructura de Tabla Sugerida
Cada tabla debe tener al menos estos campos:

```sql
CREATE TABLE cocteles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2),
  descripcion TEXT,
  imagen VARCHAR(500),
  video VARCHAR(500),
  categoria VARCHAR(100),
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Pasos para Configurar

### 1. Accede a tu proyecto de Supabase
- Ve a [supabase.com](https://supabase.com)
- Inicia sesión y selecciona tu proyecto

### 2. Crea las tablas
- Ve a la sección "Table Editor"
- Crea cada una de las 11 tablas listadas arriba
- Usa la estructura sugerida o adapta según tus necesidades

### 3. Inserta datos de prueba
```sql
-- Ejemplo para tabla cocteles
INSERT INTO cocteles (nombre, precio, descripcion) VALUES 
('Margarita', 120.00, 'Cóctel clásico con tequila y limón'),
('Mojito', 110.00, 'Refrescante cóctel con ron y menta');
```

### 4. Configura permisos (RLS)
- Ve a "Authentication" > "Policies"
- Configura políticas de acceso según tus necesidades
- Para desarrollo, puedes permitir acceso público de lectura

## ✅ Verificación
Una vez creadas las tablas:
1. Recarga la aplicación
2. Revisa la consola del navegador
3. Deberías ver mensajes como: `✅ Datos cargados desde Supabase tabla 'cocteles': X registros`

## 🔄 Comportamiento Actual
- **Con tablas**: Muestra productos desde Supabase
- **Sin tablas**: Muestra productos locales (fallback automático)
- **Errores de conexión**: Usa datos locales como respaldo

## 📝 Notas Importantes
- La aplicación funciona perfectamente sin Supabase (usando datos locales)
- Los errores 404 son normales hasta que crees las tablas
- Una vez creadas las tablas, los productos se actualizarán automáticamente
- No necesitas modificar código, solo crear las tablas en Supabase

## 🆘 Solución de Problemas
- **Error 404**: Las tablas no existen en Supabase (normal hasta crearlas)
- **Error de permisos**: Configura las políticas RLS en Supabase
- **Error de conexión**: Verifica la URL y API key en AppConfig.js