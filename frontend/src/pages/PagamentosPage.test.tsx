import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { PagamentosPage } from './PagamentosPage';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }));

const mockedApi = vi.mocked(api, true);
const mockedUseAuth = vi.mocked(useAuth);
const usuario = {
  id: '0d441e7d-62f1-48ce-9035-2b104dc52fb9', nome: 'Caio',
  email: 'caio@example.invalid', perfil: 'PROPRIETARIO' as const,
};
const entregaId = '22ffde33-96c1-45a8-8f2c-b892227a8ded';
const pagamentoId = 'a511791b-aed8-4cf1-9532-a9f1642ff660';
let payments: unknown[];

describe('PagamentosPage: resposta perdida e reenvio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    payments = [];
    mockedUseAuth.mockReturnValue({
      token: 'token', usuario, autenticado: true, carregando: false,
      login: vi.fn(), logout: vi.fn(),
    });
    mockedApi.get.mockImplementation(async (url) => ({
      data: url === '/entregas'
        ? [{ id: entregaId, codigo: 'ENT-1', clienteNome: 'Maria' }]
        : url === '/pagamentos' ? payments
          : { valorEntregas: 50, valorRecebido: 0, valorPendente: 50, pagamentosRegistrados: 0, pendencias: [] },
    }));
  });

  it('reenvia o pagamento com mesma chave e mesmo payload após reload', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('resposta perdida')).mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    const firstRender = render(<PagamentosPage />);
    await user.click(await screen.findByRole('button', { name: 'Novo pagamento' }));
    await user.selectOptions(screen.getByLabelText('Entrega'), entregaId);
    await user.type(screen.getByLabelText('Valor'), '25.50');
    await user.click(screen.getByRole('button', { name: 'Revisar pagamento' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Registrar pagamento?' }))
      .getByRole('button', { name: 'Registrar pagamento' }));

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Pagamento pendente de confirmação')).toBeInTheDocument();
    const firstCall = mockedApi.post.mock.calls[0];
    expect(firstCall[1]).toEqual(expect.objectContaining({ entregaId, valor: 25.5 }));
    firstRender.unmount();

    render(<PagamentosPage />);
    await user.click(await screen.findByRole('button', { name: 'Reenviar pagamento pendente' }));
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(2));
    expect(mockedApi.post.mock.calls[1]).toEqual(firstCall);
    await waitFor(() => expect(screen.queryByText('Pagamento pendente de confirmação')).not.toBeInTheDocument());
  });

  it('reenvia o estorno ao mesmo pagamento após reload', async () => {
    payments = [{
      id: pagamentoId, clienteNome: 'Maria', pagoEm: '2026-10-01T12:00:00Z',
      tipo: 'RECEBIMENTO', formaPagamento: 'PIX', valor: 25.5,
    }];
    mockedApi.post.mockRejectedValueOnce(new Error('resposta perdida')).mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    const firstRender = render(<PagamentosPage />);
    await user.click(await screen.findByRole('button', { name: 'Estornar' }));
    await user.type(screen.getByLabelText('Motivo'), 'Ajuste parcial');
    await user.click(screen.getByRole('button', { name: 'Confirmar estorno' }));

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Estorno pendente de confirmação')).toBeInTheDocument();
    const firstCall = mockedApi.post.mock.calls[0];
    expect(firstCall[0]).toBe(`/pagamentos/${pagamentoId}/estornos`);
    firstRender.unmount();

    render(<PagamentosPage />);
    await user.click(await screen.findByRole('button', { name: 'Reenviar estorno pendente' }));
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(2));
    expect(mockedApi.post.mock.calls[1]).toEqual(firstCall);
    await waitFor(() => expect(screen.queryByText('Estorno pendente de confirmação')).not.toBeInTheDocument());
  });
});
