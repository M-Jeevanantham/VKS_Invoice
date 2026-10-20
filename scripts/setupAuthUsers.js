import pg from 'pg';

const projectRef = 'uvxisrokqvpgmefxujlj';
const password = process.env.DB_PASSWORD || 'Jeeva08@12s';
const connStr = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

async function setupAuth() {
  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase to create auth_users table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.auth_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL DEFAULT 'Salem Admin',
        role TEXT NOT NULL DEFAULT 'ADMIN',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow public all access on auth_users" ON public.auth_users;
      CREATE POLICY "Allow public all access on auth_users" 
        ON public.auth_users FOR ALL USING (true) WITH CHECK (true);

      INSERT INTO public.auth_users (email, password, full_name, role)
      VALUES ('vks@admin.in', 'admin@vks', 'Salem Admin', 'ADMIN')
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
    `);

    console.log('✅ public.auth_users created and seeded with vks@admin.in / admin@vks!');
  } catch (err) {
    console.error('Error setting up auth:', err.message);
  } finally {
    await client.end();
  }
}

setupAuth();
