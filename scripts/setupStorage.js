import pg from 'pg';

const projectRef = 'uvxisrokqvpgmefxujlj';
const password = process.env.DB_PASSWORD || 'Jeeva08@12s';
const connStr = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

async function setupStorage() {
  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase to configure Storage bucket...');

    // Insert vks-media bucket into storage.buckets if not present
    await client.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'vks-media',
        'vks-media',
        true,
        5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
      )
      ON CONFLICT (id) DO UPDATE SET public = true;

      -- Enable RLS and public read/write policy for vks-media
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for vks-media'
        ) THEN
          CREATE POLICY "Public Access for vks-media" ON storage.objects
          FOR ALL USING (bucket_id = 'vks-media')
          WITH CHECK (bucket_id = 'vks-media');
        END IF;
      END $$;
    `);

    console.log('✅ Supabase storage bucket `vks-media` configured successfully!');
  } catch (err) {
    console.error('Storage setup info:', err.message);
  } finally {
    await client.end();
  }
}

setupStorage();
