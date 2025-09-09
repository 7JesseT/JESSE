import { http, createConfig } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors"

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo"

// Only create WalletConnect connector on client side
const connectors = [
  coinbaseWallet({
    appName: "Base Daily",
    preference: "smartWalletOnly",
  }),
  metaMask(),
]

// Add WalletConnect only on client side to avoid SSR issues
if (typeof window !== "undefined") {
  connectors.push(
    walletConnect({ 
      projectId,
      // Enable session persistence for WalletConnect
      metadata: {
        name: "Base Daily",
        description: "Daily onchain interactions on Base Sepolia",
        url: window.location.origin,
        icons: ["https://avatars.githubusercontent.com/u/37784886"]
      }
    })
  )
}

export const config = createConfig({
  chains: [baseSepolia],
  connectors,
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  ssr: false,
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
