import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function fetchSchema() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  const data = await res.json();
  
  const tables = Object.keys(data.definitions || {}).filter(k => !k.includes('patch') && !k.includes('post'));
  fs.writeFileSync('schema.json', JSON.stringify(tables, null, 2));
}

fetchSchema();
