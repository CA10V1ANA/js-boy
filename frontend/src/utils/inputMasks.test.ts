import { describe, expect, it } from 'vitest';
import { formatCep, formatCnpj, formatCpf, formatCpfOrCnpj, formatEmailInput, formatPhone, formatVehiclePlate } from './inputMasks';

describe('input masks', () => {
  it('formats CPF and CNPJ', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
    expect(formatCnpj('12345678000199')).toBe('12.345.678/0001-99');
    expect(formatCpfOrCnpj('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('formats phone and CEP', () => {
    expect(formatPhone('85999998888')).toBe('(85) 99999-8888');
    expect(formatPhone('8533334444')).toBe('(85) 3333-4444');
    expect(formatCep('60123456')).toBe('60123-456');
  });

  it('normalizes e-mail and plate while typing', () => {
    expect(formatEmailInput(' NOME@Exemplo.COM ')).toBe('nome@exemplo.com');
    expect(formatVehiclePlate('abc1d23')).toBe('ABC-1D23');
  });
});
