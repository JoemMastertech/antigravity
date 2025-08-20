import { ValidationError } from '../../Dominio/exceptions/ValidationError.js';

export class BaseEntity {
  constructor(data = {}) {
    // Asignar propiedades
    Object.assign(this, data);
    
    // Validar automáticamente al crear
    this.validate();
    
    // Metadatos de entidad
    this.createdAt = new Date().toISOString();
    this.entityType = this.constructor.name.replace('Entity', '').toLowerCase();
  }

  validate() {
    const requiredFields = this.getRequiredFields();
    const missingFields = requiredFields.filter(field => {
      const value = this[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      const entityName = this.constructor.name.replace('Entity', '');
      throw new ValidationError(
        `Datos incompletos para ${entityName}. Campos requeridos: ${missingFields.join(', ')}`
      );
    }

    // Validaciones específicas adicionales
    this.validateSpecific();
  }

  getRequiredFields() {
    return ['id', 'nombre', 'precio'];
  }

  validateSpecific() {
    // Validación de precio
    if (this.precio !== undefined && (isNaN(this.precio) || this.precio < 0)) {
      throw new ValidationError('El precio debe ser un número válido mayor o igual a 0');
    }

    // Validación de nombre
    if (this.nombre && typeof this.nombre !== 'string') {
      throw new ValidationError('El nombre debe ser una cadena de texto');
    }

    // Validación de ID
    if (this.id && typeof this.id !== 'string') {
      throw new ValidationError('El ID debe ser una cadena de texto');
    }
  }

  toPlainObject() {
    const obj = { ...this };
    // Remover metadatos internos si es necesario
    return obj;
  }

  toJSON() {
    return JSON.stringify(this.toPlainObject());
  }

  clone() {
    return new this.constructor(this.toPlainObject());
  }

  equals(other) {
    if (!other || this.constructor !== other.constructor) {
      return false;
    }
    return this.id === other.id;
  }

  toString() {
    return `${this.constructor.name}(id: ${this.id}, nombre: ${this.nombre})`;
  }
}

export default BaseEntity;