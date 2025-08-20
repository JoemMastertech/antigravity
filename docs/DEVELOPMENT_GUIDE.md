# Guía de Desarrollo para Nuevos Features

## 🎯 Introducción

Esta guía proporciona las mejores prácticas y patrones para desarrollar nuevas funcionalidades en el sistema Master Technology Bar, siguiendo la arquitectura hexagonal implementada.

## 🏗️ Arquitectura y Patrones

### Estructura de Capas

```
📁 Proyecto/
├── 🎯 Dominio/           # Lógica de negocio pura
├── 🔧 Aplicacion/        # Casos de uso y servicios
├── 🔗 Infraestructura/   # Adaptadores y servicios externos
├── 🎨 Interfaces/        # UI y controladores
└── 🛠️ Shared/           # Utilidades compartidas
```

### Principios de Desarrollo

1. **Inversión de Dependencias**: Las capas internas no dependen de las externas
2. **Separación de Responsabilidades**: Cada capa tiene una responsabilidad específica
3. **YAGNI (You Aren't Gonna Need It)**: Solo implementar lo que se necesita
4. **DRY (Don't Repeat Yourself)**: Evitar duplicación de código

## 🚀 Desarrollo de Nuevos Features

### 1. Análisis y Diseño

#### Antes de Codificar:
- [ ] Definir claramente el caso de uso
- [ ] Identificar las entidades del dominio involucradas
- [ ] Diseñar las interfaces necesarias
- [ ] Planificar los tests

#### Ejemplo: Feature de "Favoritos"
```javascript
// 1. Definir la entidad del dominio
// Dominio/entities/favorite-entity.js
class Favorite {
  constructor(userId, productId, dateAdded) {
    this.userId = userId;
    this.productId = productId;
    this.dateAdded = dateAdded;
  }
}
```

### 2. Implementación por Capas

#### Paso 1: Dominio
```javascript
// Dominio/ports/FavoriteRepositoryPort.js
class FavoriteRepositoryPort {
  async addFavorite(favorite) {
    throw new Error('Method not implemented');
  }
  
  async getFavoritesByUser(userId) {
    throw new Error('Method not implemented');
  }
}
```

#### Paso 2: Aplicación
```javascript
// Aplicacion/use-cases/AddFavoriteUseCase.js
import Logger from '../../Shared/utils/logger.js';
import { ErrorHandler } from '../../Shared/utils/errorHandler.js';

class AddFavoriteUseCase {
  constructor(favoriteRepository) {
    this.repository = favoriteRepository;
  }
  
  async execute(userId, productId) {
    try {
      const favorite = new Favorite(userId, productId, new Date());
      const result = await this.repository.addFavorite(favorite);
      Logger.info(`Favorite added: ${productId} for user ${userId}`);
      return result;
    } catch (error) {
      ErrorHandler.handle(error, 'AddFavoriteUseCase');
      throw error;
    }
  }
}
```

#### Paso 3: Infraestructura
```javascript
// Infraestructura/adapters/FavoriteAdapter.js
import BaseAdapter from './BaseAdapter.js';

class FavoriteAdapter extends BaseAdapter {
  async addFavorite(favorite) {
    return this.safeExecuteAsync(
      () => this.client.from('favorites').insert(favorite),
      'addFavorite',
      null
    );
  }
}
```

#### Paso 4: Interfaces
```javascript
// Interfaces/web/ui-adapters/components/favorite-button.js
import { getFavoriteRepository } from '../../../../Shared/utils/diUtils.js';

class FavoriteButton {
  constructor(productId) {
    this.productId = productId;
    this.repository = getFavoriteRepository();
  }
  
  async toggleFavorite() {
    try {
      await this.repository.addFavorite(this.productId);
      this.updateUI();
    } catch (error) {
      this.showError('Error al agregar favorito');
    }
  }
}
```

## 🧪 Testing

### Estrategia de Testing

1. **Tests Unitarios**: Para cada capa por separado
2. **Tests de Integración**: Para flujos completos
3. **Tests E2E**: Para funcionalidades críticas

### Ejemplo de Test Unitario
```javascript
// Shared/testing/AddFavoriteUseCase.test.js
import { describe, it, expect, beforeEach } from './test-framework.js';
import AddFavoriteUseCase from '../../Aplicacion/use-cases/AddFavoriteUseCase.js';

describe('AddFavoriteUseCase', () => {
  let useCase;
  let mockRepository;
  
  beforeEach(() => {
    mockRepository = {
      addFavorite: jest.fn()
    };
    useCase = new AddFavoriteUseCase(mockRepository);
  });
  
  it('should add favorite successfully', async () => {
    mockRepository.addFavorite.mockResolvedValue({ id: 1 });
    
    const result = await useCase.execute('user1', 'product1');
    
    expect(result).toEqual({ id: 1 });
    expect(mockRepository.addFavorite).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user1',
        productId: 'product1'
      })
    );
  });
});
```

## 🔧 Utilidades Disponibles

### Formatters
```javascript
import { formatPrice, formatProductName } from '../../../Shared/utils/formatters.js';

const price = formatPrice(150.00); // "$150.00"
const name = formatProductName('mojito'); // "Mojito"
```

### Error Handling
```javascript
import { ErrorHandler } from '../../../Shared/utils/errorHandler.js';

try {
  // Operación riesgosa
} catch (error) {
  ErrorHandler.handle(error, 'ComponentName');
}
```

### DOM Utilities
```javascript
import { setSafeInnerHTML, showModal } from '../../../Shared/utils/domUtils.js';

setSafeInnerHTML(element, htmlContent); // Sanitiza automáticamente
showModal('modal-id');
```

### Validation
```javascript
import Validator from '../../../Shared/utils/validator.js';

if (Validator.isValidEmail(email)) {
  // Procesar email
}
```

## 📊 Logging y Monitoreo

### Uso del Logger
```javascript
import Logger from '../../../Shared/utils/logger.js';

Logger.info('Feature initialized successfully');
Logger.warn('Deprecated method used');
Logger.error('Critical error occurred', { context: data });
Logger.debug('Debug information', { details: debugData });
```

## 🎨 Estilos y CSS

### Convenciones de CSS

1. **Usar variables CSS** para colores y espaciado
2. **Clases semánticas** en lugar de estilos inline
3. **Mobile-first** approach

```css
/* Shared/styles/main.css */
.favorite-button {
  background-color: var(--primary-color);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius);
}

.favorite-button--active {
  background-color: var(--accent-color);
}
```

## 🔄 Flujo de Datos

### Patrón Recomendado

```
UI Event → Use Case → Domain Logic → Repository → Adapter → External Service
                                        ↓
UI Update ← Formatted Data ← Domain Entity ← Repository ← Adapter ← Response
```

## 📝 Documentación

### JSDoc Estándar
```javascript
/**
 * Adds a product to user favorites
 * @param {string} userId - User identifier
 * @param {string} productId - Product identifier
 * @returns {Promise<Object>} Favorite object with ID
 * @throws {ValidationError} When parameters are invalid
 * @example
 * const favorite = await addFavorite('user123', 'product456');
 */
async function addFavorite(userId, productId) {
  // Implementation
}
```

## 🚨 Consideraciones de Seguridad

1. **Sanitización**: Usar `setSafeInnerHTML` para contenido dinámico
2. **Validación**: Validar todos los inputs del usuario
3. **Autenticación**: Verificar permisos antes de operaciones sensibles

## 🔧 Herramientas de Desarrollo

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run test         # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run lint         # Linting del código
npm run format       # Formatear código
```

### Debugging
```javascript
// Usar el logger en lugar de console.log
Logger.debug('Variable value', { variable: value });

// Para debugging temporal
if (DEBUG) {
  Logger.debug('Debug info', { context });
}
```

## 📋 Checklist para Nuevos Features

### Antes del Commit
- [ ] Tests unitarios escritos y pasando
- [ ] Documentación JSDoc actualizada
- [ ] Estilos CSS siguiendo convenciones
- [ ] Error handling implementado
- [ ] Logging apropiado agregado
- [ ] Validación de inputs implementada
- [ ] Performance considerada
- [ ] Accesibilidad verificada

### Antes del Deploy
- [ ] Tests de integración pasando
- [ ] Tests E2E para flujos críticos
- [ ] Performance testing realizado
- [ ] Revisión de código completada
- [ ] Documentación de usuario actualizada

## 🤝 Colaboración

### Git Workflow
1. Crear branch desde `main`: `feature/nombre-feature`
2. Commits pequeños y descriptivos
3. Pull request con descripción detallada
4. Code review antes de merge

### Convenciones de Naming
- **Archivos**: kebab-case (`favorite-button.js`)
- **Clases**: PascalCase (`FavoriteButton`)
- **Funciones**: camelCase (`addFavorite`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FAVORITES`)

---

**Recuerda**: Esta arquitectura está diseñada para ser mantenible y escalable. Sigue estos patrones para mantener la consistencia del código y facilitar el trabajo en equipo.