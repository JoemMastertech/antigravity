// Application Constants - Centralized configuration values

export const BUSINESS_RULES = {
  // Drink and order limits
  MAX_DRINK_COUNT: 5,
  MAX_JUICE_COUNT: 10,
  MIN_ORDER_AMOUNT: 0,
  MAX_ORDER_AMOUNT: 10000,
  
  // Jägermeister special rules
  JAGER_MULTIPLIER: 1,
  JAGER_EXCEPTION_DRINKS: ['2 Boost'],
  
  // Stock and inventory
  LOW_STOCK_THRESHOLD: 5,
  OUT_OF_STOCK_THRESHOLD: 0,
  
  // Pricing rules
  DEFAULT_PRICE: 0,
  PRICE_PRECISION: 2
  // CURRENCY_SYMBOL: '$' // Removed - prices now display without currency symbol
};

export const API_ENDPOINTS = {
  COCKTAILS: '/api/cocktails',
  ORDERS: '/api/orders',
  PRODUCTS: '/api/products',
  SPIRITS: '/api/spirits',
  FOOD: '/api/food'
};

export const CACHE_KEYS = {
  COCKTAILS: 'cocktails_cache',
  PRODUCTS: 'products_cache',
  USER_PREFS: 'user_preferences',
  ORDER_HISTORY: 'order_history',
  SPIRITS: 'spirits_cache',
  FOOD: 'food_cache'
};

export const CACHE_CONFIG = {
  DEFAULT_TTL: 300000, // 5 minutos
  LONG_TTL: 3600000,   // 1 hora
  SHORT_TTL: 60000,    // 1 minuto
  USER_PREFS_TTL: 86400000, // 24 horas
  MAX_CACHE_SIZE: 50   // Máximo número de entradas
};

export const SYNC_CONFIG = {
  BACKGROUND_SYNC_INTERVAL: 300000, // 5 minutos
  IMMEDIATE_LOAD: true,
  AUTO_UPDATE_ENABLED: true,
  RETRY_FAILED_SYNC: true,
  MAX_SYNC_RETRIES: 3,
  SYNC_RETRY_DELAY: 30000 // 30 segundos
};

export const UI_TIMING = {
  // Welcome sequence timing
  WELCOME_DURATION: 3000,
  LOGO_DURATION: 3000,
  CATEGORY_DURATION: 2000,
  FADE_DURATION: 1000,
  
  // Modal and interaction timing
  MODAL_FADE_DURATION: 300,
  TOOLTIP_DELAY: 500,
  DEBOUNCE_DELAY: 300,
  
  // Loading and feedback
  LOADING_MIN_DURATION: 500,
  SUCCESS_MESSAGE_DURATION: 2000,
  ERROR_MESSAGE_DURATION: 5000
};

export const PRODUCT_CATEGORIES = {
  // Main categories
  COCKTAILS: 'cocteleria',
  BEVERAGES: 'refrescos',
  LIQUORS: 'licores',
  BEERS: 'cervezas',
  PIZZAS: 'pizzas',
  WINGS: 'alitas',
  SOUPS: 'sopas',
  SALADS: 'ensaladas',
  MEATS: 'carnes',
  COFFEE: 'cafe',
  DESSERTS: 'postres',
  
  // Liquor subcategories
  VODKA: 'VODKA',
  GINEBRA: 'GINEBRA',
  RON: 'RON',
  TEQUILA: 'TEQUILA',
  WHISKY: 'WHISKY',
  BRANDY: 'BRANDY',
  JAGERMEISTER: 'JAGERMEISTER'
};

export const DRINK_TYPES = {
  // Alcoholic drinks
  ALCOHOLIC: 'alcoholic',
  NON_ALCOHOLIC: 'non-alcoholic',
  
  // Juice types
  JUICES: ['Naranja', 'Piña', 'Cranberry', 'Limón', 'Toronja'],
  
  // Water and mixers
  WATERS: ['Botella de Agua', 'Mineral', 'Agua Quina'],
  
  // Soft drinks
  SOFT_DRINKS: ['Coca Cola', 'Pepsi', 'Sprite', '7UP', 'Fanta']
};

