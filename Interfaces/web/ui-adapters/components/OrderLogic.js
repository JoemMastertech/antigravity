import { calculateTotalDrinkCount, calculateTotalJuiceCount, calculateTotalJagerDrinkCount, isJuiceOption } from '../../../../Shared/utils/calculationUtils.js';
import { OrderSystemValidations } from './order-system-validations.js';
import Logger from '../../../../Shared/utils/logger.js';

// Simple hash to generate stable keys per text
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
// Constants extracted from OrderSystem
export const CONSTANTS = {
    MAX_DRINK_COUNT: 5,
    MAX_JUICE_COUNT: 2,
    SPECIAL_PRODUCTS: {
        NO_MODAL: ['HIPNOTIQ', 'BAILEYS'],
        JAGER: 'JAGERMEISTER',
        SPECIAL_RON: ['BACARDI MANGO', 'BACARDI RASPBERRY', 'MALIBU']
    },
    CATEGORIES: {
        FOOD: ['pizzas', 'alitas', 'sopas', 'ensaladas'],
        MEAT: 'carnes',
        PLATOS_FUERTES: 'platos fuertes',
        SNACKS: 'snacks',
        DIGESTIVOS: 'digestivos',
        ESPUMOSOS: 'espumosos'
    },
    PRICE_TYPES: {
        BOTTLE: 'precioBotella',
        LITER: 'precioLitro',
        CUP: 'precioCopa'
    },
    MESSAGES: {
        SPECIAL: "Puedes elegir: 2 Jarras de jugo ó 5 Refrescos ó 1 Jarra de jugo y 2 Refrescos",
        ONLY_SODAS: "Puedes elegir hasta 5 refrescos",
        DEFAULT: "Puedes elegir hasta 5 acompañamientos",
        NO_REFRESCOS: "Este producto no incluye refrescos"
    },
    SELECTORS: {
        SIDEBAR: 'order-sidebar',
        TABLES: '.product-table',
        ORDER_BTN: 'create-order-btn',
        ORDER_ITEMS: 'order-items',
        TOTAL_AMOUNT: 'order-total-amount'
    },
    PRODUCT_OPTIONS: {
        // Options are now loaded dynamically from the database (Supabase)
        // This object is kept empty to avoid breaking legacy references if any remain
        DEFAULT: ['Mineral', 'Agua', 'Coca', 'Manzana']
    }
};

export class OrderLogic {
    constructor() {
        this.selectedDrinks = [];
        this.drinkCounts = {};
        this.currentProduct = null;
        this.currentCategory = null;
        this.bottleCategory = null;
        this.selectedCookingTerm = null;
        this.maxDrinkCount = CONSTANTS.MAX_DRINK_COUNT;
    }

    resetSelectionState() {
        this.selectedDrinks = [];
        this.drinkCounts = {};
        this.selectedCookingTerm = null;
    }

    setCurrentProduct(product, category) {
        this.currentProduct = product;
        this.currentCategory = category;
        this.bottleCategory = this.getLiquorType(product.name, category);
    }

    extractPrice(priceText) {
        if (!priceText || typeof priceText !== 'string') {
            Logger.warn('Invalid priceText provided to extractPrice', { priceText });
            return 0;
        }
        const numericString = priceText.replace(/[^\d.]/g, '');
        const price = parseFloat(numericString);
        return isNaN(price) ? 0 : price;
    }

    getProductMetadata(row) {
        if (row?.dataset?.productType) {
            return {
                type: (row.dataset.productType || 'unknown').toLowerCase(),
                category: (row.dataset.category || 'unknown').toLowerCase()
            };
        }

        const tableElement = row.closest('table, .category-grid, .product-grid');
        if (!tableElement) {
            Logger.error("Could not find parent table/grid for row", null, { row });
            return { type: 'unknown', category: 'unknown' };
        }

        return {
            type: (tableElement.dataset.productType || 'unknown').toLowerCase(),
            category: (tableElement.dataset.category || 'unknown').toLowerCase()
        };
    }

