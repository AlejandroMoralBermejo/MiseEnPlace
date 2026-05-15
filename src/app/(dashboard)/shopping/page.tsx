'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type ShoppingItem } from '@/types';

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    ingredient_name: '',
    quantity: 1,
    unit: 'unidades',
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await supabase.from('shopping_list').insert({
      ingredient_name: formData.ingredient_name,
      quantity: formData.quantity,
      unit: formData.unit,
      purchased: false,
      date: new Date().toISOString().split('T')[0],
    });

    setShowForm(false);
    setFormData({ ingredient_name: '', quantity: 1, unit: 'unidades' });
    loadItems();
  };

  const togglePurchased = async (item: ShoppingItem) => {
    await supabase
      .from('shopping_list')
      .update({ purchased: !item.purchased })
      .eq('id', item.id);
    loadItems();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este item de la lista?')) {
      await supabase.from('shopping_list').delete().eq('id', id);
      loadItems();
    }
  };

  const confirmPurchase = async () => {
    const purchasedItems = items.filter((item) => item.purchased);
    if (purchasedItems.length === 0) {
      alert('No hay items comprados para confirmar');
      return;
    }

    if (!confirm(`¿Confirmar compra de ${purchasedItems.length} items? Se agregarán al inventario.`)) {
      return;
    }

    for (const item of purchasedItems) {
      const { data: existing } = await supabase
        .from('inventory')
        .select('*')
        .ilike('ingredient_name', item.ingredient_name)
        .single();

      if (existing) {
        await supabase
          .from('inventory')
          .update({
            quantity: existing.quantity + item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('inventory').insert({
          ingredient_name: item.ingredient_name,
          quantity: item.quantity,
          unit: item.unit,
        });
      }

      await supabase.from('shopping_list').delete().eq('id', item.id);
    }

    loadItems();
    alert('¡Compra confirmada! Los items se agregaron al inventario.');
  };

  const clearPurchased = async () => {
    if (!confirm('¿Eliminar todos los items comprados de la lista?')) return;
    await supabase.from('shopping_list').delete().eq('purchased', true);
    loadItems();
  };

  const pendingItems = items.filter((item) => !item.purchased);
  const purchasedItems = items.filter((item) => item.purchased);
  const units = ['unidades', 'kg', 'g', 'litros', 'ml', 'paquetes', 'latas'];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-stone-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-stone-800 lg:text-3xl">Lista de Compras</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-stone-800 px-4 py-2 text-lg font-medium text-white hover:bg-stone-700"
        >
          + Agregar Item
        </button>
      </div>

      {pendingItems.length === 0 && purchasedItems.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <h2 className="text-xl font-medium text-stone-800">Lista de compras vacía</h2>
          <p className="mt-2 text-stone-600">Agregá items para tu próxima compra</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingItems.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-medium text-stone-700">
                Por comprar ({pendingItems.length})
              </h2>
              <div className="space-y-2">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
                  >
                    <label className="flex flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => togglePurchased(item)}
                        className="h-6 w-6 rounded border-stone-400 text-stone-800 focus:ring-stone-500"
                      />
                      <div className="flex-1">
                        <span className="text-lg font-medium text-stone-800">{item.ingredient_name}</span>
                        <span className="ml-2 text-stone-500">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    </label>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {purchasedItems.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-medium text-stone-700">
                Comprados ({purchasedItems.length})
              </h2>
              <div className="space-y-2">
                {purchasedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 opacity-60"
                  >
                    <label className="flex flex-1 cursor-pointer items-center gap-3 line-through">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => togglePurchased(item)}
                        className="h-6 w-6 rounded border-stone-400 text-stone-800 focus:ring-stone-500"
                      />
                      <div className="flex-1">
                        <span className="text-lg font-medium text-stone-500">{item.ingredient_name}</span>
                        <span className="ml-2 text-stone-400">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    </label>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={confirmPurchase}
            disabled={purchasedItems.length === 0}
            className="flex-1 rounded-lg bg-green-600 py-3 text-lg font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            ✓ Confirmar Compra (agregar al inventario)
          </button>
          <button
            onClick={clearPurchased}
            disabled={purchasedItems.length === 0}
            className="flex-1 rounded-lg border border-stone-300 py-3 text-lg font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            Limpiar comprados
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-800">Agregar a la lista</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-2xl text-stone-500 hover:text-stone-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">Ingrediente</label>
                <input
                  type="text"
                  value={formData.ingredient_name}
                  onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  placeholder="Ej: Leche"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">Cantidad</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    min="0.1"
                    step="0.1"
                    required
                    className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Unidad</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-stone-300 py-3 text-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-stone-800 py-3 text-lg font-medium text-white hover:bg-stone-700"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}