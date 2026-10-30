-- Asigna los nombres de los perfiles. Los usuarios se crean antes en
-- Supabase > Authentication > Users; sus perfiles los genera un trigger.
-- Sustituye los valores de ejemplo y ejecuta esto en el SQL Editor.
-- No subas los correos reales al repositorio: es público.

UPDATE profiles SET full_name = 'Nombre'
WHERE id = (SELECT id FROM auth.users WHERE email = 'persona@ejemplo.com');
