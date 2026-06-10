import React, { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
}

interface ConfirmDialogState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  show: (options: ConfirmOptions) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmDialogState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,
  show: (options) => {
    return new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve });
    });
  },
  close: (result) => {
    const { resolve } = get();
    if (resolve) resolve(result);
    set({ isOpen: false, options: null, resolve: null });
  },
}));

// Convenience export — use this in components
export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  useConfirmStore.getState().show(options);

export const ConfirmDialog: React.FC = () => {
  const { isOpen, options, close } = useConfirmStore();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button for keyboard accessibility
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  if (!isOpen || !options) return null;

  const isDanger = options.variant === 'danger';
  const isWarning = options.variant === 'warning';

  return (
    <div
      className="confirm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div className="confirm-dialog">
        <div className={`confirm-icon-wrap ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}>
          {isDanger ? (
            <Trash2 className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>
        <div className="confirm-content">
          <h3 id="confirm-title" className="confirm-title">
            {options.title}
          </h3>
          <p id="confirm-message" className="confirm-message">
            {options.message}
          </p>
        </div>
        <div className="confirm-actions">
          <button
            className="btn confirm-cancel-btn"
            onClick={() => close(false)}
          >
            {options.cancelText ?? 'Cancel'}
          </button>
          <button
            ref={confirmBtnRef}
            className={`btn confirm-ok-btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => close(true)}
          >
            {options.confirmText ?? 'Confirm'}
          </button>
        </div>
        <button
          className="confirm-close-x"
          onClick={() => close(false)}
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
