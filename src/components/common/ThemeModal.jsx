import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  X
} from 'lucide-react';

/**
 * Modal Pop-Up Khas Tema Yayasan Dar El Iman
 * Menggantikan seluruh alert() dan confirm() bawaan browser
 * dengan visual konsisten, elegan, dan islami.
 */
export const ThemeModal = ({
  isOpen,
  onClose,
  title = 'Pemberitahuan Sistem',
  message = '',
  type = 'info', // 'success' | 'warning' | 'danger' | 'info' | 'confirm'
  confirmText,
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (onCancel) onCancel();
        else if (onClose) onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onCancel]);

  if (!isOpen) return null;

  const isConfirm = type === 'confirm' || Boolean(onCancel);
  const resolvedConfirmText = confirmText || (isConfirm ? 'Ya, Lanjutkan' : 'Mengerti & Tutup');

  const getThemeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
          bgIcon: 'bg-emerald-100 dark:bg-emerald-950/80 ring-8 ring-emerald-50 dark:ring-emerald-950/30',
          btnPrimary: 'bg-dei-emerald hover:bg-dei-emerald-dark text-white shadow-emerald-500/20',
          borderAccent: 'border-emerald-200 dark:border-emerald-800'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
          bgIcon: 'bg-amber-100 dark:bg-amber-950/80 ring-8 ring-amber-50 dark:ring-amber-950/30',
          btnPrimary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
          borderAccent: 'border-amber-200 dark:border-amber-800'
        };
      case 'danger':
      case 'error':
        return {
          icon: <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />,
          bgIcon: 'bg-rose-100 dark:bg-rose-950/80 ring-8 ring-rose-50 dark:ring-rose-950/30',
          btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
          borderAccent: 'border-rose-200 dark:border-rose-800'
        };
      case 'confirm':
        return {
          icon: <HelpCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
          bgIcon: 'bg-purple-100 dark:bg-purple-950/80 ring-8 ring-purple-50 dark:ring-purple-950/30',
          btnPrimary: 'bg-dei-emerald hover:bg-dei-emerald-dark text-white shadow-emerald-500/20',
          borderAccent: 'border-purple-200 dark:border-purple-800'
        };
      default:
        return {
          icon: <Info className="w-8 h-8 text-dei-emerald dark:text-dei-emerald-neon" />,
          bgIcon: 'bg-emerald-100 dark:bg-emerald-950/80 ring-8 ring-emerald-50 dark:ring-emerald-950/30',
          btnPrimary: 'bg-dei-emerald hover:bg-dei-emerald-dark text-white shadow-emerald-500/20',
          borderAccent: 'border-emerald-200 dark:border-emerald-800'
        };
    }
  };

  const theme = getThemeConfig();

  const handleConfirmAction = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  const handleCancelAction = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-200"
      onClick={handleCancelAction}
    >
      <div
        className={`relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white dark:bg-dei-dark-surface border ${theme.borderAccent} shadow-2xl transition-all transform scale-100 space-y-5`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top right */}
        <button
          onClick={handleCancelAction}
          className="absolute top-4 right-4 p-1.5 rounded-full text-dei-muted hover:text-dei-ink dark:hover:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon and Brand Accent */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme.bgIcon}`}>
            {theme.icon}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink leading-snug">
              {title}
            </h3>
            {message && (
              <div className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed max-w-sm whitespace-pre-line">
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Custom Children Content if provided */}
        {children && (
          <div className="pt-1">
            {children}
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-3 pt-2 ${isConfirm ? 'justify-end' : 'justify-center'}`}>
          {isConfirm && (
            <button
              type="button"
              onClick={handleCancelAction}
              className="flex-1 py-2.5 px-4 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirmAction}
            className={`${isConfirm ? 'flex-1' : 'w-full'} py-2.5 px-5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${theme.btnPrimary}`}
          >
            <span>{resolvedConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
