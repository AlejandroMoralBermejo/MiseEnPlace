'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isAuthRetryableFetchError, type User } from '@supabase/supabase-js';
import { LoadingScreen, primaryButtonClass } from '@/components/Dialog';
import { BoxIcon, CalendarIcon, CartIcon, Logo } from '@/components/Icons';

const navItems = [
  { href: '/calendar', label: 'Calendario', icon: <CalendarIcon /> },
  { href: '/inventory', label: 'Inventario', icon: <BoxIcon /> },
  { href: '/shopping', label: 'Compras', icon: <CartIcon /> },
];

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
    return <LoadingScreen label="Cargando..." />;
  }

  if (connectionFailed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-display text-2xl font-extrabold">No se puede conectar con la base de datos</p>
        <p className="text-muted">Es posible que el proyecto de Supabase esté pausado.</p>
        <button onClick={() => window.location.reload()} className={primaryButtonClass}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-56 flex-none flex-col gap-7 bg-surface px-4 py-7 lg:flex">
        <p className="flex items-center gap-2 px-3 font-display text-xl font-extrabold tracking-tight">
          <Logo size={26} />
          MiseEnPlace
        </p>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 transition-colors ${
                  active ? 'bg-primary font-semibold text-on-primary' : 'hover:bg-ground'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-start gap-2 border-t border-line px-3 pt-4">
          <p className="max-w-full truncate text-[15px] font-medium">
            {user?.user_metadata?.full_name || user?.email}
          </p>
          <button onClick={handleSignOut} className="min-h-11 text-[15px] font-medium text-muted hover:text-ink">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Principal"
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 border-t border-line bg-ground pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[62px] flex-col items-center justify-center gap-1 text-[13px] ${
                active ? 'font-semibold text-primary' : ''
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="min-w-0 flex-1 pb-[calc(5.5rem_+_env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
    </div>
  );
}
