'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

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

      {/* Mobile Header */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-800 lg:hidden">
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
      <main className="flex-1 pb-20 lg:pb-0 lg:pl-64">
        {children}
      </main>
    </div>
  );
}