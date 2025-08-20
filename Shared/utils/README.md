# domUtils.js - Utilidades DOM Mejoradas

## Descripción General

`domUtils.js` es una biblioteca de utilidades DOM que proporciona funcionalidades robustas para el manejo de modales, manipulación segura de contenido HTML y gestión eficiente de elementos del DOM.

## Características Principales

### 🚀 Auto-mejora de Modales (v1.1.0)
- **Detección automática**: Los modales sin métodos `show()` y `hide()` son automáticamente mejorados
- **Sistema de caché**: Evita verificaciones repetidas para mejor rendimiento
- **Compatibilidad total**: Funciona con modales existentes sin romper funcionalidad

### 🛡️ Manipulación Segura de DOM
- Validación de elementos antes de manipulación
- Manejo seguro de innerHTML
- Gestión de errores robusta

### ⚡ Optimización de Rendimiento
- Sistema de caché para modales mejorados
- Verificaciones mínimas en operaciones repetidas
- Funciones de limpieza de caché para gestión de memoria

## API de Funciones

### Gestión de Modales

#### `showModal(modalId)`
Muestra un modal por su ID. Auto-mejora el modal si es necesario.

```javascript
import { showModal } from './domUtils.js';

// Muestra el modal - se auto-mejora automáticamente
showModal('my-modal');
```

#### `hideModal(modalId)`
Oculta un modal por su ID. Auto-mejora el modal si es necesario.

```javascript
import { hideModal } from './domUtils.js';

// Oculta el modal
hideModal('my-modal');
```

### Gestión de Caché

#### `clearModalCache(modalId?)`
Limpia el caché de modales mejorados.

```javascript
import { clearModalCache } from './domUtils.js';

// Limpia todo el caché
clearModalCache();

// Limpia un modal específico del caché
clearModalCache('specific-modal');
```

#### `getModalCacheStats()`
Obtiene estadísticas del caché para monitoreo y depuración.

```javascript
import { getModalCacheStats } from './domUtils.js';

const stats = getModalCacheStats();
console.log(`Modales en caché: ${stats.size}`);
console.log('IDs de modales:', stats.enhancedModals);
```

### Utilidades DOM

#### `setSafeInnerHTML(elementId, content)`
Establece contenido HTML de forma segura.

```javascript
import { setSafeInnerHTML } from './domUtils.js';

setSafeInnerHTML('content-div', '<p>Contenido seguro</p>');
```

#### `getElementSafely(elementId)`
Obtiene un elemento del DOM con validación.

```javascript
import { getElementSafely } from './domUtils.js';

const element = getElementSafely('my-element');
if (element) {
  // El elemento existe y es seguro usar
}
```

#### `updateElementText(elementId, text)`
Actualiza el texto de un elemento de forma segura.

```javascript
import { updateElementText } from './domUtils.js';

updateElementText('status', 'Operación completada');
```

#### `toggleElementClass(elementId, className, force?)`
Alterna una clase CSS en un elemento.

```javascript
import { toggleElementClass } from './domUtils.js';

// Alterna la clase
toggleElementClass('button', 'active');

// Fuerza agregar la clase
toggleElementClass('button', 'active', true);

// Fuerza remover la clase
toggleElementClass('button', 'active', false);
```

## Mejores Prácticas

### 1. Gestión de Modales Dinámicos
Cuando agregues o remuevas modales dinámicamente:

```javascript
// Después de remover un modal del DOM
clearModalCache('removed-modal-id');

// Después de agregar un nuevo modal
// No es necesario hacer nada - se auto-mejorará automáticamente
```

### 2. Monitoreo de Rendimiento
Para aplicaciones con muchos modales:

```javascript
// Verifica el estado del caché periódicamente
const stats = getModalCacheStats();
if (stats.size > 50) {
  console.warn('Muchos modales en caché, considera limpiar');
}
```

### 3. Depuración
Para depurar problemas de modales:

```javascript
// Verifica qué modales están en caché
const stats = getModalCacheStats();
console.log('Modales mejorados:', stats.enhancedModals);

// Limpia el caché si hay problemas
clearModalCache();
```

## Pruebas Unitarias

Ejecuta las pruebas unitarias incluidas:

```javascript
import DomUtilsTests from './domUtils.test.js';

const tests = new DomUtilsTests();
tests.runAllTests();
```

Las pruebas cubren:
- ✅ Auto-mejora de modales
- ✅ Preservación de modales pre-mejorados
- ✅ Funcionalidad de ocultación
- ✅ Manejo de errores
- ✅ Gestión de caché
- ✅ Rendimiento de caché

## Historial de Versiones

### v1.1.0 (Actual)
- ➕ Sistema de auto-mejora de modales
- ➕ Sistema de caché para optimización
- ➕ Funciones de gestión de caché
- ➕ Pruebas unitarias completas
- 🔧 Documentación mejorada

### v1.0.0
- 🎉 Versión inicial con utilidades básicas DOM

## Compatibilidad

- ✅ ES6+ Modules
- ✅ Navegadores modernos
- ✅ Node.js (con DOM mock)
- ✅ Frameworks: React, Vue, Angular

## Contribución

Para contribuir al proyecto:

1. Ejecuta las pruebas existentes
2. Agrega pruebas para nuevas funcionalidades
3. Mantén la compatibilidad hacia atrás
4. Actualiza la documentación

---

**Nota**: Esta biblioteca está optimizada para rendimiento y robustez. El sistema de caché asegura que los modales no sean re-procesados innecesariamente, mejorando significativamente el rendimiento en aplicaciones con múltiples modales.