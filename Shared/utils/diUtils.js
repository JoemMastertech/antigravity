/**
 * Dependency Injection Utilities - Shared utilities for DI Container access
 * Consolidates duplicated DI functions across the application
 * Part of Phase 3A: Common Logic Extraction
 */

import { logError, logWarning } from './errorHandler.js';
import Logger from './logger.js';

/**
 * Gets the ProductRepository from DI Container
 * Consolidates getProductRepository functions from multiple files
 * @returns {Object} Product repository instance
 * @throws {Error} If DIContainer is not initialized
 */
export function getProductRepository() {
  if (typeof window.DIContainer === 'undefined' && typeof window.container === 'undefined') {
    throw new Error('DI Container not initialized. Make sure AppInit.initialize() has been called.');
  }
  
  // Support both naming conventions found in the codebase
  const container = window.DIContainer || window.container;
  return container.resolve('ProductRepository');
}

/**
 * Generic service resolver from DI Container
 * @param {string} serviceName - Name of the service to resolve
 * @returns {Object} Resolved service instance
 * @throws {Error} If DIContainer is not initialized or service not found
 */
export function resolveService(serviceName) {
  if (typeof window.DIContainer === 'undefined' && typeof window.container === 'undefined') {
    throw new Error('DI Container not initialized. Make sure AppInit.initialize() has been called.');
  }
  
  const container = window.DIContainer || window.container;
  return container.resolve(serviceName);
}

/**
 * Checks if DI Container is available
 * @returns {boolean} True if container is available
 */
export function isDIContainerAvailable() {
  return typeof window.DIContainer !== 'undefined' || typeof window.container !== 'undefined';
}

/**
 * Gets the DI Container instance
 * @returns {Object|null} DI Container instance or null if not available
 */
export function getDIContainer() {
  return window.DIContainer || window.container || null;
}

/**
 * Safely resolves a service with error handling
 * @param {string} serviceName - Name of the service to resolve
 * @param {Object} fallback - Fallback value if service cannot be resolved
 * @returns {Object} Resolved service or fallback
 */
export function safeResolveService(serviceName, fallback = null) {
  try {
    return resolveService(serviceName);
  } catch (error) {
    Logger.warn(`Failed to resolve service '${serviceName}':`, error.message);
    return fallback;
  }
}