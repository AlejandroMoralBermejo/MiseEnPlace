import { type InventoryItem, type ShoppingItem } from '@/types';

export type PurchaseAction =
  | { kind: 'update'; id: number; quantity: number }
  | { kind: 'insert'; ingredient_name: string; quantity: number; unit: string };

const normalize = (name: string) => name.trim().toLowerCase();

export function planPurchase(
  item: Pick<ShoppingItem, 'ingredient_name' | 'quantity' | 'unit'>,
  inventory: Pick<InventoryItem, 'id' | 'ingredient_name' | 'quantity' | 'unit'>[]
): PurchaseAction {
  const match = inventory.find(
    (row) => normalize(row.ingredient_name) === normalize(item.ingredient_name) && row.unit === item.unit
  );

  if (match) {
    return {
      kind: 'update',
      id: match.id,
      quantity: Math.round((match.quantity + item.quantity) * 1000) / 1000,
    };
  }

  return {
    kind: 'insert',
    ingredient_name: item.ingredient_name.trim(),
    quantity: item.quantity,
    unit: item.unit,
  };
}
