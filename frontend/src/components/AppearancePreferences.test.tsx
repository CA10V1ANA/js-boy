import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AppLayout } from '../layouts/AppLayout';
import { AppearancePreferences } from './AppearancePreferences';
import { setLocale, setTheme } from '../preferences';

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ autenticado: false, usuario: { id: 'owner', nome: 'Caio', perfil: 'PROPRIETARIO' }, login: vi.fn(), logout: vi.fn(), entrarGoogle: vi.fn() }) }));
vi.mock('../services/api', () => ({ api: { get: vi.fn().mockResolvedValue({ data: { total: 2 } }) } }));
vi.mock('./GoogleLoginButton', () => ({ GoogleLoginButton: () => null }));

beforeEach(() => { localStorage.clear(); setLocale('pt-BR'); setTheme('light'); });
afterEach(() => { act(() => { setLocale('pt-BR'); setTheme('light'); }); vi.restoreAllMocks(); });

describe('Preferências de aparência e idioma', () => {
  it('troca textos e validações de login imediatamente sem recarregar', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Informe o e-mail')).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByRole('heading', { name: 'Sign in to JS Boy' })).toBeInTheDocument();
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('jsboy.locale')).toBe('en');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'es');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByText('Introduce la contraseña')).toBeInTheDocument();
  });

  it('troca os rótulos do menu sem perder rotas, contadores nem identidade', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/dashboard']}><AppLayout /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('link', { name: /Conversas/ })).toHaveTextContent('2'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByRole('link', { name: 'Payments' })).toHaveAttribute('href', '/pagamentos');
    expect(screen.getByRole('link', { name: /Conversations/ })).toHaveTextContent('2');
    expect(screen.getByText('Caio')).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'es');
    expect(screen.getByRole('link', { name: 'Pagos' })).toHaveAttribute('href', '/pagamentos');
    expect(screen.getByRole('link', { name: /Conversaciones/ })).toHaveTextContent('2');
  });

  it('persiste o tema e sincroniza idioma e tema entre abas', async () => {
    const user = userEvent.setup();
    render(<AppearancePreferences />);
    await user.click(screen.getByRole('button', { name: 'Tema escuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('jsboy.theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Tema escuro' })).toHaveAttribute('aria-pressed', 'true');
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: 'jsboy.locale', newValue: 'es' })); });
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toHaveValue('es');
    fireEvent(window, new StorageEvent('storage', { key: 'jsboy.theme', newValue: 'light' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('mantém as preferências utilizáveis quando o navegador bloqueia persistência', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<AppearancePreferences />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(document.documentElement.lang).toBe('en');
    expect(warning).toHaveBeenCalledOnce();
  });
});
