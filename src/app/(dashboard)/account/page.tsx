'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LoadingScreen,
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/Dialog';
import { ErrorBanner } from '@/components/ErrorBanner';
import { cleanName } from '@/lib/format';
import { promptInstall, useInstallMode } from '@/lib/useInstallPrompt';

export default function AccountPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const installMode = useInstallMode();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (fetchError) setError(`No se pudo cargar tu nombre: ${fetchError.message}`);
      setUserId(user.id);
      setName(profile?.full_name || user.user_metadata?.full_name || '');
      setLoading(false);
    };
    loadProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = cleanName(name);
    if (!userId || !fullName) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    // RLS reports a blocked update as zero rows, not as an error.
    const { data: rows, error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId)
      .select('id');
    if (profileError || !rows?.length) {
      setError(`No se pudo guardar el nombre${profileError ? `: ${profileError.message}` : '. Falta permiso en la base de datos.'}`);
      setSaving(false);
      return;
    }

    // Keeps the name in the session, which the sidebar reads, in step with the profile.
    const { error: sessionError } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (sessionError) setError(`Nombre guardado, pero no se pudo actualizar la sesión: ${sessionError.message}`);

    setName(fullName);
    setSaved(!sessionError);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return <LoadingScreen label="Cargando..." />;
  }

  return (
    <div className="flex flex-col gap-7 p-4 lg:max-w-xl lg:p-7">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <h1 className="font-display text-[40px] font-extrabold leading-none tracking-tight lg:text-[44px]">
        Mi usuario
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="full-name" className={labelClass}>Tu nombre</label>
          <input
            id="full-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            required
            className={fieldClass}
          />
        </div>
        <button type="submit" disabled={saving || !cleanName(name)} className={primaryButtonClass}>
          {saving ? 'Guardando...' : 'Guardar nombre'}
        </button>
        {saved && <p role="status" className="text-sm font-medium text-success">Nombre guardado</p>}
      </form>

      {installMode && installMode !== 'installed' && (
        <section className="flex flex-col gap-2 border-t border-line pt-6">
          <h2 className="font-display text-xl font-extrabold">Instalar app</h2>
          {installMode === 'prompt' && (
            <button type="button" onClick={promptInstall} className={primaryButtonClass}>
              Instalar app
            </button>
          )}
          {installMode === 'ios' && (
            <p className="text-muted">
              En Safari, pulsa <strong className="text-ink">Compartir</strong> y luego{' '}
              <strong className="text-ink">Añadir a pantalla de inicio</strong>.
            </p>
          )}
          {installMode === 'manual' && (
            <p className="text-muted">
              Abre el menú del navegador y pulsa <strong className="text-ink">Instalar app</strong> o{' '}
              <strong className="text-ink">Añadir a pantalla de inicio</strong>.
            </p>
          )}
        </section>
      )}

      <div className="border-t border-line pt-6">
        <button type="button" onClick={handleSignOut} className={`w-full ${secondaryButtonClass}`}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
