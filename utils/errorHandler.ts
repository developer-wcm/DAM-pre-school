import { Alert } from 'react-native';

/**
 * Error types for better error handling
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class with type information
 */
export class AppError extends Error {
  type: ErrorType;
  originalError?: Error;

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, originalError?: Error) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<ErrorType, { title: string; message: string }> = {
  [ErrorType.NETWORK]: {
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
  },
  [ErrorType.AUTH]: {
    title: 'Authentication Error',
    message: 'There was a problem with your login. Please try again.',
  },
  [ErrorType.VALIDATION]: {
    title: 'Invalid Input',
    message: 'Please check your information and try again.',
  },
  [ErrorType.PERMISSION]: {
    title: 'Permission Required',
    message: 'This feature requires additional permissions.',
  },
  [ErrorType.STORAGE]: {
    title: 'Storage Error',
    message: 'There was a problem saving your data. Please try again.',
  },
  [ErrorType.UNKNOWN]: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};

/**
 * Determine error type from error object
 */
function getErrorType(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorCode.includes('network')
  ) {
    return ErrorType.NETWORK;
  }

  // Auth errors
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid credentials') ||
    errorCode.includes('auth')
  ) {
    return ErrorType.AUTH;
  }

  // Validation errors
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('validation') ||
    errorMessage.includes('required')
  ) {
    return ErrorType.VALIDATION;
  }

  // Permission errors
  if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
    return ErrorType.PERMISSION;
  }

  // Storage errors
  if (errorMessage.includes('storage') || errorMessage.includes('asyncstorage')) {
    return ErrorType.STORAGE;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Show user-friendly error alert
 */
export function showErrorAlert(
  error: Error | AppError | any,
  customMessage?: string,
  onDismiss?: () => void
) {
  const errorType = error instanceof AppError ? error.type : getErrorType(error);
  const errorInfo = ERROR_MESSAGES[errorType];

  const message = customMessage || error.message || errorInfo.message;

  Alert.alert(errorInfo.title, message, [
    {
      text: 'OK',
      onPress: onDismiss,
    },
  ]);
}

/**
 * Log error for debugging (can be extended to send to error tracking service)
 */
export function logError(error: Error | AppError | any, context?: string) {
  if (__DEV__) {
    console.error('=== Error Log ===');
    console.error('Context:', context || 'Unknown');
    console.error('Error:', error);
    if (error instanceof AppError && error.originalError) {
      console.error('Original Error:', error.originalError);
    }
    console.error('================');
  }

  // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
  // Example: Sentry.captureException(error);
}

/**
 * Handle async operations with automatic error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  options?: {
    errorMessage?: string;
    onError?: (error: Error) => void;
    showAlert?: boolean;
    context?: string;
  }
): Promise<{ data: T | null; error: Error | null }> {
  const { errorMessage, onError, showAlert = true, context } = options || {};

  try {
    const data = await operation();
    return { data, error: null };
  } catch (error: any) {
    const appError = new AppError(
      errorMessage || error.message || 'An error occurred',
      getErrorType(error),
      error
    );

    logError(appError, context);

    if (showAlert) {
      showErrorAlert(appError, errorMessage);
    }

    if (onError) {
      onError(appError);
    }

    return { data: null, error: appError };
  }
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options || {};

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        
        if (onRetry) {
          onRetry(attempt, error);
        }

        if (__DEV__) {
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Validate network connectivity
 */
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    // Simple fetch to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Handle network-dependent operations
 */
export async function handleNetworkOperation<T>(
  operation: () => Promise<T>,
  options?: {
    errorMessage?: string;
    showAlert?: boolean;
    context?: string;
  }
): Promise<{ data: T | null; error: Error | null }> {
  const isConnected = await checkNetworkConnection();

  if (!isConnected) {
    const error = new AppError(
      'No internet connection. Please check your network and try again.',
      ErrorType.NETWORK
    );

    if (options?.showAlert !== false) {
      showErrorAlert(error);
    }

    logError(error, options?.context);

    return { data: null, error };
  }

  return handleAsync(operation, options);
}
