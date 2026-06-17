import { NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, keccak256, stringToBytes, verifyMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { avalancheFuji } from 'viem/chains'
import { MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI } from '@/lib/contracts'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patient, ipfsHash, doctorAddress, signature } = body

    if (!patient || !ipfsHash || !doctorAddress || !signature) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: patient, ipfsHash, doctorAddress, signature' },
        { status: 400 }
      )
    }

    // 1. Verificar firma criptográfica off-chain (EIP-191)
    const message = `Registrar expediente médico: Paciente = ${patient}, IPFS Hash = ${ipfsHash}`
    
    let isValidSignature = false
    try {
      isValidSignature = await verifyMessage({
        address: doctorAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`
      })
    } catch (sigErr) {
      return NextResponse.json(
        { error: 'Firma criptográfica con formato inválido.' },
        { status: 400 }
      )
    }

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'La firma criptográfica es inválida o no coincide con la dirección del médico.' },
        { status: 401 }
      )
    }

    // 2. Validar que la dirección firmante sea de un médico registrado en la base de datos local
    const { data: profile, error: supabaseError } = await supabase
      .from('profiles')
      .select('role')
      .eq('wallet_address', doctorAddress.toLowerCase())
      .single()

    if (supabaseError || !profile || profile.role !== 'medico') {
      return NextResponse.json(
        { error: 'El firmante no está registrado como médico en el sistema.' },
        { status: 403 }
      )
    }

    // 3. Conexión de cliente de lectura para Fuji
    const rpcUrl = process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(rpcUrl)
    })

    // 4. Validar si el médico tiene el rol DOCTOR_ROLE on-chain
    const DOCTOR_ROLE = keccak256(stringToBytes('DOCTOR_ROLE'))
    const hasDoctorRoleOnChain = await publicClient.readContract({
      address: MEDICAL_RECORDS_ADDRESS,
      abi: MEDICAL_RECORDS_ABI,
      functionName: 'hasRole',
      args: [DOCTOR_ROLE, doctorAddress as `0x${string}`]
    })

    if (!hasDoctorRoleOnChain) {
      return NextResponse.json(
        { error: 'El médico no tiene asignado el rol DOCTOR_ROLE on-chain en el contrato inteligente.' },
        { status: 403 }
      )
    }

    // 5. Configurar Wallet Client para enviar la transacción usando la clave privada del deployer/relayer
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta: PRIVATE_KEY no configurada en las variables de entorno.' },
        { status: 500 }
      )
    }

    // Asegurarse de que la clave privada tenga formato correcto
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain: avalancheFuji,
      transport: http(rpcUrl)
    })

    // 6. Enviar transacción a la Blockchain Fuji patrocinada
    const txHash = await walletClient.writeContract({
      address: MEDICAL_RECORDS_ADDRESS,
      abi: MEDICAL_RECORDS_ABI,
      functionName: 'addRecord',
      args: [patient as `0x${string}`, ipfsHash]
    })

    // 7. Esperar a que la transacción se confirme en la red fuji
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    return NextResponse.json({
      success: true,
      txHash,
      blockNumber: receipt.blockNumber.toString()
    })
  } catch (err: any) {
    console.error('Error en el Relayer API:', err)
    return NextResponse.json(
      { error: `Error interno en el Relayer de Blockchain: ${err.message || err}` },
      { status: 500 }
    )
  }
}
