import { logError, logWarning } from './errorHandler.js';
import Logger from './logger.js';

class SimpleCache {
  static cache = new Map();
  static prefix = 'mtb_';
  static stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    removes: 0
  };

  static set(key, data, ttl = 300000) {
    const expires = Date.now() + ttl;
    const cacheItem = { 
      data, 
      expires, 
      created: Date.now(),
      accessed: Date.now(),
      accessCount: 0
    };
    
    this.cache.set(key, cacheItem);
    this.stats.sets++;
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(cacheItem));
    } catch (error) {
      Logger.debug('SimpleCache: localStorage write failed', error);
    }
  }

  static get(key) {
    let item = this.cache.get(key);
    
    // Try localStorage if not in memory
    if (!item) {
      try {
        const stored = localStorage.getItem(this.prefix + key);
        if (stored) {
          item = JSON.parse(stored);
        }
      } catch (error) {
        Logger.debug('SimpleCache: localStorage read failed', error);
      }
    }
    
    // Check if item exists and is not expired
    if (!item || Date.now() > item.expires) {
      this.remove(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access statistics
    item.accessed = Date.now();
    item.accessCount = (item.accessCount || 0) + 1;
    
    // Update memory cache
    this.cache.set(key, item);
    this.stats.hits++;
    
    return item.data;
  }

  static remove(key) {
    this.cache.delete(key);
    this.stats.removes++;
    
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      Logger.debug('SimpleCache: localStorage remove failed', error);
    }
  }

  static clear() {
    this.cache.clear();
    
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefix))
        .forEach(k => localStorage.removeItem(k));
    } catch (error) {
      Logger.debug('SimpleCache: localStorage clear failed', error);
    }
    
    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      removes: 0
    };
  }

  static getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      cacheSize: this.cache.size,
      memoryKeys: Array.from(this.cache.keys())
    };
  }

  static getCacheInfo(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    return {
      key,
      created: new Date(item.created).toISOString(),
      accessed: new Date(item.accessed).toISOString(),
      expires: new Date(item.expires).toISOString(),
      accessCount: item.accessCount,
      timeToExpire: Math.max(0, item.expires - Date.now()),
      isExpired: Date.now() > item.expires
    };
  }

  static cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.remove(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

export default SimpleCache;