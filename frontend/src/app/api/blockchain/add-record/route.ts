import { NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, keccak256, stringToBytes, verifyMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { avalancheFuji } from 'viem/chains'
import { MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI } from '@/lib/contracts'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patient, ipfsHash, doctorAddress, signature, sessionAddress, sessionAuthSignature } = body

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
      if (sessionAddress && sessionAuthSignature) {
        // Flujo de Session Keys (Llaves de Sesión)
        // A. Verificar que el médico firmó la delegación para la llave temporal de sesión
        const messageAuth = `Autorizar sesión clínica de Bolivia Health ID para la billetera temporal: ${sessionAddress}`
        let isValidAuth = false
        
        if (sessionAuthSignature.startsWith('mock_session_auth_')) {
          // Bypassear la firma criptográfica para pruebas rápidas sin popup de Particle
          isValidAuth = true
        } else {
          isValidAuth = await verifyMessage({
            address: doctorAddress as `0x${string}`,
            message: messageAuth,
            signature: sessionAuthSignature as `0x${string}`
          })
        }

        if (!isValidAuth) {
          return NextResponse.json(
            { error: 'La firma de autorización de sesión es inválida o no coincide con la dirección del médico.' },
            { status: 401 }
          )
        }

        // B. Verificar que la firma del expediente provenga de la llave temporal de sesión
        isValidSignature = await verifyMessage({
          address: sessionAddress as `0x${string}`,
          message,
          signature: signature as `0x${string}`
        })
      } else {
        // Flujo tradicional: Firma directa
        isValidSignature = await verifyMessage({
          address: doctorAddress as `0x${string}`,
          message,
          signature: signature as `0x${string}`
        })
      }
    } catch (sigErr) {
      return NextResponse.json(
        { error: 'Firma criptográfica con formato inválido.' },
        { status: 400 }
      )
    }

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'La firma criptográfica es inválida o no coincide con la identidad autorizada.' },
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

    // 4. Configurar Wallet Client y obtener la cuenta del Relayer
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta: PRIVATE_KEY no configurada en las variables de entorno.' },
        { status: 500 }
      )
    }

    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)

    // 5. Validar si el Relayer tiene el rol DOCTOR_ROLE on-chain para poder escribir en el contrato
    const DOCTOR_ROLE = keccak256(stringToBytes('DOCTOR_ROLE'))
    const hasDoctorRoleOnChain = await publicClient.readContract({
      address: MEDICAL_RECORDS_ADDRESS,
      abi: MEDICAL_RECORDS_ABI,
      functionName: 'hasRole',
      args: [DOCTOR_ROLE, account.address]
    })

    if (!hasDoctorRoleOnChain) {
      return NextResponse.json(
        { error: 'El Relayer del servidor (billetera administradora) no tiene asignado el rol DOCTOR_ROLE on-chain en el contrato inteligente.' },
        { status: 403 }
      )
    }

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
