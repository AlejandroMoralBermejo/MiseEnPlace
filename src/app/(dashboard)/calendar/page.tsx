'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ConfirmDialog,
  FormDialog,
  LoadingScreen,
  fieldClass,
  iconButtonClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from '@/components/Dialog';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from '@/components/Icons';
import {
  formatDateKey,
  getMonthDays,
  getVisibleRange,
  getWeekDays,
  shiftMonth,
  type ViewMode,
} from '@/lib/dates';
import { type Meal, type MealType, type Profile } from '@/types';

const MEAL_TYPE_COLORS: Record<number, string> = {
  1: 'bg-meal-1',
  2: 'bg-meal-2',
  3: 'bg-meal-3',
  4: 'bg-meal-4',
  5: 'bg-meal-5',
};

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.toDateString() === d2.toDateString();
}

function mealColor(meal: Meal): string {
  return MEAL_TYPE_COLORS[meal.meal_type_id] || MEAL_TYPE_COLORS[1];
}

export default function CalendarPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  // Also the selected day on mobile, so moving between weeks or months keeps a day in view.
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; id: string | null; name: string}>({show: false, id: null, name: ''});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: '',
    ingredients: '',
    preparation: '',
    date: '',
    meal_type_id: 1,
    responsible_id: '',
  });

  const { start, end } = getVisibleRange(currentDate, viewMode);

  // The spinner only covers the first load: realtime refreshes must not blank the page.
  const loadData = useCallback(async () => {
    const [mealsRes, mealTypesRes, profilesRes] = await Promise.all([
      supabase
        .from('meals')
        .select('*, meal_types(*), profiles(*)')
        .gte('date', start)
        .lte('date', end)
        .order('date')
        .order('meal_type_id'),
      supabase.from('meal_types').select('*').order('id'),
      supabase.from('profiles').select('*'),
    ]);

    const fetchError = mealsRes.error || mealTypesRes.error || profilesRes.error;
    if (fetchError) {
      setLoadError(`No se pudo cargar el calendario: ${fetchError.message}`);
    } else {
      setMeals(mealsRes.data);
      setMealTypes(mealTypesRes.data);
      setProfiles(profilesRes.data);
      setLoadError(null);
    }
    setLoading(false);
  }, [start, end, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is only set after the await
    loadData();
  }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('meals-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meals' },
        () => { loadData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData, supabase]);

  const getAllMealsForDay = (date: Date): Meal[] => {
    const dateStr = formatDateKey(date);
    return meals.filter((meal) => meal.date === dateStr);
  };

  const getMealTypeName = (meal: Meal): string =>
    meal.meal_types?.name || mealTypes.find((type) => type.id === meal.meal_type_id)?.name || '';

  const getResponsibleName = (meal: Meal): string =>
    profiles.find((profile) => profile.id === meal.responsible_id)?.full_name || 'Sin asignar';

  const toggleDayExpand = (dateKey: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  const openAddMeal = (date: Date) => {
    setMealToEdit(null);
    setFormData({
      name: '',
      ingredients: '',
      preparation: '',
      date: formatDateKey(date),
      meal_type_id: 1,
      responsible_id: '',
    });
    setShowMealForm(true);
  };

  const openEditMeal = (meal: Meal) => {
    setMealToEdit(meal);
    setFormData({
      name: meal.name,
      ingredients: (meal.ingredients || []).join(', '),
      preparation: meal.preparation || '',
      date: meal.date,
      meal_type_id: meal.meal_type_id,
      responsible_id: meal.responsible_id || '',
    });
    setShowMealForm(true);
  };

  const closeMealForm = () => {
    setShowMealForm(false);
    setMealToEdit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ingredients = formData.ingredients
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i);

    const meal = {
      name: formData.name,
      ingredients,
      preparation: formData.preparation || null,
      date: formData.date,
      meal_type_id: formData.meal_type_id,
      responsible_id: formData.responsible_id || null,
    };
    const { error: saveError } = mealToEdit
      ? await supabase.from('meals').update(meal).eq('id', mealToEdit.id)
      : await supabase.from('meals').insert(meal);

    // The form stays open on failure so nothing the user typed is lost.
    if (saveError) {
      setError(`No se pudo guardar la comida: ${saveError.message}`);
      return;
    }

    setShowMealForm(false);
    setFormData({ name: '', ingredients: '', preparation: '', date: '', meal_type_id: 1, responsible_id: '' });
    setMealToEdit(null);
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    const idToDelete = deleteConfirm.id;
    setDeleteError(null);
    const { error, count } = await supabase
      .from('meals')
      .delete({ count: 'exact' })
      .eq('id', idToDelete);
    if (error) {
      console.error('Error al eliminar comida:', error);
      setDeleteError(`No se pudo eliminar: ${error.message}`);
      return;
    }
    if (count === 0) {
      setDeleteError('No se eliminó ninguna fila. Probablemente sea una política RLS de Supabase bloqueando el DELETE.');
      return;
    }
    setMeals((prev) => prev.filter((m) => m.id !== idToDelete));
    setDeleteConfirm({ show: false, id: null, name: '' });
    closeMealForm();
    loadData();
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigate = (direction: 1 | -1) => {
    if (viewMode === 'month') {
      setCurrentDate(shiftMonth(currentDate, direction));
      return;
    }
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7 * direction);
    setCurrentDate(newDate);
  };

  const getMonthLabel = (): string => {
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const getWeekLabel = (): string => {
    const days = getWeekDays(currentDate);
    const first = days[0];
    const last = days[6];
    return `${first.getDate()} ${MONTH_SHORT[first.getMonth()]} – ${last.getDate()} ${MONTH_SHORT[last.getMonth()]}`;
  };

  if (loading) {
    return <LoadingScreen label="Cargando calendario..." />;
  }

  const today = new Date();
  const selectedDayTitle = `${DAY_NAMES_FULL[currentDate.getDay()]} ${currentDate.getDate()}`;
  const selectedDayMeals = getAllMealsForDay(currentDate);
  const unit = viewMode === 'week' ? 'Semana' : 'Mes';

  return (
    <div className="flex min-h-screen flex-col gap-3 p-4 lg:gap-5 lg:p-7">
      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : (
        loadError && <ErrorBanner message={loadError} />
      )}

      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[40px] font-extrabold leading-none tracking-tight lg:text-[44px]">
          <span className="lg:hidden">
            {viewMode === 'week' ? selectedDayTitle : MONTH_NAMES[currentDate.getMonth()]}
          </span>
          <span className="hidden lg:inline">{getMonthLabel()}</span>
        </h1>
        <button type="button" onClick={goToToday} className={`lg:hidden ${secondaryButtonClass}`}>Hoy</button>
        <button type="button" onClick={() => openAddMeal(currentDate)} className={`hidden lg:block ${primaryButtonClass}`}>
          Añadir comida
        </button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 lg:gap-1">
          <button type="button" onClick={() => navigate(-1)} aria-label={`${unit} anterior`} className={iconButtonClass}>
            <ChevronLeftIcon />
          </button>
          <p className="text-[15px] font-medium text-muted lg:text-base">
            {viewMode === 'week' ? getWeekLabel() : currentDate.getFullYear()}
          </p>
          <button type="button" onClick={() => navigate(1)} aria-label={`${unit} siguiente`} className={iconButtonClass}>
            <ChevronRightIcon />
          </button>
          <button type="button" onClick={goToToday} className={`ml-2 hidden lg:block ${secondaryButtonClass}`}>Hoy</button>
        </div>
        <div className="flex rounded-full bg-surface p-0.5">
          {(['week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={`min-h-10 rounded-full px-3 text-sm lg:px-4 lg:text-[15px] ${
                viewMode === mode ? 'bg-ink font-semibold text-ground' : 'font-medium'
              }`}
            >
              {mode === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'week' ? (
        <>
          {/* Mobile: one day at a time */}
          <div className="grid grid-cols-7 gap-1 lg:hidden">
            {getWeekDays(currentDate).map((day, index) => {
              const selected = isSameDay(day, currentDate);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setCurrentDate(day)}
                  aria-pressed={selected}
                  aria-label={`${DAY_NAMES_FULL[day.getDay()]} ${day.getDate()}`}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl ${
                    selected ? 'bg-primary text-on-primary' : isToday ? 'text-primary' : ''
                  }`}
                >
                  <span className="text-xs font-medium">{DAY_LETTERS[index]}</span>
                  <span className="text-[17px] font-semibold">{day.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 lg:hidden">
            {selectedDayMeals.map((meal) => (
              <article key={meal.id} className="flex items-start gap-1 rounded-2xl bg-surface py-3 pl-3.5 pr-1">
                <button
                  type="button"
                  onClick={() => openEditMeal(meal)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-1.5 text-left"
                >
                  <span className={`rounded-[10px] px-2 py-0.5 text-xs font-semibold text-on-primary ${mealColor(meal)}`}>
                    {getMealTypeName(meal)}
                  </span>
                  <span className="font-display text-xl font-medium leading-tight">{meal.name}</span>
                  <span className="text-sm text-muted">{getResponsibleName(meal)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ show: true, id: meal.id, name: meal.name })}
                  aria-label={`Eliminar ${meal.name}`}
                  className={`text-danger ${iconButtonClass}`}
                >
                  <TrashIcon />
                </button>
              </article>
            ))}
            {selectedDayMeals.length === 0 && !loadError && (
              <p className="py-6 text-center text-muted">Sin comidas este día</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => openAddMeal(currentDate)}
            className={`sticky bottom-[calc(5rem_+_env(safe-area-inset-bottom))] mt-auto min-h-[52px] lg:hidden ${primaryButtonClass}`}
          >
            Añadir comida
          </button>

          {/* Desktop: the whole week */}
          <div className="hidden flex-1 grid-cols-7 gap-2 lg:grid">
            {getWeekDays(currentDate).map((day, index) => {
              const isToday = isSameDay(day, today);
              return (
                <section
                  key={day.toISOString()}
                  className={`flex min-h-[560px] min-w-0 flex-col gap-2 rounded-2xl p-2.5 ${
                    isToday ? 'border-2 border-primary' : 'border border-line'
                  }`}
                >
                  <h2
                    className={`flex items-baseline justify-between gap-1 px-0.5 py-1 text-sm font-medium ${
                      isToday ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    {DAY_NAMES[index]}
                    <span className={`font-display text-[26px] font-extrabold ${isToday ? '' : 'text-ink'}`}>
                      {day.getDate()}
                    </span>
                  </h2>
                  {getAllMealsForDay(day).map((meal) => (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => openEditMeal(meal)}
                      className="flex flex-col items-start gap-1 rounded-xl bg-surface p-2.5 text-left transition-colors hover:bg-line/40"
                    >
                      <span className={`rounded-lg px-1.5 py-0.5 text-xs font-semibold text-on-primary ${mealColor(meal)}`}>
                        {getMealTypeName(meal)}
                      </span>
                      <span className="w-full break-words text-[15px] font-semibold leading-tight">{meal.name}</span>
                      <span className="w-full truncate text-[13px] text-muted">{getResponsibleName(meal)}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => openAddMeal(day)}
                    aria-label={`Añadir comida el ${DAY_NAMES_FULL[day.getDay()]} ${day.getDate()}`}
                    className="mt-auto min-h-11 rounded-xl border border-dashed border-line text-sm font-semibold transition-colors hover:bg-surface"
                  >
                    Añadir
                  </button>
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Mobile: dots per day, selected day below */}
          <section aria-label={getMonthLabel()} className="grid grid-cols-7 gap-0.5 lg:hidden">
            {DAY_LETTERS.map((letter) => (
              <span key={letter} className="py-1 text-center text-xs font-medium text-muted">{letter}</span>
            ))}
            {getMonthDays(currentDate).map((day, index) => {
              if (!day) return <span key={`empty-${index}`}></span>;
              const dayMeals = getAllMealsForDay(day);
              const selected = isSameDay(day, currentDate);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setCurrentDate(day)}
                  aria-pressed={selected}
                  aria-label={`${day.getDate()} de ${MONTH_NAMES[day.getMonth()]}, ${dayMeals.length} ${dayMeals.length === 1 ? 'comida' : 'comidas'}`}
                  className={`flex h-[50px] flex-col items-center justify-center gap-1 rounded-xl text-[15px] font-semibold ${
                    selected ? 'bg-ink text-ground' : isToday ? 'text-primary' : ''
                  }`}
                >
                  {day.getDate()}
                  <span aria-hidden="true" className="flex h-1.5 gap-[3px]">
                    {dayMeals.slice(0, 4).map((meal) => (
                      <span key={meal.id} className={`h-1.5 w-1.5 rounded-full ${mealColor(meal)}`}></span>
                    ))}
                  </span>
                </button>
              );
            })}
          </section>

          <div className="flex flex-col gap-1.5 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold">{selectedDayTitle}</h2>
              <button type="button" onClick={() => openAddMeal(currentDate)} className={primaryButtonClass}>
                Añadir comida
              </button>
            </div>
            {selectedDayMeals.map((meal) => (
              <button
                key={meal.id}
                type="button"
                onClick={() => openEditMeal(meal)}
                className="flex min-h-11 items-center gap-2.5 rounded-xl bg-surface px-3 py-2 text-left"
              >
                <span className={`flex-none rounded-lg px-1.5 py-0.5 text-xs font-semibold text-on-primary ${mealColor(meal)}`}>
                  {getMealTypeName(meal)}
                </span>
                <span className="min-w-0 truncate text-[15px] font-medium">{meal.name}</span>
              </button>
            ))}
            {selectedDayMeals.length === 0 && !loadError && (
              <p className="py-4 text-center text-muted">Sin comidas este día</p>
            )}
          </div>

          {/* Desktop: full month grid */}
          <div className="hidden grid-cols-7 gap-1 lg:grid">
            {DAY_NAMES.map((name) => (
              <span key={name} className="px-2 py-0.5 text-sm font-medium text-muted">{name}</span>
            ))}
            {getMonthDays(currentDate).map((day, index) => {
              if (!day) return <span key={`empty-${index}`}></span>;
              const dayMeals = getAllMealsForDay(day);
              const dateKey = formatDateKey(day);
              const isExpanded = expandedDays.has(dateKey);
              const visibleMeals = isExpanded ? dayMeals : dayMeals.slice(0, 3);
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  className={`flex min-h-[116px] min-w-0 flex-col gap-1 rounded-xl p-1.5 ${
                    isToday ? 'border-2 border-primary' : 'border border-line'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openAddMeal(day)}
                    aria-label={`Añadir comida el ${day.getDate()} de ${MONTH_NAMES[day.getMonth()]}`}
                    title="Añadir comida"
                    className={`rounded px-0.5 text-left text-[15px] font-semibold hover:bg-surface ${isToday ? 'text-primary' : ''}`}
                  >
                    {day.getDate()}
                  </button>
                  {visibleMeals.map((meal) => (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => openEditMeal(meal)}
                      className={`rounded-md px-1.5 py-0.5 text-left text-xs font-semibold text-on-primary ${mealColor(meal)} ${
                        isExpanded ? 'whitespace-normal break-words leading-snug' : 'truncate'
                      }`}
                    >
                      {meal.name}
                    </button>
                  ))}
                  {dayMeals.length > 3 && (
                    <button
                      type="button"
                      onClick={() => toggleDayExpand(dateKey)}
                      aria-expanded={isExpanded}
                      className="p-0.5 text-left text-xs font-semibold"
                    >
                      {isExpanded ? '− menos' : `+${dayMeals.length - 3} más`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {showMealForm && (
        <FormDialog title={mealToEdit ? 'Editar comida' : 'Nueva comida'} onClose={closeMealForm}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label htmlFor="meal-name" className={labelClass}>Nombre</label>
              <input
                id="meal-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className={fieldClass}
              />
            </div>

            <fieldset>
              <legend className={labelClass}>Tipo</legend>
              <div className="flex flex-wrap gap-1.5">
                {mealTypes.map((type) => {
                  const selected = formData.meal_type_id === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, meal_type_id: type.id })}
                      aria-pressed={selected}
                      className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${
                        selected
                          ? `border-transparent text-on-primary ${MEAL_TYPE_COLORS[type.id] || MEAL_TYPE_COLORS[1]}`
                          : 'border-line'
                      }`}
                    >
                      {type.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="meal-date" className={labelClass}>Fecha</label>
                <input
                  id="meal-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="meal-responsible" className={labelClass}>Responsable</label>
                <select
                  id="meal-responsible"
                  value={formData.responsible_id}
                  onChange={(e) => setFormData({ ...formData, responsible_id: e.target.value })}
                  className={fieldClass}
                >
                  <option value="">Sin asignar</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="meal-ingredients" className={labelClass}>Ingredientes, separados por comas</label>
              <textarea
                id="meal-ingredients"
                rows={2}
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className={textareaClass}
              />
            </div>

            <div>
              <label htmlFor="meal-preparation" className={labelClass}>Preparación (opcional)</label>
              <textarea
                id="meal-preparation"
                rows={3}
                value={formData.preparation}
                onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                placeholder="Pasos de la receta"
                className={textareaClass}
              />
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <button type="submit" className={`min-h-[52px] ${primaryButtonClass}`}>
                {mealToEdit ? 'Guardar cambios' : 'Añadir comida'}
              </button>
              {mealToEdit && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ show: true, id: mealToEdit.id, name: mealToEdit.name })}
                  className="min-h-11 text-[15px] font-semibold text-danger"
                >
                  Eliminar comida
                </button>
              )}
            </div>
          </form>
        </FormDialog>
      )}

      {deleteConfirm.show && (
        <ConfirmDialog
          title="¿Eliminar comida?"
          confirmLabel="Eliminar"
          danger
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => { setDeleteConfirm({ show: false, id: null, name: '' }); setDeleteError(null); }}
        >
          <span className="font-semibold text-ink">{deleteConfirm.name}</span> se eliminará permanentemente.
        </ConfirmDialog>
      )}
    </div>
  );
}
