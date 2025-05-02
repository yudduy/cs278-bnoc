/**
 * Date Utilities
 * 
 * Helper functions for handling dates in the application.
 * Provides support for both JavaScript Date objects and Firebase Timestamp objects.
 */

import { format } from 'date-fns';

/**
 * Safely converts a date value (JavaScript Date or Firebase Timestamp) to a JavaScript Date
 * @param dateValue Date value (JavaScript Date or Firebase Timestamp)
 * @returns JavaScript Date object or null if input is invalid
 */
export const toDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  // If it's already a Date, return it
  if (dateValue instanceof Date) return dateValue;
  
  // If it's a Firebase Timestamp with seconds property
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    return new Date(dateValue.seconds * 1000);
  }
  
  // Try to parse as string or number
  try {
    return new Date(dateValue);
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Format a date with the provided format string
 * Safely handles both JavaScript Date and Firebase Timestamp objects
 * @param dateValue Date value (JavaScript Date or Firebase Timestamp)
 * @param formatString Format string for date-fns
 * @param fallback Fallback string if date is invalid
 * @returns Formatted date string
 */
export const formatDate = (
  dateValue: any,
  formatString: string = 'MMM d, yyyy',
  fallback: string = 'Unknown'
): string => {
  const date = toDate(dateValue);
  if (!date) return fallback;
  
  try {
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
};
