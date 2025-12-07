
// Estado global de la vista
export const state = {
    currentViewMode: 'table',
    eventDelegationInitialized: false,
    boundDelegatedHandler: null,
    productCache: {} // Caché de productos
};

// Acciones para mutar el estado (Actions)
export const actions = {
    toggleViewMode() {
        state.currentViewMode = state.currentViewMode === 'table' ? 'grid' : 'table';
        return state.currentViewMode;
    },

    setEventDelegationInitialized(value) {
        state.eventDelegationInitialized = value;
    },

    setBoundDelegatedHandler(handler) {
        state.boundDelegatedHandler = handler;
    },

    setProductCache(category, products) {
        state.productCache[category] = products;
    },

    getProductFromCache(category, productName) {
        if (!state.productCache[category]) return null;
        return state.productCache[category].find(product =>
            product.nombre && product.nombre.trim().toLowerCase() === productName.trim().toLowerCase()
        );
    }
};
