import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from './apiError';

function responseError(status: number, message?: string) {
  return Object.assign(new AxiosError('Falha na requisição'), {
    response: { status, data: { message } },
  });
}

describe('apiErrorMessage', () => {
  it('preserva o motivo seguro de um conflito financeiro', () => {
    expect(apiErrorMessage(responseError(409, 'Pagamento excede o saldo disponivel da entrega'), 'Erro genérico'))
      .toBe('Pagamento excede o saldo disponivel da entrega');
    expect(apiErrorMessage(responseError(409, 'Entrega cancelada não pode receber novos pagamentos'), 'Erro genérico'))
      .toBe('Entrega cancelada não pode receber novos pagamentos');
  });

  it('preserva a orientação específica para versão antiga', () => {
    expect(apiErrorMessage(responseError(409, 'Os dados foram alterados. Recarregue e tente novamente'), 'Erro genérico'))
      .toBe('Os dados foram alterados. Recarregue e tente novamente');
  });

  it('usa o contexto da tela quando a resposta não contém mensagem', () => {
    expect(apiErrorMessage(responseError(409), 'Não foi possível registrar o estorno.'))
      .toBe('Não foi possível registrar o estorno.');
    expect(apiErrorMessage(new Error('falha de rede'), 'Não foi possível carregar.'))
      .toBe('Não foi possível carregar.');
  });
});
