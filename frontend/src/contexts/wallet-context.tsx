'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface WalletContextType {
  isConnected: boolean
  walletAddress: string | null
  userName: string | null
  connect: () => void
  disconnect: () => void
}

const defaultValue: WalletContextType = {
  isConnected: false,
  walletAddress: null,
  userName: null,
  connect: () => {},
  disconnect: () => {},
}

const WalletContext = createContext<WalletContextType>(defaultValue)

function generateWalletAddress(): string {
  const chars = '0123456789abcdef'
  let address = '0x'
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  return address
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

import { useAccount, useDisconnect } from 'wagmi'
import { useModal } from 'connectkit'

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { setOpen } = useModal()

  const walletAddress = address ? (address as string) : null
  const userName = isConnected ? 'Doctor (MetaMask)' : null

  const connect = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  const handleDisconnect = useCallback(() => {
    disconnect()
  }, [disconnect])

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        userName,
        connect,
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}

export { formatAddress }
