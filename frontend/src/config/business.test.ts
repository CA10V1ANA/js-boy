import { describe, expect, it } from 'vitest';
import { parseBusinessConfig } from './business';

describe('parseBusinessConfig', () => {
  it('omite contatos ausentes ou invalidos sem inventar dados', () => {
    const config = parseBusinessConfig({
      VITE_BUSINESS_PHONE: 'telefone',
      VITE_BUSINESS_EMAIL: 'invalido',
      VITE_BUSINESS_INSTAGRAM: 'javascript:alert(1)',
    });

    expect(config.phone).toBeUndefined();
    expect(config.email).toBeUndefined();
    expect(config.instagram).toBeUndefined();
  });

  it('cria apenas links com protocolos seguros', () => {
    const config = parseBusinessConfig({
      VITE_BUSINESS_PHONE: '+55 (85) 99999-9999',
      VITE_BUSINESS_WHATSAPP: '5585999999999',
      VITE_BUSINESS_EMAIL: 'CONTATO@EXEMPLO.COM',
      VITE_BUSINESS_INSTAGRAM: '@jsboy',
    });

    expect(config.phone?.href).toBe('tel:+5585999999999');
    expect(config.whatsapp?.href).toBe('https://wa.me/5585999999999');
    expect(config.email?.href).toBe('mailto:contato@exemplo.com');
    expect(config.instagram?.href).toBe('https://www.instagram.com/jsboy/');
  });
});
