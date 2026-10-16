import { message } from './index';

/** API codes remain unchanged; only their presentation is localized. */
export function domainLabel(value?: string | null): string {
  if (!value) return message('exibicao.nao.informado');
  const key = `dominio.${value}`;
  const translated = message(key);
  return translated === key ? value.replace(/_/g, ' ').toLowerCase().replace(/^./, letter => letter.toUpperCase()) : translated;
}
