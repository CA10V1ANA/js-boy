export function sentenceCase(value?: string | null) {
  const normalized = (value || '').replace(/_/g, ' ').trim().toLocaleLowerCase('pt-BR');
  return normalized ? normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1) : 'Nao informado';
}

export function titleCase(value?: string | null) {
  return (value || '').trim().toLocaleLowerCase('pt-BR').replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'));
}

export function publicDeliveryCode(position: number) {
  return `Entrega #${String(position + 1).padStart(3, '0')}`;
}
