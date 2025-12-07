import { logWarning } from '../../../../../Shared/utils/errorHandler.js';

export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

export function formatPrice(priceValue) {
    if (!priceValue || priceValue === '--') return '--';

    // Remove existing $ if present
    let numericValue = priceValue;
    if (typeof priceValue === 'string') {
        numericValue = priceValue.replace('$', '').trim();
    }

    const floatVal = parseFloat(numericValue);
    if (isNaN(floatVal)) return priceValue;

    return `$${floatVal.toFixed(2)}`;
}

export function normalizeCategory(categoryTitle) {
    if (!categoryTitle) return '';
    return categoryTitle
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export function determineProductType(normalizedCategory, tableClass, categoryTitle) {
    const foodCategories = ['pizzas', 'alitas', 'sopas', 'ensaladas', 'carnes', 'platos fuertes', 'snacks'];
    const beverageCategories = ['cocteleria', 'refrescos', 'cervezas', 'cafe', 'postres'];

    if (foodCategories.includes(normalizedCategory)) {
        return 'food';
    } else if (beverageCategories.includes(normalizedCategory)) {
        return 'beverage';
    } else if (tableClass === 'liquor-table' || normalizedCategory === 'licores') {
        return 'liquor';
    } else {
        logWarning(`Unknown product type for category: ${categoryTitle} (normalized: ${normalizedCategory})`);
        return 'unknown';
    }
}

export function getCategoryForModal(categoryTitle) {
    return categoryTitle && (categoryTitle.toLowerCase() === 'cervezas' || categoryTitle.toLowerCase() === 'refrescos') ? categoryTitle.toLowerCase() : null;
}

export function isPriceField(field) {
    return field.includes('precio') || field === 'precioBotella' || field === 'precioLitro' || field === 'precioCopa';
}

export function slugify(s) {
    if (!s || typeof s !== 'string') return '';
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase() // Corregido .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();
}
