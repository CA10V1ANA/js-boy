import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState } from './AsyncState';

describe('estados reutilizaveis', () => {
  it('diferencia carregamento de estado vazio', () => {
    const { rerender } = render(<LoadingState label="Carregando entregas" />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando entregas');
    rerender(<EmptyState title="Nenhuma entrega" />);
    expect(screen.queryByText('Carregando entregas')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhuma entrega')).toBeInTheDocument();
  });

  it('permite tentar novamente apos erro', async () => {
    const retry = vi.fn();
    render(<ErrorState message="Falha de rede" onRetry={retry} />);
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('exige confirmacao explicita', async () => {
    const confirm = vi.fn();
    const cancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Cancelar entrega?"
        description="Esta acao altera a operacao."
        onConfirm={confirm}
        onCancel={cancel}
      />,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(confirm).toHaveBeenCalledOnce();
  });
});
