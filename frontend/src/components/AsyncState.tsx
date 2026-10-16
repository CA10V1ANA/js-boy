import { message, useLocale } from '../i18n';
import { AlertTriangle, CheckCircle2, Inbox, LoaderCircle, RotateCcw } from 'lucide-react';
import { ReactNode, useEffect, useRef } from 'react';

export function LoadingState({ label = message("estado.carregando") }: { label?: string }) {
  useLocale();
  return (
    <div className="asyncState" role="status" aria-live="polite">
      <LoaderCircle className="spin" size={24} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  useLocale();
  return (
    <div className="asyncState">
      <Inbox size={26} aria-hidden="true" />
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}

export function ErrorState({
  message: errorMessage,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  useLocale();
  return (
    <div className="asyncState error" role="alert">
      <AlertTriangle size={25} aria-hidden="true" />
      <strong>{message("estado.algo.deu.errado")}</strong>
      <span>{errorMessage}</span>
      {onRetry ? (
        <button className="secondaryButton" type="button" onClick={onRetry}>
          <RotateCcw size={16} aria-hidden="true" /> {message("estado.tentar.novamente")} </button>
      ) : null}
    </div>
  );
}

export function FeedbackMessage({
  tone,
  children,
}: {
  tone: 'success' | 'error';
  children: ReactNode;
}) {
  useLocale();
  return (
    <div className={`feedbackMessage ${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      {tone === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
      <span>{children}</span>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = message("estado.confirmar"),
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useLocale();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [busy, onCancel, open]);

  if (!open) return null;

  return (
    <div className="modalOverlay" role="presentation">
      <div className="confirmDialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        <div className="confirmActions">
          <button ref={cancelRef} className="secondaryButton" type="button" onClick={onCancel} disabled={busy}>
            {message("estado.voltar")} </button>
          <button className={danger ? 'dangerButton' : 'primaryButton'} type="button" onClick={onConfirm} disabled={busy}>
            {busy ? message("comum.processando") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