    getPriceType(row, clickedElement) {
        if (clickedElement.disabled || (clickedElement.classList && clickedElement.classList.contains('non-selectable')) || clickedElement.textContent.trim() === '--') {
            return null;
        }

        if (clickedElement.dataset.field) return clickedElement.dataset.field;
        if (clickedElement.dataset.priceType) return clickedElement.dataset.priceType;

        const currentTable = row.closest('table');
        if (!currentTable) {
            Logger.error("Could not find parent table for getPriceType", null, { row });
            return null;
        }

        const tableHeaders = currentTable.querySelectorAll('thead th');
        const cellIndex = Array.from(row.cells).findIndex(cell => cell.contains(clickedElement));

        if (cellIndex === -1 || !tableHeaders || cellIndex >= tableHeaders.length) {
            Logger.error("Invalid headers or cellIndex in getPriceType", null, { tableHeaders, cellIndex });
            return null;
        }

        const headerEl = tableHeaders[cellIndex];
        const originalText = (headerEl.dataset && headerEl.dataset.originalText) ? headerEl.dataset.originalText : '';
        const headerText = (originalText || headerEl.textContent || '').trim().toUpperCase();

        if (headerText.includes('BOTELLA')) return CONSTANTS.PRICE_TYPES.BOTTLE;
        if (headerText.includes('LITRO')) return CONSTANTS.PRICE_TYPES.LITER;
        if (headerText.includes('COPA')) return CONSTANTS.PRICE_TYPES.CUP;

        return 'precio';
    }

