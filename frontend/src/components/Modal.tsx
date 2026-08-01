import { MouseEvent, ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
};

export function Modal({ open, onClose, eyebrow, title, children, footer, maxWidth = 580 }: ModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  if (!open) return null;

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className="modalOverlay" role="presentation" onClick={onClose}>
      <div className="modalPanel" role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ maxWidth }} onClick={stop}>
        <div className="modalHeader">
          <div>
            {eyebrow ? <span className="modalEyebrow">{eyebrow}</span> : null}
            <h3 id={titleId}>{title}</h3>
          </div>
          <button ref={closeRef} className="modalClose" onClick={onClose} type="button" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}
