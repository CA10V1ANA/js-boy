import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { ContactForm } from './ContactForm';

vi.mock('../services/api', () => ({
  api: { post: vi.fn() },
}));

const mockedPost = vi.mocked(api.post);

describe('ContactForm', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('valida os campos antes do envio', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: 'Enviar solicitacao' }));

    expect(await screen.findByText('Informe seu nome')).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('envia ao endpoint publico e mostra o protocolo', async () => {
    mockedPost.mockResolvedValue({ data: { protocolo: 'CONTATO-123' } } as never);
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText('Nome'), 'Maria Souza');
    await user.type(screen.getByLabelText(/Empresa/), 'Loja Exemplo');
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText('Telefone'), '85999999999');
    await user.type(screen.getByLabelText('Mensagem'), 'Preciso conversar sobre uma entrega.');
    await user.click(screen.getByRole('button', { name: 'Enviar solicitacao' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/public/contatos', {
      nome: 'Maria Souza',
      empresa: 'Loja Exemplo',
      email: 'maria@exemplo.com',
      telefone: '85999999999',
      mensagem: 'Preciso conversar sobre uma entrega.',
      website: '',
    }));
    expect(await screen.findByText(/CONTATO-123/)).toBeInTheDocument();
  });
});
