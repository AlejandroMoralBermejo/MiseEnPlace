'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Meal, type MealType, type Profile } from '@/types';

export default function CalendarPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const [mealsRes, mealTypesRes, profilesRes] = await Promise.all([
      supabase
        .from('meals')
        .select('*, meal_types(*), profiles(*)')
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0])
        .order('date'),
      supabase.from('meal_types').select('*'),
      supabase.from('profiles').select('*'),
    ]);

    if (mealsRes.data) setMeals(mealsRes.data);
    if (mealTypesRes.data) setMealTypes(mealTypesRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  }, [currentWeek]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDaysOfWeek = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const daysOfWeek = getDaysOfWeek();

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getMealsForDay = (date: Date, mealTypeId?: number) => {
    const dateStr = formatDate(date);
    return meals.filter((meal) => {
      if (meal.date !== dateStr) return false;
      if (mealTypeId && meal.meal_type_id !== mealTypeId) return false;
      return true;
    });
  };

  const openAddMeal = (date: Date) => {
    setSelectedDate(formatDate(date));
    setFormData({ ...formData, date: formatDate(date) });
    setShowMealForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ingredients = formData.ingredients
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i);

    const { error } = await supabase.from('meals').insert({
      name: formData.name,
      ingredients,
      preparation: formData.preparation || null,
      date: formData.date,
      meal_type_id: formData.meal_type_id,
      responsible_id: formData.responsible_id || null,
    });

    if (!error) {
      setShowMealForm(false);
      setFormData({ name: '', ingredients: '', preparation: '', date: '', meal_type_id: 1, responsible_id: '' });
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta comida?')) {
      await supabase.from('meals').delete().eq('id', id);
      loadData();
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const mealTypeIcons: Record<number, string> = {
    1: '☕',
    2: '🍽️',
    3: '🌙',
    4: '🫖',
    5: '🍿',
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-stone-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800 lg:text-3xl">Calendario de Comidas</h1>
        <button
          onClick={() => {
            setSelectedDate(formatDate(new Date()));
            setFormData({ ...formData, date: formatDate(new Date()) });
            setShowMealForm(true);
          }}
          className="rounded-lg bg-stone-800 px-4 py-2 text-lg font-medium text-white hover:bg-stone-700"
        >
          + Agregar Comida
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => {
            const prev = new Date(currentWeek);
            prev.setDate(prev.getDate() - 7);
            setCurrentWeek(prev);
          }}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-stone-700 hover:bg-stone-50"
        >
          ← Semana anterior
        </button>
        <div className="text-center">
          <div className="text-lg font-medium text-stone-800">
            {daysOfWeek[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="text-sm text-stone-500 underline hover:text-stone-700"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={() => {
            const next = new Date(currentWeek);
            next.setDate(next.getDate() + 7);
            setCurrentWeek(next);
          }}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-stone-700 hover:bg-stone-50"
        >
          Semana siguiente →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {daysOfWeek.map((day) => (
          <div
            key={day.toISOString()}
            className={`rounded-xl border p-4 ${
              isToday(day)
                ? 'border-stone-800 bg-stone-50'
                : 'border-stone-200 bg-white'
            }`}
          >
            <div className="mb-4 text-center">
              <div className="text-lg font-medium text-stone-800">
                {dayNames[day.getDay()]}
              </div>
              <div className={`text-2xl ${isToday(day) ? 'font-bold' : 'text-stone-600'}`}>
                {day.getDate()}
              </div>
            </div>

            <div className="space-y-3">
              {mealTypes.map((type) => {
                const dayMeals = getMealsForDay(day, type.id);
                return (
                  <div key={type.id}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-600">
                        {mealTypeIcons[type.id]} {type.name}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDate(formatDate(day));
                          setFormData({ ...formData, date: formatDate(day), meal_type_id: type.id });
                          setShowMealForm(true);
                        }}
                        className="text-stone-400 hover:text-stone-600"
                      >
                        +
                      </button>
                    </div>
                    {dayMeals.map((meal) => (
                      <div key={meal.id} className="group relative rounded-lg bg-stone-100 p-2">
                        <div className="font-medium text-stone-800">{meal.name}</div>
                        {meal.profiles && (
                          <div className="text-xs text-stone-500">👨‍🍳 {meal.profiles.full_name}</div>
                        )}
                        <button
                          onClick={() => handleDelete(meal.id)}
                          className="absolute right-2 top-2 hidden text-red-500 hover:text-red-700 group-hover:block"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showMealForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-800">Nueva Comida</h2>
              <button
                onClick={() => setShowMealForm(false)}
                className="text-2xl text-stone-500 hover:text-stone-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  placeholder="Ej: Pasta con salsa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo de comida</label>
                <select
                  value={formData.meal_type_id}
                  onChange={(e) => setFormData({ ...formData, meal_type_id: parseInt(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                >
                  {mealTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {mealTypeIcons[type.id]} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">Responsable</label>
                <select
                  value={formData.responsible_id}
                  onChange={(e) => setFormData({ ...formData, responsible_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                >
                  <option value="">Sin asignar</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Ingredientes <span className="text-stone-400">(opcional, separados por coma)</span>
                </label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  placeholder="500g de pasta, 200g de salsa, queso rallado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Preparación <span className="text-stone-400">(opcional)</span>
                </label>
                <textarea
                  value={formData.preparation}
                  onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  placeholder="Pasos de preparación..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMealForm(false)}
                  className="flex-1 rounded-lg border border-stone-300 py-3 text-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-stone-800 py-3 text-lg font-medium text-white hover:bg-stone-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}