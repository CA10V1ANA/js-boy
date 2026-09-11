export function whatsappHref(value?: string, name?: string) {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 10 || digits.length > 15) return undefined;
  const text = encodeURIComponent(`Olá${name ? `, ${name}` : ''}! Aqui é da JS Boy. Podemos conversar sobre sua entrega?`);
  return `https://wa.me/${digits}?text=${text}`;
}
