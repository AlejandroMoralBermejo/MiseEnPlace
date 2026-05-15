'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type InventoryItem } from '@/types';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; id: number | null; name: string}>({show: false, id: null, name: ''});
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  const [formData, setFormData] = useState({
    ingredient_name: '',
    quantity: 0,
    unit: 'unidades',
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('ingredient_name');
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
        .from('inventory')
        .update({
          ingredient_name: formData.ingredient_name,
          quantity: formData.quantity,
          unit: formData.unit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id);
    } else {
      await supabase.from('inventory').insert({
        ingredient_name: formData.ingredient_name,
        quantity: formData.quantity,
        unit: formData.unit,
      });
    }

    setShowForm(false);
    setEditingItem(null);
    setFormData({ ingredient_name: '', quantity: 0, unit: 'unidades' });
    loadItems();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await supabase.from('inventory').delete().eq('id', deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null, name: '' });
      loadItems();
    }
  };

  const openAddForm = () => {
    setEditingItem(null);
    setFormData({ ingredient_name: '', quantity: 0, unit: 'unidades' });
    setShowForm(true);
  };

  const filteredItems = items.filter((item) =>
    item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const units = ['unidades', 'kg', 'g', 'litros', 'ml', 'paquetes', 'latas'];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
          <p className="text-lg font-medium text-stone-600">Cargando inventario...</p>
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
            <span className="text-3xl">📦</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Inventario
            </h1>
          </div>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-white font-semibold shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105"
          >
            <span className="text-xl">+</span>
            Agregar Ingrediente
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar ingrediente..."
          className="w-full rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-lg shadow-md focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
        />
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-12 text-center shadow-lg">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-stone-800">
            {searchQuery ? 'No encontrado' : 'Inventario vacío'}
          </h2>
          <p className="mt-2 text-stone-600">
            {searchQuery ? 'Probá con otro nombre' : 'Agregá tu primer ingrediente para empezar'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-amber-200 bg-white/90 p-5 shadow-lg shadow-amber-100/50 transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-stone-800">{item.ingredient_name}</h3>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {item.quantity}
                    <span className="ml-2 text-base font-medium text-stone-500">{item.unit}</span>
                  </p>
                </div>
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
              {item.quantity === 0 && (
                <div className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-center text-sm font-bold text-red-700">
                  ⚠️ AGOTADO
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-800">
                {editingItem ? '✏️ Editar Ingrediente' : '➕ Agregar Ingrediente'}
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
                  placeholder="Ej: Harina"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    min="0"
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
              <h3 className="text-xl font-bold text-stone-800 mb-2">¿Eliminar ingrediente?</h3>
              <p className="text-stone-600 mb-6">
                <span className="font-semibold text-amber-600">"{deleteConfirm.name}"</span> se eliminará permanentemente del inventario.
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