    getLiquorType(productName, category = null) {
        // Prioritize category if provided
        if (category) {
            const normalizedCategory = category.toLowerCase();
            if (normalizedCategory === 'tequila') return 'TEQUILA';
            if (normalizedCategory === 'ron') return 'RON';
            if (normalizedCategory === 'brandy') return 'BRANDY';
            if (normalizedCategory === 'whisky') return 'WHISKY';
            if (normalizedCategory === 'vodka') return 'VODKA';
            if (normalizedCategory === 'ginebra') return 'GINEBRA';
            if (normalizedCategory === 'mezcal') return 'MEZCAL';
            if (normalizedCategory === 'cognac') return 'COGNAC';
            if (normalizedCategory === 'digestivos') return 'DIGESTIVOS';
            if (normalizedCategory === 'espumosos') return 'ESPUMOSOS';
        }

        if (!productName) return 'OTROS';
        const name = productName.toUpperCase();

        if (name.includes('RON') || name.includes('BACARDI') || name.includes('MATUSALEM') || name.includes('CAPITAN MORGAN') || name.includes('MALIBU') || name.includes('ZACAPA')) return 'RON';
        if (name.includes('TEQUILA') || name.includes('DON JULIO') || name.includes('HERRADURA') || name.includes('JOSE CUERVO') || name.includes('1800') || name.includes('MAESTRO DOBEL') || name.includes('CENTENARIO') || name.includes('TRADICIONAL')) return 'TEQUILA';
        if (name.includes('BRANDY') || name.includes('TORRES') || name.includes('TERRY') || name.includes('DON PEDRO') || name.includes('AZTECA DE ORO')) return 'BRANDY';
        if (name.includes('WHISKY') || name.includes('WHISKEY') || name.includes('BUCHANANS') || name.includes('JOHNNIE WALKER') || name.includes('CHIVAS') || name.includes('JACK DANIELS') || name.includes('JAMESON') || name.includes('MACALLAN') || name.includes('OLD PARR') || name.includes('BLACK & WHITE')) return 'WHISKY';
        if (name.includes('VODKA') || name.includes('ABSOLUT') || name.includes('SMIRNOFF') || name.includes('GREY GOOSE') || name.includes('STOLICHNAYA') || name.includes('WYBOROWA')) return 'VODKA';
        if (name.includes('GINEBRA') || name.includes('GIN') || name.includes('BOMBAY') || name.includes('TANQUERAY') || name.includes('BEEFEATER') || name.includes('HENDRICKS')) return 'GINEBRA';
        if (name.includes('MEZCAL') || name.includes('400 CONEJOS') || name.includes('ALIPUS') || name.includes('MONTELOBOS') || name.includes('UNION')) return 'MEZCAL';
        if (name.includes('COGNAC') || name.includes('MARTELL') || name.includes('HENNESSY') || name.includes('REMY MARTIN')) return 'COGNAC';
        if (name.includes('LICOR 43') || name.includes('BAILEYS') || name.includes('JAGERMEISTER') || name.includes('SAMBUCA') || name.includes('ANIS') || name.includes('CHINCHON') || name.includes('VACCARI') || name.includes('FRANGELICO') || name.includes('AMARETTO') || name.includes('KAHLUA') || name.includes('MIDORI') || name.includes('CONTROY') || name.includes('LICOR DE MELON') || name.includes('LICOR DE CACAO') || name.includes('LICOR DE CAFE') || name.includes('LICOR DE MENTA') || name.includes('LICOR DE DURAZNO') || name.includes('LICOR DE FRESA') || name.includes('LICOR DE PLATANO') || name.includes('LICOR DE CASIS') || name.includes('LICOR DE COCO') || name.includes('LICOR DE MANZANA') || name.includes('LICOR DE FRAMBUESA') || name.includes('LICOR DE ZARZAMORA') || name.includes('LICOR DE ARANDANO') || name.includes('LICOR DE GRANADA') || name.includes('LICOR DE MANDARINA') || name.includes('LICOR DE NARANJA') || name.includes('LICOR DE LIMON') || name.includes('LICOR DE TORONJA') || name.includes('LICOR DE PIÑA') || name.includes('LICOR DE GUAYABA') || name.includes('LICOR DE MANGO') || name.includes('LICOR DE TAMARINDO') || name.includes('LICOR DE JAMAICA') || name.includes('LICOR DE HORCHATA') || name.includes('LICOR DE VAINILLA') || name.includes('LICOR DE CHOCOLATE') || name.includes('LICOR DE ALMENDRA') || name.includes('LICOR DE AVELLANA') || name.includes('LICOR DE NUEZ') || name.includes('LICOR DE PISTACHE') || name.includes('LICOR DE CACAHUATE') || name.includes('LICOR DE CAJETA') || name.includes('LICOR DE ROMPOPE') || name.includes('LICOR DE YOGURT') || name.includes('LICOR DE CREMA') || name.includes('LICOR DE LECHE') || name.includes('LICOR DE HUEVO') || name.includes('LICOR DE MIEL') || name.includes('LICOR DE AGAVE') || name.includes('LICOR DE CAÑA') || name.includes('LICOR DE MAIZ') || name.includes('LICOR DE ARROZ') || name.includes('LICOR DE TRIGO') || name.includes('LICOR DE CEBADA') || name.includes('LICOR DE CENTENO') || name.includes('LICOR DE AVENA') || name.includes('LICOR DE SORGO') || name.includes('LICOR DE MIJO') || name.includes('LICOR DE QUINOA') || name.includes('LICOR DE AMARANTO') || name.includes('LICOR DE CHIA') || name.includes('LICOR DE LINAZA') || name.includes('LICOR DE SESAMO') || name.includes('LICOR DE GIRASOL') || name.includes('LICOR DE CALABAZA') || name.includes('LICOR DE SANDIA') || name.includes('LICOR DE MELON') || name.includes('LICOR DE PAPAYA')) return 'DIGESTIVOS';
        if (name.includes('CHAMPAGNE') || name.includes('ESPUMOSO') || name.includes('CAVA') || name.includes('PROSECCO') || name.includes('MOET') || name.includes('DOM PERIGNON') || name.includes('VEUVE CLICQUOT') || name.includes('MUMM') || name.includes('CHANDON') || name.includes('FREIXENET') || name.includes('ASTI') || name.includes('LAMBRUSCO') || name.includes('SIDRA')) return 'ESPUMOSOS';

        return 'OTROS';
    }

