import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRef = 'uvxisrokqvpgmefxujlj';
const password = process.env.DB_PASSWORD || 'Jeeva08@12s';

// Try standard direct and common AWS regions poolers for Supabase
const connectionStrings = [
  // Direct connection
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  // Direct with sslmode require
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
  // Mumbai pooler (ap-south-1)
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  // Singapore pooler (ap-southeast-1)
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  // US East pooler (us-east-1)
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  // EU Central pooler (eu-central-1)
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`,
];

async function run() {
  const sqlFile = path.resolve(__dirname, '../supabase/migrations/20261017000000_init_vks_schema.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  let connectedClient = null;

  for (const connStr of connectionStrings) {
    const masked = connStr.replace(password, '******');
    console.log(`Trying connection to ${masked}...`);
    const client = new pg.Client({
      connectionString: connStr,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log('Successfully connected to Supabase PostgreSQL database!');
      connectedClient = client;
      break;
    } catch (err) {
      console.log(`Could not connect: ${err.message}`);
      await client.end().catch(() => {});
    }
  }

  if (!connectedClient) {
    console.log('\nCould not connect directly via external pg port. The Supabase SQL migration file is ready at:');
    console.log(sqlFile);
    console.log('You can also run this SQL script in the Supabase Dashboard SQL Editor.');
    process.exit(0);
  }

  try {
    console.log('Executing schema migration...');
    await connectedClient.query(sqlContent);
    console.log('✅ Migration applied successfully to Supabase database!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await connectedClient.end();
  }
}

run();
