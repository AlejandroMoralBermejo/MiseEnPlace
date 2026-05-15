'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Cargar email recordado al iniciar
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Guardar email si recuerdan
    if (rememberMe) {
      localStorage.setItem('remembered_email', email);
    } else {
      localStorage.removeItem('remembered_email');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/calendar');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 50%, #f59e0b 75%, #d97706 100%)',
      }}
    >
      {/* Decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-orange-200/20 blur-2xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Floating food icons */}
        <div className="absolute -left-16 -top-12 text-6xl opacity-20 blur-sm animate-pulse">🍳</div>
        <div className="absolute -right-8 -bottom-8 text-5xl opacity-20 blur-sm animate-pulse" style={{ animationDelay: '1s' }}>🥘</div>
        <div className="absolute -right-20 top-1/3 text-4xl opacity-20 blur-sm animate-pulse" style={{ animationDelay: '0.5s' }}>🍲</div>

        <div className="rounded-3xl bg-white/95 p-10 shadow-2xl backdrop-blur-sm border border-white/50">
          {/* Logo & Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <span className="text-3xl">👨‍🍳</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              MiseEnPlace
            </h1>
            <p className="mt-3 text-lg text-stone-600">
              Planificación de comidas familiares
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-stone-700">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-lg text-stone-800 placeholder:text-stone-400 transition-all duration-200 ease-out focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-100 shadow-sm"
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-stone-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-lg text-stone-800 placeholder:text-stone-400 transition-all duration-200 ease-out focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-100 shadow-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Remember me styled checkbox */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-stone-200 peer-checked:bg-gradient-to-r peer-checked:from-amber-400 peer-checked:to-orange-500 transition-all duration-300 shadow-inner" />
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 peer-checked:translate-x-5" />
                </div>
                <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
                  Recordar usuario
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-lg font-semibold text-white shadow-lg shadow-amber-200/50 transition-all duration-300 ease-out hover:shadow-xl hover:shadow-amber-300/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-stone-600">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition-all duration-300 underline underline-offset-4">
              Regístrate
            </Link>
          </p>
        </div>

        {/* Footer decoration */}
        <div className="mt-6 flex justify-center gap-2 text-stone-600/60">
          <span className="text-sm">🍽️</span>
          <span className="text-xs font-medium tracking-wide uppercase">Family Meals</span>
          <span className="text-sm">🍴</span>
        </div>
      </div>
    </div>
  );
}