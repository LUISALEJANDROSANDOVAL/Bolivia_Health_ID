import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://gmgilaahgmqagtskkhdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles data:', JSON.stringify(data, null, 2));
    fs.writeFileSync('profiles_sample.json', JSON.stringify(data, null, 2));
  }
}

checkProfiles();
