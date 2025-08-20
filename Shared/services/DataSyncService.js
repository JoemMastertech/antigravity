import { SYNC_CONFIG } from '../config/constants.js';
import Logger from '../utils/logger.js';

/**
 * Data Synchronization Service
 * Manages automatic background synchronization of data from Supabase
 * Ensures fresh data without blocking user interface
 */
class DataSyncService {
  constructor(adapter) {
    this.adapter = adapter;
    this.syncInterval = null;
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncRetries = new Map();
    
    Logger.debug('DataSyncService: Initialized');
  }

  /**
   * Start automatic background synchronization
   */
  startAutoSync() {
    if (this.isRunning) {
      Logger.debug('DataSyncService: Auto-sync already running');
      return;
    }

    if (!SYNC_CONFIG.AUTO_UPDATE_ENABLED) {
      Logger.info('DataSyncService: Auto-sync disabled in configuration');
      return;
    }

    this.isRunning = true;
    this.syncInterval = setInterval(() => {
      this.syncAllCategories();
    }, SYNC_CONFIG.BACKGROUND_SYNC_INTERVAL);

    Logger.info(`DataSyncService: Auto-sync started (interval: ${SYNC_CONFIG.BACKGROUND_SYNC_INTERVAL}ms)`);
    
    // Perform initial sync after a short delay
    setTimeout(() => {
      this.syncAllCategories();
    }, 5000); // 5 seconds delay
  }

  /**
   * Stop automatic background synchronization
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.isRunning = false;
    Logger.info('DataSyncService: Auto-sync stopped');
  }

  /**
   * Synchronize all product categories
   */
  async syncAllCategories() {
    if (!this.adapter) {
      Logger.warn('DataSyncService: No adapter available for sync');
      return;
    }

    const categories = [
      'cocteleria', 'refrescos', 'licores', 'cervezas',
      'pizzas', 'alitas', 'sopas', 'ensaladas', 'carnes',
      'cafe', 'espumosos', 'postres',
      // Liquor subcategories
      'vodka', 'whisky', 'tequila', 'ron', 'brandy', 'cognac',
      'digestivos', 'ginebra', 'mezcal'
    ];

    Logger.debug(`DataSyncService: Starting sync for ${categories.length} categories`);
    this.lastSyncTime = Date.now();

    const syncPromises = categories.map(category => 
      this.syncCategory(category)
    );

    try {
      await Promise.allSettled(syncPromises);
      Logger.info('DataSyncService: Background sync completed');
    } catch (error) {
      Logger.error('DataSyncService: Error during sync', { error: error.message });
    }
  }

  /**
   * Synchronize a specific category with retry logic
   * @param {string} category - Category name to sync
   */
  async syncCategory(category) {
    try {
      if (this.adapter._updateFromSupabaseBackground) {
        await this.adapter._updateFromSupabaseBackground(category);
        // Reset retry count on success
        this.syncRetries.delete(category);
      }
    } catch (error) {
      Logger.debug(`DataSyncService: Sync failed for ${category}`, { error: error.message });
      
      if (SYNC_CONFIG.RETRY_FAILED_SYNC) {
        this.scheduleRetry(category);
      }
    }
  }

  /**
   * Schedule retry for failed sync
   * @param {string} category - Category that failed to sync
   */
  scheduleRetry(category) {
    const retryCount = this.syncRetries.get(category) || 0;
    
    if (retryCount < SYNC_CONFIG.MAX_SYNC_RETRIES) {
      this.syncRetries.set(category, retryCount + 1);
      
      setTimeout(() => {
        Logger.debug(`DataSyncService: Retrying sync for ${category} (attempt ${retryCount + 1})`);
        this.syncCategory(category);
      }, SYNC_CONFIG.SYNC_RETRY_DELAY);
    } else {
      Logger.warn(`DataSyncService: Max retries reached for ${category}`);
      this.syncRetries.delete(category);
    }
  }

  /**
   * Force immediate sync of all categories
   */
  async forceSyncNow() {
    Logger.info('DataSyncService: Force sync requested');
    await this.syncAllCategories();
  }

  /**
   * Get sync status information
   * @returns {Object} Sync status details
   */
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      interval: SYNC_CONFIG.BACKGROUND_SYNC_INTERVAL,
      autoUpdateEnabled: SYNC_CONFIG.AUTO_UPDATE_ENABLED,
      pendingRetries: Array.from(this.syncRetries.keys()),
      nextSyncIn: this.isRunning && this.lastSyncTime ? 
        Math.max(0, (this.lastSyncTime + SYNC_CONFIG.BACKGROUND_SYNC_INTERVAL) - Date.now()) : null
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopAutoSync();
    this.syncRetries.clear();
    this.adapter = null;
    Logger.debug('DataSyncService: Destroyed');
  }
}

export default DataSyncService;