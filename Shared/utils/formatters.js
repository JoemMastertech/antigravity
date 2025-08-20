/**
 * Formatters - Utilidades unificadas de formateo
 * Centraliza todo el formateo disperso en múltiples archivos
 * Parte del Plan de Mejora - Fase 1: Unificación y Simplificación
 */

/**
 * Formatea precios de manera consistente
 * @param {string|number} price - Precio a formatear
 * @param {string} presentation - Tipo de presentación (individual, jarra, botella, copa, litro)
 * @returns {string} Precio formateado
 */
export const formatPrice = (price, presentation = 'individual') => {
  // Limpiar precio si viene como string con '$'
  const cleanPrice = typeof price === 'string' ? price.replace('$', '') : price;
  const numericPrice = parseFloat(cleanPrice);
  
  if (isNaN(numericPrice)) return '$0.00';
  
  const basePrice = `$${numericPrice.toFixed(2)}`;
  
  const presentations = {
    individual: basePrice,
    jarra: `${basePrice} (Jarra)`,
    botella: `${basePrice} (Botella)`,
    copa: `${basePrice} (Copa)`,
    litro: `${basePrice} (Litro)`
  };
  
  return presentations[presentation] || basePrice;
};

/**
 * Formatea lista de ingredientes de manera consistente
 * @param {string|Array} ingredients - Ingredientes a formatear
 * @returns {string} Ingredientes formateados
 */
export const formatIngredients = (ingredients) => {
  if (!ingredients) return '';
  
  if (Array.isArray(ingredients)) {
    return ingredients.join(', ');
  }
  
  if (typeof ingredients === 'string') {
    return ingredients.trim();
  }
  
  return '';
};

/**
 * Formatea nombres de productos de manera consistente
 * @param {string} name - Nombre a formatear
 * @returns {string} Nombre formateado
 */
export const formatProductName = (name) => {
  if (!name || typeof name !== 'string') return '';
  
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

/**
 * Formatea texto para capitalización de títulos
 * @param {string} text - Texto a formatear
 * @returns {string} Texto con capitalización de título
 */
export const formatTitle = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Limpia y formatea texto general
 * @param {string} text - Texto a limpiar
 * @returns {string} Texto limpio
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * Formatea números de manera consistente
 * @param {number} num - Número a formatear
 * @param {number} decimals - Número de decimales (default: 2)
 * @returns {string} Número formateado
 */
export const formatNumber = (num, decimals = 2) => {
  if (isNaN(num)) return '0';
  
  return parseFloat(num).toFixed(decimals);
};

// Exportación por defecto con todas las funciones
export default {
  formatPrice,
  formatIngredients,
  formatProductName,
  formatTitle,
  cleanText,
  formatNumber
};