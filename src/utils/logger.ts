/**
 * Logger Utility
 * 
 * A centralized logging utility that provides consistent logging with
 * environment-aware behavior (suppresses debug logs in production).
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Standardized logger for the app
 */
export const logger = {
  /**
   * Log debug messages (suppressed in production)
   */
  debug: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  /**
   * Log informational messages (suppressed in production)
   */
  info: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  /**
   * Log warning messages
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  /**
   * Log error messages
   */
  error: (message: string, error?: any, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, error, ...args);
  }
};

export default logger; 