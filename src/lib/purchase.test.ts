import { describe, expect, it } from 'vitest';
import { planPurchase } from './purchase';

const stock = (id: number, ingredient_name: string, quantity: number, unit: string) => ({
  id,
  ingredient_name,
  quantity,
  unit,
});
const bought = (ingredient_name: string, quantity: number, unit: string) => ({
  ingredient_name,
  quantity,
  unit,
});

describe('planPurchase', () => {
  it('adds to the existing row, ignoring case and spaces', () => {
    expect(planPurchase(bought(' leche ', 2, 'litros'), [stock(7, 'Leche', 1, 'litros')])).toEqual({
      kind: 'update',
      id: 7,
      quantity: 3,
    });
  });

  it('never sums different units', () => {
    expect(planPurchase(bought('Harina', 500, 'g'), [stock(1, 'Harina', 2, 'kg')])).toEqual({
      kind: 'insert',
      ingredient_name: 'Harina',
      quantity: 500,
      unit: 'g',
    });
  });

  it('treats SQL wildcards as plain text', () => {
    expect(planPurchase(bought('a%', 1, 'kg'), [stock(1, 'azucar', 1, 'kg')]).kind).toBe('insert');
  });

  it('inserts when the ingredient is new', () => {
    expect(planPurchase(bought('Sal', 1, 'kg'), []).kind).toBe('insert');
  });

  it('avoids floating point noise', () => {
    expect(planPurchase(bought('Aceite', 0.2, 'litros'), [stock(1, 'Aceite', 0.1, 'litros')])).toEqual({
      kind: 'update',
      id: 1,
      quantity: 0.3,
    });
  });
});
