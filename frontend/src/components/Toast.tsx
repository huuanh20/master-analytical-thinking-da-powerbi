import React, { useEffect, useState } from 'react';
import { useToastStore, type Toast } from '../services/toast';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useToastStore((s) => s.removeToast);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const duration = toast.duration ?? 3500;

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => removeToast(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, removeToast]);

  const Icon = ICONS[toast.type];

  return (
    <div
      className={`toast-item toast-${toast.type} ${visible ? 'toast-enter' : ''} ${exiting ? 'toast-exit' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-icon">
        <Icon className="w-5 h-5" />
      </div>
      <div className="toast-body">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button
        className="toast-close"
        onClick={() => {
          setExiting(true);
          setTimeout(() => removeToast(toast.id), 300);
        }}
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div
        className="toast-progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
};
