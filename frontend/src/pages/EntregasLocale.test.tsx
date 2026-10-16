import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { EntregasPage } from './EntregasPage';
import { api } from '../services/api';
import { setLocale } from '../preferences';
import type { Entrega } from '../types';

vi.mock('../services/api', () => ({ api: { get: vi.fn() } }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
afterEach(() => { act(() => setLocale('pt-BR')); });

it('mantém o filtro de status ao trocar inglês por espanhol sem traduzir os códigos da API', async () => {
  const deliveries = (['ENTREGUE', 'EM_ROTA'] as const).map((status, index): Entrega => ({
    id: String(index), codigo: `ENT-${index}`, status, clienteNome: 'Café Entrega', destinatarioNome: `Contato ${index}`,
    enderecoOrigem: 'Rua A', enderecoDestino: 'Rua B', bairroOrigem: 'Centro', bairroDestino: 'Centro',
    valorFinal: 20, criadoEm: '2026-10-15T12:00:00Z', historico: [],
    clienteId: 'customer', destinatarioTelefone: '85999999999', descricaoMercadoria: 'Caixa',
    distanciaKm: 1, taxaInicial: 5, valorPorKm: 1, valorCalculado: 20,
    tipoVeiculo: 'MOTO', origemPreco: 'AREA', tarifaBairro: 20, possuiRetorno: false,
    taxaRetornoAplicada: 0, tempoEsperaMinutos: 0, taxaEsperaAplicada: 0, versao: 0,
  }));
  vi.mocked(api.get).mockImplementation(async url => ({ data: url === '/entregas' ? deliveries : String(url).startsWith('/configuracoes') ? null : [] }));
  setLocale('en');
  render(<MemoryRouter><EntregasPage /></MemoryRouter>);
  const user = userEvent.setup();
  expect(await screen.findByText('ENT-0')).toBeInTheDocument();
  expect(screen.getByText('ENT-1')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Delivered' }));
  expect(screen.getByText('ENT-0')).toBeInTheDocument();
  expect(screen.queryByText('ENT-1')).not.toBeInTheDocument();
  act(() => setLocale('es'));
  expect(screen.getByRole('button', { name: 'Entregada' })).toHaveClass('active');
  expect(screen.getByText('ENT-0')).toBeInTheDocument();
  expect(screen.queryByText('ENT-1')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'En camino' }));
  await waitFor(() => expect(screen.getByText('ENT-1')).toBeInTheDocument());
  expect(screen.queryByText('ENT-0')).not.toBeInTheDocument();
  expect(deliveries.map(delivery => delivery.status)).toEqual(['ENTREGUE', 'EM_ROTA']);
});
