import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { t, getLanguage } from '../lib/i18n';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  routeName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Route render error:', this.props.routeName, error, errorInfo);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const language = getLanguage();
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 rounded-panel border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] dark:text-slate-100">
          {t('error.title', language)}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
          {t('error.body', language)}
        </p>
        {this.state.error?.message && (
          <pre className="mt-4 max-w-full overflow-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-[var(--text-secondary)] dark:border-[var(--border)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-muted)]">
            {this.state.error.message}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            {t('error.retry', language)}
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-slate-100 dark:border-[var(--border)] dark:text-slate-200 dark:hover:bg-[var(--surface-hover)]"
          >
            {t('error.backDashboard', language)}
          </button>
        </div>
      </div>
    );
  }
}
