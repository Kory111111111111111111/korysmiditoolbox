import React, { Component, ReactNode } from 'react';
import { EnhancedError, ErrorType, errorLogger } from '../utils/errorHandling';

// Error boundary component for React error handling
interface ErrorBoundaryState {
  hasError: boolean;
  error: EnhancedError | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: EnhancedError }>;
  onError?: (error: EnhancedError) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const enhancedError: EnhancedError = {
      ...error,
      type: ErrorType.UNKNOWN,
      timestamp: Date.now(),
      severity: 'high' as const,
      retryable: false
    };
    
    return {
      hasError: true,
      error: enhancedError
    };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    const enhancedError: EnhancedError = {
      ...error,
      type: ErrorType.UNKNOWN,
      timestamp: Date.now(),
      severity: 'high' as const,
      retryable: false,
      details: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name
      }
    };
    
    errorLogger.log(enhancedError);
    this.props.onError?.(enhancedError);
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}

// Default error fallback component
export const DefaultErrorFallback: React.FC<{ error: EnhancedError }> = ({ error }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
      <p className="text-gray-400 mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);