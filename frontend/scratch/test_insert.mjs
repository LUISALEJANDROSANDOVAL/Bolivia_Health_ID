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

async function testInsert() {
    console.log('Testing insert into medicine_catalog...');
    const testData = {
        id: '00000000-0000-0000-0000-000000000001',
        generic_name: 'TEST MEDICINE',
        brand_name: 'TEST BRAND',
        form: 'TABLET',
        concentration: '100MG'
    };

    const { data, error } = await supabase
        .from('medicine_catalog')
        .insert([testData])
        .select();

    if (error) {
        console.error('Insert failed:', error.message);
        console.error('Full Error:', error);
    } else {
        console.log('Insert successful:', data);
    }
}

testInsert();
