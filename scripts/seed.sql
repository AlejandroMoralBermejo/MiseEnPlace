-- ============================================
-- SEED: Crear usuarios de prueba en Supabase
-- ============================================
-- NOTA: Este SQL crea los profiles. Los usuarios en auth.users
-- deben crearse primero desde la app o desde el dashboard de Supabase.
-- Después ejecutá este SQL para vincular los profiles.
--
-- Para crear usuarios desde el dashboard:
-- 1. Ir a Supabase > Authentication > Users > Add User
-- 2. O usar la app y registrarse normalmente
-- ============================================

-- Primero verificá si ya existen los usuarios (reemplazá los UUIDs con los reales)
-- Los UUIDs se obtienen de Authentication > Users

-- Assuming you create users first (they get auto-created profiles via trigger),
-- this SQL just ensures the names are correct:

-- ACTUALIZAR NOMBRES DE PERFILES (ejecutar después de crear usuarios)
-- IMPORTANTE: Reemplazá los UUIDs con los de tus usuarios reales

-- Para encontrar los UUIDs de tus usuarios, ejecutá:
-- SELECT id, email FROM auth.users;

-- Luego actualizá los nombres:
/*
UPDATE profiles SET full_name = 'Antonio' WHERE id = 'uuid-de-antonio';
UPDATE profiles SET full_name = 'Pili' WHERE id = 'uuid-de-pili';
UPDATE profiles SET full_name = 'Alejandro' WHERE id = 'uuid-de-alejandro';
UPDATE profiles SET full_name = 'Javier' WHERE id = 'uuid-de-javier';
*/

-- ============================================
-- OPCIÓN: Si ya conoces los UUIDs, ejecutá esto:
-- ============================================

-- PLACEHOLDER: Reemplazá estos UUIDs con los reales de tu proyecto
-- CREATE OR REPLACE FUNCTION seed_family_users()
-- RETURNS void AS $$
-- BEGIN
--   -- Antonio
--   UPDATE profiles SET full_name = 'Antonio' WHERE email = 'moralantonio@hotmail.es';
--   -- Pili
--   UPDATE profiles SET full_name = 'Pili' WHERE email = 'pili.bermejo@gmail.com';
--   -- Alejandro
--   UPDATE profiles SET full_name = 'Alejandro' WHERE email = 'alejandromoralbermejo@gmail.com';
--   -- Javier
--   UPDATE profiles SET full_name = 'Javier' WHERE email = 'javiermoral@gmail.com';
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================
-- METODO ALTERNATIVO: Eliminar todos los usuarios y crear de nuevo
-- (CUIDADO: esto borra todo)
-- ============================================

/*
-- 1. Eliminar usuarios existentes (opcional, solo si querés empezar de cero)
DELETE FROM auth.users WHERE email IN (
  'moralantonio@hotmail.es',
  'pili.bermejo@gmail.com',
  'alejandromoralbermejo@gmail.com',
  'javiermoral@gmail.com'
);

-- 2. Crear usuarios (usando la API de auth_admin - requiere permisos de service_role)
-- Esto se hace mejor desde código, no desde SQL puro
*/

-- ============================================
-- RECOMENDACIÓN:
-- ============================================
-- Para crear los usuarios, la forma más fácil es:
-- 1. Ir a https://supabase.com/dashboard/project/ewkjxzgardgngczjnpbh/authentication/users
-- 2. Click "Add User" > crear cada usuario con email y contraseña
-- 3. Los profiles se crean automáticamente gracias al trigger
-- 4. Después actualizá los nombres con los UUIDs correctos
--
-- O mejor: ejecutá el seed desde la terminal con el script que te di antes.
*/