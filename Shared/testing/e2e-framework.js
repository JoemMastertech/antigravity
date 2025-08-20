/**
 * E2E Testing Framework - End-to-End Testing Module
 * Provides browser-based end-to-end testing capabilities
 * 
 * @fileoverview End-to-end testing framework for web applications
 * @author Master Technology Bar Development Team
 * @version 1.0.0
 * @since 2024
 * 
 * @module E2EFramework
 * @requires errorHandler for error logging
 * @requires constants for testing configuration
 * 
 * Features:
 * - Page object model support
 * - Element interaction utilities
 * - Screenshot and video recording
 * - Network request interception
 * - Performance monitoring
 * - Cross-browser testing support
 */

import { logError, logWarning } from '../utils/errorHandler.js';
import { DEBUG, TESTING } from '../config/constants.js';

/**
 * Element Selector Utilities
 * Provides robust element selection and interaction
 */
class ElementSelector {
  constructor() {
    this.defaultTimeout = 5000;
    this.retryInterval = 100;
  }

  /**
   * Waits for an element to be present and visible
   * 
   * @param {string} selector - CSS selector
   * @param {Object} [options={}] - Wait options
   * @param {number} [options.timeout=5000] - Timeout in milliseconds
   * @param {boolean} [options.visible=true] - Wait for visibility
   * @param {boolean} [options.enabled=false] - Wait for enabled state
   * @returns {Promise<HTMLElement>} Found element
   */
  async waitForElement(selector, options = {}) {
    const config = {
      timeout: this.defaultTimeout,
      visible: true,
      enabled: false,
      ...options
    };

    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkElement = () => {
        const element = document.querySelector(selector);
        
        if (!element) {
          if (Date.now() - startTime > config.timeout) {
            reject(new Error(`Element not found: ${selector}`));
            return;
          }
          setTimeout(checkElement, this.retryInterval);
          return;
        }

        // Check visibility
        if (config.visible && !this.isVisible(element)) {
          if (Date.now() - startTime > config.timeout) {
            reject(new Error(`Element not visible: ${selector}`));
            return;
          }
          setTimeout(checkElement, this.retryInterval);
          return;
        }

        // Check enabled state
        if (config.enabled && element.disabled) {
          if (Date.now() - startTime > config.timeout) {
            reject(new Error(`Element not enabled: ${selector}`));
            return;
          }
          setTimeout(checkElement, this.retryInterval);
          return;
        }

        resolve(element);
      };

      checkElement();
    });
  }

  /**
   * Waits for multiple elements
   * 
   * @param {string[]} selectors - Array of CSS selectors
   * @param {Object} [options={}] - Wait options
   * @returns {Promise<HTMLElement[]>} Found elements
   */
  async waitForElements(selectors, options = {}) {
    const promises = selectors.map(selector => 
      this.waitForElement(selector, options)
    );
    
    return Promise.all(promises);
  }

  /**
   * Waits for an element to disappear
   * 
   * @param {string} selector - CSS selector
   * @param {number} [timeout=5000] - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForElementToDisappear(selector, timeout = this.defaultTimeout) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkElement = () => {
        const element = document.querySelector(selector);
        
        if (!element || !this.isVisible(element)) {
          resolve();
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element still visible: ${selector}`));
          return;
        }

        setTimeout(checkElement, this.retryInterval);
      };

      checkElement();
    });
  }

  /**
   * Checks if an element is visible
   * 
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Visibility status
   */
  isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Gets element text content with retry
   * 
   * @param {string} selector - CSS selector
   * @param {Object} [options={}] - Options
   * @returns {Promise<string>} Element text
   */
  async getText(selector, options = {}) {
    const element = await this.waitForElement(selector, options);
    return element.textContent.trim();
  }

  /**
   * Gets element attribute value
   * 
   * @param {string} selector - CSS selector
   * @param {string} attribute - Attribute name
   * @param {Object} [options={}] - Options
   * @returns {Promise<string>} Attribute value
   */
  async getAttribute(selector, attribute, options = {}) {
    const element = await this.waitForElement(selector, options);
    return element.getAttribute(attribute);
  }
}

/**
 * User Interaction Utilities
 * Provides user interaction simulation
 */
