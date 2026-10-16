import { message } from './index';

// Explicit system messages from RecebimentoService and GlobalExceptionHandler.
// Do not apply this mapping to names, addresses, chat content or free-form notes.
const serverKeys: Readonly<Record<string, string>> = {
  'E-mail já cadastrado': 'conta.edicao.email.invalid',
  'Placa inválida. Informe o padrão ABC1234 ou ABC1D23': 'conta.edicao.placa.invalida',
  'Entrega cancelada': 'servidor.entrega.cancelada',
  'Designe um entregador para finalizar': 'servidor.finalizacao.designacao',
  'Concilie a cobrança legada pendente': 'servidor.finalizacao.legado',
  'Confirme o recebimento do Pix para finalizar. Existe saldo pendente': 'servidor.finalizacao.pix',
  'Confirme o recebimento em dinheiro para finalizar. Existe saldo pendente': 'servidor.finalizacao.dinheiro',
  'Escolha Pix ou Dinheiro e regularize o saldo pendente': 'servidor.finalizacao.forma',
  'Pagamento precisa ser conciliado com a forma e o recebedor atuais': 'servidor.finalizacao.conciliacao',
  'Conclua as paradas pendentes': 'servidor.finalizacao.paradas',
  'Os dados foram alterados por outra pessoa. Recarregue e tente novamente': 'servidor.conflito',
  'E-mail ou senha inválidos': 'servidor.credenciais',
  'Você não tem permissão para acessar este recurso': 'servidor.permissao',
  'Ocorreu um erro inesperado. Tente novamente mais tarde.': 'servidor.erro.inesperado',
};

export function serverMessage(value: string, code?: string): string {
  if (code === 'OPTIMISTIC_LOCK') return message('servidor.conflito');
  return serverKeys[value] ? message(serverKeys[value]) : value;
}

export function completionMessage(value: string | null | undefined, customer: boolean): string {
  if (!value) return message('operacao.entrega.todas.as.verificacoes.foram.concluidas');
  const key = serverKeys[value];
  if (!key) return value;
  return message(customer && key.startsWith('servidor.finalizacao.') ? `${key}.cliente` : key);
}
