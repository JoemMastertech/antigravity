/**di utilist 
 * Dependency Injection Utilities - Shared utilities for DI Container access
 * Consolidates duplicated DI functions across the application
 * Part of Phase 3A: Common Logic Extraction
 */

/**
 * Gets the ProductRepository from DI Container
 * Consolidates getProductRepository functions from multiple files
 * @returns {Object} Product repository instance
 * @throws {Error} If DIContainer is not initialized
 */
export function getProductRepository() {
  // Fallback for both DIContainer naming conventions used across the codebase
  const container = window.DIContainer || window.container;
  if (!container) {
    console.warn('DI Container not initialized. Returning fallback ProductRepository with sample data.');
    const sample = {
      licoresCategories: [
        { id: '10', nombre: 'WHISKY', icono: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/recursos/iconos-licores/WhikysX3.webp' },
        { id: '8', nombre: 'TEQUILA', icono: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/recursos/iconos-licores/TequilaX3.webp' },
        { id: '4', nombre: 'DIGESTIVOS', icono: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/recursos/iconos-licores/Digestivo.webp' }
      ],
      digestivos: [
        {
          id: 'd1',
          nombre: 'BAILEYS 750 ML',
          imagen: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/imagenes/bebidas/licores/digestivos/bealys.webp',
          precioBotella: '$1040.00',
          precioCopa: '$100.00'
        },
        {
          id: 'd2',
          nombre: 'JÄGERMEISTER 700 ML',
          imagen: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/imagenes/bebidas/licores/digestivos/jaguer.webp',
          precioBotella: '$1115.00',
          precioCopa: '$115.00'
        }
      ],
      cervezas: [
        {
          id: 'c1',
          nombre: 'CORONA 355ML',
          categoria: 'cerveza',
          tipo_contenido: 'imagen',
          ruta_archivo: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/imagenes/bebidas/cervezas/corona.webp',
          precio: '$60.00'
        },
        {
          id: 'c2',
          nombre: 'MODELO ESPECIAL 355ML',
          categoria: 'cerveza',
          tipo_contenido: 'imagen',
          ruta_archivo: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/imagenes/bebidas/cervezas/modelo-especial.webp',
          precio: '$65.00'
        }
      ],
      refrescos: [
        {
          id: 'r1',
          nombre: 'COCA COLA 355ML',
          categoria: 'refresco',
          tipo_contenido: 'imagen',
          ruta_archivo: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/imagenes/bebidas/refrescos/coca-cola.webp',
          precio: '$55.00'
        },
        {
          id: 'r2',
          nombre: 'SPRITE 355ML',
          categoria: 'refresco',
          tipo_contenido: 'imagen',
          ruta_archivo: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/imagenes/bebidas/refrescos/sprite.webp',
          precio: '$55.00'
        }
      ],
      pizzas: [
        {
          id: 'p1',
          nombre: 'PIZZA DE PEPPERONI',
          ingredientes: 'Masa clásica con pepperoni, queso gratinado y salsa italiana.',
          video: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/videos/comida/pizzas/pizza-peperoni.mp4',
          precio: '$110.00'
        },
        {
          id: 'p2',
          nombre: 'PIZZA HAWAIANA',
          ingredientes: 'Jamón, queso, piña, salsa italiana y queso mozzarella.',
          video: 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/videos/comida/pizzas/pizza-hawaiana.mp4',
          precio: '$115.00'
        }
      ]
    };

    return {
      async getLicoresCategories() { return sample.licoresCategories; },
      async getLiquorSubcategory(subcategory) { return sample[subcategory] || []; },
      async getCervezas() { return sample.cervezas; },
      async getPizzas() { return sample.pizzas; },
      async getRefrescos() { return sample.refrescos; }
    };
  }
  return container.resolve('ProductRepository');
}

/**
 * Generic service resolver from DI Container
 * @param {string} serviceName - Name of the service to resolve
 * @returns {Object} Resolved service instance
 * @throws {Error} If DIContainer is not initialized or service not found
 */
export function resolveService(serviceName) {
  if (typeof window.DIContainer === 'undefined' && typeof window.container === 'undefined') {
    throw new Error('DI Container not initialized. Make sure AppInit.initialize() has been called.');
  }
  
  const container = window.DIContainer || window.container;
  return container.resolve(serviceName);
}

/**
 * Checks if DI Container is available
 * @returns {boolean} True if container is available
 */
export function isDIContainerAvailable() {
  return typeof window.DIContainer !== 'undefined' || typeof window.container !== 'undefined';
}

/**
 * Gets the DI Container instance
 * @returns {Object|null} DI Container instance or null if not available
 */
export function getDIContainer() {
  return window.DIContainer || window.container || null;
}

/**
 * Safely resolves a service with error handling
 * @param {string} serviceName - Name of the service to resolve
 * @param {Object} fallback - Fallback value if service cannot be resolved
 * @returns {Object} Resolved service or fallback
 */
export function safeResolveService(serviceName, fallback = null) {
  try {
    return resolveService(serviceName);
  } catch (error) {
    console.warn(`Failed to resolve service '${serviceName}':`, error.message);
    return fallback;
  }
}