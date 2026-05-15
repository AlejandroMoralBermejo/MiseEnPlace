# MiseEnPlace - Setup Instructions

## 1. Crear usuarios en Supabase Dashboard

1. Ir a: https://supabase.com/dashboard/project/ewkjxzgardgngczjnpbh/authentication/users
2. Click **Add User** → crear cada usuario con la misma contraseña:

| Email | Contraseña |
|-------|------------|
| ***REMOVED*** | ***REMOVED*** |
| ***REMOVED*** | ***REMOVED*** |
| ***REMOVED*** | ***REMOVED*** |
| ***REMOVED*** | ***REMOVED*** |

## 2. Actualizar nombres de profiles

Ejecutar este SQL en el **SQL Editor** de Supabase:

```sql
UPDATE profiles SET full_name = 'Antonio' WHERE id = (SELECT id FROM auth.users WHERE email = '***REMOVED***');
UPDATE profiles SET full_name = 'Pili' WHERE id = (SELECT id FROM auth.users WHERE email = '***REMOVED***');
UPDATE profiles SET full_name = 'Alejandro' WHERE id = (SELECT id FROM auth.users WHERE email = '***REMOVED***');
UPDATE profiles SET full_name = 'Javier' WHERE id = (SELECT id FROM auth.users WHERE email = '***REMOVED***');
```

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

## 4. Credenciales de acceso

- **Email**: cualquiera de los 4 emails de arriba
- **Contraseña**: `***REMOVED***`

## Nota sobre "Recordar usuario"

La funcionalidad de "Recordar usuario" está implementada:
- Al hacer login con el checkbox marcado, guarda el email en `localStorage`
- Al recargar la página, restaura el email automáticamente
- Es permanente (no expira)
- Si querés borrar el email recordado, limpiá `localStorage` desde el navegador