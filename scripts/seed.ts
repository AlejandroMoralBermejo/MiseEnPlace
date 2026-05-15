import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewkjxzgardgngczjnpbh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const users = [
  { email: '***REMOVED***', name: 'Antonio' },
  { email: '***REMOVED***', name: 'Pili' },
  { email: '***REMOVED***', name: 'Alejandro' },
  { email: '***REMOVED***', name: 'Javier' },
];

const password = '***REMOVED***'; // La contraseña que vos设置

async function seed() {
  if (!supabaseServiceKey) {
    console.error('Necesitas SUPABASE_SERVICE_ROLE_KEY en tu .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Creando usuarios...');

  for (const user of users) {
    // Verificar si el usuario ya existe
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('full_name', user.name)
      .maybeSingle();

    if (existing) {
      console.log(`✓ ${user.email} ya existe (${user.name})`);
      continue;
    }

    // Crear usuario via auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: user.name },
    });

    if (error) {
      console.error(`✗ Error creando ${user.email}: ${error.message}`);
    } else {
      console.log(`✓ Creado: ${user.email} (${user.name})`);
    }
  }

  console.log('\n¡Seed completo!');
  console.log(`Contraseña para todos: ${password}`);
}

seed();