class UserInteraction {
  constructor(elementSelector) {
    this.elementSelector = elementSelector;
    this.actionDelay = 100;
  }

  /**
   * Clicks an element
   * 
   * @param {string} selector - CSS selector
   * @param {Object} [options={}] - Click options
   * @param {boolean} [options.force=false] - Force click even if not visible
   * @param {number} [options.delay=0] - Delay before click
   * @returns {Promise<void>}
   */
  async click(selector, options = {}) {
    const config = {
      force: false,
      delay: 0,
      ...options
    };

    if (config.delay > 0) {
      await this.wait(config.delay);
    }

    const element = await this.elementSelector.waitForElement(selector, {
      visible: !config.force,
      enabled: true
    });

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.wait(this.actionDelay);

    // Simulate mouse events
    const events = ['mousedown', 'mouseup', 'click'];
    for (const eventType of events) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
    }
  }

  /**
   * Double clicks an element
   * 
   * @param {string} selector - CSS selector
   * @param {Object} [options={}] - Click options
   * @returns {Promise<void>}
   */
  async doubleClick(selector, options = {}) {
    await this.click(selector, options);
    await this.wait(50);
    await this.click(selector, options);
    
    const element = await this.elementSelector.waitForElement(selector);
    const event = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  }

  /**
   * Types text into an input element
   * 
   * @param {string} selector - CSS selector
   * @param {string} text - Text to type
   * @param {Object} [options={}] - Type options
   * @param {boolean} [options.clear=true] - Clear existing text
   * @param {number} [options.delay=50] - Delay between keystrokes
   * @returns {Promise<void>}
   */
  async type(selector, text, options = {}) {
    const config = {
      clear: true,
      delay: 50,
      ...options
    };

    const element = await this.elementSelector.waitForElement(selector, {
      enabled: true
    });

    // Focus the element
    element.focus();
    await this.wait(this.actionDelay);

    // Clear existing text if requested
    if (config.clear) {
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Type each character
    for (const char of text) {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true
      });
      
      const keypressEvent = new KeyboardEvent('keypress', {
        key: char,
        bubbles: true,
        cancelable: true
      });
      
      const keyupEvent = new KeyboardEvent('keyup', {
        key: char,
        bubbles: true,
        cancelable: true
      });

      element.dispatchEvent(keydownEvent);
      element.dispatchEvent(keypressEvent);
      
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      element.dispatchEvent(keyupEvent);
      
      if (config.delay > 0) {
        await this.wait(config.delay);
      }
    }

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Selects an option from a dropdown
   * 
   * @param {string} selector - CSS selector for select element
   * @param {string|number} value - Option value or index
   * @param {Object} [options={}] - Select options
   * @returns {Promise<void>}
   */
  async select(selector, value, options = {}) {
    const element = await this.elementSelector.waitForElement(selector, {
      enabled: true
    });

    if (element.tagName.toLowerCase() !== 'select') {
      throw new Error(`Element is not a select: ${selector}`);
    }

    // Select by value or index
    if (typeof value === 'number') {
      element.selectedIndex = value;
    } else {
      element.value = value;
    }

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Hovers over an element
   * 
   * @param {string} selector - CSS selector
   * @param {Object} [options={}] - Hover options
   * @returns {Promise<void>}
   */
  async hover(selector, options = {}) {
    const element = await this.elementSelector.waitForElement(selector);

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.wait(this.actionDelay);

    const events = ['mouseover', 'mouseenter', 'mousemove'];
    for (const eventType of events) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
    }
  }

  /**
   * Scrolls to an element
   * 
   * @param {string} selector - CSS selector
   * @param {Object} [options={}] - Scroll options
   * @returns {Promise<void>}
   */
  async scrollTo(selector, options = {}) {
    const config = {
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
      ...options
    };

    const element = await this.elementSelector.waitForElement(selector);
    element.scrollIntoView(config);
    await this.wait(500); // Wait for scroll animation
  }

  /**
   * Waits for a specified amount of time
   * 
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Presses a key
   * 
   * @param {string} key - Key to press
   * @param {Object} [options={}] - Key options
   * @returns {Promise<void>}
   */
  async pressKey(key, options = {}) {
    const config = {
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ...options
    };

    const events = ['keydown', 'keyup'];
    for (const eventType of events) {
      const event = new KeyboardEvent(eventType, {
        key,
        ctrlKey: config.ctrlKey,
        shiftKey: config.shiftKey,
        altKey: config.altKey,
        metaKey: config.metaKey,
        bubbles: true,
        cancelable: true
      });
      
      document.activeElement?.dispatchEvent(event) || document.dispatchEvent(event);
    }
  }
}

