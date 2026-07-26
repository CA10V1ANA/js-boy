import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderLoginPage() {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
  return within(document.querySelector('.clientLoginForm') as HTMLElement);
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('exibe erros de validacao quando o formulario e enviado vazio', async () => {
    mockedUseAuth.mockReturnValue({ autenticado: false, carregando: false, login: vi.fn(), usuario: null, token: null, logout: vi.fn() });
    const user = userEvent.setup();
    const form = renderLoginPage();

    await user.clear(form.getByLabelText('E-mail'));
    await user.clear(form.getByLabelText('Senha'));
    await user.click(form.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o e-mail')).toBeInTheDocument();
    expect(await screen.findByText('Informe a senha')).toBeInTheDocument();
  });

  it('chama login e nao mostra erro quando as credenciais sao validas', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ autenticado: false, carregando: false, login, usuario: null, token: null, logout: vi.fn() });
    const user = userEvent.setup();
    const form = renderLoginPage();

    await user.type(form.getByLabelText('E-mail'), 'usuario@exemplo.com');
    await user.type(form.getByLabelText('Senha'), 'senha-segura');
    await user.click(form.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('usuario@exemplo.com', 'senha-segura'));
    expect(screen.queryByText('E-mail ou senha invalidos.')).not.toBeInTheDocument();
  });

  it('mostra mensagem de erro quando o login falha', async () => {
    const login = vi.fn().mockRejectedValue(new Error('unauthorized'));
    mockedUseAuth.mockReturnValue({ autenticado: false, carregando: false, login, usuario: null, token: null, logout: vi.fn() });
    const user = userEvent.setup();
    const form = renderLoginPage();

    await user.type(form.getByLabelText('E-mail'), 'usuario@exemplo.com');
    await user.type(form.getByLabelText('Senha'), 'senha-incorreta');
    await user.click(form.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail ou senha invalidos.')).toBeInTheDocument();
  });

  it('nao preenche credenciais nem oferece cadastro publico', () => {
    mockedUseAuth.mockReturnValue({ autenticado: false, carregando: false, login: vi.fn(), usuario: null, token: null, logout: vi.fn() });
    const form = renderLoginPage();

    expect(form.getByLabelText('E-mail')).toHaveValue('');
    expect(form.getByLabelText('Senha')).toHaveValue('');
    expect(screen.queryByText(/criar conta/i)).not.toBeInTheDocument();
  });
});
