import { getProductRepository } from '../../../../../Shared/utils/diUtils.js';
import { actions } from './state.js';

export const api = {
    // Wrapper for Repository Methods
    async getLicoresCategories() {
        return await getProductRepository().getLicoresCategories();
    },

    async getProductsByCategory(category) {
        return await getProductRepository().getProductsByCategory(category);
    },

    async getLiquorSubcategory(subcategory) {
        return await getProductRepository().getLiquorSubcategory(subcategory);
    }
};
