/**
 * Firebase Retry Utility
 * 
 * A utility to add retry logic to Firebase operations that might fail due to connectivity issues.
 */

/**
 * Execute a Firebase operation with automatic retry for WebChannelConnection errors
 * 
 * @param operation The Firebase operation function to execute
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param baseDelay Base delay between retries in ms (default: 1000)
 * @returns The result of the operation
 */
export const withFirebaseRetry = async<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let attempt = 0;
  let lastError: any;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      attempt++;
      
      // Only retry on WebChannelConnection errors
      const isWebChannelError = 
        error?.message?.includes('WebChannelConnection') ||
        error?.code === 'unavailable' ||
        error?.code === 'resource-exhausted';
      
      if (!isWebChannelError && attempt > 1) {
        throw error; // Not a retryable error, rethrow immediately
      }
      
      // Log the retry attempt
      console.log(`Retry attempt ${attempt}/${maxRetries} for Firebase operation`);
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
      const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1) * jitter, 10000);
      
      // Wait for the delay before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
};

export default withFirebaseRetry;