import { http, createConfig } from "wagmi"
import { metaMask, walletConnect } from "wagmi/connectors"
import { base, baseSepolia } from "viem/chains"

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo"

// Get the base URL dynamically for WalletConnect metadata
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
}

// Prioritize MetaMask as the primary wallet option
const connectors = [
  metaMask({
    // Add dapp metadata for better UX
    dappMetadata: {
      name: "Base Daily",
      url: getBaseUrl(),
      iconUrl: `${getBaseUrl()}/placeholder-logo.svg`,
    },
  }),
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
        url: getBaseUrl(),
        icons: [`${getBaseUrl()}/placeholder-logo.svg`]
      },
      // Add better mobile support
      showQrModal: true,
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
  // Add better error handling
  multiInjectedProviderDiscovery: false,
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
