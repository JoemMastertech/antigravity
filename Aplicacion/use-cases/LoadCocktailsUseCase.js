import Logger from '../../Shared/utils/logger.js';
import ErrorHandler from '../../Shared/utils/errorHandler.js';
import SimpleCache from '../../Shared/utils/simpleCache.js';
import { CACHE_KEYS, CACHE_CONFIG } from '../../Shared/config/constants.js';

class LoadCocktailsUseCase {
  constructor(cocktailRepository, options = {}) {
    this.repository = cocktailRepository;
    this.cacheTime = options.cacheTime || CACHE_CONFIG.DEFAULT_TTL;
    this.enableCache = options.enableCache !== false;
    this.cache = { data: null, timestamp: 0 };
    this.loading = false;
  }
  
  async execute(forceRefresh = false) {
    const now = Date.now();
    
    // Return cache if valid and not forcing refresh
    if (!forceRefresh && this.enableCache && this._isCacheValid(now)) {
      Logger.debug('Using cache');
      return this.cache.data;
    }
    
    // Prevent concurrent requests
    if (this.loading) {
      while (this.loading) await new Promise(r => setTimeout(r, 50));
      return this.cache.data || [];
    }
    
    this.loading = true;
    
    try {
      const [error, cocktails] = await ErrorHandler.handleAsync(
        this.repository.getAllCocktails(),
        'LoadCocktailsUseCase'
      );
      
      if (error) {
        Logger.warn('Repository error, using cache fallback');
        return this.cache.data || [];
      }
      
      // Update cache
      if (this.enableCache) {
        this.cache = { data: cocktails, timestamp: now };
        SimpleCache.set(CACHE_KEYS.COCKTAILS, cocktails, this.cacheTime);
      }
      
      Logger.info(`Loaded ${cocktails?.length || 0} cocktails`);
      return cocktails;
    } finally {
      this.loading = false;
    }
  }
  
  clearCache() {
    this.cache = { data: null, timestamp: 0 };
    SimpleCache.remove(CACHE_KEYS.COCKTAILS);
  }
  
  _isCacheValid(now = Date.now()) {
    return this.cache.data && (now - this.cache.timestamp) < this.cacheTime;
  }
}

export default LoadCocktailsUseCase;