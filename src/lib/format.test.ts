import { describe, expect, it } from 'vitest';
import { formatQuantity } from './format';

describe('formatQuantity', () => {
  it('uses the singular unit for one', () => {
    expect(formatQuantity(1, 'litros')).toBe('1 litro');
    expect(formatQuantity(1, 'unidades')).toBe('1 unidad');
    expect(formatQuantity(1, 'paquetes')).toBe('1 paquete');
    expect(formatQuantity(1, 'latas')).toBe('1 lata');
  });

  it('keeps the plural for other amounts', () => {
    expect(formatQuantity(2, 'litros')).toBe('2 litros');
    expect(formatQuantity(0.5, 'latas')).toBe('0,5 latas');
  });

  it('leaves abbreviations and unknown units untouched', () => {
    expect(formatQuantity(1, 'kg')).toBe('1 kg');
    expect(formatQuantity(1, 'cajas')).toBe('1 cajas');
  });

  it('writes decimals the Spanish way', () => {
    expect(formatQuantity(1.5, 'kg')).toBe('1,5 kg');
  });
});
