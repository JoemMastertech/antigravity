/**
 * CSS CLASS MANAGER - FASE 3: CONSOLIDACIÓN DE LÓGICA JAVASCRIPT
 * Módulo centralizado para manipulación de clases CSS
 * Implementa naming conventions BEM y reduce duplicación
 */

class CSSClassManager {
  constructor() {
    this.state = {
      topNavVisible: false,
      gridEnhanced: false,
      orderModeActive: false,
      drawerOpen: false,
      viewMode: 'list' // 'list' | 'grid'
    };
    
    // Cache de elementos DOM para mejor performance
    this.elements = {
      body: document.body,
      topNav: null,
      drawerMenu: null,
      drawerOverlay: null,
      hamburgerBtn: null,
      viewToggleBtn: null
    };
    
    this.init();
  }
  
  /**
   * Inicializa el manager y cachea elementos DOM
   */
  init() {
    this.cacheElements();
    this.bindEvents();
  }
  
  /**
   * Cachea elementos DOM frecuentemente utilizados
   */
  cacheElements() {
    this.elements.topNav = document.querySelector('.top-nav');
    this.elements.drawerMenu = document.querySelector('.drawer-menu');
    this.elements.drawerOverlay = document.querySelector('.drawer-overlay');
    this.elements.hamburgerBtn = document.querySelector('.hamburger-btn');
    this.elements.viewToggleBtn = document.querySelector('.view-toggle-btn');
  }
  
  /**
   * Vincula eventos globales
   */
  bindEvents() {
    // Escuchar cambios de estado para sincronización
    document.addEventListener('stateChange', (e) => {
      this.handleStateChange(e.detail);
    });
  }
  
  /**
   * === MÉTODOS PARA TOP NAVIGATION ===
   */
  
  /**
   * Muestra la navegación superior
   */
  showTopNav() {
    if (this.state.topNavVisible) return;
    
    this.addClass(this.elements.topNav, 'top-nav--visible');
    this.addClass(this.elements.body, 'body--top-nav-visible');
    
    this.state.topNavVisible = true;
    this.emitStateChange('topNavVisible', true);
  }
  
  /**
   * Oculta la navegación superior
   */
  hideTopNav() {
    if (!this.state.topNavVisible) return;
    
    this.removeClass(this.elements.topNav, 'top-nav--visible');
    this.removeClass(this.elements.body, 'body--top-nav-visible');
    
    this.state.topNavVisible = false;
    this.emitStateChange('topNavVisible', false);
  }
  
  /**
   * Alterna la visibilidad de la navegación superior
   */
  toggleTopNav() {
    if (this.state.topNavVisible) {
      this.hideTopNav();
    } else {
      this.showTopNav();
    }
  }
  
  /**
   * === MÉTODOS PARA DRAWER MENU ===
   */
  
  /**
   * Abre el menú drawer
   */
  openDrawer() {
    if (this.state.drawerOpen) return;
    
    this.addClass(this.elements.drawerMenu, 'drawer-menu--open');
    this.addClass(this.elements.drawerOverlay, 'drawer-overlay--active');
    
    this.state.drawerOpen = true;
    this.emitStateChange('drawerOpen', true);
  }
  
  /**
   * Cierra el menú drawer
   */
  closeDrawer() {
    if (!this.state.drawerOpen) return;
    
    this.removeClass(this.elements.drawerMenu, 'drawer-menu--open');
    this.removeClass(this.elements.drawerOverlay, 'drawer-overlay--active');
    
    this.state.drawerOpen = false;
    this.emitStateChange('drawerOpen', false);
  }
  
  /**
   * Alterna el menú drawer
   */
  toggleDrawer() {
    if (this.state.drawerOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }
  
  /**
   * === MÉTODOS PARA GRID ENHANCEMENT ===
   */
  
  /**
   * Activa el modo grid mejorado
   */
  enableGridEnhancement() {
    if (this.state.gridEnhanced) return;
    
    this.addClass(this.elements.body, 'body--grid-enhanced');
    
    this.state.gridEnhanced = true;
    this.emitStateChange('gridEnhanced', true);
  }
  
  /**
   * Desactiva el modo grid mejorado
   */
  disableGridEnhancement() {
    if (!this.state.gridEnhanced) return;
    
    this.removeClass(this.elements.body, 'body--grid-enhanced');
    
    this.state.gridEnhanced = false;
    this.emitStateChange('gridEnhanced', false);
  }
  
  /**
   * GRID ENHANCEMENT - Activa/desactiva modo grid mejorado
   * Ahora utiliza clases BEM optimizadas
   */
  toggleGridEnhancement(force = null) {
    const shouldEnable = force !== null ? force : !this.state.gridEnhanced;
    
    if (shouldEnable) {
      // Aplicar clases BEM optimizadas
      this.applyEnhancedGridClasses();
      this.addClass(this.elements.body, 'body--grid-enhanced'); // BEM class
      this.state.gridEnhanced = true;
    } else {
      this.removeEnhancedGridClasses();
      this.removeClass(this.elements.body, 'body--grid-enhanced');
      this.state.gridEnhanced = false;
    }
    
    this.emitStateChange('gridEnhanced', this.state.gridEnhanced);
    return this.state.gridEnhanced;
  }
  
  /**
   * Aplica clases BEM optimizadas para grid enhancement
   */
  applyEnhancedGridClasses() {
    // Aplicar clases BEM a product cards
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      this.addClass(card, 'product-card--enhanced');
      
      // Aplicar clases específicas según tipo
      if (card.classList.contains('liquor-card')) {
        this.addClass(card, 'product-card--liquor');
      }
    });
    
