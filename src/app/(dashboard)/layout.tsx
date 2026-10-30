'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isAuthRetryableFetchError, type User } from '@supabase/supabase-js';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      // A network failure is not a logout: do not send the user to /login for it.
      if (isAuthRetryableFetchError(error)) {
        setConnectionFailed(true);
        setLoading(false);
        return;
      }
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-xl text-stone-600">Cargando...</div>
      </div>
    );
  }

  if (connectionFailed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 p-6 text-center">
        <p className="text-xl font-semibold text-stone-800">No se puede conectar con la base de datos</p>
        <p className="text-stone-600">Es posible que el proyecto de Supabase esté pausado.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-stone-800 px-4 py-2 text-white hover:bg-stone-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const navItems = [
    { href: '/calendar', label: 'Calendario', icon: '📅' },
    { href: '/inventory', label: 'Inventario', icon: '📦' },
    { href: '/shopping', label: 'Compras', icon: '🛒' },
  ];

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col bg-stone-800 text-white lg:flex">
        <div className="p-6">
          <h1 className="text-2xl font-bold">MiseEnPlace</h1>
        </div>
        <nav className="flex-1 space-y-2 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-lg transition-colors ${
                pathname === item.href
                  ? 'bg-stone-700 font-medium'
                  : 'hover:bg-stone-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-stone-700 p-4">
          <div className="mb-4 text-sm text-stone-300">
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full rounded-lg bg-stone-700 px-4 py-2 text-left text-lg hover:bg-stone-600"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-stone-800 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.15)] lg:hidden">
        <nav className="flex justify-around py-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 ${
                pathname === item.href ? 'text-white' : 'text-stone-400'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-[calc(7rem_+_env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
    </div>
  );
}