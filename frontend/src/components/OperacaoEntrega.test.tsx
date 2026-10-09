import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { storeAuth } from '../services/authStorage';
import { OperacaoEntrega } from './OperacaoEntrega';
vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
let state: Record<string, unknown>;
const stops = [
  { id: 'stop-1', ordem: 1, tipo: 'COLETA', endereco: 'Rua A', status: 'PENDENTE', versao: 0 },
  { id: 'stop-2', ordem: 2, tipo: 'ENTREGA', endereco: 'Rua B', status: 'PENDENTE', versao: 0 },
];
describe('Operação e confirmação financeira', () => {
  beforeEach(() => {
    localStorage.clear();
    storeAuth('test-only', { id: 'b4b7c67b-821f-4081-acf1-cee4b0d6918b', nome: 'Teste', email: 'teste@example.invalid', perfil: 'ENTREGADOR' });
    vi.clearAllMocks();
    state = { formaPagamento: 'DINHEIRO', valorRecebido: 0, saldo: 80, recebedorNome: 'Jean',
      referenciaRecebedor: 'ref-recebedor', recebidoConfirmado: false, podeConfirmar: true,
      podeFinalizar: false, pendencia: 'Confirme o recebimento em dinheiro para finalizar' };
    vi.mocked(api.get).mockImplementation(async url => ({ data: String(url).includes('/recebimentos/') ? { ...state } : stops }));
  });
  it('dinheiro não mostra chave Pix e finalização espera a confirmação do servidor', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockImplementation(async () => {
      state = { ...state, saldo: 0, valorRecebido: 80, recebidoConfirmado: true, podeConfirmar: false,
        podeFinalizar: false, pendencia: 'Conclua as paradas pendentes' };
      return { data: {} };
    });
    render(<OperacaoEntrega entregaId="entrega-1" versao={2} perfil="ENTREGADOR" />);
    expect(await screen.findByRole('button', { name: 'Finalizar entrega' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Copiar chave Pix' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar dinheiro recebido' }));
    expect(api.post).toHaveBeenCalledWith('/recebimentos/entregas/entrega-1/confirmar',
      { valor: 80, formaPagamento: 'DINHEIRO', referenciaRecebedor: 'ref-recebedor' },
      { headers: { 'Idempotency-Key': expect.any(String) } });
    expect(await screen.findByText('Recebimento regularizado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar entrega' })).toBeDisabled();
    expect(api.patch).not.toHaveBeenCalled();
  });
  it('falha de rede bloqueia finalização e repete a mesma operação', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValueOnce(new Error('resposta perdida')).mockResolvedValueOnce({ data: {} });
    render(<OperacaoEntrega entregaId="entrega-1" versao={2} perfil="ENTREGADOR" />);
    await user.click(await screen.findByRole('button', { name: 'Confirmar dinheiro recebido' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Recebimento regularizado')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finalizar entrega' })).not.toBeInTheDocument();
    const attempt = vi.mocked(api.post).mock.calls[0];
    await user.click(screen.getByRole('button', { name: 'Atualizar rota e pagamento' }));
    await user.click(await screen.findByRole('button', { name: 'Confirmar dinheiro recebido' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    expect(vi.mocked(api.post).mock.calls[1]).toEqual(attempt);
  });
  it('mostra somente a primeira parada pendente como ação disponível', async () => {
    render(<OperacaoEntrega entregaId="entrega-1" versao={2} perfil="ENTREGADOR" />);
    expect(await screen.findByRole('button', { name: 'Confirmar coleta' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Concluir parada' })).not.toBeInTheDocument();
  });
  it('conclui a entrega com quem recebeu, observação opcional e sem foto ou código', async () => {
    const user = userEvent.setup();
    const pendente = [{ ...stops[0], status: 'CONCLUIDA', realizadaEm: '2026-10-08T12:00:00Z' }, stops[1]];
    vi.mocked(api.get).mockImplementation(async url => ({ data: String(url).includes('/recebimentos/') ? { ...state } : pendente }));
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    render(<OperacaoEntrega entregaId="entrega-1" versao={2} perfil="ENTREGADOR" />);
    const concluir = await screen.findByRole('button', { name: 'Concluir parada' });
    expect(concluir).toBeDisabled();
    expect(screen.queryByText(/foto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/código/i)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Quem recebeu'), 'Alysson');
    await user.click(concluir);
    expect(api.post).toHaveBeenCalledWith('/rotas/entregas/entrega-1/paradas/stop-2/concluir',
      { recebedorNome: 'Alysson', observacao: null }, { headers: { 'If-Match': '0' } });
  });
  it('recupera a mesma confirmação após fechar a tela com resposta perdida', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValueOnce(new Error('resposta perdida')).mockResolvedValueOnce({ data: {} });
    const first = render(<OperacaoEntrega entregaId="entrega-1" versao={2} perfil="ENTREGADOR" />);
    await user.click(await screen.findByRole('button', { name: 'Confirmar dinheiro recebido' }));
    await screen.findByRole('alert');
    const attempt = vi.mocked(api.post).mock.calls[0];
    first.unmount();
    state = { ...state, saldo: 0, valorRecebido: 80, recebidoConfirmado: true, podeConfirmar: false };
    render(<OperacaoEntrega entregaId="entrega-1" versao={2} perfil="ENTREGADOR" />);
    await user.click(await screen.findByRole('button', { name: 'Conferir tentativa anterior' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    expect(vi.mocked(api.post).mock.calls[1]).toEqual(attempt);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Conferir tentativa anterior' })).not.toBeInTheDocument());
  });
  it('respeita a permissão retornada pelo servidor', async () => {
    state.podeConfirmar = false;
    render(<OperacaoEntrega entregaId="entrega-1" versao={2} perfil="ENTREGADOR" />);
    await screen.findByRole('button', { name: 'Finalizar entrega' });
    expect(screen.queryByRole('button', { name: 'Confirmar dinheiro recebido' })).not.toBeInTheDocument();
  });
});
