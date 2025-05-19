/**
 * Navigation Service
 * 
 * A service for navigating without having to pass the navigation prop through every component.
 * This is particularly useful for components that aren't directly connected to a navigator.
 */

import { NavigationContainerRef, CommonActions, StackActions } from '@react-navigation/native';
import { createRef } from 'react';

// Create a ref for the navigation container
export const navigationRef = createRef<NavigationContainerRef<any>>();

/**
 * Navigate to a specific route
 * 
 * @param name Route name
 * @param params Route parameters
 */
function navigate(name: string, params?: any) {
  if (navigationRef.current) {
    try {
      navigationRef.current.navigate(name, params);
    } catch (error) {
      console.error(`NavigationService: Error navigating to ${name}:`, error);
    }
  } else {
    console.warn(`NavigationService: Cannot navigate to ${name}, navigation ref is not set`);
  }
}

/**
 * Push a new route onto the stack
 * 
 * @param name Route name
 * @param params Route parameters
 */
function push(name: string, params?: any) {
  if (navigationRef.current) {
    try {
      navigationRef.current.dispatch(StackActions.push(name, params));
    } catch (error) {
      console.error(`NavigationService: Error pushing ${name}:`, error);
    }
  } else {
    console.warn(`NavigationService: Cannot push ${name}, navigation ref is not set`);
  }
}

/**
 * Go back to the previous screen
 */
function goBack() {
  if (navigationRef.current) {
    try {
      navigationRef.current.goBack();
    } catch (error) {
      console.error('NavigationService: Error going back:', error);
    }
  } else {
    console.warn('NavigationService: Cannot go back, navigation ref is not set');
  }
}

/**
 * Reset the navigation state to a specific route
 * 
 * @param name Route name
 * @param params Route parameters
 */
function reset(name: string, params?: any) {
  if (navigationRef.current) {
    try {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name, params }],
        })
      );
    } catch (error) {
      console.error(`NavigationService: Error resetting to ${name}:`, error);
    }
  } else {
    console.warn(`NavigationService: Cannot reset to ${name}, navigation ref is not set`);
  }
}

/**
 * Get the current route
 * 
 * @returns The current route or undefined if not available
 */
function getCurrentRoute() {
  if (navigationRef.current) {
    try {
      return navigationRef.current.getCurrentRoute();
    } catch (error) {
      console.error('NavigationService: Error getting current route:', error);
      return undefined;
    }
  }
  return undefined;
}

// Export navigation functions
export default {
  navigate,
  push,
  goBack,
  reset,
  getCurrentRoute,
  navigationRef,
};
