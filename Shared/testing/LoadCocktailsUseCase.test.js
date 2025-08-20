/**
 * Unit tests for LoadCocktailsUseCase
 * Tests caching, error handling, and flexible configuration
 */
import { describe, it, expect, beforeEach, jest } from './test-framework.js';
import LoadCocktailsUseCase from '../../Aplicacion/use-cases/LoadCocktailsUseCase.js';

describe('LoadCocktailsUseCase', () => {
  let mockRepository;
  let useCase;
  const mockCocktails = [
    { id: 1, nombre: 'Mojito', precio: 8.50 },
    { id: 2, nombre: 'Piña Colada', precio: 9.00 }
  ];

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      getAllCocktails: jest.fn()
    };
    
    // Reset mock before each test
    mockRepository.getAllCocktails.mockResolvedValue(mockCocktails);
  });

  it('should fetch cocktails successfully on first call', async () => {
    useCase = new LoadCocktailsUseCase(mockRepository);
    
    const result = await useCase.execute();
    
    expect(result).toEqual(mockCocktails);
    expect(mockRepository.getAllCocktails).toHaveBeenCalledTimes(1);
  });

  it('should return cached data on subsequent calls within cache time', async () => {
    useCase = new LoadCocktailsUseCase(mockRepository, { cacheTime: 1000 });
    
    // First call
    const result1 = await useCase.execute();
    // Second call immediately
    const result2 = await useCase.execute();
    
    expect(result1).toEqual(mockCocktails);
    expect(result2).toEqual(mockCocktails);
    expect(mockRepository.getAllCocktails).toHaveBeenCalledTimes(1);
  });

  it('should handle repository errors gracefully with cached data', async () => {
    useCase = new LoadCocktailsUseCase(mockRepository);
    
    // First successful call to populate cache
    await useCase.execute();
    
    // Mock repository to fail on second call
    mockRepository.getAllCocktails.mockRejectedValue(new Error('Database error'));
    
    // Should return cached data instead of throwing
    const result = await useCase.execute();
    expect(result).toEqual(mockCocktails);
  });

  it('should throw error when repository fails and no cache available', async () => {
    useCase = new LoadCocktailsUseCase(mockRepository);
    mockRepository.getAllCocktails.mockRejectedValue(new Error('Database error'));
    
    await expect(useCase.execute()).rejects.toThrow('Failed to load cocktails: Database error');
  });

  it('should respect cache disabled configuration', async () => {
    useCase = new LoadCocktailsUseCase(mockRepository, { enableCache: false });
    
    // Two calls should both hit the repository
    await useCase.execute();
    await useCase.execute();
    
    expect(mockRepository.getAllCocktails).toHaveBeenCalledTimes(2);
  });

  it('should clear cache when clearCache is called', async () => {
    useCase = new LoadCocktailsUseCase(mockRepository);
    
    // First call
    await useCase.execute();
    
    // Clear cache
    useCase.clearCache();
    
    // Second call should hit repository again
    await useCase.execute();
    
    expect(mockRepository.getAllCocktails).toHaveBeenCalledTimes(2);
  });

  it('should use custom cache time configuration', async () => {
    const shortCacheTime = 10; // 10ms
    useCase = new LoadCocktailsUseCase(mockRepository, { cacheTime: shortCacheTime });
    
    // First call
    await useCase.execute();
    
    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, shortCacheTime + 5));
    
    // Second call should hit repository again
    await useCase.execute();
    
    expect(mockRepository.getAllCocktails).toHaveBeenCalledTimes(2);
  });
});