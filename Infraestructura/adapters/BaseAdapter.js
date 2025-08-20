import Logger from '../../Shared/utils/logger.js';
import { ErrorHandler } from '../../Shared/utils/errorHandler.js';
import Validator from '../../Shared/utils/validator.js';

/**
 * Base Adapter - Common functionality for all infrastructure adapters
 * Implements common patterns: error handling, logging, validation
 * Follows YAGNI principle - only includes actually needed functionality
 * Part of Hexagonal Architecture - Infrastructure layer base class
 */
class BaseAdapter {
  constructor() {
    this.adapterName = this.constructor.name;
    Logger.debug(`${this.adapterName}: Initialized`);
  }

  /**
   * Safe method execution with error handling and logging
   * @param {Function} operation - The operation to execute
   * @param {string} methodName - Name of the method for logging
   * @param {*} fallbackValue - Value to return on error (default: [])
   * @returns {*} Operation result or fallback value
   */
  safeExecute(operation, methodName, fallbackValue = []) {
    try {
      const result = operation();
      Logger.debug(`${this.adapterName}.${methodName}: Success`);
      return result;
    } catch (error) {
      ErrorHandler.handle(error, `${this.adapterName}.${methodName}`);
      Logger.error(`${this.adapterName}.${methodName}: Error occurred`, { error: error.message });
      return fallbackValue;
    }
  }

  /**
   * Safe async method execution with error handling and logging
   * @param {Function} asyncOperation - The async operation to execute
   * @param {string} methodName - Name of the method for logging
   * @param {*} fallbackValue - Value to return on error (default: [])
   * @returns {Promise<*>} Operation result or fallback value
   */
  async safeExecuteAsync(asyncOperation, methodName, fallbackValue = []) {
    const [error, result] = await ErrorHandler.handleAsync(
      asyncOperation(),
      `${this.adapterName}.${methodName}`
    );

    if (error) {
      Logger.error(`${this.adapterName}.${methodName}: Async error`, { 
        userMessage: error.userMessage 
      });
      return fallbackValue;
    }

    Logger.debug(`${this.adapterName}.${methodName}: Async success`);
    return result;
  }

  /**
   * Validate text input parameter
   * @param {string} text - Text to validate
   * @param {string} paramName - Parameter name for logging
   * @returns {boolean} True if valid, false otherwise
   */
  validateTextParam(text, paramName) {
    if (!Validator.isValidText(text)) {
      Logger.warn(`${this.adapterName}: Invalid ${paramName} parameter`, { [paramName]: text });
      return false;
    }
    return true;
  }

  /**
   * Get standard categories list
   * @returns {Array} Array of category names
   */
  getStandardCategories() {
    return [
      'cocteles', 'refrescos', 'licores', 'cervezas',
      'pizzas', 'alitas', 'sopas', 'ensaladas', 'carnes',
      'cafes', 'postres'
    ];
  }
}

export default BaseAdapter;