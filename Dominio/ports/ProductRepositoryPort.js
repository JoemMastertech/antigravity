/**
 * Product Repository Port - Interface for product data access
 * Defines the contract for product repository implementations
 * Part of Hexagonal Architecture - Domain layer port
 */
class ProductRepositoryPort {
  /**
   * Get all cocktails
   * @returns {Array} Array of cocktail objects
   */
  getCocteles() {
    throw new Error('getCocteles method must be implemented');
  }

  /**
   * Get all beverages (refrescos)
   * @returns {Array} Array of beverage objects
   */
  getRefrescos() {
    throw new Error('getRefrescos method must be implemented');
  }

  /**
   * Get all liquors
   * @returns {Array} Array of liquor objects
   */
  getLicores() {
    throw new Error('getLicores method must be implemented');
  }

  /**
   * Get all beers
   * @returns {Array} Array of beer objects
   */
  getCervezas() {
    throw new Error('getCervezas method must be implemented');
  }

  /**
   * Get all pizzas
   * @returns {Array} Array of pizza objects
   */
  getPizzas() {
    throw new Error('getPizzas method must be implemented');
  }

  /**
   * Get all wings (alitas)
   * @returns {Array} Array of wing objects
   */
  getAlitas() {
    throw new Error('getAlitas method must be implemented');
  }

  /**
   * Get all soups
   * @returns {Array} Array of soup objects
   */
  getSopas() {
    throw new Error('getSopas method must be implemented');
  }

  /**
   * Get all salads
   * @returns {Array} Array of salad objects
   */
  getEnsaladas() {
    throw new Error('getEnsaladas method must be implemented');
  }

  /**
   * Get all meats
   * @returns {Array} Array of meat objects
   */
  getCarnes() {
    throw new Error('getCarnes method must be implemented');
  }

  /**
   * Get all coffee products
   * @returns {Array} Array of coffee objects
   */
  getCafe() {
    throw new Error('getCafe method must be implemented');
  }

  /**
   * Get all desserts
   * @returns {Array} Array of dessert objects
   */
  getPostres() {
    throw new Error('getPostres method must be implemented');
  }

  /**
   * Get product by ID
   * @param {string} id - Product identifier
   * @returns {Object|null} Product object or null if not found
   */
  getProductById(id) {
    throw new Error('getProductById method must be implemented');
  }

  /**
   * Get products by category
   * @param {string} category - Product category
   * @returns {Array} Array of products in the category
   */
  getProductsByCategory(category) {
    throw new Error('getProductsByCategory method must be implemented');
  }

  /**
   * Search products by name or ingredients
   * @param {string} query - Search query
   * @returns {Array} Array of matching products
   */
  searchProducts(query) {
    throw new Error('searchProducts method must be implemented');
  }
}

export default ProductRepositoryPort;