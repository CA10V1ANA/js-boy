import { describe, expect, it } from 'vitest';
import { businessDate } from './businessDate';

describe('data da operação', () => {
  it('mantém o dia e o mês locais quando o UTC já virou', () => {
    expect(businessDate(new Date('2026-11-01T01:30:00Z'))).toBe('2026-10-31');
    expect(businessDate(new Date('2026-11-01T03:00:00Z'))).toBe('2026-11-01');
  });
});
