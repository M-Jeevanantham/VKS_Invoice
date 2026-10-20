import pg from 'pg';

const projectRef = 'uvxisrokqvpgmefxujlj';
const password = process.env.DB_PASSWORD || 'Jeeva08@12s';
const connStr = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

async function clearData() {
  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase to remove sample customers and products...');

    // Delete existing customer and product rows
    // Note: Foreign keys on invoice_items or invoices have ON DELETE SET NULL
    await client.query(`
      DELETE FROM public.customers;
      DELETE FROM public.products;
    `);

    console.log('✅ All customers and products removed from Supabase database!');
  } catch (err) {
    console.error('Error clearing data:', err.message);
  } finally {
    await client.end();
  }
}

clearData();
