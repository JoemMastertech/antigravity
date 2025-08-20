import SimpleCache from './simpleCache.js';
import Logger from './logger.js';
import { logError, logWarning } from './errorHandler.js';

/**
 * Sync Monitor - Development tool for monitoring data synchronization
 * Provides console commands and status information for debugging
 */
class SyncMonitor {
  constructor() {
    this.adapter = null;
    this.isEnabled = false;
  }

  /**
   * Initialize monitor with adapter reference
   * @param {Object} adapter - ProductDataAdapter instance
   */
  init(adapter) {
    this.adapter = adapter;
    this.isEnabled = true;
    
    // Expose global functions for console access
    if (typeof window !== 'undefined') {
      window.syncMonitor = {
        status: () => this.getFullStatus(),
        cache: () => this.getCacheStatus(),
        sync: () => this.forceSync(),
        start: () => this.startSync(),
        stop: () => this.stopSync(),
        clear: () => this.clearCache(),
        help: () => this.showHelp()
      };
      
      Logger.info('🔧 SyncMonitor initialized. Type "syncMonitor.help()" for available commands.');
    }
    
    Logger.info('SyncMonitor: Initialized');
  }

  /**
   * Get comprehensive status information
   * @returns {Object} Complete status information
   */
  getFullStatus() {
    if (!this.adapter) {
      return { error: 'Adapter not initialized' };
    }

    const syncStatus = this.adapter.getSyncStatus();
    const cacheStats = SimpleCache.getStats();
    
    const status = {
      timestamp: new Date().toISOString(),
      sync: {
        ...syncStatus,
        nextSyncIn: syncStatus.nextSyncIn ? `${Math.round(syncStatus.nextSyncIn / 1000)}s` : 'N/A'
      },
      cache: cacheStats,
      supabase: {
        url: this.adapter.supabaseUrl ? 'Configured' : 'Not configured',
        key: this.adapter.supabaseKey ? 'Present' : 'Missing'
      }
    };

    console.table({
      'Sync Status': syncStatus.isRunning ? '🟢 Running' : '🔴 Stopped',
      'Last Sync': syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString() : 'Never',
      'Cache Hit Rate': cacheStats.hitRate,
      'Cache Size': cacheStats.cacheSize,
      'Auto Update': syncStatus.autoUpdateEnabled ? '✅ Enabled' : '❌ Disabled'
    });

    return status;
  }

  /**
   * Get detailed cache status
   * @returns {Object} Cache information
   */
  getCacheStatus() {
    const stats = SimpleCache.getStats();
    const keys = stats.memoryKeys;
    
    Logger.info('Cache Statistics:');
    console.table(stats);
    
    if (keys.length > 0) {
      Logger.info('\nCached Items:');
      keys.forEach(key => {
        const info = SimpleCache.getCacheInfo(key);
        if (info) {
          Logger.info(`${key}: ${info.accessCount} accesses, expires in ${Math.round(info.timeToExpire / 1000)}s`);
        }
      });
    }
    
    return stats;
  }

  /**
   * Force immediate synchronization
   */
  async forceSync() {
    if (!this.adapter) {
      Logger.error('Adapter not available');
      return;
    }

    Logger.info('Starting forced synchronization...');
    const startTime = Date.now();
    
    try {
      await this.adapter.forceSyncNow();
      const duration = Date.now() - startTime;
      Logger.info(`Sync completed in ${duration}ms`);
    } catch (error) {
      Logger.error('Sync failed:', error.message);
    }
  }

  /**
   * Start automatic synchronization
   */
  startSync() {
    if (!this.adapter) {
      Logger.error('Adapter not available');
      return;
    }

    this.adapter.startAutoSync();
    Logger.info('▶️ Auto-sync started');
  }

  /**
   * Stop automatic synchronization
   */
  stopSync() {
    if (!this.adapter) {
      Logger.error('Adapter not available');
      return;
    }

    this.adapter.stopAutoSync();
    Logger.info('⏹️ Auto-sync stopped');
  }

  /**
   * Clear all cache data
   */
  clearCache() {
    const beforeSize = SimpleCache.getStats().cacheSize;
    SimpleCache.clear();
    Logger.info(`Cache cleared (${beforeSize} items removed)`);
  }

  /**
   * Show available commands
   */
  showHelp() {
    const commands = {
      'syncMonitor.status()': 'Show complete sync and cache status',
      'syncMonitor.cache()': 'Show detailed cache information',
      'syncMonitor.sync()': 'Force immediate synchronization',
      'syncMonitor.start()': 'Start automatic synchronization',
      'syncMonitor.stop()': 'Stop automatic synchronization',
      'syncMonitor.clear()': 'Clear all cache data',
      'syncMonitor.help()': 'Show this help message'
    };

    Logger.info('Available SyncMonitor Commands:');
    console.table(commands);
    
    Logger.info('\nTips:');
    Logger.info('- Use status() to check if sync is working properly');
    Logger.info('- Use cache() to see cache performance');
    Logger.info('- Use sync() to test immediate data updates');
  }

  /**
   * Log sync event for monitoring
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  logSyncEvent(event, data = {}) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    Logger.debug(`SyncMonitor: ${event}`, { timestamp, ...data });
  }

  /**
   * Disable monitor and clean up
   */
  destroy() {
    this.isEnabled = false;
    this.adapter = null;
    
    if (typeof window !== 'undefined' && window.syncMonitor) {
      delete window.syncMonitor;
    }
    
    Logger.info('SyncMonitor: Destroyed');
  }
}

// Create singleton instance
const syncMonitor = new SyncMonitor();

export default syncMonitor;