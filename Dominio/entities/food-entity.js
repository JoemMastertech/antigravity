import { BaseEntity } from '../../Shared/base/BaseEntity.js';
import Validator from '../../Shared/utils/validator.js';
import { formatProductName, formatIngredients, formatPrice } from '../../Shared/utils/formatters.js';

/**
 * Entidad Food - Representa un alimento en el dominio
 * Usa validators y formatters unificados para simplicidad
 * 
 * @extends BaseEntity
 */
class FoodEntity extends BaseEntity {
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
    const validation = Validator.validateFood(formattedData);
    Validator.throwIfInvalid(validation, 'Comida');
    
    super(formattedData);
    this.type = 'food';
    this.category = 'comida';
  }

  // Eliminamos validateSpecific ya que usamos el validator unificado
}

export { FoodEntity };