export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) return false;
  
  if (!('message' in error) || typeof (error as ApiError).message !== 'string') return false;
  
  if ('errors' in error) {
    const apiError = error as ApiError;
    if (!Array.isArray(apiError.errors)) return false;
    
    return apiError.errors.every(
      (err) =>
        typeof err === 'object' &&
        err !== null &&
        'field' in err &&
        'message' in err &&
        typeof err.field === 'string' &&
        typeof err.message === 'string'
    );
  }
  
  return true;
}