"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label for error logs */
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary for crash-prone client components (Globe 3D, Map, CMS editor).
 * Catches render errors and displays a graceful fallback instead of crashing the page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ""}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center rounded-2xl border border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] p-8 text-center">
          <div>
            <p className="font-heading text-sm font-semibold text-foreground-muted">
              Contenu temporairement indisponible
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
