import { MouseEvent, ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
};

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
  maxWidth = 580,
}: ModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Tab") {
        const dialog = closeRef.current?.closest(".modalPanel");
        const controls = dialog
          ? Array.from(
              dialog.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
              ),
            ).filter((e) => e.getClientRects().length > 0)
          : [];
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      const dialogs = document.querySelectorAll(".modalPanel");
      if (
        event.key === "Escape" &&
        closeRef.current?.closest(".modalPanel") === dialogs[dialogs.length - 1]
      )
        onCloseRef.current();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  return createPortal(
    <div className="modalOverlay" role="presentation" onClick={onClose}>
      <div
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth }}
        onClick={stop}
      >
        <div className="modalHeader">
          <div>
            {eyebrow ? <span className="modalEyebrow">{eyebrow}</span> : null}
            <h3 id={titleId}>{title}</h3>
          </div>
          <button
            ref={closeRef}
            className="modalClose"
            onClick={onClose}
            type="button"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
