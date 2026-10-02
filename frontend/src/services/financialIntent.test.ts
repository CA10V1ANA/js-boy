import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearFinancialIntents, createPaymentIntent, createRefundIntent,
  pendingPayment, pendingRefund,
} from './financialIntent';

const userId = '0d441e7d-62f1-48ce-9035-2b104dc52fb9';
const deliveryId = '22ffde33-96c1-45a8-8f2c-b892227a8ded';
const paymentId = 'a511791b-aed8-4cf1-9532-a9f1642ff660';
const payload = {
  entregaId: deliveryId, valor: 25.5, formaPagamento: 'PIX' as const,
  comprovante: null, observacoes: 'parcial',
};

describe('tentativas financeiras pendentes', () => {
  beforeEach(() => sessionStorage.clear());

  it('mantém chave e payload do pagamento após recarregar e impede nova intenção', () => {
    const intent = createPaymentIntent(userId, payload);
    expect(pendingPayment(userId)).toEqual(intent);
    expect(() => createPaymentIntent(userId, { ...payload, valor: 30 }))
      .toThrow('Existe um pagamento pendente');
    expect(pendingPayment(userId)?.chave).toBe(intent.chave);
  });

  it('separa estorno do pagamento e vincula o recurso à mesma chave', () => {
    const payment = createPaymentIntent(userId, payload);
    const refund = createRefundIntent(userId, paymentId, { valor: 10, motivo: 'ajuste' });
    expect(pendingRefund(userId)).toEqual(refund);
    expect(pendingRefund(userId)?.pagamentoId).toBe(paymentId);
    expect(pendingPayment(userId)?.chave).toBe(payment.chave);
    clearFinancialIntents();
    expect(pendingPayment(userId)).toBeNull();
    expect(pendingRefund(userId)).toBeNull();
  });

  it('não oferece tentativa de outro usuário na mesma aba', () => {
    createPaymentIntent(userId, payload);
    expect(pendingPayment('69d826d9-865e-49a7-bcef-a868e77e7ff2')).toBeNull();
    expect(pendingPayment(userId)).toBeNull();
  });
});
