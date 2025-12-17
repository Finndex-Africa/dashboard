// Persistent logger utility for debugging
// This is a simple logger that can be used in both client and server environments

export const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

export const logInfo = (message: string, data?: any) => {
  console.log(`[INFO] ${message}`, data || '');
};

export const logError = (message: string, data?: any) => {
  console.error(`[ERROR] ${message}`, data || '');
};

export const logWarning = (message: string, data?: any) => {
  console.warn(`[WARNING] ${message}`, data || '');
};

export default {
  logDebug,
  logInfo,
  logError,
  logWarning,
};
