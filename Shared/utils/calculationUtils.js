/**
 * Simplified calculation utilities for drink counts and pricing
 * Centralized business logic with reduced complexity
 */

// Drink categories for easy maintenance
const DRINK_CATEGORIES = ['cocteleria', 'refrescos', 'licores', 'cervezas'];

/**
 * Calculate total drink count from order items
 * @param {Array} items - Order items array
 * @returns {number} Total drink count
 */
export function calculateTotalDrinkCount(items) {
  if (!Array.isArray(items)) return 0;
  
  return items.reduce((total, item) => {
    return item?.category && DRINK_CATEGORIES.includes(item.category) 
      ? total + (item.quantity || 0) 
      : total;
  }, 0);
}

/**
 * Calculate total juice count from order items
 * @param {Array} items - Order items array
 * @returns {number} Total juice count
 */
export function calculateTotalJuiceCount(items) {
  if (!Array.isArray(items)) return 0;
  
  return items.reduce((total, item) => {
    const hasJuice = item?.selectedOptions?.some?.(option => isJuiceOption(option));
    return hasJuice ? total + (item.quantity || 0) : total;
  }, 0);
}

/**
 * Calculate total Jäger drink count from order items
 * @param {Array} items - Order items array
 * @returns {number} Total Jäger drink count
 */
export function calculateTotalJagerDrinkCount(items) {
  if (!Array.isArray(items)) return 0;
  
  return items.reduce((total, item) => {
    const isJager = item?.name?.toLowerCase().includes('jäger');
    return isJager ? total + (item.quantity || 0) : total;
  }, 0);
}

/**
 * Calculate price for a product with options (simplified)
 * @param {Object} product - Product object
 * @param {Array} selectedOptions - Selected options array
 * @param {number} quantity - Quantity
 * @returns {number} Total price
 */
export function calculatePrice(product, selectedOptions = [], quantity = 1) {
  const basePrice = product?.price || 0;
  const optionPrice = selectedOptions?.reduce((total, option) => total + (option?.price || 0), 0) || 0;
  return (basePrice + optionPrice) * Math.max(1, quantity);
}

/**
 * Calculate total order amount (simplified)
 * @param {Array} items - Order items array
 * @returns {number} Total order amount
 */
export function calculateOrderTotal(items) {
  return items?.reduce((total, item) => total + ((item?.price || 0) * (item?.quantity || 0)), 0) || 0;
}

// Funciones de formateo movidas a formatters.js para unificación

export function isJuiceOption(option) {
  const normalized = option.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  return ['PIÑA', 'UVA', 'NARANJA', 'ARANDANO', 'MANGO', 'DURAZNO', 'JUGO']
    .some(keyword => normalized.includes(keyword));
}

const getIngredientPrice = ingredient => ({
  'extra_cheese': 2.0,
  'extra_bacon': 3.0,
  'extra_sauce': 1.0,
  'premium_meat': 5.0
})[ingredient] || 0;