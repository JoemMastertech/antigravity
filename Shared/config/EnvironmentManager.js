import { logError, logWarning } from '../utils/errorHandler.js';
import { DEBUG } from './constants.js';
import Logger from '../utils/logger.js';

class ConfigValidator {
  constructor() {
    this.schemas = new Map();
    this.validationRules = new Map();
  }

  registerSchema(schemaName, schema) {
    this.schemas.set(schemaName, {
      properties: {},
      required: [],
      strict: false,
      ...schema
    });
  }

  validate(config, schemaName) {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      return { valid: false, errors: [`Schema not found: ${schemaName}`] };
    }

    const errors = [];
    const warnings = [];

    for (const prop of schema.required) {
      if (!(prop in config)) {
        errors.push(`Missing required property: ${prop}`);
      }
    }

    for (const [prop, value] of Object.entries(config)) {
      const propSchema = schema.properties[prop];
      
      if (!propSchema) {
        if (schema.strict) {
          errors.push(`Unknown property: ${prop}`);
        } else {
          warnings.push(`Unknown property: ${prop}`);
        }
        continue;
      }

      const validation = this.validateProperty(value, propSchema, prop);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateProperty(value, propSchema, propName) {
    const errors = [];
    const warnings = [];

    if (propSchema.type && typeof value !== propSchema.type) {
      errors.push(`Property ${propName} must be of type ${propSchema.type}`);
    }

    if (propSchema.enum && !propSchema.enum.includes(value)) {
      errors.push(`Property ${propName} must be one of: ${propSchema.enum.join(', ')}`);
    }

    if (typeof value === 'number') {
      if (propSchema.min !== undefined && value < propSchema.min) {
        errors.push(`Property ${propName} must be >= ${propSchema.min}`);
      }
      if (propSchema.max !== undefined && value > propSchema.max) {
        errors.push(`Property ${propName} must be <= ${propSchema.max}`);
      }
    }

    if (typeof value === 'string') {
      if (propSchema.minLength && value.length < propSchema.minLength) {
        errors.push(`Property ${propName} must be at least ${propSchema.minLength} characters`);
      }
      if (propSchema.maxLength && value.length > propSchema.maxLength) {
        errors.push(`Property ${propName} must be at most ${propSchema.maxLength} characters`);
      }
      if (propSchema.pattern && !new RegExp(propSchema.pattern).test(value)) {
        errors.push(`Property ${propName} does not match required pattern`);
      }
    }

    if (propSchema.validate && typeof propSchema.validate === 'function') {
      try {
        const result = propSchema.validate(value);
        if (result !== true) {
          errors.push(`Property ${propName} validation failed: ${result}`);
        }
      } catch (error) {
        errors.push(`Property ${propName} validation error: ${error.message}`);
      }
    }

    return { errors, warnings };
  }
}

class FeatureFlagManager {
  constructor() {
    this.flags = new Map();
    this.overrides = new Map();
    this.experiments = new Map();
  }

  registerFlag(flagName, flagConfig) {
    this.flags.set(flagName, {
      defaultValue: false,
      description: '',
      environments: {},
      experiment: null,
      ...flagConfig
    });
  }

  isEnabled(flagName, environment = null, userId = null) {
    if (this.overrides.has(flagName)) {
      return this.overrides.get(flagName);
    }

    const flag = this.flags.get(flagName);
    if (!flag) {
      logWarning(`Feature flag not found: ${flagName}`);
      return false;
    }

    if (flag.experiment && userId) {
      const experimentValue = this.getExperimentValue(flagName, userId, flag.experiment);
      if (experimentValue !== null) {
        return experimentValue;
      }
    }

    if (environment && flag.environments[environment] !== undefined) {
      return flag.environments[environment];
    }

    return flag.defaultValue;
  }

  setOverride(flagName, value) {
    this.overrides.set(flagName, value);
  }

  removeOverride(flagName) {
    this.overrides.delete(flagName);
  }