    isBottleProduct(row) {
        return Array.from(document.querySelectorAll('th')).some(header => {
            const text = header.textContent.toUpperCase();
            return ['BOTELLA', 'LITRO', 'COPA'].some(type => text.includes(type));
        }) && row.querySelector('.product-price');
    }

    isFoodProduct() { return CONSTANTS.CATEGORIES.FOOD.includes(this.currentCategory); }
    isMeatProduct() { return this.currentCategory === CONSTANTS.CATEGORIES.MEAT; }
    isPlatosFuertesProduct() { return this.currentCategory === CONSTANTS.CATEGORIES.PLATOS_FUERTES; }

    calculateTotalJagerDrinkCount() {
        // Jager logic might be specific, but for now let's count total drinks if it's Jager bottle
        return this.calculateTotalDrinkCount();
    }

    calculateTotalDrinkCount() {
        return Object.values(this.drinkCounts).reduce((total, count) => total + count, 0);
    }

    calculateTotalJuiceCount() {
        return Object.entries(this.drinkCounts).reduce((total, [option, count]) => {
            return isJuiceOption(option) ? total + count : total;
        }, 0);
    }

    hasValidDrinkSelection() {
        if (!this.currentProduct) {
            Logger.error('No current product selected for drink selection validation');
            return false;
        }
        return OrderSystemValidations.hasValidDrinkSelection(this.selectedDrinks, this.drinkCounts, this.currentProduct);
    }

    validateDrinkOptions(drinkOptionsResult) {
        if (!this.currentProduct) {
            Logger.error('No current product selected for drink options validation');
            return false;
        }
        return OrderSystemValidations.validateDrinkOptions(drinkOptionsResult, this.currentProduct.name);
    }

    isSpecialBottleCategory() {
        if (this.bottleCategory === 'VODKA' || this.bottleCategory === 'GINEBRA') return true;
        if (this.bottleCategory === 'RON') {
            const normalizedName = this.currentProduct?.name?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() || '';
            return CONSTANTS.SPECIAL_PRODUCTS.SPECIAL_RON.some(name => normalizedName.includes(name));
        }
        return false;
    }

    isOnlySodaCategory(drinkOptions) {
        if (!drinkOptions || drinkOptions.length === 0) return false;
        return drinkOptions.every(option => !isJuiceOption(option)) &&
            drinkOptions.length > 0 &&
            !drinkOptions.includes('Ninguno');
    }

    isSpecialDrinkProduct(drinkOptions) {
        return this.isSpecialBottleCategory() || this.isOnlySodaCategory(drinkOptions);
    }

