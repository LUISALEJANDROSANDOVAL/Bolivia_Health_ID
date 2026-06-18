import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmgilaahgmqagtskkhdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw';

const supabase = createClient(supabaseUrl, anonKey);

async function check() {
  const { data, error } = await supabase.from('access_permissions').select('*').limit(1);
  if (error) {
    console.error('Error fetching columns:', error);
  } else {
    console.log('Access Permission columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data in table');
    console.log('Full first row:', data && data.length > 0 ? data[0] : 'None');
  }
}

check();