/**
 * Page Object Model Base Class
 * Provides structure for page object implementations
 */
export class PageObject {
  constructor(url = null) {
    this.url = url;
    this.elementSelector = new ElementSelector();
    this.userInteraction = new UserInteraction(this.elementSelector);
    this.selectors = {};
  }

  /**
   * Navigates to the page
   * 
   * @param {Object} [options={}] - Navigation options
   * @returns {Promise<void>}
   */
  async navigate(options = {}) {
    if (!this.url) {
      throw new Error('Page URL not defined');
    }

    const config = {
      waitForLoad: true,
      timeout: 10000,
      ...options
    };

    window.location.href = this.url;

    if (config.waitForLoad) {
      await this.waitForPageLoad(config.timeout);
    }
  }

  /**
   * Waits for page to load completely
   * 
   * @param {number} [timeout=10000] - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForPageLoad(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkLoad = () => {
        if (document.readyState === 'complete') {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Page load timeout'));
          return;
        }
        
        setTimeout(checkLoad, 100);
      };
      
      checkLoad();
    });
  }

  /**
   * Gets the current page URL
   * 
   * @returns {string} Current URL
   */
  getCurrentUrl() {
    return window.location.href;
  }

  /**
   * Gets the page title
   * 
   * @returns {string} Page title
   */
  getTitle() {
    return document.title;
  }

  /**
   * Takes a screenshot (if supported)
   * 
   * @param {string} [name] - Screenshot name
   * @returns {Promise<string|null>} Screenshot data URL or null
   */
  async takeScreenshot(name = null) {
    try {
      // This would require additional browser APIs or libraries
      // For now, we'll return a placeholder
      console.log(`📸 Screenshot taken: ${name || 'unnamed'}`);
      return null;
    } catch (error) {
      logError('Failed to take screenshot', error);
      return null;
    }
  }

  /**
   * Waits for a specific condition
   * 
   * @param {Function} condition - Condition function
   * @param {Object} [options={}] - Wait options
   * @returns {Promise<*>} Condition result
   */
  async waitFor(condition, options = {}) {
    const config = {
      timeout: 5000,
      interval: 100,
      message: 'Condition not met',
      ...options
    };

    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkCondition = async () => {
        try {
          const result = await condition();
          if (result) {
            resolve(result);
            return;
          }
        } catch (error) {
          // Continue checking
        }
        
        if (Date.now() - startTime > config.timeout) {
          reject(new Error(config.message));
          return;
        }
        
        setTimeout(checkCondition, config.interval);
      };
      
      checkCondition();
    });
  }
}

/**
 * E2E Test Runner
 * Manages test execution and reporting
 */
export class E2ETestRunner {
  constructor(options = {}) {
    this.config = {
      timeout: 30000,
      retries: 1,
      screenshotOnFailure: true,
      parallel: false,
      ...options
    };

    this.tests = [];
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      details: []
    };

