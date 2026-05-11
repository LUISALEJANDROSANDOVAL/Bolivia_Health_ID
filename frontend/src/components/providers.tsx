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

export const config = createConfig(
  getDefaultConfig({
    chains: [avalancheFuji],
    transports: {
      [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3fcc6b4468bd93cb50976d31954a6d09", // ID de prueba público
    appName: "Bolivia Health ID",
  }),
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <>{children}</>;
  }

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
                {children}
              </ThemeProvider>
            </DoctorAuthProvider>
          </WalletProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
