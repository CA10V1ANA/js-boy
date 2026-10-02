import { z } from 'zod';
import { idempotencyKey } from './apiError';

const paymentPayloadSchema = z.object({
  entregaId: z.string().uuid(),
  valor: z.number().positive(),
  formaPagamento: z.enum(['PIX', 'DINHEIRO', 'CARTAO', 'BOLETO', 'TRANSFERENCIA', 'OUTRO']),
  comprovante: z.string().nullable(),
  observacoes: z.string().nullable(),
});
const refundPayloadSchema = z.object({ valor: z.number().positive(), motivo: z.string().min(1) });
const base = { usuarioId: z.string().uuid(), chave: z.string().min(8) };
const paymentIntentSchema = z.object({ ...base, payload: paymentPayloadSchema });
const refundIntentSchema = z.object({ ...base, pagamentoId: z.string().uuid(), payload: refundPayloadSchema });

export type PaymentPayload = z.infer<typeof paymentPayloadSchema>;
export type RefundPayload = z.infer<typeof refundPayloadSchema>;
export type PendingPayment = z.infer<typeof paymentIntentSchema>;
export type PendingRefund = z.infer<typeof refundIntentSchema>;

const PAYMENT_KEY = 'jsboy.intent.payment';
const REFUND_KEY = 'jsboy.intent.refund';

function read<T>(key: string, usuarioId: string, schema: z.ZodType<T>): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = schema.parse(JSON.parse(raw));
    if ((parsed as { usuarioId: string }).usuarioId === usuarioId) return parsed;
  } catch {
    // Dados incompletos não podem ser usados para repetir uma escrita financeira.
  }
  localStorage.removeItem(key);
  return null;
}

export function pendingPayment(usuarioId: string) {
  return read(PAYMENT_KEY, usuarioId, paymentIntentSchema);
}

export function pendingRefund(usuarioId: string) {
  return read(REFUND_KEY, usuarioId, refundIntentSchema);
}

export function createPaymentIntent(usuarioId: string, payload: PaymentPayload): PendingPayment {
  if (pendingPayment(usuarioId)) throw new Error('Existe um pagamento pendente de confirmação.');
  const intent = paymentIntentSchema.parse({ usuarioId, chave: idempotencyKey('payment'), payload });
  localStorage.setItem(PAYMENT_KEY, JSON.stringify(intent));
  return intent;
}

export function createRefundIntent(usuarioId: string, pagamentoId: string, payload: RefundPayload): PendingRefund {
  if (pendingRefund(usuarioId)) throw new Error('Existe um estorno pendente de confirmação.');
  const intent = refundIntentSchema.parse({ usuarioId, pagamentoId, chave: idempotencyKey('refund'), payload });
  localStorage.setItem(REFUND_KEY, JSON.stringify(intent));
  return intent;
}

export function clearPaymentIntent() { localStorage.removeItem(PAYMENT_KEY); }
export function clearRefundIntent() { localStorage.removeItem(REFUND_KEY); }
export function clearFinancialIntents() {
  clearPaymentIntent();
  clearRefundIntent();
}
