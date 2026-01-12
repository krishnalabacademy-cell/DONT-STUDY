
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4 text-center">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h1>
            <p className="text-lg mb-6">Aap chinta na karein. Please try refreshing the page.</p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 transition-colors"
            >
                Refresh
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
