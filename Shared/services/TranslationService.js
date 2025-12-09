import { createClient } from '@supabase/supabase-js';
import AppConfig from '../core/AppConfig.js';
import Logger from '../utils/logger.js';

/**
 * Translation Service
 * Manages dynamic page translations using Google Translate API and Supabase storage
 * Implements caching strategy to minimize API calls and improve performance
 */
class TranslationService {
  constructor() {
    this.config = AppConfig;
    this.appConfig = this.config.getAll();

    // Initialize Supabase client
    this.supabase = createClient(
      this.appConfig.database.supabaseUrl,
      this.appConfig.database.supabaseKey
    );

    // Translation cache for current session
    this.translationCache = new Map();

    // Current language
    this.currentLanguage = 'es'; // Spanish as base language

    // Supported languages
    this.supportedLanguages = {
      'es': 'Español',
      'en': 'English',
      'fr': 'Français',
      'it': 'Italiano',
      'zh': '中文'
    };

    Logger.info('TranslationService: Initialized');
    this.initDebugPanel();
  }

  /**
   * Initialize debug panel with controls
   * Only shows if ?debug=true is in the URL
   */
  initDebugPanel() {
    // Only show if ?debug=true is in URL
    if (!window.location.search.includes('debug=true')) {
      return;
    }

    let debugPanel = document.getElementById('translation-debug-panel');

    // Create panel if it doesn't exist
    if (!debugPanel) {
      debugPanel = document.createElement('div');
      debugPanel.id = 'translation-debug-panel';
      // Styles moved to _translation-debug.scss

      const header = document.createElement('div');
      // Styles moved to _translation-debug.scss
      header.textContent = 'Translation Debug Log';
      debugPanel.appendChild(header);

      document.body.appendChild(debugPanel);
    }

    if (debugPanel) {
      // Create controls container
      const controls = document.createElement('div');
      controls.className = 'translation-debug-controls';

      // Clear Cache Button (Client Side)
      const clearBtn = document.createElement('button');
      clearBtn.textContent = '🧹 Clear Local Cache';
      clearBtn.className = 'translation-debug-btn translation-debug-btn--clear';

      clearBtn.onclick = () => {
        this.clearCache();
        this.logToPanel('Local cache cleared! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 500);
      };

      // Delete DB Button (Server Side)
      const deleteDbBtn = document.createElement('button');
      deleteDbBtn.textContent = '🔥 Reset DB for Current Lang';
      deleteDbBtn.className = 'translation-debug-btn translation-debug-btn--reset';

      deleteDbBtn.onclick = async () => {
        if (this.currentLanguage === 'es') {
          alert('Cannot delete Spanish (source) translations.');
          return;
        }
        if (confirm(`Are you sure you want to delete ALL '${this.currentLanguage}' translations from the database? This forces a re-translation.`)) {
          this.logToPanel(`Deleting all '${this.currentLanguage}' translations from DB...`, 'info');
          const { error } = await this.supabase
            .from('translations')
            .delete()
            .eq('target_language', this.currentLanguage);

          if (error) {
            this.logToPanel(`Error deleting DB: ${error.message}`, 'error');
          } else {
            this.logToPanel('DB cleared! Clearing local cache and reloading...', 'success');
            this.clearCache();
            setTimeout(() => window.location.reload(), 1000);
          }
        }
      };

      controls.appendChild(clearBtn);
      controls.appendChild(deleteDbBtn);

      // Insert controls at the top of the panel (after header)
      if (debugPanel.firstChild) {
        debugPanel.insertBefore(controls, debugPanel.firstChild.nextSibling);
      } else {
        debugPanel.appendChild(controls);
      }
    }
  }

  /**
   * Helper to log to the visible debug panel
   */
  logToPanel(message, type = 'info') {
    const debugPanel = document.getElementById('translation-debug-panel');
    if (debugPanel) {
      const color = type === 'error' ? 'red' : (type === 'success' ? '#0f0' : '#fff');
      // Using inline style for dynamic color only, structural styles moved to CSS
      debugPanel.innerHTML += `<div style="color:${color}">${message}</div>`;
      debugPanel.scrollTop = debugPanel.scrollHeight;
    }
  }

  /**
   * Reload configuration
   * Forces AppConfig to reload from environment and updates local state
   */
  reloadConfig() {
    if (this.config && typeof this.config.reload === 'function') {
      this.config.reload();
      this.appConfig = this.config.getAll();
      Logger.info('TranslationService: Configuration reloaded');
    }
  }

  /**
   * Validate translation quality
   * @param {string} sourceText 
   * @param {string} translatedText 
   * @param {string} targetLanguage 
   * @returns {boolean} True if translation seems valid
   */
  isValidTranslation(sourceText, translatedText, targetLanguage) {
    if (!translatedText) return false;

    // 1. Check for Chinese characters if target is Chinese
    if (targetLanguage === 'zh') {
      const chineseRegex = /[\u4e00-\u9fa5]/;
      if (!chineseRegex.test(translatedText)) {
        console.warn(`[Validation] Invalid Chinese translation (no chinese chars): "${translatedText}"`);
        return false;
      }
    }

    // 2. Check for identical text (poisoning) for non-Spanish languages
    // We allow short words (<= 3 chars) to be identical (e.g. "ABC", "Gin", "Ron")
    // But longer sentences should usually change.
    if (targetLanguage !== 'es' && sourceText.trim().toLowerCase() === translatedText.trim().toLowerCase()) {
      // Exception list for words that might be same in many languages (Brand names, units, universal terms)
      const exceptions = [
        'mezcal', 'tequila', 'vodka', 'whisky', 'gin', 'ron', 'brandy', 'cognac', 'total',
        'ml', '700', '750', '1l', 'reserva', 'gran', 'anejo', 'blanco', 'reposado', 'cristalino',
        'sherry', 'cask', 'double', 'black', 'label', 'red', 'blue', 'gold', 'platinum', '1800', 'don', 'julio'
      ];
      const isException = exceptions.some(ex => sourceText.toLowerCase().includes(ex));

      // Increased threshold from 15 to 40 to allow for long Product Names (e.g. "MÁRQUEZ DEL MÉRITO SHERRY CASK 700 ML")
      if (sourceText.length > 40 && !isException) {
        console.warn(`[Validation] Suspicious identical translation: "${sourceText}" -> "${translatedText}"`);
        // We strictly reject long identical strings to prevent poisoning
        return false;
      }
    }

    return true;
  }

  /**
   * Get translation for a specific text
   * @param {string} textKey - Unique identifier for the text
   * @param {string} sourceText - Original text in Spanish
   * @param {string} targetLanguage - Target language code
   * @param {string} namespace - Context namespace (default: 'general')
   * @returns {Promise<string>} Translated text
   */
  async getTranslation(textKey, sourceText, targetLanguage, namespace = 'general') {
    try {
      // If target language is Spanish (base language), return original text
      if (targetLanguage === 'es') {
        return sourceText;
      }

      // Check cache first
      const cacheKey = `${textKey}_${namespace}_${targetLanguage}`;
      if (this.translationCache.has(cacheKey)) {
        Logger.debug(`Translation cache hit for: ${cacheKey}`);
        return this.translationCache.get(cacheKey);
      }

      // Check Supabase for existing translation
      const existingTranslation = await this.getFromSupabase(textKey, targetLanguage, namespace, sourceText);
      if (existingTranslation) {
        // Validate existing translation from DB too!
        if (this.isValidTranslation(sourceText, existingTranslation, targetLanguage)) {
          this.translationCache.set(cacheKey, existingTranslation);
          Logger.debug(`Translation loaded from Supabase: ${textKey} -> ${targetLanguage}`);
          return existingTranslation;
        } else {
          Logger.warn(`Invalid translation found in DB for ${textKey}, ignoring.`);
          // We could delete it here, but let's just ignore it for now and fetch fresh
        }
      }

      // If not found, respect feature flag for Google Translate
      const googleEnabled = this.config.isFeatureEnabled('googleTranslateEnabled');

      if (!googleEnabled) {
        Logger.info('Google Translate disabled by config; returning source text');
        this.logToPanel(`Skipping: Google Translate disabled for ${textKey}`, 'error');
        return sourceText;
      }

      // If not found and enabled, request new translation from Google Translate API
      // If not found and enabled, request new translation from Google Translate API
      this.logToPanel(`Requesting API: "${sourceText.substring(0, 15)}..." -> ${targetLanguage}`, 'info');
      const newTranslation = await this.requestTranslation(sourceText, targetLanguage);

      if (newTranslation) {
        if (newTranslation) {

          // VALIDATE before saving
          if (this.isValidTranslation(sourceText, newTranslation, targetLanguage)) {
            // Save to Supabase for future use
            await this.saveToSupabase(textKey, sourceText, newTranslation, targetLanguage, namespace);

            // Cache the translation
            this.translationCache.set(cacheKey, newTranslation);

            Logger.info(`New translation created: ${textKey} (${targetLanguage})`);
            return newTranslation;
          } else {
            this.logToPanel(`Validation Failed: "${newTranslation}"`, 'error');
            Logger.warn(`Validation failed for ${textKey}, not saving.`);
            // Return sourceText so it's obvious it failed
            return sourceText;
          }
        } else {
          Logger.warn(`Translation failed for ${textKey}, returning source text without saving.`);
          return sourceText;
        }

      } catch (error) {
        Logger.error(`Translation error for ${textKey}:`, error);
        this.logToPanel(`Error getting translation for ${textKey}: ${error.message}`, 'error');
        // Fallback to original text if translation fails
        return sourceText;
      }
    }

  /**
   * Get translation from Supabase
   * @param {string} textKey - Text identifier
   * @param {string} targetLanguage - Target language
   * @param {string} namespace - Context namespace
   * @returns {Promise<string|null>} Translated text or null if not found
   */
  async getFromSupabase(textKey, targetLanguage, namespace, sourceText = null) {
      try {
        const query = this.supabase
          .from('translations')
          .select('translated_text')
          .eq('text_key', textKey)
          .eq('target_language', targetLanguage)
          .eq('namespace', namespace);

        // Prefer .maybeSingle() to avoid 406 when no rows exist
        const result = (typeof query.maybeSingle === 'function')
          ? await query.maybeSingle()
          : await query.single();

        const { data, error, status } = result;

        if (error) {
          // Treat 406 (no rows) or PGRST116 as 'not found' without logging noise
          if (status === 406 || error.code === 'PGRST116') {
            // Intentionally continue to fallback below
          } else {
            Logger.error('Supabase translation query error:', error);
            this.logToPanel(`Supabase Error: ${error.message}`, 'error');
            return null;
          }
        }

        // Primary lookup by key succeeded
        if (data?.translated_text) {
          return data.translated_text;
        }

        // Fallback: lookup by source_text regardless of namespace (helps reuse existing translations)
        if (sourceText) {
          try {
            const altQuery = this.supabase
              .from('translations')
              .select('translated_text')
              .eq('source_text', sourceText)
              .eq('target_language', targetLanguage)
              .limit(1);

            const altResult = (typeof altQuery.maybeSingle === 'function')
              ? await altQuery.maybeSingle()
              : await altQuery.single();

            const { data: altData, error: altError, status: altStatus } = altResult;
            if (altError) {
              if (altStatus === 406 || altError.code === 'PGRST116') {
                return null;
              }
              Logger.debug('Supabase fallback by source_text returned error (non-fatal):', altError);
              return null;
            }
            return altData?.translated_text || null;
          } catch (fallbackErr) {
            Logger.debug('Supabase fallback by source_text failed:', fallbackErr);
            return null;
          }
        }
        return null;
      } catch (error) {
        Logger.error('Error fetching translation from Supabase:', error);
        return null;
      }
    }

  /**
   * Request translation from Google Translate API
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<string|null>} Translated text or null on failure
   */
  async requestTranslation(text, targetLanguage) {
      try {
        // 1. Try server-side proxy first (secure way)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: text,
              targetLanguage: targetLanguage,
              sourceLanguage: 'es'
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            return result.translatedText;
          }
        } catch (serverError) {
          Logger.warn('Server-side translation failed, trying client-side fallback...', serverError);
        }

        // 2. Client-side fallback (for local development/static hosting)
        // NOTE: This exposes the API key to the client. Use only in trusted environments.
        // Fetch key dynamically to ensure we get runtime env var
        const apiKey = this.config.getEnvVar('VITE_GOOGLE_TRANSLATE_API_KEY');

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY_PLEASE_REPLACE') {
          Logger.error('Google Translate API key not configured or is placeholder');
          console.warn('Please replace PLACEHOLDER_API_KEY_PLEASE_REPLACE in index.html with your actual Google Translate API Key');
          return null;
        }

        this.logToPanel(`Using API Key: ${apiKey.substring(0, 5)}...`, 'info');

        const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(translateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: 'es',
            target: targetLanguage,
            format: 'text'
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.text();
          this.logToPanel(`API Error: ${errorData}`, 'error');
          // Return null so we don't save the error/original text to DB
          return null;
        }

        const data = await response.json();
        this.logToPanel(`Success: ${text.substring(0, 10)}... -> ${data.data.translations[0].translatedText.substring(0, 10)}...`, 'success');
        return data.data.translations[0].translatedText;

      } catch (error) {
        if (error.name === 'AbortError') {
          Logger.error('Translation API timed out');
          this.logToPanel(`API Timeout after 5s`, 'error');
        } else {
          Logger.error('Translation error (both server and client failed):', error);
        }
        // Return null on error to prevent saving bad data
        return null;
      }
    }

  /**
   * Save translation to Supabase
   * @param {string} textKey - Text identifier
   * @param {string} sourceText - Original text
   * @param {string} translatedText - Translated text
   * @param {string} targetLanguage - Target language
   * @param {string} namespace - Context namespace
   */
  async saveToSupabase(textKey, sourceText, translatedText, targetLanguage, namespace) {
      try {
        try {
          const { error } = await this.supabase
            .from('translations')
            .upsert({
              text_key: textKey,
              namespace: namespace,
              source_language: 'es',
              target_language: targetLanguage,
              source_text: sourceText,
              translated_text: translatedText
            }, { onConflict: 'text_key,namespace,target_language' });

          if (error) {
            if (error) {
              Logger.error('Error saving translation to Supabase:', error);
            } else {
            } else {
              Logger.debug(`Translation saved to Supabase: ${textKey} -> ${targetLanguage}`);
            }
          } catch (error) {
          } catch (error) {
            Logger.error('Error saving translation to Supabase:', error);
          }
        }

  /**
   * Translate entire page to target language
   * @param {string} targetLanguage - Target language code
   */
  async translatePage(targetLanguage) {
          try {
            Logger.info(`Starting page translation to: ${targetLanguage}`);
            this.logToPanel(`--- Starting Page Translation to ${targetLanguage} ---`, 'info');

            // Update current language
            this.currentLanguage = targetLanguage;

            // Find all elements with data-translate attribute
            const translatableElements = document.querySelectorAll('[data-translate]');
            this.logToPanel(`Found ${translatableElements.length} elements to translate`, 'info');

            // Process in batches to avoid overwhelming the browser/network
            const BATCH_SIZE = 10;
            const results = [];
            const elementsArray = Array.from(translatableElements);

            for (let i = 0; i < elementsArray.length; i += BATCH_SIZE) {
              const batch = elementsArray.slice(i, i + BATCH_SIZE);
              this.logToPanel(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (Size: ${batch.length})`, 'info');

              const batchPromises = batch.map(async (element, index) => {
                const textKey = element.getAttribute('data-translate');
                const namespace = element.getAttribute('data-namespace') || 'general';
                const originalText = element.getAttribute('data-original-text') || element.textContent.trim();

                // Store original text if not already stored
                if (!element.getAttribute('data-original-text')) {
                  element.setAttribute('data-original-text', originalText);
                }

                try {
                  // Get translation
                  const translatedText = await this.getTranslation(textKey, originalText, targetLanguage, namespace);

                  // Debug first item of batch to verify translation is happening
                  if (index === 0) {
                    this.logToPanel(`Batch Debug: "${originalText.substring(0, 10)}..." -> "${translatedText ? translatedText.substring(0, 10) : 'null'}..."`, 'info');
                  }

                  // Update element content
                  if (translatedText) {
                    element.textContent = translatedText;
                  }
                  return { textKey, translatedText };
                } catch (elemError) {
                  Logger.error(`Error processing element ${textKey}:`, elemError);
                  return { textKey, error: elemError };
                }
              });

              const batchResults = await Promise.all(batchPromises);
              results.push(...batchResults);

              // Yield to main thread to prevent freezing
              await new Promise(resolve => setTimeout(resolve, 20));
            }

            Logger.info(`Page translation completed. Translated ${results.length} elements to ${targetLanguage}`);

            // Dispatch custom event for other components to react
            window.dispatchEvent(new CustomEvent('languageChanged', {
              detail: { language: targetLanguage, translations: results }
            }));

          } catch (error) {
            Logger.error('Error translating page:', error);
            this.logToPanel(`Page Translation Error: ${error.message}`, 'error');
          }
        }

        /**
         * Get current language
         * @returns {string} Current language code
         */
        getCurrentLanguage() {
          return this.currentLanguage;
        }

        /**
         * Get supported languages
         * @returns {Object} Supported languages object
         */
        getSupportedLanguages() {
          return this.supportedLanguages;
        }

        /**
         * Clear translation cache
         */
        clearCache() {
          this.translationCache.clear();
          Logger.info('Translation cache cleared');
        }

  /**
   * Preload translations for specific elements
   * @param {Array} textKeys - Array of text keys to preload
   * @param {string} targetLanguage - Target language
   * @param {string} namespace - Namespace
   */
  async preloadTranslations(textKeys, targetLanguage, namespace = 'general') {
          try {
            const preloadPromises = textKeys.map(async (textKey) => {
              const element = document.querySelector(`[data-translate="${textKey}"]`);
              if (element) {
                const originalText = element.textContent.trim();
                return this.getTranslation(textKey, originalText, targetLanguage, namespace);
              }
              return Promise.resolve();
            });

            await Promise.all(preloadPromises);
            Logger.info(`Preloaded ${textKeys.length} translations for ${targetLanguage}`);
          } catch (error) {
            Logger.error('Error preloading translations:', error);
          }
        }
      }

export default new TranslationService();