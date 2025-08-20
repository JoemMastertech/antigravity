/**
 * DOM utilities: safe HTML insertion, modal management, element manipulation
 */
import { sanitizeHTML } from './sanitizer.js';
import { handleXSSError } from './errorHandler.js';
import Logger from './logger.js';

const enhancedModalsCache = new Set();

export function setSafeInnerHTML(element, html) {
  if (!element || typeof element.innerHTML === 'undefined') {
    Logger.error('setSafeInnerHTML: Invalid element provided');
    return false;
  }
  
  if (typeof html !== 'string') {
    handleXSSError('setSafeInnerHTML', html);
    return false;
  }
  
  try {
    element.innerHTML = sanitizeHTML(html);
    return true;
  } catch (error) {
    handleXSSError('setSafeInnerHTML', { html, error: error.message });
    return false;
  }
}

/**
 * Simplified modal management
 * @param {string} modalId - Modal element ID
 */
export function showModal(modalId) {
  const modal = getElementSafely(modalId);
  if (!modal || !modal.classList) return;
  
  modal.classList.remove('modal-hidden');
  modal.classList.add('modal-flex');
  modal.setAttribute('aria-hidden', 'false');
  
  // Simple focus management
  const firstFocusable = modal.querySelector('button, [href], input, select, textarea');
  firstFocusable?.focus();
}

export function hideModal(modalId) {
  const modal = getElementSafely(modalId);
  if (!modal || !modal.classList) return;
  
  modal.classList.remove('modal-flex');
  modal.classList.add('modal-hidden');
  modal.setAttribute('aria-hidden', 'true');
}

/**
 * Add basic modal functionality (click outside to close, escape key)
 * @param {HTMLElement} modal - Modal element
 */
export function enhanceModal(modal) {
  if (!modal || modal.dataset.enhanced) return;
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal(modal.id);
  });
  
  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList && !modal.classList.contains('modal-hidden')) {
      hideModal(modal.id);
    }
  });
  
  modal.dataset.enhanced = 'true';
}

export function getElementSafely(elementId, required = false) {
  const element = document.getElementById(elementId);
  if (!element && required) {
    Logger.error(`Required element with ID '${elementId}' not found.`);
  }
  return element;
}

export const updateElementText = (elementId, content) => {
  const element = getElementSafely(elementId);
  if (element) element.textContent = content;
};

export const toggleElementClass = (elementId, className, force) => {
  const element = getElementSafely(elementId);
  if (element && element.classList) element.classList.toggle(className, force);
};