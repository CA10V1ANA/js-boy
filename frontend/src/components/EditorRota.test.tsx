import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { LocalRota } from '../types';
import { EditorRota, novoLocal } from './EditorRota';

function Rota() {
  const [value, setValue] = useState<LocalRota[]>([
    { ...novoLocal('COLETA'), id: 'a', logradouro: 'Origem A', numero: '1', contatoNome: 'Contato A' },
    { ...novoLocal('COLETA'), id: 'b', logradouro: 'Coleta B', numero: '2', contatoNome: 'Contato B' },
    { ...novoLocal('ENTREGA'), id: 'c', logradouro: 'Destino C', numero: '3', contatoNome: 'Contato C' },
  ]);
  return <EditorRota value={value} onChange={setValue} />;
}
describe('Editor de locais', () => {
  it('preserva os dados digitados quando o operador reordena e remove um local', async () => {
    const user = userEvent.setup();
    render(<Rota />);
    const cards = screen.getAllByRole('article');
    await user.clear(within(cards[1]).getByLabelText('Contato'));
    await user.type(within(cards[1]).getByLabelText('Contato'), 'Contato atualizado');
    await user.click(within(cards[1]).getByRole('button', { name: 'Mover para cima' }));
    const reordered = screen.getAllByRole('article');
    expect(within(reordered[0]).getByLabelText('Logradouro')).toHaveValue('Coleta B');
    expect(within(reordered[0]).getByLabelText('Contato')).toHaveValue('Contato atualizado');
    await user.click(within(reordered[1]).getByRole('button', { name: 'Remover parada' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByDisplayValue('Destino C')).toBeInTheDocument();
  });
  it('adiciona um local antes do destino sem perder os locais existentes', async () => {
    render(<Rota />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Adicionar parada' }));
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(4);
    expect(within(cards[0]).getByLabelText('Logradouro')).toHaveValue('Origem A');
    expect(within(cards[3]).getByLabelText('Logradouro')).toHaveValue('Destino C');
  });
});
