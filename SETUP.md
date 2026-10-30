# MiseEnPlace - Setup Instructions

Este repositorio es público: no escribas aquí contraseñas ni correos reales.

## 1. Crear usuarios en Supabase Dashboard

1. Ir a **Authentication > Users** en el dashboard del proyecto.
2. Click **Add User** y crear cada usuario con una contraseña propia.

También se puede usar `scripts/seed.ts`, que lee `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SEED_PASSWORD` y `SEED_USERS` del entorno.

## 2. Actualizar nombres de profiles

Ejecutar `scripts/seed.sql` en el **SQL Editor** de Supabase, con los correos reales.

## 3. Agregar meal_types si no existen

Si los tipos de comida no se insertaron, ejecutá:

```sql
INSERT INTO meal_types (name) VALUES
  ('Desayuno'),
  ('Comida'),
  ('Cena'),
  ('Merienda'),
  ('Snack')
ON CONFLICT (name) DO NOTHING;
```

## Si el proyecto aparece pausado

Supabase pausa los proyectos del plan gratuito tras un periodo sin actividad. Mientras está pausado, la app no puede conectar. Se reanuda con **Restore project** en el dashboard.

## Nota sobre "Recordar usuario"

La funcionalidad de "Recordar usuario" está implementada:
- Al hacer login con el checkbox marcado, guarda el email en `localStorage`
- Al recargar la página, restaura el email automáticamente
- Es permanente (no expira)
- Si querés borrar el email recordado, limpiá `localStorage` desde el navegador
