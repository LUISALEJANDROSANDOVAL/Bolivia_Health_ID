import { privateKeyToAccount } from 'viem/accounts';

const privateKey = '0xc6902114e7ab61b3f57f3a515405344e06157a9315b04de8ada423b5f0e118ef';
const account = privateKeyToAccount(privateKey);
console.log('Deployer/Relayer Address:', account.address);
