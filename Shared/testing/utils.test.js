/**
 * Unit Tests for Shared Utilities
 * Tests for errorHandler, domUtils, and calculationUtils
 * 
 * @fileoverview Comprehensive test suite for shared utility functions
 * @author Master Technology Bar Development Team
 * @version 1.0.0
 * @since 2024
 * 
 * @module UtilsTests
 */

import { 
  describe, 
  it, 
  expect, 
  beforeEach, 
  afterEach, 
  createMock, 
  spyOn 
} from './test-framework.js';

import { logError, logWarning, handleMissingElementError } from '../utils/errorHandler.js';
import { setSafeInnerHTML, showModal, hideModal } from '../utils/domUtils.js';
import { 
  calculateTotalDrinkCount, 
  calculateTotalJuiceCount, 
  calculateTotalJagerDrinkCount 
} from '../utils/calculationUtils.js';

// Mock DOM elements for testing
function createMockElement(id, innerHTML = '') {
  return {
    id,
    innerHTML,
    style: { display: 'none' },
    classList: {
      add: createMock(),
      remove: createMock(),
      contains: createMock(() => false)
    }
  };
}

describe('Error Utils', () => {
  let consoleSpy;
  
  beforeEach(() => {
    consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleSpy.restore();
  });

  describe('logError', () => {
    it('should log error message to console', () => {
      const message = 'Test error message';
      logError(message);
      
      expect(consoleSpy.callCount).toBe(1);
      expect(consoleSpy.calls[0][0]).toContain(message);
    });

    it('should log error with error object', () => {
      const message = 'Test error';
      const error = new Error('Detailed error');
      logError(message, error);
      
      expect(consoleSpy.callCount).toBe(1);
      expect(consoleSpy.calls[0][0]).toContain(message);
    });

    it('should handle null error object gracefully', () => {
      const message = 'Test error';
      logError(message, null);
      
      expect(consoleSpy.callCount).toBe(1);
      expect(consoleSpy.calls[0][0]).toContain(message);
    });
  });

  describe('logWarning', () => {
    let warnSpy;
    
    beforeEach(() => {
      warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
    });
    
    afterEach(() => {
      warnSpy.restore();
    });

    it('should log warning message to console', () => {
      const message = 'Test warning message';
      logWarning(message);
      
      expect(warnSpy.callCount).toBe(1);
      expect(warnSpy.calls[0][0]).toContain(message);
    });
  });

  describe('handleMissingElementError', () => {
    it('should log error for missing element', () => {
      const elementId = 'missing-element';
      const operation = 'test-operation';
      
      handleMissingElementError(elementId, operation);
      
      expect(consoleSpy.callCount).toBe(1);
      expect(consoleSpy.calls[0][0]).toContain(elementId);
      expect(consoleSpy.calls[0][0]).toContain(operation);
    });
  });
});

describe('DOM Utils', () => {
  let mockElement;
  let documentSpy;
  
  beforeEach(() => {
    mockElement = createMockElement('test-element');
    documentSpy = spyOn(document, 'getElementById').mockReturnValue(mockElement);
  });
  
  afterEach(() => {
    documentSpy.restore();
  });

  describe('setSafeInnerHTML', () => {
    it('should set innerHTML safely', () => {
      const htmlContent = '<p>Safe content</p>';
      const result = setSafeInnerHTML(mockElement, htmlContent);
      
      expect(result).toBe(true);
      expect(mockElement.innerHTML).toContain('Safe content');
    });

    it('should handle null element gracefully', () => {
      const result = setSafeInnerHTML(null, '<p>Content</p>');
      
      expect(result).toBe(false);
    });

    it('should sanitize malicious content', () => {
      const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>';
      setSafeInnerHTML(mockElement, maliciousContent);
      
      // Should not contain script tag
      expect(mockElement.innerHTML).not.toContain('<script>');
      expect(mockElement.innerHTML).toContain('Safe content');
    });
  });

  describe('showModal', () => {
    it('should show modal by setting display style', () => {
      const modalId = 'test-modal';
      const result = showModal(modalId);
      
      expect(documentSpy.callCount).toBe(1);
      expect(documentSpy.calls[0][0]).toBe(modalId);
      expect(result).toBe(true);
      expect(mockElement.style.display).toBe('flex');
    });

    it('should return false for non-existent modal', () => {
      documentSpy.mockReturnValue(null);
      const result = showModal('non-existent-modal');
      
      expect(result).toBe(false);
    });
  });

  describe('hideModal', () => {
    it('should hide modal by setting display style', () => {
      const modalId = 'test-modal';
      const result = hideModal(modalId);
      
      expect(documentSpy.callCount).toBe(1);
      expect(documentSpy.calls[0][0]).toBe(modalId);
      expect(result).toBe(true);
      expect(mockElement.style.display).toBe('none');
    });

    it('should return false for non-existent modal', () => {
      documentSpy.mockReturnValue(null);
      const result = hideModal('non-existent-modal');
      
      expect(result).toBe(false);
    });
  });
});

