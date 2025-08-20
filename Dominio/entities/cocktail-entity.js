import { BaseEntity } from '../../Shared/base/BaseEntity.js';
import Validator from '../../Shared/utils/validator.js';
import { formatProductName, formatIngredients, formatPrice } from '../../Shared/utils/formatters.js';

/**
 * Entidad Cocktail - Representa un cóctel en el dominio
 * Usa validators y formatters unificados para simplicidad
 * 
 * @extends BaseEntity
 */
class CocktailEntity extends BaseEntity {
  constructor(id, nombre, ingredientes, video, precio) {
    // Formatear datos antes de crear la entidad
    const formattedData = {
      id,
      nombre: formatProductName(nombre),
      ingredientes: formatIngredients(ingredientes),
      video,
      precio: formatPrice(precio)
    };
    
    // Validar usando el validator unificado
    const validation = Validator.validateCocktail(formattedData);
    Validator.throwIfInvalid(validation, 'Cóctel');
    
    super(formattedData);
    this.type = 'cocktail';
    this.category = 'bebida';
  }

  // Eliminamos validateSpecific ya que usamos el validator unificado
}

export { CocktailEntity };