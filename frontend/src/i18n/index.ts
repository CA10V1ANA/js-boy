import portuguese from './messages/messages_pt.properties?raw';
import english from './messages/messages.properties?raw';
import spanish from './messages/messages_es.properties?raw';
import { getLocale } from '../preferences';
import { parseProperties } from './properties';
export { useLocale } from '../preferences';

type Parameters = Record<string, string | number | null | undefined>;
const catalogs: Record<string, Record<string, string>> = {
  'pt-BR': parseProperties(portuguese),
  en: parseProperties(english),
  es: parseProperties(spanish),
};

/** Explicit message keys only: account names, addresses and chat messages are never translated. */
export function message(key: string, parameters: Parameters = {}): string {
  const text = catalogs[getLocale()][key] ?? catalogs['pt-BR'][key] ?? key;
  return text.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(parameters, name) ? String(parameters[name] ?? '') : placeholder,
  );
}

export const formatMoney = (value: number) => new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'BRL' }).format(value);
export const formatDateTime = (value: string | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' }) =>
  new Intl.DateTimeFormat(getLocale(), options).format(new Date(value));