    // Aplicar clases BEM a category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      this.addClass(card, 'category-card--enhanced');
    });
    
    // Detectar y aplicar tipos de grid
    this.applyGridTypeClasses();
  }
  
  /**
   * Remueve clases BEM optimizadas para grid enhancement
   */
  removeEnhancedGridClasses() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      this.removeClass(card, 'product-card--enhanced');
      this.removeClass(card, 'product-card--liquor');
      this.removeClass(card, 'product-card--grid-type-2');
    });
    
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      this.removeClass(card, 'category-card--enhanced');
      this.removeClass(card, 'category-card--grid-type-4');
    });
  }
  
  /**
   * Aplica clases de tipo de grid según contexto
   */
  applyGridTypeClasses() {
    // Grid tipo 2: Refrescos, Cervezas (sin ingredientes)
    const gridType2Cards = document.querySelectorAll('.product-grid.grid-type-2 .product-card');
    gridType2Cards.forEach(card => {
      this.addClass(card, 'product-card--grid-type-2');
    });
    
    // Grid tipo 4: Categorías de licores
    const gridType4Cards = document.querySelectorAll('.category-grid.grid-type-4 .category-card');
    gridType4Cards.forEach(card => {
      this.addClass(card, 'category-card--grid-type-4');
    });
  }
  
  /**
   * === MÉTODOS PARA VIEW MODE ===
   */
  
  /**
   * Cambia el modo de vista
   * @param {string} mode - 'list' | 'grid'
   */
  setViewMode(mode) {
    if (this.state.viewMode === mode) return;
    
    // Remover clase anterior
    this.removeClass(this.elements.body, `body--view-${this.state.viewMode}`);
    
    // Agregar nueva clase
    this.addClass(this.elements.body, `body--view-${mode}`);
    
    // Actualizar botón toggle
    if (this.elements.viewToggleBtn) {
      this.toggleClass(this.elements.viewToggleBtn, 'view-toggle-btn--active', mode === 'grid');
    }
    
    this.state.viewMode = mode;
    this.emitStateChange('viewMode', mode);
  }
  
  /**
   * === MÉTODOS PARA ORDER MODE ===
   */
  
  /**
   * Activa el modo de pedidos
   */
  enableOrderMode() {
    if (this.state.orderModeActive) return;
    
    this.addClass(this.elements.body, 'body--order-mode-active');
    
    this.state.orderModeActive = true;
    this.emitStateChange('orderModeActive', true);
  }
  
  /**
   * Desactiva el modo de pedidos
   */
  disableOrderMode() {
    if (!this.state.orderModeActive) return;
    
    this.removeClass(this.elements.body, 'body--order-mode-active');
    
    this.state.orderModeActive = false;
    this.emitStateChange('orderModeActive', false);
  }
  
  /**
   * ORDER MODE - Activa/desactiva modo de pedidos
   * Ahora utiliza clases BEM optimizadas
   */
  toggleOrderMode(force = null) {
    const shouldEnable = force !== null ? force : !this.state.orderModeActive;
    
    if (shouldEnable) {
      this.applyOrderModeClasses();
      this.addClass(this.elements.body, 'order-mode-active'); // Legacy compatibility
      this.state.orderModeActive = true;
    } else {
      this.removeOrderModeClasses();
      this.removeClass(this.elements.body, 'order-mode-active');
      this.state.orderModeActive = false;
    }
    
    return this.state.orderModeActive;
  }
  
  /**
   * Aplica clases BEM optimizadas para order mode
   */
  applyOrderModeClasses() {
    // Sidebar
    const orderSidebar = document.querySelector('#order-sidebar');
    if (orderSidebar) {
      this.addClass(orderSidebar, 'order-sidebar--active');
      
      // Detectar si estamos en landscape para aplicar clase específica
      if (window.matchMedia('(orientation: landscape) and (min-width: 640px)').matches) {
        this.addClass(orderSidebar, 'order-sidebar--landscape');
      }
    }
    
    // Content container
    const contentContainer = document.querySelector('#content-container');
    if (contentContainer) {
      this.addClass(contentContainer, 'content-container--order-active');
    }
    
    // Content container flex
    const contentContainerFlex = document.querySelector('.content-container-flex');
    if (contentContainerFlex) {
      this.addClass(contentContainerFlex, 'content-container-flex--order-active');
    }
  }
  
  /**
   * Remueve clases BEM optimizadas para order mode
   */
  removeOrderModeClasses() {
    const orderSidebar = document.querySelector('#order-sidebar');
    if (orderSidebar) {
      this.removeClass(orderSidebar, 'order-sidebar--active');
      this.removeClass(orderSidebar, 'order-sidebar--landscape');
    }
    
    const contentContainer = document.querySelector('#content-container');
    if (contentContainer) {
      this.removeClass(contentContainer, 'content-container--order-active');
    }
    
    const contentContainerFlex = document.querySelector('.content-container-flex');
    if (contentContainerFlex) {
      this.removeClass(contentContainerFlex, 'content-container-flex--order-active');
    }
  }
  
  /**
   * === MÉTODOS UTILITARIOS PARA CLASES CSS ===
   */
  
  /**
   * Agrega una clase a un elemento
   * @param {Element} element - Elemento DOM
   * @param {string} className - Nombre de la clase
   */
  addClass(element, className) {
    if (!element || !className) return;
    element.classList.add(className);
  }
  
  /**
   * Remueve una clase de un elemento
   * @param {Element} element - Elemento DOM
   * @param {string} className - Nombre de la clase
   */
  removeClass(element, className) {
    if (!element || !className) return;
    element.classList.remove(className);
  }
  
  /**
   * Alterna una clase en un elemento
   * @param {Element} element - Elemento DOM
   * @param {string} className - Nombre de la clase
   * @param {boolean} force - Forzar estado (opcional)
   */
  toggleClass(element, className, force) {
    if (!element || !className) return;
    
    if (typeof force !== 'undefined') {
      element.classList.toggle(className, force);
    } else {
      element.classList.toggle(className);
    }
  }
  
  /**
   * Verifica si un elemento tiene una clase
   * @param {Element} element - Elemento DOM
   * @param {string} className - Nombre de la clase
   * @returns {boolean}
   */
  hasClass(element, className) {
    if (!element || !className) return false;
    return element.classList.contains(className);
  }
  
  /**
   * === MÉTODOS DE ESTADO ===
   */
  
  /**
   * Obtiene el estado actual
   * @returns {Object} Estado actual
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * Maneja cambios de estado externos
   * @param {Object} stateChange - Cambio de estado
   */
  handleStateChange(stateChange) {
    Object.keys(stateChange).forEach(key => {
      if (this.state.hasOwnProperty(key)) {
        this.state[key] = stateChange[key];
      }
    });
  }
  
  /**
   * Emite un evento de cambio de estado
   * @param {string} property - Propiedad que cambió
   * @param {*} value - Nuevo valor
   */
  emitStateChange(property, value) {
    const event = new CustomEvent('cssClassManagerStateChange', {
      detail: { property, value, fullState: this.getState() }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * === MÉTODOS DE COMPATIBILIDAD LEGACY ===
   */
  
  /**
   * Mapea clases legacy a clases BEM
   * @param {string} legacyClass - Clase legacy
   * @returns {string} Clase BEM equivalente
   */
  mapLegacyToBEM(legacyClass) {
    const mapping = {
      'show': 'top-nav--visible',
      'open': 'drawer-menu--open',
      'active': 'drawer-overlay--active',
      'grid-enhanced': 'body--grid-enhanced',
      'top-nav-visible': 'body--top-nav-visible',
      'order-mode-active': 'body--order-mode-active',
      'scrolled': 'hamburger-btn--scrolled'
    };
    
    return mapping[legacyClass] || legacyClass;
  }
  
  /**
   * Aplica clase con mapeo automático legacy -> BEM
   * @param {Element} element - Elemento DOM
   * @param {string} className - Clase (legacy o BEM)
   */
  addClassWithMapping(element, className) {
    const bemClass = this.mapLegacyToBEM(className);
    this.addClass(element, bemClass);
  }
  
  /**
   * Remueve clase con mapeo automático legacy -> BEM
   * @param {Element} element - Elemento DOM
   * @param {string} className - Clase (legacy o BEM)
   */
  removeClassWithMapping(element, className) {
    const bemClass = this.mapLegacyToBEM(className);
    this.removeClass(element, bemClass);
  }
}

// Crear instancia global
window.cssClassManager = new CSSClassManager();

// Exportar para módulos ES6
export default CSSClassManager;