'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type ShoppingItem } from '@/types';

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; id: number | null; name: string}>({show: false, id: null, name: ''});
  const supabase = createClient();

  const [formData, setFormData] = useState({
    ingredient_name: '',
    quantity: 1,
    unit: 'unidades',
    store: 'Supermercado',
    notes: '',
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

    if (editingItem) {
      await supabase
        .from('shopping_list')
        .update({
          ingredient_name: formData.ingredient_name,
          quantity: formData.quantity,
          unit: formData.unit,
          store: formData.store,
          notes: formData.notes,
        })
        .eq('id', editingItem.id);
    } else {
      await supabase.from('shopping_list').insert({
        ingredient_name: formData.ingredient_name,
        quantity: formData.quantity,
        unit: formData.unit,
        store: formData.store,
        notes: formData.notes,
        purchased: false,
        date: new Date().toISOString().split('T')[0],
      });
    }

    setShowForm(false);
    setEditingItem(null);
    setFormData({ ingredient_name: '', quantity: 1, unit: 'unidades', store: 'Supermercado', notes: '' });
    loadItems();
  };

  const handleEdit = (item: ShoppingItem) => {
    setEditingItem(item);
    setFormData({
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      store: item.store || 'Supermercado',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await supabase.from('shopping_list').delete().eq('id', deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null, name: '' });
      loadItems();
    }
  };

  const togglePurchased = async (item: ShoppingItem) => {
    await supabase
      .from('shopping_list')
      .update({ purchased: !item.purchased })
      .eq('id', item.id);
    loadItems();
  };

  const clearPurchased = async () => {
    if (!confirm('¿Eliminar todos los items comprados de la lista?')) return;
    await supabase.from('shopping_list').delete().eq('purchased', true);
    loadItems();
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

  const openAddForm = () => {
    setEditingItem(null);
    setFormData({ ingredient_name: '', quantity: 1, unit: 'unidades', store: 'Supermercado', notes: '' });
    setShowForm(true);
  };

  const pendingItems = items.filter((item) => !item.purchased);
  const purchasedItems = items.filter((item) => item.purchased);
  const units = ['unidades', 'kg', 'g', 'litros', 'ml', 'paquetes', 'latas'];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
          <p className="text-lg font-medium text-stone-600">Cargando lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🛒</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Lista de Compras
            </h1>
          </div>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-white font-semibold shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105"
          >
            <span className="text-xl">+</span>
            Agregar Item
          </button>
        </div>
      </header>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-12 text-center shadow-lg">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-stone-800">Lista vacía</h2>
          <p className="mt-2 text-stone-600">Agregá items para tu próxima compra</p>
        </div>
      )}

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-stone-700">
            <span className="text-2xl">📋</span>
            Por comprar ({pendingItems.length})
          </h2>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.01]"
              >
                <label className="flex flex-1 cursor-pointer items-center gap-4">
                  <input
                    type="checkbox"
                    checked={item.purchased}
                    onChange={() => togglePurchased(item)}
                    className="h-7 w-7 rounded-xl border-2 border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-stone-800">{item.ingredient_name}</span>
                      <span className="text-stone-500 font-medium">• {item.quantity} {item.unit}</span>
                      <span className="text-sm px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{item.store}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-stone-500 mt-1 italic">{item.notes}</p>
                    )}
                  </div>
                </label>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => handleEdit(item)}
                    className="rounded-xl bg-amber-100 p-3 text-amber-600 hover:bg-amber-200 transition-colors shadow-md"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.ingredient_name)}
                    className="rounded-xl bg-red-100 p-3 text-red-600 hover:bg-red-200 transition-colors shadow-md"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchased Items */}
      {purchasedItems.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-stone-500">
            <span className="text-2xl">✅</span>
            Comprados ({purchasedItems.length})
          </h2>
          <div className="space-y-3">
            {purchasedItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-100/70 p-4 opacity-60 transition-all duration-200"
              >
                <label className="flex flex-1 cursor-pointer items-center gap-4 line-through">
                  <input
                    type="checkbox"
                    checked={item.purchased}
                    onChange={() => togglePurchased(item)}
                    className="h-7 w-7 rounded-xl border-2 border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-medium text-stone-500 line-through">{item.ingredient_name}</span>
                      <span className="text-stone-400 font-medium line-through">• {item.quantity} {item.unit}</span>
                      {item.store && item.store !== 'Supermercado' && (
                        <span className="text-sm px-2 py-0.5 rounded-full bg-stone-200 text-stone-500 line-through">{item.store}</span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-stone-400 mt-1 italic line-through">{item.notes}</p>
                    )}
                  </div>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="rounded-xl bg-stone-200 p-3 text-stone-500 hover:bg-stone-300 transition-colors shadow-sm"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.ingredient_name)}
                    className="rounded-xl bg-red-100 p-3 text-red-500 hover:bg-red-200 transition-colors shadow-sm"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {items.length > 0 && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={confirmPurchase}
            disabled={purchasedItems.length === 0}
            className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-lg font-bold text-white shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Confirmar Compra
          </button>
          <button
            onClick={clearPurchased}
            disabled={purchasedItems.length === 0}
            className="flex-1 rounded-xl border-2 border-stone-300 py-4 text-lg font-bold text-stone-600 hover:bg-stone-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar comprados
          </button>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-800">
                {editingItem ? '✏️ Editar Item' : '➕ Agregar a la lista'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-2xl text-stone-400 hover:text-stone-600 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Ingrediente</label>
                <input
                  type="text"
                  value={formData.ingredient_name}
                  onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-lg focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                  placeholder="Ej: Leche"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    min="0.1"
                    step="0.1"
                    required
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-lg focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Unidad</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-lg focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Tienda</label>
                  <input
                    type="text"
                    value={formData.store}
                    onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-lg focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                    placeholder="Ej: Mercadona"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Notas</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-lg focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 rounded-xl border border-stone-300 py-3 text-lg font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-lg font-semibold text-white shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  {editingItem ? 'Guardar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl transform animate-[fadeIn_0.2s_ease-out]">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">¿Eliminar item?</h3>
              <p className="text-stone-600 mb-6">
                <span className="font-semibold text-amber-600">"{deleteConfirm.name}"</span> se eliminará de la lista de compras.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-semibold hover:bg-stone-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg hover:from-red-600 hover:to-red-700 transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}