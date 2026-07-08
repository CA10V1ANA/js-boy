import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientesPage } from './ClientesPage';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

const mockedApi = vi.mocked(api, true);
const mockedUseToast = vi.mocked(useToast);

describe('ClientesPage', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseToast.mockReturnValue({ showToast });
    mockedApi.get.mockResolvedValue({ data: [] });
  });

  it('lista os clientes retornados pela API', async () => {
    mockedApi.get.mockResolvedValue({
      data: [{ id: '1', nome: 'Maria Souza', telefone: '11988887777', cidade: 'Sao Paulo', ativo: true, criadoEm: '' }],
    });

    render(<ClientesPage />);

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument();
  });

  it('exibe erro de validacao ao tentar cadastrar sem preencher campos obrigatorios', async () => {
    const user = userEvent.setup();
    render(<ClientesPage />);

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Informe o nome')).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('cadastra um cliente valido e exibe toast de sucesso', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    render(<ClientesPage />);

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());

    await user.type(screen.getByLabelText('Nome'), 'Joao Silva');
    await user.type(screen.getByLabelText('Telefone'), '11999990000');
    await user.type(screen.getByLabelText('Endereco'), 'Rua A, 100');
    await user.type(screen.getByLabelText('Bairro'), 'Centro');
    await user.type(screen.getByLabelText('Cidade'), 'Sao Paulo');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith('/clientes', expect.objectContaining({ nome: 'Joao Silva' })));
    expect(showToast).toHaveBeenCalledWith('Cliente cadastrado com sucesso.', 'success');
  });
});
