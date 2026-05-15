'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Meal, type MealType, type Profile } from '@/types';

type ViewMode = 'week' | 'month';

const MEAL_TYPE_ICONS: Record<number, string> = {
  1: '☕',
  2: '🍽️',
  3: '🌙',
  4: '🫖',
  5: '🍿',
};

const MEAL_TYPE_COLORS: Record<number, { bg: string; border: string; text: string; hover: string }> = {
  1: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', hover: 'hover:bg-amber-100' },
  2: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', hover: 'hover:bg-orange-100' },
  3: { bg: 'bg-stone-100', border: 'border-stone-300', text: 'text-stone-800', hover: 'hover:bg-stone-200' },
  4: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', hover: 'hover:bg-yellow-100' },
  5: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', hover: 'hover:bg-rose-100' },
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.toDateString() === d2.toDateString();
}

export default function CalendarPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; id: string | null; name: string}>({show: false, id: null, name: ''});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: '',
    ingredients: '',
    preparation: '',
    date: '',
    meal_type_id: 1,
    responsible_id: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    
    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'week') {
      startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    const [mealsRes, mealTypesRes, profilesRes] = await Promise.all([
      supabase
        .from('meals')
        .select('*, meal_types(*), profiles(*)')
        .gte('date', formatDateKey(startDate))
        .lte('date', formatDateKey(endDate))
        .order('date'),
      supabase.from('meal_types').select('*'),
      supabase.from('profiles').select('*'),
    ]);

    if (mealsRes.data) setMeals(mealsRes.data);
    if (mealTypesRes.data) setMealTypes(mealTypesRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMealsForDay = (date: Date, mealTypeId?: number): Meal[] => {
    const dateStr = formatDateKey(date);
    return meals.filter((meal) => {
      if (meal.date !== dateStr) return false;
      if (mealTypeId && meal.meal_type_id !== mealTypeId) return false;
      return true;
    });
  };

  const getAllMealsForDay = (date: Date): Meal[] => {
    const dateStr = formatDateKey(date);
    return meals.filter((meal) => meal.date === dateStr);
  };

  const openAddMeal = (date: Date, mealTypeId?: number) => {
    setMealToEdit(null);
    setSelectedDate(formatDateKey(date));
    setFormData({
      name: '',
      ingredients: '',
      preparation: '',
      date: formatDateKey(date),
      meal_type_id: mealTypeId || 1,
      responsible_id: '',
    });
    setShowMealForm(true);
  };

  const openEditMeal = (meal: Meal) => {
    setMealToEdit(meal);
    setSelectedDate(meal.date);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ingredients = formData.ingredients
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i);

    if (mealToEdit) {
      await supabase.from('meals').update({
        name: formData.name,
        ingredients,
        preparation: formData.preparation || null,
        date: formData.date,
        meal_type_id: formData.meal_type_id,
        responsible_id: formData.responsible_id || null,
      }).eq('id', mealToEdit.id);
    } else {
      await supabase.from('meals').insert({
        name: formData.name,
        ingredients,
        preparation: formData.preparation || null,
        date: formData.date,
        meal_type_id: formData.meal_type_id,
        responsible_id: formData.responsible_id || null,
      });
    }

    setShowMealForm(false);
    setFormData({ name: '', ingredients: '', preparation: '', date: '', meal_type_id: 1, responsible_id: '' });
    setMealToEdit(null);
    loadData();
  };

  const handleDelete = async (id: string, mealName: string) => {
    setDeleteConfirm({ show: true, id, name: mealName });
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
    loadData();
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getWeekDays = (): Date[] => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  };

  const getMonthDays = (): (Date | null)[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getMonthLabel = (): string => {
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const getWeekLabel = (): string => {
    const days = getWeekDays();
    const start = days[0];
    const end = days[6];
    if (start.getMonth() === end.getMonth()) {
      return `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${DAY_NAMES_FULL[start.getDay()]} ${start.getDate()} - ${DAY_NAMES_FULL[end.getDay()]} ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
          <p className="text-lg font-medium text-stone-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 lg:p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍽️</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Calendario de Comidas
            </h1>
          </div>
          <button
            type="button"
            onClick={() => openAddMeal(new Date())}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-white font-semibold shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105"
          >
            <span className="text-xl">+</span>
            Agregar Comida
          </button>
        </div>
      </header>

      <main className="py-2">
        {/* Navigation Bar */}
        <div className="bg-white rounded-2xl shadow-lg shadow-amber-100/50 border border-amber-100 p-4 mb-6 max-w-[1800px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={navigatePrev}
                className="p-2 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                aria-label={viewMode === 'week' ? 'Semana anterior' : 'Mes anterior'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={navigateNext}
                className="p-2 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                aria-label={viewMode === 'week' ? 'Semana siguiente' : 'Mes siguiente'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Date Label */}
              <h2 className="text-lg sm:text-xl font-semibold text-stone-800 ml-2">
                {viewMode === 'week' ? getWeekLabel() : getMonthLabel()}
              </h2>
            </div>

            {/* View Toggle & Today Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToToday}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 transition-colors"
              >
                Hoy
              </button>
              
              <div className="inline-flex rounded-xl bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    viewMode === 'week'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    viewMode === 'month'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Mes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Views */}
        {viewMode === 'week' ? (
          /* Week View - single col on mobile, full 7-day grid from md+ */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2 lg:gap-3 max-w-[1800px] mx-auto">
            {getWeekDays().map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-white rounded-2xl shadow-lg shadow-amber-100/50 border flex flex-col transition-all duration-200 min-w-0 md:min-h-[420px] ${
                    isToday
                      ? 'border-amber-400 ring-2 ring-amber-400/50'
                      : 'border-amber-100'
                  }`}
                >
                  {/* Day Header - Double click to add meal */}
                  <div
                    onDoubleClick={() => openAddMeal(day)}
                    className={`text-center py-3 px-2 border-b cursor-pointer flex-shrink-0 ${isToday ? 'bg-amber-50 rounded-t-2xl' : ''} hover:bg-amber-100/50 transition-colors`}
                    title="Doble clic para agregar comida"
                  >
                    <p className={`text-xs lg:text-sm font-medium truncate ${isToday ? 'text-amber-600' : 'text-stone-500'}`}>
                      <span className="md:hidden xl:inline">{DAY_NAMES_FULL[day.getDay()]}</span>
                      <span className="hidden md:inline xl:hidden">{DAY_NAMES[day.getDay()]}</span>
                    </p>
                    <p className={`text-2xl lg:text-3xl font-bold mt-1 ${isToday ? 'text-amber-700' : 'text-stone-700'}`}>
                      {day.getDate()}
                    </p>
                  </div>

                  {/* Meals Container - Simple list, height driven by content */}
                  <div className="p-2 sm:p-3 space-y-2 overflow-y-auto max-h-[400px]">
                    {getAllMealsForDay(day).map((meal) => {
                      const profile = profiles.find((p) => p.id === meal.responsible_id);
                      return (
                        <div
                          key={meal.id}
                          onClick={() => openEditMeal(meal)}
                          className="group relative p-2 sm:p-3 pr-9 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg sm:text-xl">{MEAL_TYPE_ICONS[meal.meal_type_id]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm sm:text-base font-semibold text-amber-800 truncate">
                                {meal.name}
                              </p>
                              {profile && (
                                <p className="text-xs text-stone-500 truncate">
                                  👨‍🍳 {profile.full_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(meal.id, meal.name);
                            }}
                            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm font-bold transition-opacity hover:bg-red-200 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                    
                    {getAllMealsForDay(day).length === 0 && (
                      <p className="text-center text-xs sm:text-sm text-stone-400 py-2">
                        Sin comidas
                      </p>
                    )}

                    {/* Add Meal Button */}
                    <button
                      type="button"
                      onClick={() => openAddMeal(day)}
                      className="w-full py-2 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 text-sm font-medium hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">+</span>
                      <span className="hidden sm:inline">Agregar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Month View */
          <div className="bg-white rounded-2xl shadow-lg shadow-amber-100/50 border border-amber-100 overflow-hidden max-w-[1800px] mx-auto">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-amber-100">
              {DAY_NAMES.map((name, i) => (
                <div key={name} className="text-center py-3 bg-stone-50">
                  <p className="text-sm font-semibold text-stone-600">{name}</p>
                </div>
              ))}
            </div>

            {/* Calendar Grid - Content-driven height */}
            <div className="grid grid-cols-7">
              {getMonthDays().map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="bg-stone-50/50"></div>;
                }

                const isToday = isSameDay(day, new Date());
                const dayMeals = getAllMealsForDay(day);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => openAddMeal(day)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      openAddMeal(day);
                    }}
                    className={`min-h-[100px] p-2 border-b border-r border-amber-100 cursor-pointer transition-colors hover:bg-amber-50/50 ${
                      isToday ? 'bg-amber-50/30' : ''
                    }`}
                    title="Doble clic para agregar comida"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                          isToday
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    <div className="mt-1 space-y-1">
                      {dayMeals.slice(0, 3).map((meal) => {
                        const colors = MEAL_TYPE_COLORS[meal.meal_type_id] || MEAL_TYPE_COLORS[1];
                        return (
                          <div
                            key={meal.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditMeal(meal);
                            }}
                            className={`text-xs p-1.5 rounded-lg ${colors.bg} ${colors.border} border truncate ${colors.hover}`}
                          >
                            <span className="mr-1">{MEAL_TYPE_ICONS[meal.meal_type_id]}</span>
                            <span className={`font-medium ${colors.text}`}>{meal.name}</span>
                          </div>
                        );
                      })}
                      
                      {dayMeals.length > 3 && (
                        <p className="text-xs text-stone-500 font-medium pl-1">
                          +{dayMeals.length - 3} más
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Meal Modal */}
      {showMealForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowMealForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{mealToEdit ? '✏️' : '🍽️'}</span>
                  <h2 className="text-2xl font-bold">
                    {mealToEdit ? 'Editar Comida' : 'Nueva Comida'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMealForm(false)}
                  className="w-10 h-10 rounded-full bg-white/20 text-white text-2xl hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Meal Name */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Nombre de la comida
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 text-lg focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
                  placeholder="Ej: Pasta con salsa boloñesa"
                />
              </div>

              {/* Meal Type & Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.meal_type_id}
                    onChange={(e) => setFormData({ ...formData, meal_type_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
                  >
                    {mealTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {MEAL_TYPE_ICONS[type.id]} {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
                  />
                </div>
              </div>

              {/* Responsible */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Responsable
                </label>
                <select
                  value={formData.responsible_id}
                  onChange={(e) => setFormData({ ...formData, responsible_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
                >
                  <option value="">Sin asignar</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      👨‍🍳 {profile.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Ingredientes
                  <span className="text-stone-400 font-normal ml-1">(separados por coma)</span>
                </label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all resize-none"
                  placeholder="500g de pasta, 200g de carne molida, 100g de queso..."
                />
              </div>

              {/* Preparation */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Preparación
                  <span className="text-stone-400 font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                  value={formData.preparation}
                  onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all resize-none"
                  placeholder="1. Hervir la pasta...\n2. Preparar la salsa..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMealForm(false)}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-semibold hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-[1.02]"
                >
                  {mealToEdit ? 'Guardar Cambios' : 'Agregar Comida'}
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
              <h3 className="text-xl font-bold text-stone-800 mb-2">¿Eliminar comida?</h3>
              <p className="text-stone-600 mb-6">
                <span className="font-semibold text-amber-600">"{deleteConfirm.name}"</span> se eliminará permanentemente.
              </p>
              {deleteError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-left">
                  <p className="text-sm font-semibold text-red-700">Error:</p>
                  <p className="text-xs text-red-600 break-words">{deleteError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setDeleteConfirm({ show: false, id: null, name: '' }); setDeleteError(null); }}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-semibold hover:bg-stone-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); confirmDelete(); }}
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