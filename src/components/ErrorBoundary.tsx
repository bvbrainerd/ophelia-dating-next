'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-xl font-semibold text-[#BA2525] mb-4">Something went wrong</h2>
          <button
            className="px-4 py-2 bg-[#BA2525] text-white rounded-full"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 