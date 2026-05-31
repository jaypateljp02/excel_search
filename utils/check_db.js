import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

// Read .env.local manually
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

const client = createClient({
  url: env.TURSO_URL,
  authToken: env.TURSO_TOKEN,
});

(async () => {
  try {
    // Check connection
    console.log('Connecting to Turso at:', env.TURSO_URL);
    const result = await client.execute('SELECT 1 as ok');
    console.log('Connection OK:', result.rows[0]);

    // Check if table exists
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.rows.map(r => r.name));

    // Count rows
    try {
      const count = await client.execute('SELECT COUNT(*) as cnt FROM excel_data');
      console.log('Row count:', count.rows[0].cnt);
    } catch (e) {
      console.log('excel_data table does not exist yet (will be auto-created on first upload)');
    }

    console.log('\nDatabase is ready!');
  } catch (e) {
    console.error('DB error:', e.message);
  }
})();
