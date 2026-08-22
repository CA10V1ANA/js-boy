import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PublicHeader } from './LandingPage';

describe('PublicHeader', () => {
  it('abre e fecha a navegação móvel de forma acessível', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><PublicHeader /></MemoryRouter>);

    const menu = screen.getByRole('button', { name: 'Abrir menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Sobre' })).not.toBeInTheDocument();

    await user.click(menu);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('link', { name: 'Serviços' }));
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
