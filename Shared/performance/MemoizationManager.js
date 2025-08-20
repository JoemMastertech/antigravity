/**
 * Simplified cache implementation with TTL support
 */
class SimpleCache {
  constructor(maxSize = 100, defaultTTL = 300000) { // 5 minutes
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item || (item.expires && Date.now() > item.expires)) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Simple LRU: remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expires: ttl ? Date.now() + ttl : null
    });
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Simplified memoization manager
 */
export class MemoizationManager {
  constructor(defaultTTL = 300000) {
    this.defaultTTL = defaultTTL;
    this.caches = new Map();
  }

  /**
   * Memoize a function with automatic caching
   * @param {string} key - Cache namespace
   * @param {Function} fn - Function to memoize
   * @param {number} ttl - Time to live (optional)
   * @returns {Function} Memoized function
   */
  memoize(key, fn, ttl = this.defaultTTL) {
    if (!this.caches.has(key)) {
      this.caches.set(key, new SimpleCache(100, ttl));
    }
    
    const cache = this.caches.get(key);
    
    return (...args) => {
      const cacheKey = JSON.stringify(args);
      const cached = cache.get(cacheKey);
      
      if (cached !== null) return cached;
      
      const result = fn(...args);
      cache.set(cacheKey, result, ttl);
      return result;
    };
  }

  /**
   * Store value in cache
   * @param {string} namespace - Cache namespace
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live
   */
  set(namespace, key, value, ttl = this.defaultTTL) {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new SimpleCache());
    }
    this.caches.get(namespace).set(key, value, ttl);
  }

  /**
   * Get value from cache
   * @param {string} namespace - Cache namespace
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  get(namespace, key) {
    return this.caches.get(namespace)?.get(key) || null;
  }

  /**
   * Clear specific cache namespace
   * @param {string} namespace - Cache namespace to clear
   */
  clear(namespace) {
    this.caches.get(namespace)?.clear();
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.caches.forEach(cache => cache.clear());
  }
}

// Global instance for convenience
const globalManager = new MemoizationManager();

// Simplified exports
export const memoize = (key, fn, ttl) => globalManager.memoize(key, fn, ttl);
export const cache = (namespace, key, value, ttl) => globalManager.set(namespace, key, value, ttl);
export const get = (namespace, key) => globalManager.get(namespace, key);
export const clearCache = (namespace) => globalManager.clear(namespace);
export const clearAllCaches = () => globalManager.clearAll();

export default globalManager;