/**
 * Dependency Injection Container for Hexagonal Architecture
 * Manages service registration, resolution, and lifecycle
 * Provides singleton support and circular dependency detection
 */
class DIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.resolving = new Set();
  }

  /**
   * Register a service with factory function
   * @param {string} name - Service identifier
   * @param {Function} factory - Factory function that creates the service
   * @param {Object} options - Registration options
   */
  register(name, factory, options = {}) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('Service name must be a non-empty string');
    }

    if (typeof factory !== 'function') {
      throw new Error('Factory must be a function');
    }

    this.services.set(name, {
      factory,
      singleton: options.singleton || false,
      dependencies: options.dependencies || []
    });

    return this; // Enable fluent interface
  }

  /**
   * Register a singleton service
   * @param {string} name - Service identifier
   * @param {Function} factory - Factory function
   * @param {Array} dependencies - Service dependencies
   */
  singleton(name, factory, dependencies = []) {
    return this.register(name, factory, { singleton: true, dependencies });
  }

  /**
   * Resolve a service by name
   * @param {string} name - Service identifier
   * @returns {*} The resolved service instance
   */
  resolve(name) {
    // Check for circular dependencies
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected: ${[...this.resolving, name].join(' -> ')}`);
    }

    // Return singleton if already created
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Get service registration
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found. Available services: ${[...this.services.keys()].join(', ')}`);
    }

    try {
      // Mark as resolving for circular dependency detection
      this.resolving.add(name);

      // Resolve dependencies
      const dependencies = service.dependencies.map(dep => this.resolve(dep));

      // Create instance
      const instance = service.factory(...dependencies);

      // Store singleton if needed
      if (service.singleton) {
        this.singletons.set(name, instance);
      }

      return instance;
    } catch (error) {
      throw new Error(`Failed to resolve '${name}': ${error.message}`);
    } finally {
      // Clean up resolving state
      this.resolving.delete(name);
    }
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service identifier
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Clear all services and singletons
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.resolving.clear();
  }

  /**
   * Get list of registered service names
   * @returns {Array<string>}
   */
  getRegisteredServices() {
    return [...this.services.keys()];
  }

  /**
   * Validate all registered services can be resolved
   * @returns {Object} Validation result with success flag and errors
   */
  validate() {
    const errors = [];
    const services = [...this.services.keys()];

    for (const serviceName of services) {
      try {
        // Create a temporary container to test resolution
        const testContainer = new DIContainer();
        
        // Copy all service registrations
        for (const [name, config] of this.services) {
          testContainer.services.set(name, config);
        }

        testContainer.resolve(serviceName);
      } catch (error) {
        errors.push(`${serviceName}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }
}

export default DIContainer;