  getExperimentValue(flagName, userId, experiment) {
    try {
      const hash = this.hashString(`${flagName}_${userId}`);
      const bucket = hash % 100;
      
      if (bucket < experiment.percentage) {
        return experiment.value;
      }
      
      return null;
    } catch (error) {
      logError(`Error in experiment for flag ${flagName}`, error);
      return null;
    }
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getAllFlags(environment = null, userId = null) {
    const result = {};
    
    for (const [flagName] of this.flags) {
      result[flagName] = this.isEnabled(flagName, environment, userId);
    }
    
    return result;
  }

  getStats() {
    return {
      totalFlags: this.flags.size,
      overrides: this.overrides.size,
      experiments: Array.from(this.flags.values()).filter(f => f.experiment).length,
      flags: Array.from(this.flags.entries()).map(([name, config]) => ({
        name,
        defaultValue: config.defaultValue,
        hasExperiment: !!config.experiment,
        hasOverride: this.overrides.has(name)
      }))
    };
  }
}

export class EnvironmentManager {
  constructor(options = {}) {
    this.config = {
      defaultEnvironment: 'development',
      autoDetect: true,
      persistConfig: true,
      configKey: 'app_config',
      validateConfig: true,
      ...options
    };

    this.currentEnvironment = null;
    this.configurations = new Map();
    this.validator = new ConfigValidator();
    this.featureFlags = new FeatureFlagManager();
    this.watchers = new Set();
    this.isDebugMode = DEBUG.ENABLE_CONSOLE_LOGS;

    this.initializeDefaultSchemas();
    this.detectEnvironment();
  }

  initializeDefaultSchemas() {
    this.validator.registerSchema('api', {
      properties: {
        baseUrl: { type: 'string', pattern: '^https?://' },
        timeout: { type: 'number', min: 1000, max: 60000 },
        retries: { type: 'number', min: 0, max: 5 },
        apiKey: { type: 'string', minLength: 10 },
        enableMocking: { type: 'boolean' }
      },
      required: ['baseUrl'],
      strict: false
    });

    this.validator.registerSchema('database', {
      properties: {
        host: { type: 'string' },
        port: { type: 'number', min: 1, max: 65535 },
        database: { type: 'string', minLength: 1 },
        ssl: { type: 'boolean' },
        poolSize: { type: 'number', min: 1, max: 100 }
      },
      required: ['host', 'database'],
      strict: true
    });

    this.validator.registerSchema('ui', {
      properties: {
        theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
        language: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
        animations: { type: 'boolean' },
        debugMode: { type: 'boolean' },
        showPerformanceMetrics: { type: 'boolean' }
      },
      required: [],
      strict: false
    });
  }

  detectEnvironment() {
    if (!this.config.autoDetect) {
      this.currentEnvironment = this.config.defaultEnvironment;
      return;
    }

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
        this.currentEnvironment = 'development';
      } else if (hostname.includes('staging') || hostname.includes('test')) {
        this.currentEnvironment = 'staging';
      } else {
        this.currentEnvironment = 'production';
      }
    } else {
      this.currentEnvironment = process.env.NODE_ENV || this.config.defaultEnvironment;
    }

    if (this.isDebugMode) {
      Logger.info(`Environment detected: ${this.currentEnvironment}`);
    }
  }

  registerConfig(environment, config, options = {}) {
    try {
      const opts = {
        validate: this.config.validateConfig,
        merge: true,
        ...options
      };

      let finalConfig = config;

      if (opts.merge && this.configurations.has(environment)) {
        const existingConfig = this.configurations.get(environment);
        finalConfig = this.deepMerge(existingConfig, config);
      }

      if (opts.validate) {
        const validation = this.validateConfiguration(finalConfig);
        if (!validation.valid) {
          logError(`Configuration validation failed for ${environment}:`, validation.errors);
          return false;
        }
        
        if (validation.warnings.length > 0) {
          logWarning(`Configuration warnings for ${environment}:`, validation.warnings);
        }
      }

      this.configurations.set(environment, finalConfig);
      
      if (this.config.persistConfig) {
        this.persistConfiguration(environment, finalConfig);
      }

      this.notifyWatchers('configRegistered', { environment, config: finalConfig });

      if (this.isDebugMode) {
        Logger.info(`Configuration registered for ${environment}`);
      }

      return true;
    } catch (error) {
      logError(`Error registering configuration for ${environment}`, error);
      return false;
    }
  }

  getConfig(environment = null, path = null) {
    const env = environment || this.currentEnvironment;
    const config = this.configurations.get(env);

    if (!config) {
      logWarning(`No configuration found for environment: ${env}`);
      return null;
    }

    if (!path) {
      return config;
    }

    return this.getNestedValue(config, path);
  }

  setConfig(path, value, environment = null) {
    try {
      const env = environment || this.currentEnvironment;
      let config = this.configurations.get(env) || {};

      config = this.setNestedValue(config, path, value);
      this.configurations.set(env, config);

      if (this.config.persistConfig) {
        this.persistConfiguration(env, config);
      }

      this.notifyWatchers('configChanged', { environment: env, path, value });

      return true;
    } catch (error) {
      logError(`Error setting configuration ${path}`, error);
      return false;
    }
  }

