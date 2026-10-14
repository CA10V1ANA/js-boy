import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { EsqueciSenhaPage } from './EsqueciSenhaPage';

vi.mock('../services/api', () => ({
  api: { post: vi.fn() },
}));

const mockedPost = vi.mocked(api.post);

function renderPage() {
  render(
    <MemoryRouter>
      <EsqueciSenhaPage />
    </MemoryRouter>,
  );
}

describe('EsqueciSenhaPage', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('apresenta a ação de retorno como navegação secundária', () => {
    renderPage();

    expect(screen.getByText('Digite o e-mail cadastrado para receber um link de redefinição de senha.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveClass('authBackLink');
  });

  it('exibe uma confirmação clara após solicitar a recuperação', async () => {
    mockedPost.mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('E-mail'), 'cliente@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/auth/password/request', { email: 'cliente@exemplo.com' }));
    expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeInTheDocument();
    expect(screen.getByText('Não encontrou a mensagem? Verifique a pasta de spam.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveClass('authBackLink');
  });
});
