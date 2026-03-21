'use client'

import { WagmiProvider, createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { WalletProvider } from "@/contexts/wallet-context";

const queryClient = new QueryClient();

// Configure Wagmi with Alchemy RPC and Avalanche Fuji
export const config = createConfig(
  getDefaultConfig({
    chains: [avalancheFuji],
    transports: {
      [avalancheFuji.id]: http(`https://avax-fuji.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "1234567890abcdef1234567890abcdef", 
    appName: "Bolivia Health ID",
  }),
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
