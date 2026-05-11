import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

import fs from 'fs';

async function guessTable() {
  const tables = [
    'patient', 'patients', 'medical_record', 'medical_records', 
    'health_record', 'health_records', 'health_summary', 
    'patient_data', 'health_data', 'patient_info', 'records'
  ];

  const found = {};
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error && data && data.length > 0) {
       found[table] = data;
    }
  }
  fs.writeFileSync('guess.json', JSON.stringify(found, null, 2));
}

guessTable();
