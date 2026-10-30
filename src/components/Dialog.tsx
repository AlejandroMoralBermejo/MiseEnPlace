'use client';

import { useId } from 'react';
import { CloseIcon } from './Icons';

export const fieldClass =
  'min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-base font-medium text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/40';
export const textareaClass =
  'w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-[15px] leading-snug text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/40';
export const labelClass = 'mb-1.5 block text-sm font-semibold';
export const primaryButtonClass =
  'min-h-12 rounded-full bg-primary px-5 font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50';
export const secondaryButtonClass =
  'min-h-11 rounded-full border border-line px-4 font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-50';
export const iconButtonClass = 'flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors hover:bg-surface';

// Full screen on a phone, centered window from the desktop breakpoint up.
export function FormDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ground lg:items-center lg:bg-black/60 lg:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full p-4 lg:max-w-lg lg:rounded-2xl lg:border lg:border-line lg:bg-ground lg:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-display text-3xl font-extrabold leading-none tracking-tight">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={iconButtonClass}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger = false,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string | null;
  danger?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border border-line bg-ground p-6"
      >
        <h2 id={titleId} className="mb-2 font-display text-2xl font-extrabold">
          {title}
        </h2>
        <div className="mb-5 text-muted">{children}</div>
        {error && (
          <p role="alert" className="mb-4 break-words text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          {cancelLabel && onCancel && (
            <button type="button" onClick={onCancel} disabled={busy} className={`flex-1 ${secondaryButtonClass}`}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 ${danger ? primaryButtonClass.replace('bg-primary', 'bg-danger') : primaryButtonClass}`}
          >
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg font-medium text-muted">{label}</p>
    </div>
  );
}
