/**
 * ToastContext
 * 
 * Context for managing toast notifications throughout the app.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '../components/notifications/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });
  const [duration, setDuration] = useState(3000);

  const showToast = (message: string, type: ToastType = 'info', toastDuration = 3000) => {
    setToast({
      visible: true,
      message,
      type,
    });
    setDuration(toastDuration);
  };

  const showSuccess = (message: string, toastDuration = 3000) => {
    showToast(message, 'success', toastDuration);
  };

  const showError = (message: string, toastDuration = 4000) => {
    showToast(message, 'error', toastDuration);
  };

  const showWarning = (message: string, toastDuration = 3500) => {
    showToast(message, 'warning', toastDuration);
  };

  const showInfo = (message: string, toastDuration = 3000) => {
    showToast(message, 'info', toastDuration);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext; 