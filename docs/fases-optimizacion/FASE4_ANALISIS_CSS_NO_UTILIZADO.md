# FASE 4: Análisis de CSS No Utilizado

## Metodología de Análisis

### Archivos HTML Analizados
- `index.html` (archivo principal)
- `test-*.html` (archivos de prueba)
- `debug-*.html` (archivos de debug)

### Clases CSS Encontradas en HTML

#### Clases Principales Utilizadas
- `.content-container`, `.content-container-flex`
- `.main-content`, `.main-content-screen`
- `.category-grid`, `.product-grid`
- `.category-card`, `.product-card`
- `.nav-button`, `.price-button`
- `.modal`, `.modal-content`, `.modal-backdrop`
- `.order-sidebar`, `.order-item`
- `.drawer-menu`, `.drawer-overlay`
- `.top-nav-btn`, `.hamburger-btn`

## Selectores CSS Potencialmente No Utilizados

### 1. Utilidades de Tablet/Mobile Específicas
```css
/* tablet.css */
.u-tablet-only
.u-hide-tablet
.u-tablet-center
.u-tablet-flex

/* mobile.css */
.u-mobile-only
.u-hide-mobile
.u-mobile-center
.u-mobile-full-width
```
**Estado**: ❓ Verificar uso en JavaScript dinámico

### 2. Estados de Loading/Empty
```css
.grid--loading
.grid--empty
.card--loading
```
**Estado**: ❓ Verificar uso en JavaScript dinámico

### 3. Clases de Animación
```css
.fade-in
.fade-out
```
**Estado**: ❓ Verificar uso en JavaScript dinámico

### 4. Selectores de Categorías Específicas
```css
[data-category="carnes"] .video-thumb
[data-category="cafe"] .video-thumb
[data-category="postres"] .video-thumb:hover
[data-category="sopas"] .video-thumb
```
**Estado**: ✅ Probablemente utilizados (data attributes)

### 5. Clases de Estado de Orden
```css
.price-selection-mode .price-button
.order-mode-active
.content-container--order-active
.order-sidebar--active
.order-sidebar--landscape
```
**Estado**: ✅ Utilizados por CSSClassManager.js

### 6. Clases de Utilidad Específicas
```css
.video-hidden
.screen-hidden
.hamburger-hidden
.sidebar-hidden
.content-hidden
.input-container-hidden
.choice-hidden
.error-hidden
.modal-hidden
```
**Estado**: ✅ Utilizados por CSSClassManager.js

### 7. Clases de Productos Específicos
```css
.exclusive-option-group
.jager-option-container
.jager-radio
.jager-label
```
**Estado**: ❓ Verificar si se usan para productos específicos

### 8. Clases BEM Nuevas
```css
.product-card--enhanced
.product-card--grid-type-2
.product-card--liquor
.category-card--grid-type-4
```
**Estado**: ✅ Utilizados por sistema BEM implementado

## Reglas !important Identificadas

### Reglas Marcadas para Retención
```css
.screen-hidden { display: none !important; }
.product-image-small { width: 40px !important; height: 40px !important; }
.height-auto { height: auto !important; }
```
**Estado**: ✅ Mantener (necesarias para override)

### Reglas Candidatas para Optimización
```css
/* tablet.css - múltiples !important en margin, padding, height */
/* mobile.css - múltiples !important en font-size, line-height */
/* main.css - !important en transform, flex, width, display */
```
**Estado**: ⚠️ Evaluar caso por caso

## Código Duplicado Identificado

### 1. Reglas de Grid Repetidas
- Definiciones de `.grid`, `.card` en múltiples archivos
- Reglas de responsive duplicadas entre mobile.css y tablet.css

### 2. Reglas de Navegación
- Estilos de `.nav-button` repetidos
- Reglas de `.top-nav-btn` duplicadas entre archivos

### 3. Reglas de Modal
- Estilos de modal repetidos en main.css
- Reglas de backdrop duplicadas

## Recomendaciones de Limpieza

### Fase 4.1: Eliminación Segura
1. **Comentarios obsoletos** - Eliminar comentarios de migración completada
2. **Reglas legacy duplicadas** - Consolidar reglas @extend redundantes
3. **Selectores específicos no utilizados** - Eliminar tras verificación

### Fase 4.2: Consolidación
1. **Unificar reglas de utilidad** - Mover todas las utilidades a un archivo
2. **Consolidar reglas de componentes** - Agrupar estilos relacionados
3. **Optimizar media queries** - Consolidar breakpoints similares

### Fase 4.3: Optimización !important
1. **Evaluar necesidad real** - Verificar si se puede eliminar
2. **Aumentar especificidad** - Usar selectores más específicos
3. **Usar CSS custom properties** - Para valores que necesitan override

## Métricas de Limpieza Esperadas

### Reducción de Código
- **Líneas de CSS**: ~200-300 líneas menos
- **Reglas !important**: Reducción del 30-40%
- **Selectores duplicados**: Eliminación del 90%

### Mejoras de Performance
- **Tamaño de archivos CSS**: Reducción del 15-20%
- **Tiempo de parsing**: Mejora marginal
- **Especificidad promedio**: Reducción significativa

---
*Análisis realizado en Fase 4 - Limpieza Final y Documentación*