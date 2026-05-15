'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type InventoryItem } from '@/types';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
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

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este ingrediente del inventario?')) {
      await supabase.from('inventory').delete().eq('id', id);
      loadItems();
    }
  };

  const filteredItems = items.filter((item) =>
    item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold text-stone-800 lg:text-3xl">Inventario</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({ ingredient_name: '', quantity: 0, unit: 'unidades' });
            setShowForm(true);
          }}
          className="rounded-lg bg-stone-800 px-4 py-2 text-lg font-medium text-white hover:bg-stone-700"
        >
          + Agregar Ingrediente
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar ingrediente..."
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-xl font-medium text-stone-800">Inventario vacío</h2>
          <p className="mt-2 text-stone-600">
            {searchQuery
              ? 'No se encontraron ingredientes'
              : 'Agregá tu primer ingrediente para empezar'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-stone-800">{item.ingredient_name}</h3>
                  <p className="mt-1 text-2xl font-bold text-stone-600">
                    {item.quantity} <span className="text-base">{item.unit}</span>
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(item)}
                    className="rounded-lg bg-stone-100 p-2 text-stone-600 hover:bg-stone-200"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {item.quantity === 0 && (
                <div className="mt-2 rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                  AGOTADO
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-800">
                {editingItem ? 'Editar Ingrediente' : 'Agregar Ingrediente'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
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
                  placeholder="Ej: Harina"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">Cantidad</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    min="0"
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
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 rounded-lg border border-stone-300 py-3 text-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-stone-800 py-3 text-lg font-medium text-white hover:bg-stone-700"
                >
                  {editingItem ? 'Guardar Cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}