    getDrinkOptionsForProduct(productName) {
        if (!productName || typeof productName !== 'string') {
            Logger.error('getDrinkOptionsForProduct: Invalid productName:', productName);
            return { drinkOptions: ['Ninguno'], message: 'Error: Producto no válido' };
        }

        const productType = this.getLiquorType(productName, this.currentCategory);
        const normalizedName = productName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const priceType = this.currentProduct ? this.currentProduct.priceType : CONSTANTS.PRICE_TYPES.BOTTLE;

        // 1. Dynamic options from Database (Highest Priority)
        if (this.currentProduct && this.currentProduct.mixers && Array.isArray(this.currentProduct.mixers) && this.currentProduct.mixers.length > 0) {
            const options = this.currentProduct.mixers;
            // Determine message based on options
            const isOnlySodas = this.isOnlySodaCategory(options);
            const message = isOnlySodas ?
                (CONSTANTS.MESSAGES.ONLY_SODAS || 'Puedes elegir hasta 5 refrescos') :
                (CONSTANTS.MESSAGES.DEFAULT || 'Seleccione acompañamiento');

            return { drinkOptions: options, message };
        }

        // Check special products first
        const specialProduct = this._getSpecialProductOptions(normalizedName);
        if (specialProduct && specialProduct.drinkOptions) {
            return specialProduct;
        }

        // Handle digestivos
        if (productType === 'DIGESTIVOS') {
            const digestivoResult = this._getDigestivoOptions(normalizedName, productName);
            if (digestivoResult && digestivoResult.drinkOptions) {
                return digestivoResult;
            }
        }

        // Handle espumosos
        if (productType === 'ESPUMOSOS') {
            return { drinkOptions: ['Ninguno'], message: CONSTANTS.MESSAGES.NO_REFRESCOS || 'Sin acompañamientos' };
        }

        // Get standard options with fallback based on price type
        let options = null;
        if (CONSTANTS.PRODUCT_OPTIONS && CONSTANTS.PRODUCT_OPTIONS[productType]) {
            const typeOptions = CONSTANTS.PRODUCT_OPTIONS[productType];

            // Special handling for Tequila Bottles (Simple Array)
            if (productType === 'TEQUILA' && Array.isArray(typeOptions)) {
                options = typeOptions;
            } else if (priceType === CONSTANTS.PRICE_TYPES.LITER && typeOptions.LITER) {
                options = typeOptions.LITER;
            } else if (priceType === CONSTANTS.PRICE_TYPES.CUP && typeOptions.CUP) {
                options = typeOptions.CUP;
            } else {
                options = typeOptions.DEFAULT || typeOptions; // Fallback to default or the object itself if no sub-keys
            }
        } else if (CONSTANTS.PRODUCT_OPTIONS && CONSTANTS.PRODUCT_OPTIONS.DEFAULT) {
            options = CONSTANTS.PRODUCT_OPTIONS.DEFAULT;
        } else {
            options = ['Mineral', 'Coca', 'Manzana'];
        }

        // Determine message
        let message;
        if (['VODKA', 'GINEBRA'].includes(productType)) {
            message = CONSTANTS.MESSAGES.SPECIAL || 'Opciones especiales';
        } else {
            const isOnlySodas = this.isOnlySodaCategory(options);
            message = isOnlySodas ?
                (CONSTANTS.MESSAGES.ONLY_SODAS || 'Puedes elegir hasta 5 refrescos') :
                (CONSTANTS.MESSAGES.DEFAULT || 'Seleccione acompañamiento');
        }

        return { drinkOptions: options, message };
    }

    _getSpecialProductOptions(normalizedName) {
        if (!normalizedName || typeof normalizedName !== 'string') return null;

        const specialProducts = {
            'BACARDI MANGO': ['Sprite', 'Mineral', 'Jugo de Piña'],
            'BACARDI RASPBERRY': ['Sprite', 'Mineral', 'Jugo de Arándano'],
            'MALIBU': ['Jugo de Piña', 'Sprite', 'Mineral']
        };

        for (const [key, options] of Object.entries(specialProducts)) {
            if (normalizedName.includes(key)) {
                return {
                    drinkOptions: Array.isArray(options) ? options : ['Ninguno'],
                    message: CONSTANTS.MESSAGES.SPECIAL || 'Opciones especiales'
                };
            }
        }
        return null;
    }

    _getDigestivoOptions(normalizedName, productName) {
        if (!normalizedName || !productName || !this.currentProduct) {
            return { drinkOptions: ['Ninguno'], message: 'Sin acompañamientos' };
        }

        if (this.currentProduct.priceType === CONSTANTS.PRICE_TYPES.BOTTLE) {
            const digestivoOptions = {
                'LICOR 43': ['Botella de Agua', 'Mineral'],
                'CADENAS DULCE': ['Botella de Agua', 'Mineral'],
                'ZAMBUCA NEGRO': ['Botella de Agua', 'Mineral']
            };

            for (const [key, options] of Object.entries(digestivoOptions)) {
                if (normalizedName.includes(key)) {
                    return {
                        drinkOptions: Array.isArray(options) ? options : ['Ninguno'],
                        message: "Seleccione acompañamiento:"
                    };
                }
            }
            return {
                drinkOptions: ['Ninguno'],
                message: CONSTANTS.MESSAGES.NO_REFRESCOS || 'Sin acompañamientos'
            };
        }

        if (this.currentProduct.priceType === CONSTANTS.PRICE_TYPES.CUP && productName.includes("BAILEYS")) {
            return { drinkOptions: ['Rocas'], message: "Acompañamientos para copa" };
        }

        return {
            drinkOptions: ['Ninguno'],
            message: CONSTANTS.MESSAGES.NO_REFRESCOS || 'Sin acompañamientos'
        };
    }

