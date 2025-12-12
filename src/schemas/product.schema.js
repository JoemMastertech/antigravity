import { z } from 'zod';

// =============================================================================
// ESQUEMA DE PRODUCTO BLINDADO (Fase 2: Data Shielding)
// =============================================================================
// Objetivo: Que la UI nunca se rompa, independientemente de la basura que llegue de la BD.
// Estrategia: "Sanitización Agresiva" usando z.coerce y z.catch/default.

const baseProductShape = z.object({

    // 1. ID: Obligatorio
    id: z.string().min(1).catch("ID_DESCONOCIDO"),

    // 2. Nombre (name): Mínimo 3 caracteres.
    nombre: z.string()
        .min(3)
        .catch("Producto Sin Nombre")
        .default("Producto Sin Nombre"),

    // 3. Precio (price): Convertir string a número.
    precio: z.coerce.number()
        .nonnegative()
        .catch(0)
        .default(0),

    // 4. Imagen (image): URL válida.
    imagen: z.string()
        .url() // Valida que parezca una URL
        .catch("/assets/images/default-bottle.png")
        .default("/assets/images/default-bottle.png")
        .transform((val) => val === "" ? "/assets/images/default-bottle.png" : val),

    // 5. Categoría (category): Enum estricto.
    categoria: z.enum(['cervezas', 'licores', 'vinos', 'snacks', 'sin_alcohol', 'refresco', 'jugo', 'cerveza', 'alitas', 'pizzas', 'sopas', 'ensaladas', 'carnes', 'platos fuertes', 'postres', 'cafe', 'tequila', 'whisky', 'ron', 'vodka', 'ginebra', 'mezcal', 'cognac', 'brandy', 'digestivos', 'espumosos'])
        .catch('cervezas')
        .default('cervezas'),

    // 6. Disponibilidad: Boolean default true
    available: z.boolean()
        .catch(true)
        .default(true)

});

// --- NORMALIZATION LOGIC (BILINGUAL SUPPORT) ---
const normalizeProductInput = (input) => {
    if (!input || typeof input !== 'object') return input;

    return {
        ...input,
        nombre: input.nombre ?? input.name,
        precio: input.precio ?? input.price,
        imagen: input.imagen ?? input.image ?? input.image_url,
        categoria: input.categoria ?? input.category
        // id is usually id, available usually available.
    };
};

export const productSchema = z.preprocess(normalizeProductInput, baseProductShape.passthrough()).transform((product) => {
    return product;
});

// =============================================================================
// ESQUEMA DE LICOR
// =============================================================================

const DEFAULT_MIXERS = [
    "Coca Cola",
    "Agua Mineral",
    "Squirt",
    "Sprite"
];

const baseLicorShape = baseProductShape.extend({
    // Precios específicos de licor (coerce para asegurar numbers)
    precioBotella: z.coerce.number()
        .nonnegative()
        .catch(0)
        .default(0),

    precioCopa: z.coerce.number()
        .nonnegative()
        .nullable()
        .catch(null)
        .default(null),

    precioLitro: z.coerce.number()
        .nonnegative()
        .nullable()
        .catch(null)
        .default(null),

    // Mixers (Acompañantes) - Arrays de strings
    mixersBotella: z.array(z.string())
        .catch(DEFAULT_MIXERS)
        .default(DEFAULT_MIXERS),

    mixersCopa: z.array(z.string())
        .catch(DEFAULT_MIXERS)
        .default(DEFAULT_MIXERS),

    mixersLitro: z.array(z.string())
        .catch(DEFAULT_MIXERS)
        .default(DEFAULT_MIXERS),

    // Metadata extra
    pais: z.string()
        .catch('Desconocido')
        .default('Desconocido')
});

const normalizeLicorInput = (input) => {
    // Primero normalizamos lo básico
    const base = normalizeProductInput(input);
    if (!base || typeof base !== 'object') return base;

    // Helper para mixers: Si viene null o vacío, usar DEFAULT
    // Si viene como string (JSON), intentar parsear
    const normalizeMixer = (val) => {
        if (!val) return undefined;

        let parsedVal = val;
        // Parse JSON string if needed (Supabase sometimes sends JSON as string)
        if (typeof val === 'string') {
            try {
                // If it looks like an array, parse it
                if (val.trim().startsWith('[')) {
                    parsedVal = JSON.parse(val);
                } else {
                    return undefined;
                }
            } catch (e) {
                console.warn('[Schema] Failed to parse mixer JSON', val);
                return undefined;
            }
        }

        if (Array.isArray(parsedVal) && parsedVal.length === 0) return undefined; // Deja que Zod use el default
        return parsedVal;
    };

    // EXPLICIT MAPPING (User Request Phase 3)
    // Extract values with priority: CamelCase -> SnakeCase -> English -> Null
    // Using || to ensure we catch "truthy" arrays, though ?? is usually safer for definedness.
    // User requested "inputs.mixersBotella || inputs.mixers_botella || null"
    const mixersBotellaRaw = base.mixersBotella || base.mixers_botella || base.bottleMixers;
    const mixersCopaRaw = base.mixersCopa || base.mixers_copa || base.glassMixers;
    const mixersLitroRaw = base.mixersLitro || base.mixers_litro || base.literMixers;

    // Normalizamos lo específico de licores
    return {
        ...base,
        // Map database columns (snake_case) or English aliases to internal camelCase
        precioBotella: base.precioBotella ?? base.precio_botella ?? base.bottlePrice ?? base.bottle_price,
        precioCopa: base.precioCopa ?? base.precio_copa ?? base.glassPrice ?? base.cup_price,
        precioLitro: base.precioLitro ?? base.precio_litro ?? base.literPrice ?? base.liter_price,
        // Also map standard price if it's a simple product but came as snake_case (e.g. food)
        precio: base.precio ?? base.price ?? base.precio_venta,

        // Mapeo Robusto (Parseado y Limpio)
        mixersBotella: normalizeMixer(mixersBotellaRaw),
        mixersCopa: normalizeMixer(mixersCopaRaw),
        mixersLitro: normalizeMixer(mixersLitroRaw),

        pais: base.pais ?? base.country
    };
};

export const licorSchema = z.preprocess(normalizeLicorInput, baseLicorShape.passthrough());

// Categories that use the Liquor Schema
const LIQUOR_CATEGORIES = [
    'vodka', 'whisky', 'tequila', 'ron', 'brandy',
    'cognac', 'digestivos', 'ginebra', 'mezcal', 'licores'
];

// Función helper para validar y limpiar un array de productos
// UPDATED: Smart Schema Selection
export const validateProducts = (products, category = '') => {
    if (!Array.isArray(products)) return [];

    const isLiquor = LIQUOR_CATEGORIES.includes(category.toLowerCase());
    const schemaToUse = isLiquor ? licorSchema : productSchema;

    // safeParse individual para no tirar todo el array si uno falla catastróficamente
    // aunque con los .catch() de arriba, no debería fallar nunca.
    return products.map(p => schemaToUse.parse(p));
};
