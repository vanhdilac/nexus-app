
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isFirestoreError = false;

      try {
        // Check if it's our custom Firestore error JSON
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.operationType && parsed.authInfo) {
            isFirestoreError = true;
            errorMessage = `Database Error: ${parsed.error} (Operation: ${parsed.operationType})`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 text-center">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tight">Something went wrong</h2>
            <div className="bg-rose-50 rounded-2xl p-4 mb-8 border border-rose-100">
              <p className="text-rose-600 text-sm font-bold break-words">
                {errorMessage}
              </p>
            </div>
            <p className="text-slate-500 text-sm mb-8">
              {isFirestoreError 
                ? "This might be a permission issue. Please ensure you are logged in correctly."
                : "We've been notified and are looking into it."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-accent text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              <RefreshCcw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
