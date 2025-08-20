/**
 * Lightweight Testing Framework for Master Technology Bar
 * Browser-compatible testing utilities with Jest-like syntax
 * 
 * @fileoverview Simple testing framework for unit and integration tests
 * @author Master Technology Bar Development Team
 * @version 1.0.0
 * @since 2024
 * 
 * @module TestFramework
 * 
 * Features:
 * - Jest-like syntax for familiar testing experience
 * - Browser-compatible (no Node.js dependencies)
 * - Async test support
 * - Mocking and spying capabilities
 * - Test result reporting and statistics
 * - Integration with existing error handling
 */

import { logError, logWarning } from '../utils/errorHandler.js';

/**
 * Test Framework State
 * Manages test execution state and results
 */
class TestFramework {
  constructor() {
    this.tests = [];
    this.currentSuite = null;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };
    this.mocks = new Map();
    this.spies = new Map();
  }

  /**
   * Defines a test suite
   * @param {string} description - Suite description
   * @param {Function} fn - Suite function containing tests
   */
  describe(description, fn) {
    const previousSuite = this.currentSuite;
    this.currentSuite = {
      description,
      tests: [],
      beforeEach: null,
      afterEach: null,
      beforeAll: null,
      afterAll: null
    };
    
    try {
      fn();
      this.tests.push(this.currentSuite);
    } catch (error) {
      logError(`Error in test suite "${description}"`, error);
    } finally {
      this.currentSuite = previousSuite;
    }
  }

  /**
   * Defines a test case
   * @param {string} description - Test description
   * @param {Function} fn - Test function
   */
  it(description, fn) {
    if (!this.currentSuite) {
      throw new Error('Tests must be defined within a describe block');
    }

    this.currentSuite.tests.push({
      description,
      fn,
      skip: false
    });
  }

  /**
   * Skips a test case
   * @param {string} description - Test description
   * @param {Function} fn - Test function (not executed)
   */
  xit(description, fn) {
    if (!this.currentSuite) {
      throw new Error('Tests must be defined within a describe block');
    }

    this.currentSuite.tests.push({
      description,
      fn,
      skip: true
    });
  }

  /**
   * Setup function to run before each test
   * @param {Function} fn - Setup function
   */
  beforeEach(fn) {
    if (!this.currentSuite) {
      throw new Error('beforeEach must be defined within a describe block');
    }
    this.currentSuite.beforeEach = fn;
  }

  /**
   * Cleanup function to run after each test
   * @param {Function} fn - Cleanup function
   */
  afterEach(fn) {
    if (!this.currentSuite) {
      throw new Error('afterEach must be defined within a describe block');
    }
    this.currentSuite.afterEach = fn;
  }

  /**
   * Setup function to run before all tests in suite
   * @param {Function} fn - Setup function
   */
  beforeAll(fn) {
    if (!this.currentSuite) {
      throw new Error('beforeAll must be defined within a describe block');
    }
    this.currentSuite.beforeAll = fn;
  }

  /**
   * Cleanup function to run after all tests in suite
   * @param {Function} fn - Cleanup function
   */
  afterAll(fn) {
    if (!this.currentSuite) {
      throw new Error('afterAll must be defined within a describe block');
    }
    this.currentSuite.afterAll = fn;
  }

  /**
   * Runs all defined tests
   * @returns {Promise<Object>} Test results
   */
  async runTests() {
    console.log('🧪 Starting Test Execution...');
    this.results = { passed: 0, failed: 0, skipped: 0, total: 0 };

    for (const suite of this.tests) {
      console.log(`\n📋 Suite: ${suite.description}`);
      
      // Run beforeAll
      if (suite.beforeAll) {
        try {
          await suite.beforeAll();
        } catch (error) {
          logError(`beforeAll failed in suite "${suite.description}"`, error);
          continue;
        }
      }

      // Run tests
      for (const test of suite.tests) {
        this.results.total++;
        
        if (test.skip) {
          console.log(`  ⏭️  ${test.description} (skipped)`);
          this.results.skipped++;
          continue;
        }

        try {
          // Run beforeEach
          if (suite.beforeEach) {
            await suite.beforeEach();
          }

          // Run test
          await test.fn();
          
          console.log(`  ✅ ${test.description}`);
          this.results.passed++;

          // Run afterEach
          if (suite.afterEach) {
            await suite.afterEach();
          }
        } catch (error) {
          console.log(`  ❌ ${test.description}`);
          console.log(`     Error: ${error.message}`);
          this.results.failed++;
        }
      }

      // Run afterAll
      if (suite.afterAll) {
        try {
          await suite.afterAll();
        } catch (error) {
          logError(`afterAll failed in suite "${suite.description}"`, error);
        }
      }
    }

    this.printResults();
    return this.results;
  }

  /**
   * Prints test execution results
   */
  printResults() {
    console.log('\n📊 Test Results:');
    console.log(`  Total: ${this.results.total}`);
    console.log(`  ✅ Passed: ${this.results.passed}`);
    console.log(`  ❌ Failed: ${this.results.failed}`);
    console.log(`  ⏭️  Skipped: ${this.results.skipped}`);
    
    const successRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(1)
      : 0;
    console.log(`  📈 Success Rate: ${successRate}%`);
  }

  /**
   * Creates a mock function
   * @param {Function} implementation - Optional mock implementation
   * @returns {Function} Mock function
   */
  createMock(implementation = () => {}) {
    const mock = (...args) => {
      mock.calls.push(args);
      mock.callCount++;
      return implementation(...args);
    };
    
    mock.calls = [];
    mock.callCount = 0;
    mock.mockImplementation = (newImpl) => {
      implementation = newImpl;
      return mock;
    };
    mock.mockReturnValue = (value) => {
      implementation = () => value;
      return mock;
    };
    mock.mockResolvedValue = (value) => {
      implementation = () => Promise.resolve(value);
      return mock;
    };
    mock.mockRejectedValue = (error) => {
      implementation = () => Promise.reject(error);
      return mock;
    };
    
    return mock;
  }

  /**
   * Spies on an object method
   * @param {Object} object - Target object
   * @param {string} methodName - Method name to spy on
   * @returns {Function} Spy function
   */
  spyOn(object, methodName) {
    const originalMethod = object[methodName];
    const spy = this.createMock(originalMethod);
    
    object[methodName] = spy;
    spy.restore = () => {
      object[methodName] = originalMethod;
    };
    
    this.spies.set(`${object.constructor.name}.${methodName}`, spy);
    return spy;
  }

  /**
   * Restores all spies
   */
  restoreAllSpies() {
    this.spies.forEach(spy => {
      if (spy.restore) {
        spy.restore();
      }
    });
    this.spies.clear();
  }
}

