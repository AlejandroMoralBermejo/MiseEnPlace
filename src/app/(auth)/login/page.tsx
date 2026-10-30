'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { fieldClass, labelClass, primaryButtonClass } from '@/components/Dialog';
import { Logo } from '@/components/Icons';

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR
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
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <main className="flex w-full max-w-[380px] flex-col gap-7">
        <div className="flex flex-col gap-4">
          <Logo size={56} />
          <h1 className="font-display text-[44px] font-extrabold leading-none tracking-tight">MiseEnPlace</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="rounded-xl border border-danger p-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={fieldClass}
            />
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-6 w-6 accent-primary"
            />
            Recordar usuario
          </label>

          <button type="submit" disabled={loading} className={`min-h-[52px] ${primaryButtonClass}`}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  );
}
