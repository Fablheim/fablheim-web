import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] items-center justify-center bg-background p-8">
          <div className="w-full max-w-md rounded-lg border border-destructive/50 bg-card p-8 text-center tavern-card texture-parchment iron-brackets">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="font-['IM_Fell_English'] text-xl font-bold text-foreground text-carved">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred. Try refreshing, or return to the dashboard.
            </p>
            {this.state.error && (
              <p className="mt-3 rounded-md border border-iron/30 bg-accent/40 p-2 text-xs text-muted-foreground font-mono truncate">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-1.5 rounded-md border border-iron bg-accent px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/80 transition-all font-[Cinzel] uppercase tracking-wider"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
              <a
                href="/app"
                className="flex items-center gap-1.5 rounded-md border border-gold/30 bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/15 transition-all font-[Cinzel] uppercase tracking-wider"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
