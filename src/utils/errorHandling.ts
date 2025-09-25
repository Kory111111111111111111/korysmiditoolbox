// Enhanced error types with more specific categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUDIO = 'AUDIO',
  MIDI = 'MIDI',
  CANVAS = 'CANVAS',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export interface EnhancedError extends Error {
  type: ErrorType;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: number;
  retryable?: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Rate limiting with exponential backoff
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private backoffMap: Map<string, number> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private timeWindow: number = 60000, // 1 minute
    private maxBackoff: number = 300000 // 5 minutes
  ) {}
  
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside time window
    const validRequests = requests.filter(time => now - time < this.timeWindow);
    this.requests.set(key, validRequests);
    
    // Check if we're in backoff period
    const backoffUntil = this.backoffMap.get(key) || 0;
    if (now < backoffUntil) {
      return false;
    }
    
    return validRequests.length < this.maxRequests;
  }
  
  recordRequest(key: string): void {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
  }
  
  recordFailure(key: string): void {
    const currentBackoff = this.backoffMap.get(key) || 1000; // Start with 1 second
    const newBackoff = Math.min(currentBackoff * 2, this.maxBackoff);
    this.backoffMap.set(key, Date.now() + newBackoff);
  }
  
  clearBackoff(key: string): void {
    this.backoffMap.delete(key);
  }
}

// Enhanced error logger with structured logging
class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: EnhancedError[] = [];
  private maxLogs = 1000;
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  log(error: EnhancedError): void {
    // Add to in-memory logs
    this.logs.push(error);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Console logging with appropriate level
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.type}] ${error.message}`, {
      code: error.code,
      details: error.details,
      timestamp: new Date(error.timestamp).toISOString(),
      stack: error.stack
    });
    
    // Send to external service if configured (analytics, Sentry, etc.)
    this.sendToExternalService(error);
  }
  
  private getLogMethod(severity: string): (...args: unknown[]) => void {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error;
      case 'medium':
        return console.warn;
      default:
        return console.log;
    }
  }
  
  private sendToExternalService(error: EnhancedError): void {
    // Only send high/critical errors to external services
    if (error.severity === 'high' || error.severity === 'critical') {
      // Implementation would depend on chosen service (Sentry, LogRocket, etc.)
      // For now, we'll just prepare the data structure
      const errorData = {
        message: error.message,
        type: error.type,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      };
      
      // Could send to service here
      console.log('Would send to external service:', errorData);
    }
  }
  
  getLogs(type?: ErrorType, severity?: string): EnhancedError[] {
    return this.logs.filter(log => {
      if (type && log.type !== type) return false;
      if (severity && log.severity !== severity) return false;
      return true;
    });
  }
  
  clearLogs(): void {
    this.logs = [];
  }
}

// Enhanced API client with retry logic and rate limiting
export class APIClient {
  private rateLimiter = new RateLimiter();
  private errorLogger = ErrorLogger.getInstance();
  
  async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<T> {
    const requestKey = `${options.method || 'GET'}:${url}`;
    
    // Check rate limiting
    if (!this.rateLimiter.canMakeRequest(requestKey)) {
      throw this.createError(
        'Rate limit exceeded. Please try again later.',
        ErrorType.RATE_LIMIT,
        'RATE_LIMIT_EXCEEDED',
        'medium',
        false
      );
    }
    
    let lastError: EnhancedError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        this.rateLimiter.recordRequest(requestKey);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          throw this.createError(
            `HTTP ${response.status}: ${response.statusText}`,
            ErrorType.API,
            response.status.toString(),
            response.status >= 500 ? 'high' : 'medium',
            response.status >= 500 || response.status === 429
          );
        }
        
        const data = await response.json();
        this.rateLimiter.clearBackoff(requestKey);
        return data;
        
      } catch (error) {
        lastError = error instanceof Error && 'type' in error 
          ? error as EnhancedError
          : this.createError(
              error instanceof Error ? error.message : 'Unknown API error',
              ErrorType.API,
              'API_ERROR',
              'high'
            );
        
        this.errorLogger.log(lastError);
        
        // Don't retry non-retryable errors
        if (!lastError.retryable || attempt === retries) {
          this.rateLimiter.recordFailure(requestKey);
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  private createError(
    message: string,
    type: ErrorType,
    code?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    retryable = false
  ): EnhancedError {
    const error = new Error(message) as EnhancedError;
    error.type = type;
    error.code = code;
    error.timestamp = Date.now();
    error.severity = severity;
    error.retryable = retryable;
    return error;
  }
}

// Utility functions for common error scenarios
export const errorUtils = {
  // Create standardized errors
  createNetworkError: (message: string, code?: string): EnhancedError => ({
    name: 'NetworkError',
    message,
    type: ErrorType.NETWORK,
    code,
    timestamp: Date.now(),
    severity: 'medium',
    retryable: true
  }),
  
  createValidationError: (message: string, field?: string): EnhancedError => ({
    name: 'ValidationError',
    message,
    type: ErrorType.VALIDATION,
    code: 'VALIDATION_FAILED',
    timestamp: Date.now(),
    severity: 'low',
    retryable: false,
    details: { field }
  }),
  
  createAudioError: (message: string, code?: string): EnhancedError => ({
    name: 'AudioError',
    message,
    type: ErrorType.AUDIO,
    code,
    timestamp: Date.now(),
    severity: 'medium',
    retryable: false
  }),
  
  // Async error wrapper
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorType: ErrorType = ErrorType.UNKNOWN
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const enhancedError: EnhancedError = {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        type: errorType,
        timestamp: Date.now(),
        severity: 'medium',
        retryable: false,
        stack: error instanceof Error ? error.stack : undefined
      };
      
      ErrorLogger.getInstance().log(enhancedError);
      throw enhancedError;
    }
  },
  
  // Check if error is retryable
  isRetryable: (error: unknown): boolean => {
    if (error && typeof error === 'object' && error !== null && 'retryable' in error) {
      return (error as { retryable: boolean }).retryable;
    }
    return false;
  }
};

// Export singleton instances
export const apiClient = new APIClient();
export const errorLogger = ErrorLogger.getInstance();