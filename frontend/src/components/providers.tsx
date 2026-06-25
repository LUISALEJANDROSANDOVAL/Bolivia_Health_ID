'use client'

import { WagmiProvider, createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { WalletProvider } from "@/contexts/wallet-context";
import { ThemeProvider } from "@/components/theme-provider";
import { DoctorAuthProvider } from "@/contexts/doctor-auth-context";
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWallet } from "@/contexts/wallet-context";

const queryClient = new QueryClient();

function RoleGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, role } = useWallet()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isConnected && role) {
      const isDoctorPath = pathname.startsWith('/doctor')
      const isSecretaryPath = pathname.startsWith('/secretaria')
      const isVerificando = pathname === '/verificando'
      const isPublic = pathname === '/'
      const isRegister = pathname === '/register'

      // Permitir páginas públicas y de registro/verificación
      if (isPublic || isVerificando || isRegister) return

      if (role === 'medico' && !isDoctorPath) {
        router.push('/doctor')
      } else if (role === 'paciente' && (isDoctorPath || isSecretaryPath)) {
        router.push('/dashboard')
      } else if (role === 'secretaria' && !isSecretaryPath) {
        router.push('/secretaria')
      } else if (role === 'medico' && isSecretaryPath) {
        router.push('/doctor')
      }
    }
  }, [isConnected, role, pathname, router])

  return <>{children}</>
}

// Configure Wagmi with Alchemy RPC or public RPC and Avalanche Fuji
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const rpcUrl = alchemyKey 
  ? `https://avax-fuji.g.alchemy.com/v2/${alchemyKey}`
  : "https://api.avax-test.network/ext/bc/C/rpc";

export const config = createConfig(
  getDefaultConfig({
    chains: [avalancheFuji],
    transports: {
      [avalancheFuji.id]: http(rpcUrl),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "1234567890abcdef1234567890abcdef", 
    appName: "Bolivia Health ID",
  }),
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <WalletProvider>
            <DoctorAuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {mounted ? (
                  <RoleGuard>
                    {children}
                  </RoleGuard>
                ) : (
                  <div style={{ visibility: 'hidden' }}>{children}</div>
                )}
              </ThemeProvider>
            </DoctorAuthProvider>
          </WalletProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
