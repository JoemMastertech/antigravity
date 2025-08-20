class Logger {
  static #isProduction = false; // Cambiar a true en producción
  
  static info(message, data = {}) {
    if (!this.#isProduction) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
    }
  }
  
  static error(message, error = {}) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    
    // En producción, aquí podrías enviar a un servicio de monitoreo
    if (this.#isProduction && error.stack) {
      // TODO: Integrar con servicio de monitoreo si es necesario
    }
  }
  
  static warn(message, data = {}) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  }
  
  static debug(message, data = {}) {
    if (!this.#isProduction) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
}

export default Logger;