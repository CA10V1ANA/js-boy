import { ReactNode } from 'react';

export type TableAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export function TableActions({ actions }: { actions: TableAction[] }) {
  return (
    <div className="tableActions" aria-label="Acoes do registro">
      {actions.map((action) => (
        <button
          key={action.label}
          className={action.danger ? 'tableActionButton danger' : 'tableActionButton'}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          aria-label={action.label}
          title={action.label}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
