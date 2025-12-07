# Arquitectura Modular: Product Table

Este documento describe la arquitectura refactorizada del componente `product-table.js`, encargado de la visualización de productos (Tabla/Grid) y gestión de categorías.

## 🧩 Diagrama de Componentes

La refactorización sigue un patrón de **Orquestador y Módulos**, donde `product-table.js` actúa como el punto central que coordina subsistemas especializados.

```mermaid
graph TD
    Consumer[Consumidor (App/Main)] -->|Usa| Orchestrator[ProductRenderer<br>(product-table.js)]

    subgraph "Núcelo (Orquestación)"
        Orchestrator
    end

    subgraph "Módulos Especializados"
        State[State Module<br>(modules/state.js)]
        API[API Module<br>(modules/api.js)]
        Events[Events Module<br>(modules/events.js)]
        Utils[Utils Module<br>(modules/utils.js)]
    end

    subgraph "Capa de Dominio Compartido"
        Repo[ProductRepository]
        Logger[Logger]
        DI[DI Container]
    end

    %% Relaciones
    Orchestrator -->|Delega Eventos| Events
    Orchestrator -->|Lee Estado| State
    Orchestrator -->|Pide Datos| API
    Orchestrator -->|Usa Helpers| Utils

    Events -->|Mutaciones| State
    Events -->|Trigger Nav| Orchestrator
    
    API -->|Obtiene Datos| Repo
    API -->|Lee Cache| State

    State -->|Gestiona| Cache[ProductCache]
    State -->|Gestiona| ViewMode[ViewMode: Grid/Table]

    %% Dependencias Externas
    API -.-> DI
    Events -.-> Logger
```

## 📦 Descripción de Módulos

### 1. `product-table.js` (El Orquestador)
**Responsabilidad:** Renderizado y Coordinación.
- **Función:** Es la cara pública del componente. Recibe órdenes de renderizado (`renderLicores`, `createProductTable`) y coordina a los módulos para pintar la UI.
- **Lógica "Dumb":** No toma decisiones de negocio complejas ni adivina datos. Renderiza estrictamente lo que recibe.
- **Gestión de UI:** Contiene la lógica de creación de elementos DOM (Cards, Rows, Modals).

### 2. `modules/state.js` (Estado)
**Responsabilidad:** Gestión de Memoria y Configuración.
- **State:** Almacena el modo de vista actual (`grid` vs `table`), caché de productos y estado de inicialización de eventos.
- **Actions:** Provee métodos controlados para modificar este estado (`toggleViewMode`, `setProductCache`).

### 3. `modules/api.js` (Datos)
**Responsabilidad:** Obtención de Datos y Abstracción.
- **Repo Wrapper:** Envuelve llamadas a `ProductRepository` y otras fuentes de datos del Container DI.
- **Limpio de Visualización:** No sabe nada de HTML o DOM. Solo retorna objetos de datos o URLs.

### 4. `modules/events.js` (Interacción)
**Responsabilidad:** Manejo de Eventos (Delegación).
- **Delegación Centralizada:** Implementa un único listener en `document` para manejar clics de toda la interfaz de productos, mejorando el rendimiento.
- **Routing Interno:** Maneja la navegación interna (volver atrás, cambiar categoría, abrir modales).
- **Handlers:** Contiene la lógica de qué hacer cuando se hace clic en una imagen, un precio o un botón.

### 5. `modules/utils.js` (Utilidades)
**Responsabilidad:** Funciones Puras.
- **Helpers:** Formateo de precios, normalización de strings, generación de hashes.
- **Sin Efectos Secundarios:** Funciones que reciben input y devuelven output, sin tocar el DOM ni el estado.

## 🔄 Flujo de Datos (Ejemplo: Renderizado de Grid)

1. **Usuario** hace clic en "Coctelería".
2. **App** llama a `ProductRenderer.renderCocktails(container)`.
3. **ProductRenderer** pide datos a `api.getProductsByCategory('cocteleria')`.
4. **API** retorna array de productos (desde Repositorio o Caché).
5. **ProductRenderer** consulta `state.currentViewMode` (ej: 'grid').
6. **ProductRenderer** itera los datos y llama a `createProductCard`.
   - Usa `utils.formatPrice`.
   - Usa `item.imagen` directo de la BD (Dumb UI).
7. **ProductRenderer** inyecta el HTML en el contenedor.
8. (Pasivo) **Events** module ya está escuchando clics en los nuevos elementos gracias a la delegación.

## ✅ Principios Aplicados
- **Single Responsibility Principle (SRP):** Cada módulo tiene una única razón para cambiar.
- **Separation of Concerns:** Renderizado separado de Datos separado de Eventos.
- **Dumb UI:** La UI no interpreta ni transforma datos mágicamente, solo los muestra.
- **Event Delegation:** Eficiencia en memoria para listas largas de productos.
