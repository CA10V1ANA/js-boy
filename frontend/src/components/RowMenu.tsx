import { MoreHorizontal } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

export type RowMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
};

type RowMenuProps = {
  items: RowMenuItem[];
};

export function RowMenu({ items }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(event: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="rowMenu" ref={ref}>
      <button className="rowMenuButton" onClick={() => setOpen((value) => !value)} type="button" aria-label="Mais acoes">
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="rowMenuDropdown">
          {items.map((item) => (
            <div
              key={item.label}
              className={item.danger ? 'rowMenuItem danger' : 'rowMenuItem'}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
