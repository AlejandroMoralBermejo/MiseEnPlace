'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ConfirmDialog,
  FormDialog,
  LoadingScreen,
  fieldClass,
  labelClass,
  primaryButtonClass,
  iconButtonClass,
  secondaryButtonClass,
} from '@/components/Dialog';
import { ErrorBanner } from '@/components/ErrorBanner';
import { TrashIcon } from '@/components/Icons';
import { formatDateKey } from '@/lib/dates';
import { formatQuantity } from '@/lib/format';
import { planPurchase } from '@/lib/purchase';
import { type InventoryItem, type ShoppingItem } from '@/types';

const UNITS = ['unidades', 'kg', 'g', 'litros', 'ml', 'paquetes', 'latas'];

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

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const pendingItems = items.filter((item) => !item.purchased);
  const purchasedItems = items.filter((item) => item.purchased);

  if (loading) {
    return <LoadingScreen label="Cargando lista..." />;
  }

  const renderRow = (item: ShoppingItem) => {
    const amount = formatQuantity(item.quantity, item.unit);
    const trashButton = (
      <button
        onClick={() => setDeleteConfirm({ show: true, id: item.id, name: item.ingredient_name })}
        aria-label={`Eliminar ${item.ingredient_name}`}
        className={`text-danger ${iconButtonClass}`}
      >
        <TrashIcon />
      </button>
    );
    const checkbox = (
      <label className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={item.purchased}
          onChange={() => togglePurchased(item)}
          aria-label={`Marcar ${item.ingredient_name} como ${item.purchased ? 'pendiente' : 'comprado'}`}
          className="h-6 w-6 accent-primary"
        />
      </label>
    );

    if (item.purchased) {
      return (
        <div key={item.id} className="flex min-h-[52px] items-center gap-1 border-b border-line">
          {checkbox}
          <button
            onClick={() => handleEdit(item)}
            className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 text-left text-muted line-through"
          >
            <span className="min-w-0 truncate text-[15px]">{item.ingredient_name}</span>
            <span className="flex-none text-sm">{amount}</span>
          </button>
          {trashButton}
        </div>
      );
    }

    return (
      <div key={item.id} className="flex min-h-[60px] items-center gap-1 border-b border-line">
        {checkbox}
        <button
          onClick={() => handleEdit(item)}
          className="flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-px text-left hover:text-primary"
        >
          <span className="w-full truncate font-medium">{item.ingredient_name}</span>
          <span className="w-full truncate text-sm text-muted">
            {[amount, item.store, item.notes].filter(Boolean).join(' · ')}
          </span>
        </button>
        {trashButton}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-7">
      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : (
        loadError && <ErrorBanner message={loadError} />
      )}

      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[40px] font-extrabold leading-none tracking-tight lg:text-[44px]">
          Compras
        </h1>
        <button onClick={openAddForm} className={primaryButtonClass}>Añadir</button>
      </header>

      {items.length === 0 && !loadError && (
        <div className="py-12 text-center">
          <h2 className="font-display text-2xl font-extrabold">Lista vacía</h2>
          <p className="mt-2 text-muted">Añade artículos para tu próxima compra</p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
        {pendingItems.length > 0 && (
          <section>
            <h2 className="mb-1 text-[15px] font-semibold lg:text-base">Por comprar ({pendingItems.length})</h2>
            {pendingItems.map(renderRow)}
          </section>
        )}

        {purchasedItems.length > 0 && (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="mb-1 text-[15px] font-semibold lg:text-base">Comprados ({purchasedItems.length})</h2>
              {purchasedItems.map(renderRow)}
            </div>
            <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
              <button onClick={() => setPurchaseModal(true)} className={`min-h-[52px] lg:min-h-12 ${primaryButtonClass}`}>
                Pasar {purchasedItems.length} al inventario
              </button>
              <button onClick={() => setClearModal(true)} className="min-h-11 px-3 text-[15px] font-semibold">
                Limpiar comprados
              </button>
            </div>
          </section>
        )}
      </div>

      {showForm && (
        <FormDialog title={editingItem ? 'Editar artículo' : 'Añadir a la lista'} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="ingredient_name" className={labelClass}>Artículo</label>
              <input
                id="ingredient_name"
                type="text"
                value={formData.ingredient_name}
                onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
                required
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quantity" className={labelClass}>Cantidad</label>
                <input
                  id="quantity"
                  type="number"
                  value={Number.isNaN(formData.quantity) ? '' : formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  min="0.1"
                  step="0.1"
                  required
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="unit" className={labelClass}>Unidad</label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={fieldClass}
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="store" className={labelClass}>Tienda</label>
                <input
                  id="store"
                  type="text"
                  value={formData.store}
                  onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="notes" className={labelClass}>Notas (opcional)</label>
                <input
                  id="notes"
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 lg:flex-row-reverse">
              <button type="submit" className={`min-h-[52px] lg:flex-1 ${primaryButtonClass}`}>
                {editingItem ? 'Guardar cambios' : 'Añadir'}
              </button>
              <button type="button" onClick={closeForm} className={`lg:flex-1 ${secondaryButtonClass}`}>
                Cancelar
              </button>
            </div>
          </form>
        </FormDialog>
      )}

      {purchaseModal && (
        <ConfirmDialog
          title="¿Pasar al inventario?"
          confirmLabel="Confirmar"
          busy={purchaseLoading}
          onConfirm={executePurchase}
          onCancel={() => setPurchaseModal(false)}
        >
          <ul className="max-h-56 overflow-y-auto">
            {purchasedItems.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 border-b border-line py-2">
                <span className="min-w-0 truncate font-medium text-ink">{item.ingredient_name}</span>
                <span className="flex-none text-sm">{formatQuantity(item.quantity, item.unit)}</span>
              </li>
            ))}
          </ul>
        </ConfirmDialog>
      )}

      {successModal.show && (
        <ConfirmDialog
          title="Compra confirmada"
          confirmLabel="Aceptar"
          cancelLabel={null}
          onConfirm={() => setSuccessModal({ show: false, count: 0 })}
        >
          {successModal.count === 1
            ? '1 artículo se ha añadido al inventario.'
            : `${successModal.count} artículos se han añadido al inventario.`}
        </ConfirmDialog>
      )}

      {clearModal && (
        <ConfirmDialog
          title="¿Limpiar comprados?"
          confirmLabel="Limpiar"
          danger
          onConfirm={clearPurchased}
          onCancel={() => setClearModal(false)}
        >
          {purchasedItems.length === 1 ? 'Se eliminará 1 artículo' : `Se eliminarán ${purchasedItems.length} artículos`}{' '}
          de la lista sin añadirlos al inventario.
        </ConfirmDialog>
      )}

      {deleteConfirm.show && (
        <ConfirmDialog
          title="¿Eliminar artículo?"
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: null, name: '' })}
        >
          <span className="font-semibold text-ink">{deleteConfirm.name}</span> se eliminará de la lista.
        </ConfirmDialog>
      )}
    </div>
  );
}
