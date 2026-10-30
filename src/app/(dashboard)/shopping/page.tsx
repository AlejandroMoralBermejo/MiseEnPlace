'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ErrorBanner } from '@/components/ErrorBanner';
import { formatDateKey } from '@/lib/dates';
import { planPurchase } from '@/lib/purchase';
import { type InventoryItem, type ShoppingItem } from '@/types';

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; id: number | null; name: string}>({show: false, id: null, name: ''});
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [successModal, setSuccessModal] = useState<{show: boolean; count: number}>({show: false, count: 0});
  const [clearModal, setClearModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    ingredient_name: '',
    quantity: 1,
    unit: 'unidades',
    store: 'Supermercado',
    notes: '',
  });

  // The spinner only covers the first load: realtime refreshes must not blank the page.
  const loadItems = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setLoadError(`No se pudo cargar la lista: ${fetchError.message}`);
    } else {
      setItems(data);
      setLoadError(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is only set after the await
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const channel = supabase
      .channel('shopping-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_list' },
        () => { loadItems(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadItems, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fields = {
      ingredient_name: formData.ingredient_name,
      quantity: formData.quantity,
      unit: formData.unit,
      store: formData.store,
      notes: formData.notes,
    };
    const { error: saveError } = editingItem
      ? await supabase.from('shopping_list').update(fields).eq('id', editingItem.id)
      : await supabase.from('shopping_list').insert({
          ...fields,
          purchased: false,
          date: formatDateKey(new Date()),
        });

    // The form stays open on failure so nothing the user typed is lost.
    if (saveError) {
      setError(`No se pudo guardar el item: ${saveError.message}`);
      return;
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
      const { error: deleteError } = await supabase.from('shopping_list').delete().eq('id', deleteConfirm.id);
      if (deleteError) {
        setError(`No se pudo eliminar: ${deleteError.message}`);
        return;
      }
      setDeleteConfirm({ show: false, id: null, name: '' });
      loadItems();
    }
  };

  const togglePurchased = async (item: ShoppingItem) => {
    const { error: toggleError } = await supabase
      .from('shopping_list')
      .update({ purchased: !item.purchased })
      .eq('id', item.id);
    if (toggleError) setError(`No se pudo actualizar: ${toggleError.message}`);
    loadItems();
  };

  const clearPurchased = async () => {
    const { error: clearError } = await supabase.from('shopping_list').delete().eq('purchased', true);
    if (clearError) setError(`No se pudieron limpiar los comprados: ${clearError.message}`);
    setClearModal(false);
    loadItems();
  };

  const executePurchase = async () => {
    const purchasedItems = items.filter((item) => item.purchased);
    if (purchasedItems.length === 0) return;
    setPurchaseLoading(true);

    const { data: inventoryData, error: inventoryError } = await supabase.from('inventory').select('*');
    if (inventoryError) {
      setError(`No se pudo leer el inventario: ${inventoryError.message}`);
      setPurchaseLoading(false);
      return;
    }

    const inventory: InventoryItem[] = inventoryData;
    const failed: string[] = [];

    // Not atomic: a list item is removed only after its stock is written, so a failure never
    // loses a purchase. If only the removal fails, retrying would count that item twice.
    for (const item of purchasedItems) {
      const action = planPurchase(item, inventory);
      let stockError;

      if (action.kind === 'update') {
        ({ error: stockError } = await supabase
          .from('inventory')
          .update({ quantity: action.quantity, updated_at: new Date().toISOString() })
          .eq('id', action.id));
        if (!stockError) {
          const row = inventory.find((r) => r.id === action.id);
          if (row) row.quantity = action.quantity;
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('inventory')
          .insert({ ingredient_name: action.ingredient_name, quantity: action.quantity, unit: action.unit })
          .select()
          .single();
        stockError = insertError;
        if (inserted) inventory.push(inserted);
      }

      const { error: removeError } = stockError
        ? { error: stockError }
        : await supabase.from('shopping_list').delete().eq('id', item.id);
      if (removeError) failed.push(item.ingredient_name);
    }

    const count = purchasedItems.length - failed.length;
    setPurchaseLoading(false);
    setPurchaseModal(false);
    if (failed.length > 0) {
      setError(`No se pudieron procesar: ${failed.join(', ')}. Siguen en la lista.`);
    }
    if (count > 0) setSuccessModal({ show: true, count });
    loadItems();
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
      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : (
        loadError && <ErrorBanner message={loadError} />
      )}

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
      {items.length === 0 && !loadError && (
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
                <div className="flex gap-2 transition-all duration-200">
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
            onClick={() => setPurchaseModal(true)}
            disabled={purchasedItems.length === 0}
            className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-lg font-bold text-white shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Confirmar Compra
          </button>
          <button
            onClick={() => setClearModal(true)}
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

      {/* Purchase Confirmation Modal */}
      {purchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 px-6 py-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-3 ring-4 ring-white/30">
                <span className="text-5xl">🛍️</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Confirmar compra</h3>
              <p className="text-green-50 mt-1 text-sm">
                {purchasedItems.length} {purchasedItems.length === 1 ? 'item se agregará' : 'items se agregarán'} al inventario
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 divide-y divide-stone-200">
                {purchasedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-green-500 text-lg">✓</span>
                      <span className="font-semibold text-stone-800 truncate">{item.ingredient_name}</span>
                    </div>
                    <span className="text-sm font-medium text-stone-500 shrink-0 ml-2">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPurchaseModal(false)}
                  disabled={purchaseLoading}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-semibold hover:bg-stone-100 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={executePurchase}
                  disabled={purchaseLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {purchaseLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                      Procesando...
                    </>
                  ) : (
                    <>✓ Confirmar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {successModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center animate-[fadeIn_0.25s_ease-out]">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-5 shadow-lg shadow-green-500/40 animate-[fadeIn_0.4s_ease-out]">
              <span className="text-5xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-stone-800 mb-2">¡Compra confirmada!</h3>
            <p className="text-stone-600 mb-6">
              <span className="font-bold text-green-600">{successModal.count}</span>{' '}
              {successModal.count === 1 ? 'item se agregó' : 'items se agregaron'} al inventario
            </p>
            <button
              onClick={() => setSuccessModal({ show: false, count: 0 })}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              Genial
            </button>
          </div>
        </div>
      )}

      {/* Clear Purchased Confirmation Modal */}
      {clearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <span className="text-3xl">🧹</span>
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">¿Limpiar comprados?</h3>
              <p className="text-stone-600 mb-6">
                Se eliminarán <span className="font-semibold text-amber-600">{purchasedItems.length}</span>{' '}
                {purchasedItems.length === 1 ? 'item' : 'items'} de la lista sin agregarlos al inventario.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setClearModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-semibold hover:bg-stone-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={clearPurchased}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Limpiar
                </button>
              </div>
            </div>
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
                <span className="font-semibold text-amber-600">&quot;{deleteConfirm.name}&quot;</span> se eliminará de la lista de compras.
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