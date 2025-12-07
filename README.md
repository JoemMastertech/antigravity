# Proyecto Restaurante Moderno

Aplicación web para gestión de pedidos y menú interactivo, construida con Vanilla JS modular y arquitectura CSS moderna.

## 🏗️ Arquitectura

### CSS y Estilos (ITCSS)
Utilizamos la metodología **ITCSS (Inverted Triangle CSS)** para organizar los estilos de manera escalable y mantenible.
La estructura se encuentra en `Shared/styles/` y se compila a un único archivo `main.css`.

- **Settings/Tools**: Variables, breakpoints y mixins.
- **Base**: Reset y tipografía base.
- **Layout**: Estructura de rejilla y contenedores.
- **Components**: Botones, tarjetas, modales, tablas (modularizados).
- **Utilities**: Clases utilitarias con `!important` solo cuando es necesario.

Para garantizar la integridad visual, utilizamos **BackstopJS** para pruebas de regresión visual.

### Javascript (Modular Architecture)
El núcleo de la renderización de productos (`product-table.js`) ha sido refactorizado a una arquitectura modular basada en el patrón Orquestador.

- **Orquestador**: `product-table.js` (Coordina la vista).
- **Módulos**:
  - `state.js`: Gestión centralizada del estado.
  - `api.js`: Capa de acceso a datos (Repository Pattern).
  - `events.js`: Delegación de eventos global.
  - `utils.js`: Funciones puras de utilidad.

Para más detalles técnicos, consulta: [Documentación de Arquitectura JS](docs/JS_ARCHITECTURE.md).

## 🚀 Setup y Desarrollo

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El servidor iniciará en http://localhost:8081.

3. **Compilar CSS (si se hacen cambios):**
   ```bash
   npm run build:css
   ```
   *Nota: En desarrollo, el script `dev` suele encargarse de esto.*

4. **Pruebas Visuales:**
   ```bash
   npm run test:visual
   ```

## 🛠️ Tecnologías
- **Frontend**: HTML5, CSS3 (PostCSS/ITCSS), Javascript (ES6+ Modules).
- **Backend/Data**: Supabase.
- **Testing**: BackstopJS (Visual), Jest (Unit - *en progreso*).

## 📄 Licencia
Privada.