import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const privateKey = getEnv('PRIVATE_KEY');
if (!privateKey) {
  console.error('PRIVATE_KEY not found in .env.local');
  process.exit(1);
}

const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
const account = privateKeyToAccount(formattedKey);
console.log('Derived Relayer Address:', account.address);
