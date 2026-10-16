import { message } from '../i18n';
export function whatsappHref(value?: string, name?: string) {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 10 || digits.length > 15) return undefined;
  const text = encodeURIComponent(message("whatsapp.olavalue.aqui.e.da.js.boy.podemos.conversar.sobre.sua.entrega", { value1: name ? `, ${name}` : '' }));
  return `https://wa.me/${digits}?text=${text}`;
}
