/**
 * Integration tests for Order System
 * Tests the complete order flow from UI to core logic
 * Part of Phase 3 - Expanded test coverage for critical components
 */
import { describe, it, expect, beforeEach, jest } from './test-framework.js';
import OrderSystem from '../../Interfaces/web/ui-adapters/components/order-system.js';
import OrderSystemCore from '../../Aplicacion/services/OrderCore.js';

describe('OrderSystem Integration Tests', () => {
  let orderSystem;
  let mockProductRepository;
  let mockContainer;

  const mockProducts = {
    licores: [
      { id: '1', nombre: 'RON BACARDI', precio: '$200.00', category: 'licores' },
      { id: '2', nombre: 'TEQUILA JOSE CUERVO', precio: '$250.00', category: 'licores' }
    ],
    refrescos: [
      { id: '3', nombre: 'Coca Cola', precio: '$25.00', category: 'refrescos' },
      { id: '4', nombre: 'Agua Mineral', precio: '$20.00', category: 'refrescos' }
    ]
  };

  beforeEach(() => {
    // Mock DOM container
    mockContainer = {
      innerHTML: '',
      querySelector: jest.fn(),
      addEventListener: jest.fn()
    };

    // Mock product repository
    mockProductRepository = {
      getLicores: jest.fn().mockResolvedValue(mockProducts.licores),
      getRefrescos: jest.fn().mockResolvedValue(mockProducts.refrescos)
    };

    // Mock DOM elements
    global.document = {
      querySelector: jest.fn(),
      getElementById: jest.fn(),
      createElement: jest.fn(() => ({
        innerHTML: '',
        addEventListener: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() }
      }))
    };

    orderSystem = new OrderSystem(mockProductRepository);
  });

  describe('Order Creation Flow', () => {
    it('should initialize order system correctly', async () => {
      await orderSystem.init(mockContainer);
      
      expect(orderSystem.isInitialized).toBe(true);
      expect(orderSystem.core).toBeInstanceOf(OrderSystemCore);
    });

    it('should add product to order successfully', () => {
      const product = {
        name: 'RON BACARDI',
        price: '$200.00',
        category: 'licores',
        customizations: ['Mineral', 'Coca']
      };

      orderSystem.addProductToOrder(product);
      
      const orders = orderSystem.getOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0].name).toBe('RON BACARDI');
      expect(orders[0].customizations).toEqual(['Mineral', 'Coca']);
    });

    it('should calculate total correctly with multiple products', () => {
      const products = [
        { name: 'RON BACARDI', price: '$200.00', category: 'licores' },
        { name: 'Coca Cola', price: '$25.00', category: 'refrescos' }
      ];

      products.forEach(product => orderSystem.addProductToOrder(product));
      
      const total = orderSystem.calculateTotal();
      expect(total).toBe(225.00);
    });
  });

  describe('Product Options Validation', () => {
    it('should validate drink selection for liquor products', () => {
      orderSystem.currentProduct = {
        name: 'RON BACARDI',
        category: 'licores',
        price: '$200.00'
      };
      orderSystem.selectedDrinks = ['Mineral', 'Coca'];
      orderSystem.drinkCounts = { 'Mineral': 1, 'Coca': 1 };

      const isValid = orderSystem._hasValidDrinkSelection();
      expect(isValid).toBe(true);
    });

    it('should reject invalid drink combinations', () => {
      orderSystem.currentProduct = {
        name: 'RON BACARDI',
        category: 'licores',
        price: '$200.00'
      };
      orderSystem.selectedDrinks = [];
      orderSystem.drinkCounts = {};

      const isValid = orderSystem._hasValidDrinkSelection();
      expect(isValid).toBe(false);
    });
  });

  describe('Order Management', () => {
    it('should clear order successfully', () => {
      // Add some products first
      orderSystem.addProductToOrder({ name: 'Test Product', price: '$100.00' });
      expect(orderSystem.getOrders()).toHaveLength(1);

      orderSystem.clearOrder();
      expect(orderSystem.getOrders()).toHaveLength(0);
    });

    it('should remove specific product from order', () => {
      orderSystem.addProductToOrder({ name: 'Product 1', price: '$100.00' });
      orderSystem.addProductToOrder({ name: 'Product 2', price: '$150.00' });
      
      expect(orderSystem.getOrders()).toHaveLength(2);
      
      orderSystem.removeFromOrder(0);
      expect(orderSystem.getOrders()).toHaveLength(1);
      expect(orderSystem.getOrders()[0].name).toBe('Product 2');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockProductRepository.getLicores.mockRejectedValue(new Error('Database error'));
      
      // Should not throw error
      await expect(orderSystem.init(mockContainer)).resolves.not.toThrow();
    });

    it('should handle missing DOM elements gracefully', () => {
      global.document.querySelector.mockReturnValue(null);
      
      // Should not throw error when elements are missing
      expect(() => orderSystem._showModal('test-modal')).not.toThrow();
    });
  });

  describe('UI State Management', () => {
    it('should toggle order mode correctly', () => {
      expect(orderSystem.isOrderMode).toBe(false);
      
      orderSystem.toggleOrderMode();
      expect(orderSystem.isOrderMode).toBe(true);
      
      orderSystem.toggleOrderMode();
      expect(orderSystem.isOrderMode).toBe(false);
    });

    it('should update UI when products are added', () => {
      const mockUpdateUI = jest.spyOn(orderSystem, 'updateOrderDisplay');
      
      orderSystem.addProductToOrder({ name: 'Test Product', price: '$100.00' });
      
      expect(mockUpdateUI).toHaveBeenCalled();
    });
  });
});