// Infraestructura/adapters/SupabaseAdapter.js
import { createClient } from '@supabase/supabase-js';
import CocktailRepositoryPort from '../../Dominio/ports/CocktailRepositoryPort.js';
import BaseAdapter from './BaseAdapter.js';
import Logger from '../../Shared/utils/logger.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const errorMsg = 'SupabaseAdapter: Variables de entorno no configuradas';
    Logger.error(errorMsg);
    throw new Error('Configuración de Supabase incompleta');
}

Logger.info('SupabaseAdapter: Configuración validada correctamente');

/**
 * Supabase Database Adapter
 * Handles all interactions with the Supabase backend for product data
 * Implements CocktailRepositoryPort interface for cocktail operations
 * Implements error handling and fallback strategies for reliability
 * Used as alternative to local ProductData for live database integration
 * 
 * @class SupabaseAdapter
 * @extends CocktailRepositoryPort
 */
export default class SupabaseAdapter extends BaseAdapter {
  /**
   * Creates an instance of SupabaseAdapter
   * Initializes Supabase client with environment credentials
   */
  constructor() {
    super(); // Call parent constructor
    // Initialize Supabase client with production credentials
    // URL and key are public-safe for client-side usage
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.port = new CocktailRepositoryPort();
  }

  /**
   * Retrieves products by category with error handling
   * @param {string} type - Product category (cocteleria, refrescos, etc.)
   * @returns {Array} Array of product objects or empty array on error
   */
  async getProducts(type) {
    if (!this.validateTextParam(type, 'type')) {
      return [];
    }
    
    return this.safeExecuteAsync(
      () => this.client
        .from('products')
        .select('*')
        .eq('category', type)
        .order('price', { ascending: true }),
      'getProducts',
      []
    ).then(result => result?.data || []);
  }

  /**
   * Implements CocktailRepositoryPort.getAllCocktails()
   * Retrieves all cocktails from the database
   * Maps to specific columns needed for cocktail display
   * 
   * @returns {Promise<Array>} Array of cocktail objects with required fields
   * @throws {Error} When database query fails
   */
  async getAllCocktails() {
    const result = await this.safeExecuteAsync(
      () => this.client
        .from('products')
        .select('id, nombre, ingredientes, video, precio, imagen')
        .eq('category', 'cocteleria')
        .order('nombre', { ascending: true }),
      'getAllCocktails',
      []
    );
    
    return result?.data || [];
  }
  
  /**
   * Legacy method for backward compatibility
   * @deprecated Use getAllCocktails() instead
   * @returns {Promise<Array>} Array of cocktail objects
   */
  async getCocktails() {
    Logger.warn('SupabaseAdapter.getCocktails: Using deprecated method, use getAllCocktails() instead');
    return this.getAllCocktails();
  }

  /**
   * Get products by specific category
   * @param {string} category - Product category (refrescos, licores, etc.)
   * @returns {Promise<Array>} Array of products in the category
   */
  async getProductsByCategory(category) {
    if (!this.validateTextParam(category, 'category')) {
      return [];
    }
    
    return this.safeExecuteAsync(
      () => this.client
        .from('products')
        .select('*')
        .eq('category', category)
        .order('nombre', { ascending: true }),
      'getProductsByCategory',
      []
    ).then(result => result?.data || []);
  }
}