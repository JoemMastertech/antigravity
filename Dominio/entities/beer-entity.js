import { BaseEntity } from '../../Shared/base/BaseEntity.js';
import Validator from '../../Shared/utils/validator.js';
import { formatProductName, formatPrice } from '../../Shared/utils/formatters.js';

class BeerEntity extends BaseEntity {
  constructor(id, nombre, imagen, precio) {
    // Formatear datos antes de crear la entidad
    const formattedData = {
      id,
      nombre: formatProductName(nombre),
      imagen,
      precio: formatPrice(precio)
    };
    
    // Validar usando el validator unificado
    const validation = Validator.validateBeer(formattedData);
    Validator.throwIfInvalid(validation, 'Cerveza');
    
    super(formattedData);
    this.type = 'beer';
    this.category = 'bebida';
  }

  // Eliminamos validateSpecific ya que usamos el validator unificado
}

export { BeerEntity };