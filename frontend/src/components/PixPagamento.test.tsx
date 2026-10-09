import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { PixPagamento } from './PixPagamento';
vi.mock('../services/api', () => ({ api: { post: vi.fn(), get: vi.fn() } }));
const response = { formaPagamento: 'PIX', valorRecebido: 0, saldo: 50, recebedorNome: 'Jean',
  chavePix: 'jean@example.invalid', titularPix: 'Jean teste', referenciaRecebedor: 'ref',
  recebidoConfirmado: false, podeConfirmar: false, podeFinalizar: false,
  pendencia: 'Confirme o recebimento do Pix para finalizar' };
describe('Pix direto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation(async url => ({ data: String(url).includes('/recebimentos/') ? response : [] }));
  });
  it('copia a chave do recebedor sem emitir cobrança nem confirmar recebimento', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<PixPagamento entregaId="entrega-1" />);
    await user.click(await screen.findByRole('button', { name: 'Copiar chave Pix' }));
    expect(write).toHaveBeenCalledWith('jean@example.invalid');
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByText('Aguardando confirmação')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar Pix recebido' })).not.toBeInTheDocument();
  });
  it('permite copiar manualmente quando o clipboard falha', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('permission'));
    render(<PixPagamento entregaId="entrega-1" />);
    await user.click(await screen.findByRole('button', { name: 'Copiar chave Pix' }));
    expect(await screen.findByText(/copie manualmente/)).toBeInTheDocument();
    expect(screen.getByText('jean@example.invalid')).toBeInTheDocument();
  });
});