/**
 * Assertion utilities with Jest-like syntax
 */
class Expect {
  constructor(actual) {
    this.actual = actual;
    this.isNot = false;
  }

  get not() {
    this.isNot = true;
    return this;
  }

  toBe(expected) {
    const passed = this.isNot ? this.actual !== expected : this.actual === expected;
    if (!passed) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be ${expected}`
      );
    }
  }

  toEqual(expected) {
    const passed = this.isNot 
      ? !this.deepEqual(this.actual, expected)
      : this.deepEqual(this.actual, expected);
    if (!passed) {
      throw new Error(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to equal ${JSON.stringify(expected)}`
      );
    }
  }

  toBeTruthy() {
    const passed = this.isNot ? !this.actual : !!this.actual;
    if (!passed) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be truthy`
      );
    }
  }

  toBeFalsy() {
    const passed = this.isNot ? !!this.actual : !this.actual;
    if (!passed) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be falsy`
      );
    }
  }

  toContain(expected) {
    const contains = Array.isArray(this.actual) 
      ? this.actual.includes(expected)
      : this.actual.indexOf(expected) !== -1;
    const passed = this.isNot ? !contains : contains;
    if (!passed) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'not ' : ''}to contain ${expected}`
      );
    }
  }

  toThrow(expectedError) {
    let threw = false;
    let actualError = null;
    
    try {
      if (typeof this.actual === 'function') {
        this.actual();
      }
    } catch (error) {
      threw = true;
      actualError = error;
    }
    
    const passed = this.isNot ? !threw : threw;
    if (!passed) {
      throw new Error(
        `Expected function ${this.isNot ? 'not ' : ''}to throw${expectedError ? ` ${expectedError}` : ''}`
      );
    }
    
    if (expectedError && threw) {
      if (typeof expectedError === 'string' && !actualError.message.includes(expectedError)) {
        throw new Error(
          `Expected error message to contain "${expectedError}", but got "${actualError.message}"`
        );
      }
    }
  }

  deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      return true;
    }
    
    return false;
  }
}

// Create global test framework instance
const testFramework = new TestFramework();

// Export global functions
export const describe = testFramework.describe.bind(testFramework);
export const it = testFramework.it.bind(testFramework);
export const xit = testFramework.xit.bind(testFramework);
export const beforeEach = testFramework.beforeEach.bind(testFramework);
export const afterEach = testFramework.afterEach.bind(testFramework);
export const beforeAll = testFramework.beforeAll.bind(testFramework);
export const afterAll = testFramework.afterAll.bind(testFramework);
export const runTests = testFramework.runTests.bind(testFramework);
export const createMock = testFramework.createMock.bind(testFramework);
export const spyOn = testFramework.spyOn.bind(testFramework);
export const restoreAllSpies = testFramework.restoreAllSpies.bind(testFramework);

/**
 * Creates an expectation for testing
 * @param {*} actual - The actual value to test
 * @returns {Expect} Expectation object with assertion methods
 */
export function expect(actual) {
  return new Expect(actual);
}

// Export the framework instance for advanced usage
export default testFramework;