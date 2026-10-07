import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { PixPagamento } from './PixPagamento';

vi.mock('../services/api', () => ({ api: { post: vi.fn(), get: vi.fn() } }));
const response = { id: 'pix-1', valor: 50, status: 'PENDENTE', qrCodeBase64: 'aW1hZ2U=',
  qrCodeCopiaECola: 'codigo-pix', expiraEm: '2099-01-01T00:00:00Z' };
describe('PixPagamento', () => {
  beforeEach(() => vi.clearAllMocks());
  it('gera QR Code e copia o código', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: response });
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<PixPagamento entregaId="entrega-1" />);
    await user.click(screen.getByRole('button', { name: 'Gerar cobrança Pix' }));
    expect(api.post).toHaveBeenCalledWith('/api/pix/entregas/entrega-1');
    expect(await screen.findByAltText('QR Code para pagamento Pix')).toHaveAttribute('src', 'data:image/png;base64,aW1hZ2U=');
    await user.click(screen.getByRole('button', { name: 'Copiar código Pix' }));
    expect(write).toHaveBeenCalledWith('codigo-pix');
  });
  it('permite cópia manual quando clipboard falha', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: response });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('permission'));
    render(<PixPagamento entregaId="entrega-1" />);
    await user.click(screen.getByRole('button', { name: 'Gerar cobrança Pix' }));
    await user.click(await screen.findByRole('button', { name: 'Copiar código Pix' }));
    expect(await screen.findByText(/copie manualmente/)).toBeInTheDocument();
    expect(screen.getByLabelText('Pix Copia e Cola')).toHaveValue('codigo-pix');
  });
  it('pagamento confirmado não exibe QR Code', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ...response, status: 'PAGO' } });
    render(<PixPagamento entregaId="entrega-1" />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Gerar cobrança Pix' }));
    expect(await screen.findByText(/Pagamento confirmado/)).toBeInTheDocument();
    expect(screen.queryByAltText('QR Code para pagamento Pix')).not.toBeInTheDocument();
  });
});
