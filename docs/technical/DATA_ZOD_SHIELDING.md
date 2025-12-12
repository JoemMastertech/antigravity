# Arquitectura de Blindaje de Datos con Zod

## 1. Filosofía: "Defensive Programming"
El sistema implementa una capa de **Blindaje de Datos** (Data Shielding) ubicada entre la capa de Infraestructura (Supabase/API) y la Capa de UI.
Su objetivo es garantizar que **nunca** llegue un dato corrupto, nulo o malformado a los componentes de React, eliminando crashes por `undefined` o `NaN`.

---

## 2. El Cerebro Bilingüe (`z.preprocess`)
Esta es la pieza clave de la arquitectura. Permite que el frontend sea agnóstico al idioma de la fuente de datos.

### ¿Cómo funciona?
Antes de validar, Zod intercepta el objeto crudo y normaliza sus llaves.

**Ejemplo de Flujo:**
1. **Input (Inglés/API Futura):** `{ "name": "Gin", "bottlePrice": 500 }`
2. **Input (Español/Supabase):** `{ "nombre": "Gin", "precio_botella": 500 }`
3. **Pre-Proceso:** Ambos se transforman a ➡️ `{ "nombre": "Gin", "precioBotella": 500 }`
4. **Validación:** El esquema solo valida las llaves estandarizadas en camelCase.

### Código Clave (`src/schemas/product.schema.js`)
```javascript
const normalizeLicorInput = (input) => {
    return {
        ...base,
        // Mapeo Inteligente (Prioridad: camelCase -> snake_case -> English)
        precioBotella: base.precioBotella ?? base.bottlePrice ?? base.precio_botella,
        nombre: base.nombre ?? base.name,
        // ...
    };
};
```

---

## 3. Jerarquía de Esquemas

### A. `baseProductShape` (El Cimiento)
Define las reglas universales para CUALQUIER producto vendible.
- **ID:** String obligatorio.
- **Precio:** `z.coerce.number()`. Convierte "100", 100.00, o "100 pesos" a `100`. Si falla, usa `0`.
- **Imagen:** Si viene vacía o rota, inyecta `default-bottle.png`.

### B. `licorSchema` (La Especialidad)
Extiende al base y añade reglas estrictas para el alcohol.
- **Precios Desglosados:** `precioBotella`, `precioCopa`, `precioLitro`.
- **País:** Default "Desconocido".
- **Mixers (Acompañantes):**
    - Si la BD envía `null` o `[]`, el esquema inyecta automáticamente:
    - `["Coca Cola", "Agua Mineral", "Squirt", "Sprite"]`

---

## 4. Patrón de Implementación (Hexagonal)
La UI nunca toca estos esquemas directamente. La validación ocurre en los **Data Providers**.

`Infraestructura/data-providers/product-data.js`:
```javascript
// 1. Obtener datos crudos (sucios)
const { data } = await supabase.from('tequila').select('*');

// 2. BLINDAR (Parsear con Zod via Helper)
// Usamos el helper centralizado que maneja arrays y errores
import { validateProducts } from '../../src/schemas/product.schema.js';

return validateProducts(data);
```

## 5. Mantenimiento
- **Agregar un campo:** Añádelo a `baseProductShape` (si es para todos) o `licorSchema` (si es solo alcohol).
- **Soportar otro idioma:** Simplemente agrega el mapeo en `normalizeProductInput` o `normalizeLicorInput`. No toques la UI.
