/**
 * Sync Configuration - Easy setup for data synchronization improvements
 * This file centralizes all sync-related settings and provides easy toggles
 */

// Import the enhanced constants
import { SYNC_CONFIG, CACHE_CONFIG } from './constants.js';
import Logger from '../utils/logger.js';

/**
 * Main configuration object for sync system
 */
export const SyncSystemConfig = {
  // Enable/disable the entire sync system
  enabled: true,
  
  // Sync behavior settings
  sync: {
    ...SYNC_CONFIG,
    // Override specific settings if needed
    BACKGROUND_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
    AUTO_UPDATE_ENABLED: true,
    IMMEDIATE_LOAD: true
  },
  
  // Cache settings
  cache: {
    ...CACHE_CONFIG,
    // Enhanced cache settings
    ENABLE_STATISTICS: true,
    AUTO_CLEANUP: true,
    CLEANUP_INTERVAL: 10 * 60 * 1000 // 10 minutes
  },
  
  // Development tools
  development: {
    ENABLE_MONITOR: true,
    ENABLE_CONSOLE_COMMANDS: true,
    LOG_SYNC_EVENTS: true,
    SHOW_CACHE_STATS: false
  },
  
  // Performance settings
  performance: {
    MAX_CONCURRENT_SYNCS: 3,
    SYNC_TIMEOUT: 30000, // 30 seconds
    CACHE_PRELOAD: true
  }
};

/**
 * Quick setup presets for different environments
 */
export const SyncPresets = {
  // Production environment - optimized for performance
  production: {
    ...SyncSystemConfig,
    development: {
      ENABLE_MONITOR: false,
      ENABLE_CONSOLE_COMMANDS: false,
      LOG_SYNC_EVENTS: false,
      SHOW_CACHE_STATS: false
    },
    sync: {
      ...SyncSystemConfig.sync,
      BACKGROUND_SYNC_INTERVAL: 10 * 60 * 1000, // 10 minutes
      MAX_SYNC_RETRIES: 2
    }
  },
  
  // Development environment - full monitoring
  development: {
    ...SyncSystemConfig,
    development: {
      ENABLE_MONITOR: true,
      ENABLE_CONSOLE_COMMANDS: true,
      LOG_SYNC_EVENTS: true,
      SHOW_CACHE_STATS: true
    },
    sync: {
      ...SyncSystemConfig.sync,
      BACKGROUND_SYNC_INTERVAL: 2 * 60 * 1000, // 2 minutes for faster testing
      MAX_SYNC_RETRIES: 5
    }
  },
  
  // Testing environment - minimal sync
  testing: {
    ...SyncSystemConfig,
    enabled: false,
    sync: {
      ...SyncSystemConfig.sync,
      AUTO_UPDATE_ENABLED: false,
      IMMEDIATE_LOAD: true
    },
    development: {
      ENABLE_MONITOR: false,
      ENABLE_CONSOLE_COMMANDS: false,
      LOG_SYNC_EVENTS: false,
      SHOW_CACHE_STATS: false
    }
  }
};

/**
 * Get configuration for current environment
 * @param {string} environment - 'production', 'development', or 'testing'
 * @returns {Object} Configuration object
 */
export function getConfigForEnvironment(environment = 'development') {
  return SyncPresets[environment] || SyncPresets.development;
}

/**
 * Validate sync configuration
 * @param {Object} config - Configuration to validate
 * @returns {boolean} True if valid
 */
export function validateSyncConfig(config) {
  const required = ['enabled', 'sync', 'cache', 'development', 'performance'];
  
  for (const key of required) {
    if (!(key in config)) {
      Logger.error(`Missing required config key: ${key}`);
      return false;
    }
  }
  
  // Validate sync intervals
  if (config.sync.BACKGROUND_SYNC_INTERVAL < 30000) {
    Logger.warn('Background sync interval is very short (<30s), this may impact performance');
  }
  
  return true;
}

/**
 * Apply configuration to the system
 * @param {Object} config - Configuration to apply
 */
export function applySyncConfig(config) {
  if (!validateSyncConfig(config)) {
    throw new Error('Invalid sync configuration');
  }
  
  // Store in global scope for access by other modules
  if (typeof window !== 'undefined') {
    window.SYNC_SYSTEM_CONFIG = config;
  }
  
  Logger.info('Sync configuration applied:', {
    enabled: config.enabled,
    autoUpdate: config.sync.AUTO_UPDATE_ENABLED,
    syncInterval: `${config.sync.BACKGROUND_SYNC_INTERVAL / 1000}s`,
    monitor: config.development.ENABLE_MONITOR
  });
}

// Auto-apply development config if in browser
if (typeof window !== 'undefined' && !window.SYNC_SYSTEM_CONFIG) {
  const env = process?.env?.NODE_ENV || 'development';
  applySyncConfig(getConfigForEnvironment(env));
}

export default SyncSystemConfig;