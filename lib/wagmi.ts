import { http, createConfig } from "wagmi"
import { metaMask, walletConnect } from "wagmi/connectors"
import { base, baseSepolia } from "viem/chains"

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo"

// Prioritize MetaMask as the primary wallet option
const connectors = [
  metaMask(),
]

// Add WalletConnect as fallback option on client side to avoid SSR issues
if (typeof window !== "undefined") {
  connectors.push(
    walletConnect({ 
      projectId,
      // Enable session persistence for WalletConnect
      metadata: {
        name: "Base Daily",
        description: "Daily onchain interactions on Base",
        url: window.location.origin,
        icons: ["https://avatars.githubusercontent.com/u/37784886"]
      }
    })
  )
}

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors,
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || "https://sepolia.base.org"),
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://mainnet.base.org"),
  },
  ssr: false,
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