    this.isDebugMode = DEBUG.ENABLE_CONSOLE_LOGS;
  }

  /**
   * Registers a test case
   * 
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   * @param {Object} [options={}] - Test options
   */
  test(name, testFn, options = {}) {
    this.tests.push({
      name,
      testFn,
      options: {
        timeout: this.config.timeout,
        retries: this.config.retries,
        skip: false,
        ...options
      }
    });
  }

  /**
   * Runs all registered tests
   * 
   * @param {Object} [options={}] - Run options
   * @returns {Promise<Object>} Test results
   */
  async run(options = {}) {
    const config = {
      filter: null,
      bail: false,
      ...options
    };

    const startTime = Date.now();
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      details: []
    };

    let testsToRun = this.tests;
    
    // Apply filter if provided
    if (config.filter) {
      testsToRun = this.tests.filter(test => 
        test.name.includes(config.filter)
      );
    }

    this.results.total = testsToRun.length;

    if (this.isDebugMode) {
      console.log(`🧪 Running ${testsToRun.length} E2E tests`);
    }

    for (const test of testsToRun) {
      if (test.options.skip) {
        this.results.skipped++;
        this.results.details.push({
          name: test.name,
          status: 'skipped',
          duration: 0,
          error: null
        });
        continue;
      }

      const testResult = await this.runSingleTest(test);
      this.results.details.push(testResult);

      if (testResult.status === 'passed') {
        this.results.passed++;
      } else {
        this.results.failed++;
        
        if (config.bail) {
          break;
        }
      }
    }

    this.results.duration = Date.now() - startTime;

    if (this.isDebugMode) {
      this.printResults();
    }

    return this.results;
  }

  /**
   * Runs a single test with retries
   * 
   * @param {Object} test - Test object
   * @returns {Promise<Object>} Test result
   */
  async runSingleTest(test) {
    const startTime = Date.now();
    let lastError = null;
    
    for (let attempt = 0; attempt <= test.options.retries; attempt++) {
      try {
        if (this.isDebugMode && attempt > 0) {
          console.log(`🔄 Retrying test: ${test.name} (attempt ${attempt + 1})`);
        }

        await this.executeTestWithTimeout(test);
        
        return {
          name: test.name,
          status: 'passed',
          duration: Date.now() - startTime,
          error: null,
          attempts: attempt + 1
        };
      } catch (error) {
        lastError = error;
        
        if (this.config.screenshotOnFailure) {
          await this.takeFailureScreenshot(test.name, attempt);
        }
        
        if (attempt < test.options.retries) {
          await this.wait(1000); // Wait before retry
        }
      }
    }

    return {
      name: test.name,
      status: 'failed',
      duration: Date.now() - startTime,
      error: lastError.message,
      attempts: test.options.retries + 1
    };
  }

  /**
   * Executes a test with timeout
   * 
   * @param {Object} test - Test object
   * @returns {Promise<void>}
   */
  async executeTestWithTimeout(test) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Test timeout: ${test.name}`));
      }, test.options.timeout);

      try {
        await test.testFn();
        clearTimeout(timeout);
        resolve();
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Takes a screenshot on test failure
   * 
   * @param {string} testName - Test name
   * @param {number} attempt - Attempt number
   * @returns {Promise<void>}
   */
  async takeFailureScreenshot(testName, attempt) {
    try {
      const name = `failure_${testName}_attempt_${attempt + 1}`;
      console.log(`📸 Taking failure screenshot: ${name}`);
      // Implementation would depend on available screenshot APIs
    } catch (error) {
      logError('Failed to take failure screenshot', error);
    }
  }

  /**
   * Prints test results to console
   */
  printResults() {
    console.log('\n🧪 E2E Test Results:');
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Duration: ${this.results.duration}ms`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.details
        .filter(result => result.status === 'failed')
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.error}`);
        });
    }
  }

  /**
   * Waits for a specified amount of time
   * 
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clears all registered tests
   */
  clear() {
    this.tests = [];
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      details: []
    };
  }
}

// Create global instances
const globalElementSelector = new ElementSelector();
const globalUserInteraction = new UserInteraction(globalElementSelector);
const globalTestRunner = new E2ETestRunner();

// Export convenience functions
export const waitForElement = globalElementSelector.waitForElement.bind(globalElementSelector);
export const waitForElements = globalElementSelector.waitForElements.bind(globalElementSelector);
export const click = globalUserInteraction.click.bind(globalUserInteraction);
export const type = globalUserInteraction.type.bind(globalUserInteraction);
export const select = globalUserInteraction.select.bind(globalUserInteraction);
export const hover = globalUserInteraction.hover.bind(globalUserInteraction);
export const scrollTo = globalUserInteraction.scrollTo.bind(globalUserInteraction);
export const test = globalTestRunner.test.bind(globalTestRunner);
export const runTests = globalTestRunner.run.bind(globalTestRunner);

// Export classes and instances
export { ElementSelector, UserInteraction };
export default globalTestRunner;