import { message, useLocale } from '../i18n';
import { MoreVertical, Search } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  useLocale();
  return (
    <div className="pageHeader">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="pageHeaderActions">{action}</div> : null}
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  helper?: string;
  tone?: 'value' | 'success' | 'warning' | 'info';
  icon: ReactNode;
};

export function StatCard({ title, value, helper, tone = 'value', icon }: StatCardProps) {
  useLocale();
  return (
    <article className={`statCard tone-${tone}`}>
      <div className="statCardTop">
        <span className="statIcon">{icon}</span>
        {helper ? <span className="statBadge">{helper}</span> : null}
      </div>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  useLocale();
  return (
    <label className="searchField">
      <Search size={17} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

type FilterPillProps<T extends string> = {
  value: T;
  activeValue: T;
  onChange: (value: T) => void;
  children: ReactNode;
};

export function FilterPill<T extends string>({ value, activeValue, onChange, children }: FilterPillProps<T>) {
  useLocale();
  return (
    <button className={`filterPill ${value === activeValue ? 'active' : ''}`} type="button" onClick={() => onChange(value)}>
      {children}
    </button>
  );
}

type StatusPillProps = {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
};

export function StatusPill({ children, tone = 'neutral' }: StatusPillProps) {
  useLocale();
  return <span className={`statusPill tone-${tone}`}>{children}</span>;
}

type ActionItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

export function ActionMenu({ items }: { items: ActionItem[] }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="actionMenu" ref={ref}>
      <button className="ellipsisButton" type="button" onClick={() => setOpen((current) => !current)} aria-label={message("interface.mais.acoes")}>
        <MoreVertical size={18} />
      </button>
      {open ? (
        <div className="actionMenuList">
          {items.map((item) => (
            <button
              className={item.danger ? 'danger' : ''}
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
