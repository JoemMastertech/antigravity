# ANÁLISIS DE CONFLICTOS CSS - PROBLEMAS IDENTIFICADOS

## PROBLEMAS PRINCIPALES DETECTADOS

### 1. CONFLICTO DE GRID COLUMNS EN DESKTOP

**Problema:** Desktop muestra 2 columnas en lugar de 3-4

**Causas identificadas:**
- `main.css` línea 35: `--grid-cols-desktop: repeat(3, 1fr)` (debería ser 4)
- `tablet.css` línea 202: `@media (min-width: 1024px)` aplica reglas de tablet a desktop
- `tablet.css` línea 204: `grid-template-columns: repeat(var(--tablet-grid-columns-landscape), 1fr)` = 3 columnas
- Variables inconsistentes:
  - `_variables-unified.css`: `--grid-columns-desktop: 4`
  - `main.css`: `--grid-cols-desktop: repeat(3, 1fr)`
  - `tablet.css`: `--tablet-grid-columns-landscape: 3`

### 2. MÚLTIPLES DEFINICIONES DE GRID CONFLICTIVAS

**En main.css:**
- Línea 35: `--grid-cols-desktop: repeat(3, 1fr)`
- Línea 2720: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- Línea 2746: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`

**En tablet.css:**
- Línea 20: `grid-template-columns: repeat(var(--tablet-grid-columns-portrait), 1fr)`
- Línea 187: `grid-template-columns: repeat(var(--tablet-grid-columns-portrait), 1fr)`
- Línea 204: `grid-template-columns: repeat(var(--tablet-grid-columns-landscape), 1fr)`

### 3. BREAKPOINTS SUPERPUESTOS

**Conflictos de media queries:**
- `tablet.css` línea 202: `@media (min-width: 1024px)` (afecta desktop)
- `main.css` línea 2122: `@media (min-width: 1025px)` (desktop)
- `tablet.css` línea 185: `@media (min-width: var(--bp-tablet)) and (max-width: 1023px)`

**Problema:** 1024px está en tablet.css pero debería ser desktop

### 4. ENCABEZADOS DE TABLA DESALINEADOS

**Causas:**
- `table-layout: fixed` aplicado sin definir anchos de columna específicos
- Múltiples reglas de padding conflictivas
- `text-align: center` en headers vs `text-align: left` en primera columna
- Reglas responsive que afectan el layout de tabla

### 5. ARQUITECTURA CSS DESORGANIZADA

**Problemas estructurales:**
- Variables duplicadas entre archivos
- Reglas que se sobreescriben sin necesidad
- Media queries mal organizadas
- Responsabilidades mezcladas entre archivos

## PLAN DE CORRECCIÓN

### FASE 1: LIMPIEZA DE VARIABLES
1. Consolidar todas las variables de grid en `_variables-unified.css`
2. Eliminar variables duplicadas de `main.css` y `tablet.css`
3. Definir claramente: mobile=2, tablet=3, desktop=4 columnas

### FASE 2: REORGANIZACIÓN DE BREAKPOINTS
1. Definir rangos claros:
   - Mobile: 0-767px
   - Tablet: 768px-1023px  
   - Desktop: 1024px+
2. Eliminar superposiciones de media queries

### FASE 3: SIMPLIFICACIÓN DE GRID
1. Una sola definición de grid por dispositivo
2. Eliminar reglas conflictivas
3. Usar variables unificadas consistentemente

### FASE 4: CORRECCIÓN DE TABLAS
1. Remover `table-layout: fixed` innecesario
2. Simplificar reglas de alineación
3. Permitir comportamiento natural de tabla

### FASE 5: TESTING
1. Verificar 4 columnas en desktop
2. Verificar 3 columnas en tablet
3. Verificar 2 columnas en mobile
4. Verificar alineación natural de tablas