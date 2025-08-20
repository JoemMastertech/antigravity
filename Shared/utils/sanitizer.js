import { handleXSSError } from './errorHandler.js';
import Validator from './validator.js';
import Logger from './logger.js';

function sanitizeHTML(html, options = {}) {
  if (!html || typeof html !== 'string') return '';
  
  const validation = Validator.validate(html, 'text', { maxLength: 10000 });
  if (!validation.isValid) {
    handleXSSError('sanitizeHTML', validation.message);
    return '';
  }
  
  if (!window.DOMPurify) {
    Logger.error('DOMPurify not available. HTML sanitization disabled.');
    return '';
  }
  
  try {
    const defaultOptions = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span', 'div', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['class', 'src', 'alt', 'data-category'],
      KEEP_CONTENT: true,
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover'],
      ...options
    };
    return window.DOMPurify.sanitize(html, defaultOptions);
  } catch (error) {
    handleXSSError('sanitizeHTML', { html, error: error.message });
    return '';
  }
}

function sanitizeText(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  
  const validation = Validator.validate(text, 'text', { maxLength });
  if (!validation.isValid) return Validator.sanitizeText(text);
  
  return text.trim().replace(/[<>"'&]/g, '').substring(0, maxLength);
}

function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return '';
  
  if (url.length > 2048) {
    handleXSSError('sanitizeURL', 'URL too long');
    return '';
  }
  
  const trimmedUrl = url.trim().toLowerCase();
  if (trimmedUrl.startsWith('javascript:') || trimmedUrl.startsWith('data:') || 
      trimmedUrl.startsWith('vbscript:') || trimmedUrl.startsWith('file:') || 
      trimmedUrl.startsWith('ftp:')) {
    handleXSSError('sanitizeURL', url);
    return '';
  }
  return url.trim();
}

const sanitize = (input, type = 'text', options = {}) => {
  switch (type.toLowerCase()) {
    case 'html': return sanitizeHTML(input, options);
    case 'url': return sanitizeURL(input);
    case 'text':
    default: return sanitizeText(input, options.maxLength);
  }
};

const sanitizeBatch = (inputs) => inputs.map(({ value, type = 'text', options = {} }) => 
  sanitize(value, type, options)
);

window.sanitizeHTML = sanitizeHTML;
window.sanitizeText = sanitizeText;
window.sanitizeURL = sanitizeURL;
window.sanitize = sanitize;

export { 
  sanitizeHTML, 
  sanitizeText, 
  sanitizeURL, 
  sanitize,
  sanitizeBatch
};
export default sanitize;