import { http, createConfig } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors"

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo"

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: "Base Daily",
      preference: "smartWalletOnly",
    }),
    metaMask(),
    walletConnect({ 
      projectId,
      // Enable session persistence for WalletConnect
      metadata: {
        name: "Base Daily",
        description: "Daily onchain interactions on Base Sepolia",
        url: typeof window !== "undefined" ? window.location.origin : "",
        icons: ["https://avatars.githubusercontent.com/u/37784886"]
      }
    }),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  // Enable auto-connect to restore previous wallet connections
  autoConnect: true,
  ssr: false,
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
