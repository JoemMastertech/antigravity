import Validator from '../../Shared/utils/validator.js';
import { formatPrice } from '../../Shared/utils/formatters.js';

class OrderSystemCore {
  constructor() {
    this.items = [];
    this.idCounter = 0;
  }

  addProduct(itemData) {
    // Validar usando el validator unificado
    const validation = Validator.validateProduct(itemData);
    Validator.throwIfInvalid(validation, 'Producto en orden');
    
    const newItem = {
      ...itemData,
      id: this.generateUniqueId(),
      addedAt: new Date().toISOString(),
      price: parseFloat(itemData.price) || 0
    };
    this.items.push(newItem);
    return newItem;
  }

  /**
   * Generate unique ID for order items
   * @returns {string} Unique identifier
   */
  generateUniqueId() {
    this.idCounter++;
    return `order_${Date.now()}_${this.idCounter}`;
  }

  removeItem(itemId) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== itemId);
    
    return this.items.length < initialLength; // Return true if item was removed
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  getItems() {
    return [...this.items]; // Return a copy to prevent direct manipulation
  }

  getItemCount() {
    return this.items.length;
  }

  findItemById(itemId) {
    return this.items.find(item => item.id === itemId) || null;
  }

  clearItems() {
    const clearedCount = this.items.length;
    this.items = [];
    this.idCounter = 0; // Reset counter
    return clearedCount;
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

export default OrderSystemCore;