    buildProductInfo() {
        if (!this.currentProduct) {
            Logger.error('No current product selected for building product info');
            return { prefix: '', name: '', customization: 'Error: No product selected' };
        }
        const priceType = this.currentProduct.priceType;
        const productName = this.currentProduct.name.replace(/\s*\d+\s*ML/i, '');
        const isJagerBottle = this.currentProduct.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes('JAGERMEISTER') &&
            priceType === 'precioBotella';

        const prefixMap = { 'precioBotella': 'Botella', 'precioLitro': 'Litro', 'precioCopa': 'Copa' };
        const prefix = prefixMap[priceType] || '';

        let customization = '';
        if (priceType === 'precioBotella') {
            if (isJagerBottle && this.selectedDrinks.includes('2 Boost')) {
                customization = 'Con: 2 Boost';
            } else if (Object.values(this.drinkCounts).some(count => count > 0)) {
                const customizations = Object.entries(this.drinkCounts)
                    .filter(([, count]) => count > 0)
                    .map(([drink, count]) => `${count}x ${drink}`);
                customization = `Con: ${customizations.join(', ')}`;
            } else {
                customization = this.selectedDrinks.includes('Ninguno') ? 'Sin acompañamientos' : `Con: ${this.selectedDrinks.join(', ')}`;
            }
        } else if (priceType === 'precioLitro') {
            customization = `Mezclador: ${this.selectedDrinks[0] || 'Ninguno'}`;
        } else if (priceType === 'precioCopa') {
            customization = `Estilo: ${this.selectedDrinks[0] || 'Ninguno'}`;
        }

        return { prefix, name: productName, customization };
    }

    // ==================== Orders Persistence ====================
    // localStorage management for saved orders and history

    getActiveOrders() {
        try {
            return JSON.parse(localStorage.getItem('orders') || '[]');
        } catch (error) {
            Logger.error('Error reading active orders from localStorage', error);
            return [];
        }
    }

    getOrderHistory() {
        try {
            return JSON.parse(localStorage.getItem('orderHistory') || '[]');
        } catch (error) {
            Logger.error('Error reading order history from localStorage', error);
            return [];
        }
    }

    saveOrderToStorage(order) {
        try {
            const orders = this.getActiveOrders();
            orders.unshift(order); // Add to beginning of array (most recent first)
            localStorage.setItem('orders', JSON.stringify(orders));
            Logger.info('Order saved to localStorage', { orderId: order.id, itemCount: order.items.length });
            return true;
        } catch (error) {
            Logger.error('Error saving order to localStorage', error);
            return false;
        }
    }

    moveOrderToHistory(orderId) {
        try {
            const orders = this.getActiveOrders();
            const orderToMove = orders.find(o => o.id === orderId);

            if (!orderToMove) {
                Logger.warn('Order not found for moving to history', { orderId });
                return false;
            }

            // Remove from active orders
            const updatedOrders = orders.filter(o => o.id !== orderId);
            localStorage.setItem('orders', JSON.stringify(updatedOrders));

            // Add to history with deletion timestamp
            const history = this.getOrderHistory();
            history.unshift({
                ...orderToMove,
                deletedAt: new Date().toISOString()
            });
            localStorage.setItem('orderHistory', JSON.stringify(history));

            Logger.info('Order moved to history', { orderId });
            return true;
        } catch (error) {
            Logger.error('Error moving order to history', error);
            return false;
        }
    }

    clearOrderHistory() {
        try {
            localStorage.setItem('orderHistory', '[]');
            Logger.info('Order history cleared');
            return true;
        } catch (error) {
            Logger.error('Error clearing order history', error);
            return false;
        }
    }

    generateOrderId() {
        return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
