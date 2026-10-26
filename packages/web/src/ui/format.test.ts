import { describe, expect, it } from 'vitest';
import { formatInt, formatKm, formatTick, logTicks } from './format';

describe('format', () => {
  it('km Türkçe ondalıkla', () => {
    expect(formatKm(59650)).toBe('59,65 km');
    expect(formatKm(1234567)).toBe('1.234,57 km');
  });

  it('tamsayı Türkçe binlik ayırıcıyla', () => {
    expect(formatInt(303400)).toBe('303.400');
  });

  it('eksen etiketleri', () => {
    expect(formatTick(100)).toBe('100');
    expect(formatTick(30000)).toBe('30k');
  });

  it('log tick\'leri 10\'un kuvvetleri', () => {
    expect(logTicks(303401)).toEqual([1, 10, 100, 1000, 10000, 100000]);
    expect(logTicks(1)).toEqual([1]);
  });
});
