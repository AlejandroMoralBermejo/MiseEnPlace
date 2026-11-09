export interface ChecklistItem {
  name: string;
  alreadyListed: boolean;
  checked: boolean;
}

// "Plátano " and "platano" are the same thing on a shopping list.
const normalize = (name: string) =>
  name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function parseIngredients(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of text.split(',')) {
    const name = raw.trim();
    const key = normalize(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

// Ingredients already pending on the list start unchecked so they are not added twice.
export function buildChecklist(ingredients: string[], pendingNames: string[]): ChecklistItem[] {
  const pending = new Set(pendingNames.map(normalize));
  return ingredients.map((name) => {
    const alreadyListed = pending.has(normalize(name));
    return { name, alreadyListed, checked: !alreadyListed };
  });
}

export function toShoppingRows(names: string[], mealName: string, date: string) {
  const meal = mealName.trim();
  return names.map((ingredient_name) => ({
    ingredient_name,
    quantity: 1,
    unit: 'unidades',
    store: 'Supermercado',
    notes: meal ? `Para: ${meal}` : '',
    purchased: false,
    date,
  }));
}
