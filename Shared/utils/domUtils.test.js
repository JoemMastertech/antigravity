/**
 * Unit Tests for domUtils.js
 * Tests the modal auto-enhancement functionality and other utilities
 * 
 * @author AI Assistant
 * @version 1.1.0
 * @since 2024
 */

import { 
  showModal, 
  hideModal, 
  setSafeInnerHTML, 
  getElementSafely, 
  updateElementText, 
  toggleElementClass,
  clearModalCache,
  getModalCacheStats
} from './domUtils.js';

/**
 * Test suite for domUtils functionality
 */
class DomUtilsTests {
  constructor() {
    this.setupMockDOM();
  }
  
  /**
   * Setup mock DOM environment for testing
   */
  setupMockDOM() {
    // Ensure we have a document object for testing
    if (typeof document === 'undefined') {
      console.warn('⚠️ Running tests without DOM environment');
      return;
    }
  }
  
  /**
   * Test auto-enhancement of modals
   */
  testAutoEnhancement() {
    const modal = document.createElement('div');
    modal.id = 'test-modal-auto';
    modal.style.display = 'none';
    document.body.appendChild(modal);
    
    // Modal should not have show/hide methods initially
    if (typeof modal.show === 'undefined' && typeof modal.hide === 'undefined') {
      console.log('✅ Modal initially lacks show/hide methods');
    }
    
    // Show modal - should auto-enhance
    showModal('test-modal-auto');
    
    if (typeof modal.show === 'function' && typeof modal.hide === 'function') {
      console.log('✅ Modal auto-enhancement test passed');
    } else {
      console.error('❌ Modal auto-enhancement test failed');
    }
    
    document.body.removeChild(modal);
  }
  
  /**
   * Test that already enhanced modals are preserved
   */
  testPreserveEnhanced() {
    const modal = document.createElement('div');
    modal.id = 'test-modal-preserve';
    modal.style.display = 'none';
    
    // Pre-enhance with custom methods
    modal.show = function() { this.customShow = true; };
    modal.hide = function() { this.customHide = true; };
    
    document.body.appendChild(modal);
    
    showModal('test-modal-preserve');
    
    if (modal.customShow === true) {
      console.log('✅ Pre-enhanced modal preservation test passed');
    } else {
      console.error('❌ Pre-enhanced modal preservation test failed');
    }
    
    document.body.removeChild(modal);
  }
  
  /**
   * Test hideModal functionality
   */
  testHideModal() {
    const modal = document.createElement('div');
    modal.id = 'test-modal-hide';
    modal.style.display = 'flex';
    document.body.appendChild(modal);
    
    hideModal('test-modal-hide');
    
    if (typeof modal.hide === 'function' && modal.style.display === 'none') {
      console.log('✅ hideModal test passed');
    } else {
      console.error('❌ hideModal test failed');
    }
    
    document.body.removeChild(modal);
  }
  
  /**
   * Test error handling for non-existent modals
   */
  testNonExistentModal() {
    // Capture console.error to test error handling
    const originalError = console.error;
    let errorCalled = false;
    
    console.error = function(...args) {
      if (args[0].includes('not found')) {
        errorCalled = true;
      }
      originalError.apply(console, args);
    };
    
    showModal('non-existent-modal');
    
    console.error = originalError;
    
    if (errorCalled) {
      console.log('✅ Non-existent modal error handling test passed');
    } else {
      console.error('❌ Non-existent modal error handling test failed');
    }
  }
  
  /**
   * Test setSafeInnerHTML functionality
   */
  testSetSafeInnerHTML() {
    const testDiv = document.createElement('div');
    testDiv.id = 'test-div';
    document.body.appendChild(testDiv);
    
    setSafeInnerHTML('test-div', '<p>Safe content</p>');
    
    if (testDiv.innerHTML === '<p>Safe content</p>') {
      console.log('✅ setSafeInnerHTML test passed');
    } else {
      console.error('❌ setSafeInnerHTML test failed');
    }
    
    document.body.removeChild(testDiv);
  }
  
  /**
   * Test modal cache functionality
   */
  testModalCache() {
    // Clear cache first
    clearModalCache();
    
    const modal1 = document.createElement('div');
    modal1.id = 'cache-test-modal-1';
    modal1.style.display = 'none';
    document.body.appendChild(modal1);
    
    const modal2 = document.createElement('div');
    modal2.id = 'cache-test-modal-2';
    modal2.style.display = 'none';
    document.body.appendChild(modal2);
    
    // Test initial cache state
    let stats = getModalCacheStats();
    if (stats.size === 0) {
      console.log('✅ Initial cache is empty');
    } else {
      console.error('❌ Initial cache should be empty');
    }
    
    // Show modals to trigger enhancement and caching
    showModal('cache-test-modal-1');
    showModal('cache-test-modal-2');
    
    // Check cache after enhancement
    stats = getModalCacheStats();
    if (stats.size === 2 && stats.enhancedModals.includes('cache-test-modal-1') && stats.enhancedModals.includes('cache-test-modal-2')) {
      console.log('✅ Cache correctly stores enhanced modals');
    } else {
      console.error('❌ Cache should contain both enhanced modals');
    }
    
    // Test selective cache clearing
    clearModalCache('cache-test-modal-1');
    stats = getModalCacheStats();
    if (stats.size === 1 && stats.enhancedModals.includes('cache-test-modal-2')) {
      console.log('✅ Selective cache clearing works');
    } else {
      console.error('❌ Selective cache clearing failed');
    }
    
    // Test full cache clearing
    clearModalCache();
    stats = getModalCacheStats();
    if (stats.size === 0) {
      console.log('✅ Full cache clearing works');
    } else {
      console.error('❌ Full cache clearing failed');
    }
    
    // Cleanup
    document.body.removeChild(modal1);
    document.body.removeChild(modal2);
  }
  
  /**
   * Test cache performance (modals should not be re-enhanced)
   */
  testCachePerformance() {
    clearModalCache();
    
    const modal = document.createElement('div');
    modal.id = 'performance-test-modal';
    modal.style.display = 'none';
    document.body.appendChild(modal);
    
    // First show - should enhance and cache
    showModal('performance-test-modal');
    const originalShow = modal.show;
    
    // Second show - should use cached enhancement
    showModal('performance-test-modal');
    
    if (modal.show === originalShow) {
      console.log('✅ Cache performance test passed - modal not re-enhanced');
    } else {
      console.error('❌ Cache performance test failed - modal was re-enhanced');
    }
    
    document.body.removeChild(modal);
  }
  
  /**
   * Run all tests
   */
  runAllTests() {
    console.log('🧪 Running domUtils.js tests...');
    
    this.testAutoEnhancement();
    this.testPreserveEnhanced();
    this.testHideModal();
    this.testNonExistentModal();
    this.testSetSafeInnerHTML();
    this.testModalCache();
    this.testCachePerformance();
    
    console.log('✨ domUtils.js tests completed!');
  }
}

// Export for use in other test files or manual testing
export default DomUtilsTests;

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const tests = new DomUtilsTests();
    tests.runAllTests();
  });
}