import { MouseEvent, ReactNode } from 'react';
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
  if (!open) {
    return null;
  }

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalPanel" style={{ maxWidth }} onClick={stop}>
        <div className="modalHeader">
          <div>
            {eyebrow ? <span className="modalEyebrow">{eyebrow}</span> : null}
            <h3>{title}</h3>
          </div>
          <button className="modalClose" onClick={onClose} type="button" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}
