export type BusinessContact = {
  label: string;
  value: string;
  href?: string;
};

export type BusinessConfig = {
  phone?: BusinessContact;
  whatsapp?: BusinessContact;
  email?: BusinessContact;
  city?: string;
  instagram?: BusinessContact;
  hours?: string;
};

export type BusinessEnv = {
  VITE_BUSINESS_PHONE?: string;
  VITE_BUSINESS_WHATSAPP?: string;
  VITE_BUSINESS_EMAIL?: string;
  VITE_BUSINESS_CITY?: string;
  VITE_BUSINESS_INSTAGRAM?: string;
  VITE_BUSINESS_HOURS?: string;
};

function text(value: string | undefined, maxLength = 160) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function phoneContact(value: string | undefined, label: string): BusinessContact | undefined {
  const display = text(value, 40);
  if (!display) return undefined;

  const internationalPrefix = display.trim().startsWith('+') ? '+' : '';
  const digits = display.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return undefined;

  return { label, value: display, href: `tel:${internationalPrefix}${digits}` };
}

function whatsappContact(value: string | undefined): BusinessContact | undefined {
  const display = text(value, 40);
  if (!display) return undefined;

  const digits = display.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return undefined;

  return { label: 'WhatsApp', value: display, href: `https://wa.me/${digits}` };
}

function emailContact(value: string | undefined): BusinessContact | undefined {
  const email = text(value, 254)?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return { label: 'E-mail', value: email, href: `mailto:${email}` };
}

function instagramContact(value: string | undefined): BusinessContact | undefined {
  const configured = text(value, 120);
  if (!configured) return undefined;

  const handle = configured.replace(/^@/, '');
  if (/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
    return {
      label: 'Instagram',
      value: `@${handle}`,
      href: `https://www.instagram.com/${handle}/`,
    };
  }

  try {
    const url = new URL(configured);
    const allowedHost = url.hostname === 'instagram.com'
      || url.hostname === 'www.instagram.com';
    if (url.protocol !== 'https:' || !allowedHost) return undefined;
    return { label: 'Instagram', value: configured, href: url.toString() };
  } catch {
    return undefined;
  }
}

export function parseBusinessConfig(env: BusinessEnv): BusinessConfig {
  return {
    phone: phoneContact(env.VITE_BUSINESS_PHONE, 'Telefone'),
    whatsapp: whatsappContact(env.VITE_BUSINESS_WHATSAPP),
    email: emailContact(env.VITE_BUSINESS_EMAIL),
    city: text(env.VITE_BUSINESS_CITY, 100),
    instagram: instagramContact(env.VITE_BUSINESS_INSTAGRAM),
    hours: text(env.VITE_BUSINESS_HOURS, 120),
  };
}

export const businessConfig = parseBusinessConfig(import.meta.env);
