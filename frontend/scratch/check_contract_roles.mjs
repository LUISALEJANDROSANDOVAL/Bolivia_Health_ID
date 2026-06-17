import { createPublicClient, createWalletClient, http, keccak256, stringToBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalancheFuji } from 'viem/chains';

const address = '0xE686E3F1Eb3F8122beA698FD8e40eb65873985ca';
const relayerAddress = '0x5Ef2c21565f2Db93b93Da9Cf3C89ffe5005F91f4';
const privateKey = '0xc6902114e7ab61b3f57f3a515405344e06157a9315b04de8ada423b5f0e118ef';
const account = privateKeyToAccount(privateKey);

const rpcUrl = 'https://api.avax-test.network/ext/bc/C/rpc'; // Use public RPC

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(rpcUrl)
});

const walletClient = createWalletClient({
  account,
  chain: avalancheFuji,
  transport: http(rpcUrl)
});

const DOCTOR_ROLE = keccak256(stringToBytes('DOCTOR_ROLE'));
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

async function main() {
  try {
    const hasDoctorRole = await publicClient.readContract({
      address,
      abi: [{
        name: 'hasRole',
        type: 'function',
        inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }]
      }],
      functionName: 'hasRole',
      args: [DOCTOR_ROLE, relayerAddress]
    });

    const hasAdminRole = await publicClient.readContract({
      address,
      abi: [{
        name: 'hasRole',
        type: 'function',
        inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }]
      }],
      functionName: 'hasRole',
      args: [DEFAULT_ADMIN_ROLE, relayerAddress]
    });

    console.log('Relayer Address:', relayerAddress);
    console.log('Has DOCTOR_ROLE:', hasDoctorRole);
    console.log('Has DEFAULT_ADMIN_ROLE:', hasAdminRole);

    if (!hasDoctorRole && hasAdminRole) {
      console.log('Relayer is ADMIN but not DOCTOR. Granting DOCTOR_ROLE to itself...');
      const txHash = await walletClient.writeContract({
        address,
        abi: [{
          name: 'grantRole',
          type: 'function',
          inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }],
          outputs: []
        }],
        functionName: 'grantRole',
        args: [DOCTOR_ROLE, relayerAddress]
      });
      console.log('Transaction sent:', txHash);
      console.log('Waiting for confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log('Transaction confirmed! Relayer now has DOCTOR_ROLE.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
