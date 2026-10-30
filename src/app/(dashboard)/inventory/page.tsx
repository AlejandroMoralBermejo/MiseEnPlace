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
import { formatQuantity } from '@/lib/format';
import { type InventoryItem } from '@/types';

const UNITS = ['unidades', 'kg', 'g', 'litros', 'ml', 'paquetes', 'latas'];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; id: number | null; name: string}>({show: false, id: null, name: ''});
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    ingredient_name: '',
    quantity: 0,
    unit: 'unidades',
  });

  // The spinner only covers the first load: realtime refreshes must not blank the page.
  const loadItems = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .order('ingredient_name');
    if (fetchError) {
      setLoadError(`No se pudo cargar el inventario: ${fetchError.message}`);
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
      .channel('inventory-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        () => { loadItems(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadItems, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error: saveError } = editingItem
      ? await supabase
          .from('inventory')
          .update({
            ingredient_name: formData.ingredient_name,
            quantity: formData.quantity,
            unit: formData.unit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id)
      : await supabase.from('inventory').insert({
          ingredient_name: formData.ingredient_name,
          quantity: formData.quantity,
          unit: formData.unit,
        });

    // The form stays open on failure so nothing the user typed is lost.
    if (saveError) {
      setError(`No se pudo guardar el ingrediente: ${saveError.message}`);
      return;
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

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      const { error: deleteError } = await supabase.from('inventory').delete().eq('id', deleteConfirm.id);
      if (deleteError) {
        setError(`No se pudo eliminar: ${deleteError.message}`);
        return;
      }
      setDeleteConfirm({ show: false, id: null, name: '' });
      loadItems();
    }
  };

  const openAddForm = () => {
    setEditingItem(null);
    setFormData({ ingredient_name: '', quantity: 0, unit: 'unidades' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const filteredItems = items.filter((item) =>
    item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingScreen label="Cargando inventario..." />;
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 lg:gap-5 lg:p-7">
      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : (
        loadError && <ErrorBanner message={loadError} />
      )}

      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[40px] font-extrabold leading-none tracking-tight lg:text-[44px]">
          Inventario
        </h1>
        <button onClick={openAddForm} className={`hidden lg:block ${primaryButtonClass}`}>
          Añadir ingrediente
        </button>
      </header>

      <div className="lg:max-w-[420px]">
        <label htmlFor="search" className="mb-1 block text-sm font-semibold">Buscar ingrediente</label>
        <input
          id="search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={fieldClass}
        />
      </div>

      {!loadError && filteredItems.length === 0 && (
        <div className="py-12 text-center">
          <h2 className="font-display text-2xl font-extrabold">
            {searchQuery ? 'No encontrado' : 'Inventario vacío'}
          </h2>
          <p className="mt-2 text-muted">
            {searchQuery ? 'Prueba con otro nombre' : 'Añade tu primer ingrediente para empezar'}
          </p>
        </div>
      )}

      <div className="grid gap-x-8 lg:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="flex min-h-14 items-center gap-1 border-b border-line">
            <button
              onClick={() => handleEdit(item)}
              className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 text-left hover:text-primary"
            >
              <span className="min-w-0 truncate font-medium">{item.ingredient_name}</span>
              {item.quantity === 0 ? (
                <span className="flex-none font-semibold text-danger">Agotado</span>
              ) : (
                <span className="flex-none font-semibold">{formatQuantity(item.quantity, item.unit)}</span>
              )}
            </button>
            <button
              onClick={() => setDeleteConfirm({ show: true, id: item.id, name: item.ingredient_name })}
              aria-label={`Eliminar ${item.ingredient_name}`}
              className={`text-danger ${iconButtonClass}`}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={openAddForm}
        className={`sticky bottom-[calc(5rem_+_env(safe-area-inset-bottom))] mt-auto min-h-[52px] lg:hidden ${primaryButtonClass}`}
      >
        Añadir ingrediente
      </button>

      {showForm && (
        <FormDialog title={editingItem ? 'Editar ingrediente' : 'Añadir ingrediente'} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="ingredient_name" className={labelClass}>Ingrediente</label>
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
                  min="0"
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

      {deleteConfirm.show && (
        <ConfirmDialog
          title="¿Eliminar ingrediente?"
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: null, name: '' })}
        >
          <span className="font-semibold text-ink">{deleteConfirm.name}</span> se eliminará del inventario.
        </ConfirmDialog>
      )}
    </div>
  );
}
