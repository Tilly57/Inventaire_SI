/**
 * ErrorBoundary Component
 * Catches React errors and prevents entire app crash
 * Shows user-friendly error UI with option to retry or go home
 */
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { captureException } from '@/lib/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 * Wraps the entire app to catch any React errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Send error to Sentry
    captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack },
      },
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/dashboard';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Une erreur est survenue</CardTitle>
                  <CardDescription>
                    L'application a rencontré un problème inattendu
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error message (user-friendly) */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Erreur:</p>
                <p className="text-sm text-muted-foreground">
                  {this.state.error?.message || 'Erreur inconnue'}
                </p>
              </div>

              {/* Error stack (development only) */}
              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="bg-muted p-4 rounded-lg text-xs">
                  <summary className="cursor-pointer font-medium mb-2">
                    Détails techniques (dev only)
                  </summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="default" className="flex-1">
                  Réessayer
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  Retour au tableau de bord
                </Button>
              </div>

              {/* Help text */}
              <p className="text-sm text-muted-foreground text-center">
                Si le problème persiste, veuillez contacter le support technique.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional hook-style error boundary wrapper
 * For use with specific components/routes
 */
interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Erreur</CardTitle>
          </div>
          <CardDescription>
            Une erreur est survenue lors du chargement de ce composant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded text-sm">
            {error.message}
          </div>
          <Button onClick={resetErrorBoundary} className="w-full">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
