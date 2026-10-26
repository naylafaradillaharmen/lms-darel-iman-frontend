import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      window.location.hash = 'overview';
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-neutral-50 dark:bg-dei-dark-bg text-dei-ink dark:text-dei-dark-ink">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-dei-ink dark:text-dei-dark-ink">
                Terjadi Kendala Tampilan Halaman
              </h2>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed">
                Aplikasi mengalami kendala saat memproses data tampilan. Silakan muat ulang halaman atau kembali ke Ringkasan Eksekutif.
              </p>
              {this.state.error?.message && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-[11px] font-mono text-left break-words">
                  {String(this.state.error.message)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Halaman</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
