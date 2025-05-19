/**
 * Config Index File
 * 
 * Centralized exports of all configuration values for the app.
 * Import from this file to ensure consistency across the application.
 */

// Re-export theme settings
export * from './theme';

// Re-export firebase config
export * from './firebase';

// Note: We're using theme.ts as the source of truth for colors and styling.
// colors.ts is kept for backward compatibility but developers should
// use the theme exports going forward. 