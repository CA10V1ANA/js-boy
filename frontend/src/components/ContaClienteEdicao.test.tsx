import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { ContaClienteEdicao } from './ContaClienteEdicao';
import { api } from '../services/api';
import type { Cliente } from '../types';

const mocks = vi.hoisted(() => ({ atualizarPerfil: vi.fn() }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => mocks }));
vi.mock('../services/api', () => ({ api: { get: vi.fn(), patch: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock('./GoogleLoginButton', () => ({ GoogleLoginButton: () => null }));
const cliente: Cliente = { id: 'customer', nome: 'Cliente Teste', email: 'contato@example.invalid', telefone: '85999990000',
  whatsapp: '85999990000', documento: '', cep: '60000000', logradouro: 'Rua A', numero: '10', semNumero: false,
  endereco: 'Rua A, 10', bairro: 'Centro', cidade: 'Fortaleza', estado: 'CE', complemento: '', ativo: true,
  criadoEm: '2026-10-15T12:00:00Z', versao: 2 };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: { emailAtivo: true } }); });

it('salva e-mail, documento e endereço diretamente e atualiza a identidade local', async () => {
  const user = userEvent.setup(); const onChange = vi.fn();
  const atualizado = { ...cliente, email: 'novo@example.invalid', documento: '52998224725', logradouro: 'Rua Nova', versao: 3 };
  vi.mocked(api.patch).mockResolvedValue({ data: atualizado });
  render(<ContaClienteEdicao cliente={cliente} onChange={onChange} />);
  await user.clear(screen.getByLabelText('E-mail de acesso'));
  await user.type(screen.getByLabelText('E-mail de acesso'), atualizado.email);
  await user.type(screen.getByLabelText('CPF ou CNPJ'), atualizado.documento);
  await user.clear(screen.getByLabelText('Rua ou avenida'));
  await user.type(screen.getByLabelText('Rua ou avenida'), 'Rua Nova');
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/cliente/me', expect.objectContaining({
    email: atualizado.email, documento: '52998224725', logradouro: 'Rua Nova', telefone: '85999990000',
  }), { headers: { 'If-Match': 2 } }));
  expect(api.post).not.toHaveBeenCalled();
  expect(onChange).toHaveBeenCalledWith(atualizado);
  expect(mocks.atualizarPerfil).toHaveBeenCalledWith({ nome: cliente.nome, email: atualizado.email });
  expect(await screen.findByText('Dados atualizados com sucesso.')).toBeInTheDocument();
});

it('preserva o número ao alternar endereço sem número e mantém a edição quando há conflito', async () => {
  const user = userEvent.setup();
  vi.mocked(api.patch).mockRejectedValue(new Error('conflict'));
  render(<ContaClienteEdicao cliente={cliente} onChange={vi.fn()} />);
  await user.click(screen.getByLabelText('Endereço sem número'));
  expect(screen.getByLabelText('Número')).toBeDisabled();
  await user.click(screen.getByLabelText('Endereço sem número'));
  expect(screen.getByLabelText('Número')).toHaveValue('10');
  await user.clear(screen.getByLabelText('Telefone'));
  await user.type(screen.getByLabelText('Telefone'), '85988887777');
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar');
  expect(screen.getByLabelText('Telefone')).toHaveValue('(85) 98888-7777');
});
