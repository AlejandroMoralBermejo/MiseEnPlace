import { describe, expect, it } from 'vitest';
import { buildChecklist, parseIngredients, toShoppingRows } from './ingredients';

describe('parseIngredients', () => {
  it('splits by commas, trims and drops empty entries', () => {
    expect(parseIngredients(' pollo, arroz ,, verduras , ')).toEqual(['pollo', 'arroz', 'verduras']);
  });

  it('keeps the first spelling of a repeated ingredient', () => {
    expect(parseIngredients('Pollo, arroz, pollo, ARROZ')).toEqual(['Pollo', 'arroz']);
  });

  it('returns nothing for an empty field', () => {
    expect(parseIngredients('   ')).toEqual([]);
  });
});

describe('buildChecklist', () => {
  it('checks every ingredient that is not already pending', () => {
    expect(buildChecklist(['pollo', 'arroz'], [])).toEqual([
      { name: 'pollo', alreadyListed: false, checked: true },
      { name: 'arroz', alreadyListed: false, checked: true },
    ]);
  });

  it('unchecks ingredients already pending, ignoring case, spaces and accents', () => {
    expect(buildChecklist(['Plátano', 'arroz'], [' platano '])).toEqual([
      { name: 'Plátano', alreadyListed: true, checked: false },
      { name: 'arroz', alreadyListed: false, checked: true },
    ]);
  });
});

describe('toShoppingRows', () => {
  it('builds one pending row per ingredient, noting the meal it is for', () => {
    expect(toShoppingRows(['pollo'], 'Pollo al curry', '2026-11-09')).toEqual([
      {
        ingredient_name: 'pollo',
        quantity: 1,
        unit: 'unidades',
        store: 'Supermercado',
        notes: 'Para: Pollo al curry',
        purchased: false,
        date: '2026-11-09',
      },
    ]);
  });

  it('leaves notes empty when the meal has no name yet', () => {
    expect(toShoppingRows(['sal'], '  ', '2026-11-09')[0].notes).toBe('');
  });
});
