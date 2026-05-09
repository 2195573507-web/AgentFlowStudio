import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { classNames } from '../lib/utils';

export interface ModalProps {
  /** Whether the modal is visible. */
  isOpen?: boolean;
  /** Backwards-compatible alias used by older route code. */
  open?: boolean;
  /** Called when the modal should close (backdrop click, escape key, X button). */
  onClose: () => void;
  /** Modal title rendered in the header bar. */
  title?: string;
  /** Modal body content. */
  children: React.ReactNode;
  /** Size preset controlling max-width. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional footer content (e.g., action buttons). Rendered below the children. */
  footer?: React.ReactNode;
  /** When true, clicking the backdrop will NOT close the modal. */
  closeOnBackdrop?: boolean;
  /** Additional className applied to the dialog panel. */
  className?: string;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  className,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save and restore focus
  useEffect(() => {
    const visible = open ?? isOpen ?? false;
    if (visible) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen, open]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const visible = open ?? isOpen ?? false;
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, open, handleKeyDown]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdrop && e.target === overlayRef.current) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose],
  );

  const visible = open ?? isOpen ?? false;

  if (!visible) return null;

  const modal = (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className={classNames(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        // Backdrop
        'bg-black/40 dark:bg-black/60 backdrop-blur-sm',
        // Enter animation
        'animate-in fade-in duration-200',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      <div
        className={classNames(
          'relative w-full',
          sizeClasses[size],
          'liquid-glass-card',
          // Enter animation
          'animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-300',
          className,
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/40">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={classNames(
                'p-1.5 rounded-lg transition-colors duration-150',
                'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
                'hover:bg-slate-200/60 dark:hover:bg-white/10',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70',
              )}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* No title but still need close button */}
        {!title && (
          <button
            onClick={onClose}
            className={classNames(
              'absolute top-3 right-3 p-1.5 rounded-lg transition-colors duration-150 z-10',
              'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
              'hover:bg-slate-200/60 dark:hover:bg-white/10',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70',
            )}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Body */}
        <div className="px-6 py-5 text-slate-700 dark:text-slate-200 text-sm">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/60 dark:border-slate-700/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default Modal;