describe('Calculation Utils', () => {
  describe('calculateTotalDrinkCount', () => {
    it('should calculate total drink count correctly', () => {
      const drinkCounts = {
        'Naranja': 2,
        'Piña': 1
      };
      const result = calculateTotalDrinkCount(drinkCounts, 'VODKA');
      
      // Each drink counts as 2 for VODKA category
      expect(result).toBe(6); // (2*2) + (1*2)
    });

    it('should handle empty drink counts', () => {
      const result = calculateTotalDrinkCount({}, 'VODKA');
      
      expect(result).toBe(0);
    });

    it('should handle different bottle categories', () => {
      const drinkCounts = { 'Naranja': 1 };
      
      const vodkaResult = calculateTotalDrinkCount(drinkCounts, 'VODKA');
      const ronResult = calculateTotalDrinkCount(drinkCounts, 'RON');
      
      expect(vodkaResult).toBe(2); // VODKA multiplier
      expect(ronResult).toBe(2); // RON multiplier
    });
  });

  describe('calculateTotalJuiceCount', () => {
    it('should calculate juice count correctly', () => {
      const drinkCounts = {
        'Naranja': 2,
        'Piña': 1,
        'Beer': 3 // Should not be counted as juice
      };
      const result = calculateTotalJuiceCount(drinkCounts);
      
      expect(result).toBe(3); // Only Naranja and Piña
    });

    it('should handle empty drink counts', () => {
      const result = calculateTotalJuiceCount({});
      
      expect(result).toBe(0);
    });

    it('should only count juice drinks', () => {
      const drinkCounts = {
        'Beer': 5,
        'Vodka': 3,
        'Whisky': 2
      };
      const result = calculateTotalJuiceCount(drinkCounts);
      
      expect(result).toBe(0); // No juice drinks
    });
  });

  describe('calculateTotalJagerDrinkCount', () => {
    it('should calculate Jager drink count correctly', () => {
      const selectedDrinks = ['Botella de Agua', 'Mineral'];
      const drinkCounts = {
        'Botella de Agua': 2,
        'Mineral': 1
      };
      const result = calculateTotalJagerDrinkCount(selectedDrinks, drinkCounts);
      
      expect(result).toBe(3); // 2 + 1
    });

    it('should handle 2 Boost exception', () => {
      const selectedDrinks = ['2 Boost'];
      const drinkCounts = { '2 Boost': 5 };
      const result = calculateTotalJagerDrinkCount(selectedDrinks, drinkCounts);
      
      expect(result).toBe(0); // 2 Boost is excluded
    });

    it('should handle empty selections', () => {
      const result = calculateTotalJagerDrinkCount([], {});
      
      expect(result).toBe(0);
    });

    it('should handle mixed drinks with exception', () => {
      const selectedDrinks = ['Botella de Agua', '2 Boost', 'Mineral'];
      const drinkCounts = {
        'Botella de Agua': 2,
        '2 Boost': 3, // Should be excluded
        'Mineral': 1
      };
      const result = calculateTotalJagerDrinkCount(selectedDrinks, drinkCounts);
      
      expect(result).toBe(3); // Only Botella de Agua and Mineral
    });
  });
});

// Export test runner function for manual execution
export async function runUtilsTests() {
  // Test output - keeping console.log for test visibility
console.log('🧪 Running Shared Utils Tests...');
  const results = await import('./test-framework.js').then(framework => framework.runTests());
  return results;
}