require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkRecords() {
  const { data, error } = await supabase
    .from('health_records')
    .select('*');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Health Records count:', data.length);
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
  }
}

checkRecords();