  switchEnvironment(environment) {
    try {
      if (!this.configurations.has(environment)) {
        logWarning(`No configuration found for environment: ${environment}`);
        return false;
      }

      const previousEnvironment = this.currentEnvironment;
      this.currentEnvironment = environment;

      this.notifyWatchers('environmentChanged', {
        previous: previousEnvironment,
        current: environment
      });

      if (this.isDebugMode) {
        Logger.info(`Environment switched from ${previousEnvironment} to ${environment}`);
      }

      return true;
    } catch (error) {
      logError(`Error switching to environment ${environment}`, error);
      return false;
    }
  }

  registerFeatureFlag(flagName, flagConfig) {
    try {
      this.featureFlags.registerFlag(flagName, flagConfig);
      
      if (this.isDebugMode) {
        Logger.info(`Feature flag registered: ${flagName}`);
      }
      
      return true;
    } catch (error) {
      logError(`Error registering feature flag ${flagName}`, error);
      return false;
    }
  }

  isFeatureEnabled(flagName, userId = null) {
    return this.featureFlags.isEnabled(flagName, this.currentEnvironment, userId);
  }

  watch(callback) {
    this.watchers.add(callback);
    
    return () => {
      this.watchers.delete(callback);
    };
  }

  validateConfiguration(config) {
    const allErrors = [];
    const allWarnings = [];

    for (const [section, sectionConfig] of Object.entries(config)) {
      if (this.validator.schemas.has(section)) {
        const validation = this.validator.validate(sectionConfig, section);
        allErrors.push(...validation.errors.map(e => `${section}: ${e}`));
        allWarnings.push(...validation.warnings.map(w => `${section}: ${w}`));
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  getStats() {
    return {
      currentEnvironment: this.currentEnvironment,
      totalEnvironments: this.configurations.size,
      environments: Array.from(this.configurations.keys()),
      featureFlags: this.featureFlags.getStats(),
      watchers: this.watchers.size,
      config: this.config
    };
  }

  exportConfig(environments = null) {
    const envs = environments || Array.from(this.configurations.keys());
    const exported = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environments: {},
      featureFlags: {}
    };

    for (const env of envs) {
      if (this.configurations.has(env)) {
        exported.environments[env] = this.configurations.get(env);
      }
    }

    for (const [flagName, flagConfig] of this.featureFlags.flags) {
      exported.featureFlags[flagName] = flagConfig;
    }

    return exported;
  }

  importConfig(configData, options = {}) {
    try {
      const opts = {
        overwrite: false,
        validate: true,
        ...options
      };

      if (configData.environments) {
        for (const [env, config] of Object.entries(configData.environments)) {
          if (!opts.overwrite && this.configurations.has(env)) {
            continue;
          }
          
          this.registerConfig(env, config, { validate: opts.validate });
        }
      }

      if (configData.featureFlags) {
        for (const [flagName, flagConfig] of Object.entries(configData.featureFlags)) {
          this.registerFeatureFlag(flagName, flagConfig);
        }
      }

      if (this.isDebugMode) {
        Logger.info('Configuration imported successfully');
      }

      return true;
    } catch (error) {
      logError('Error importing configuration', error);
      return false;
    }
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.deepMerge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
    return obj;
  }

  persistConfiguration(environment, config) {
    try {
      if (typeof localStorage !== 'undefined') {
        const key = `${this.config.configKey}_${environment}`;
        localStorage.setItem(key, JSON.stringify(config));
      }
    } catch (error) {
      logWarning('Failed to persist configuration', error);
    }
  }

  notifyWatchers(event, data) {
    for (const callback of this.watchers) {
      try {
        callback(event, data);
      } catch (error) {
        logError('Error in configuration watcher', error);
      }
    }
  }
}

const globalEnvironmentManager = new EnvironmentManager();

export const getConfig = globalEnvironmentManager.getConfig.bind(globalEnvironmentManager);
export const setConfig = globalEnvironmentManager.setConfig.bind(globalEnvironmentManager);
export const registerConfig = globalEnvironmentManager.registerConfig.bind(globalEnvironmentManager);
export const switchEnvironment = globalEnvironmentManager.switchEnvironment.bind(globalEnvironmentManager);
export const registerFeatureFlag = globalEnvironmentManager.registerFeatureFlag.bind(globalEnvironmentManager);
export const isFeatureEnabled = globalEnvironmentManager.isFeatureEnabled.bind(globalEnvironmentManager);
export const watch = globalEnvironmentManager.watch.bind(globalEnvironmentManager);
export const getEnvironmentStats = globalEnvironmentManager.getStats.bind(globalEnvironmentManager);

export default globalEnvironmentManager;