import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
    console.log('Checking table: medicine_catalog...');
    const { data, error, count } = await supabase
        .from('medicine_catalog')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching medicine_catalog:', error);
    } else {
        console.log('Count:', count);
        console.log('First 5 items:', data.slice(0, 5));
    }
    
    // Test the search query specifically
    const testSearch = 'IBUPROFENO';
    const { data: searchData, error: searchError } = await supabase
        .from('medicine_catalog')
        .select('*')
        .or(`generic_name.ilike.%${testSearch}%,brand_name.ilike.%${testSearch}%`);
        
    console.log(`Searching for "${testSearch}"...`);
    if (searchError) {
        console.error('Search Error:', searchError);
    } else {
        console.log('Search Results Count:', searchData.length);
        console.log('Search Results:', searchData);
    }
}

checkTable();