export const VALIDATION = {
  // Email and phone patterns
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
  
  // String length limits
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 6,
  MAX_COMMENT_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 500,
  
  // Numeric limits
  MIN_PRICE: 0,
  MAX_PRICE: 9999.99,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99,
  
  // Pattern validation
  PRICE_PATTERN: /^\$?\d+(\.\d{2})?$/,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  
  // Required fields
  REQUIRED_PRODUCT_FIELDS: ['id', 'nombre', 'precio'],
  REQUIRED_ORDER_FIELDS: ['items', 'total']
};

export const MESSAGES = {
  // Success messages
  SUCCESS: {
    PRODUCT_ADDED: 'Producto agregado exitosamente',
    ORDER_PLACED: 'Pedido realizado con éxito',
    DATA_SAVED: 'Datos guardados correctamente'
  },
  
  // Error messages
  ERRORS: {
    PRODUCT_NOT_FOUND: 'Producto no encontrado',
    INVALID_QUANTITY: 'Cantidad inválida',
    MAX_DRINKS_EXCEEDED: 'Máximo de bebidas excedido (5 por botella)',
    MISSING_ELEMENT: 'Elemento requerido no encontrado',
    NETWORK_ERROR: 'Error de conexión',
    VALIDATION_FAILED: 'Error de validación'
  },
  
  // Warning messages
  WARNINGS: {
    LOW_STOCK: 'Stock bajo',
    UNSAVED_CHANGES: 'Cambios sin guardar',
    SLOW_CONNECTION: 'Conexión lenta detectada'
  },
  
  // Info messages
  INFO: {
    LOADING: 'Cargando...',
    PROCESSING: 'Procesando...',
    PLEASE_WAIT: 'Por favor espere'
  }
};

export const NETWORK = {
  // Timeouts
  DEFAULT_TIMEOUT: 10000,
  RETRY_TIMEOUT: 3000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // HTTP status codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  }
};

export const DEBUG = {
  // Logging levels
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  },
  
  // Debug flags
  ENABLE_CONSOLE_LOGS: true,
  ENABLE_PERFORMANCE_MONITORING: false,
  ENABLE_ERROR_REPORTING: true,
  
  // Development helpers
  MOCK_DATA_ENABLED: false,
  SKIP_VALIDATIONS: false
};

export const API = {
  // Base URLs
  BASE_URL: window.location.origin + '/api',
  TIMEOUT: 10000,
  
  // Endpoints
  ENDPOINTS: {
    PRODUCTS: '/products',
    ORDERS: '/orders',
    CATEGORIES: '/categories',
    HEALTH: '/health'
  },
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const PERFORMANCE = {
  // Lazy loading
  ENABLE_LAZY_LOADING: true,
  LAZY_LOADING_THRESHOLD: 100,
  
  // Memoization
  ENABLE_MEMOIZATION: true,
  CACHE_SIZE: 100,
  CACHE_TTL: 300000, // 5 minutes
  
  // Debouncing
  ENABLE_DEBOUNCING: true,
  DEFAULT_DEBOUNCE_DELAY: 300,
  
  // Bundle optimization
  ENABLE_CODE_SPLITTING: true,
  CHUNK_SIZE_LIMIT: 250000 // 250KB
};

export const UI = {
  // Theme settings
  DEFAULT_THEME: 'light',
  AVAILABLE_THEMES: ['light', 'dark', 'auto'],
  
  // Animation settings
  ENABLE_ANIMATIONS: true,
  ANIMATION_DURATION: 300,
  
  // Layout settings
  SIDEBAR_WIDTH: 250,
  HEADER_HEIGHT: 60,
  
  // Responsive breakpoints
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200
  },
  
  // Debug settings
  DEBUG_MODE: false,
  SHOW_PERFORMANCE_METRICS: false
};

export const TESTING = {
  // Test environment
  ENABLE_TESTING: false,
  TEST_TIMEOUT: 5000,
  
  // Mock data
  ENABLE_MOCK_DATA: false,
  MOCK_DELAY: 500,
  
  // E2E testing
  E2E_TIMEOUT: 30000,
  SCREENSHOT_ON_FAILURE: true,
  
  // Test reporting
  ENABLE_COVERAGE: false,
  COVERAGE_THRESHOLD: 80
};

export default {
  BUSINESS_RULES,
  UI_TIMING,
  PRODUCT_CATEGORIES,
  DRINK_TYPES,
  VALIDATION,
  MESSAGES,
  NETWORK,
  DEBUG,
  API,
  PERFORMANCE,
  UI,
  TESTING
};