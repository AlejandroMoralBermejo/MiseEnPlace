import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const password = process.env.SEED_PASSWORD || '';
// Formato: [{"email":"persona@ejemplo.com","name":"Persona"}]
const users: { email: string; name: string }[] = JSON.parse(process.env.SEED_USERS || '[]');

async function seed() {
  if (!supabaseUrl || !supabaseServiceKey || !password || users.length === 0) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_PASSWORD o SEED_USERS');
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
      console.log(`✓ ${user.name} ya existe`);
      continue;
    }

    // Crear usuario via auth
    const { error } = await supabase.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: user.name },
    });

    if (error) {
      console.error(`✗ Error creando ${user.name}: ${error.message}`);
    } else {
      console.log(`✓ Creado: ${user.name}`);
    }
  }

  console.log('\n¡Seed completo!');
}

seed();
