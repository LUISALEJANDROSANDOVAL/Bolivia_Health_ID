'use client'

import { WagmiProvider, createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { WalletProvider } from "@/contexts/wallet-context";
import { ThemeProvider } from "@/components/theme-provider";
import { DoctorAuthProvider } from "@/contexts/doctor-auth-context";
import React, { useState, useEffect } from 'react';

const queryClient = new QueryClient();

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
                {/* 
                   Evitamos renderizar los hijos hasta que el cliente esté montado
                   para prevenir errores de hidratación, pero mantenemos los proveedores
                   siempre presentes.
                */}
                {mounted ? children : null}
              </ThemeProvider>
            </DoctorAuthProvider>
          </WalletProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
