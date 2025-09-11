import { base, baseSepolia } from "viem/chains"
import { http } from "wagmi"

export type NetworkType = "sepolia" | "mainnet"

export interface NetworkConfig {
  type: NetworkType
  chain: typeof base | typeof baseSepolia
  rpcUrl: string
  explorerUrl: string
  name: string
  isTestnet: boolean
}

// Get RPC URL from environment variables
const getRpcUrl = (network: NetworkType): string => {
  if (network === "sepolia") {
    return process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || "https://sepolia.base.org"
  }
  return process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://mainnet.base.org"
}

// Get default network from environment
export const getDefaultNetwork = (): NetworkType => {
  const defaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK as NetworkType
  return defaultNetwork === "mainnet" ? "mainnet" : "sepolia"
}

// Network configurations
export const networks: Record<NetworkType, NetworkConfig> = {
  sepolia: {
    type: "sepolia",
    chain: baseSepolia,
    rpcUrl: getRpcUrl("sepolia"),
    explorerUrl: "https://sepolia.basescan.org",
    name: "Base Sepolia",
    isTestnet: true,
  },
  mainnet: {
    type: "mainnet",
    chain: base,
    rpcUrl: getRpcUrl("mainnet"),
    explorerUrl: "https://basescan.org",
    name: "Base Mainnet",
    isTestnet: false,
  },
}

// Get network config by type
export const getNetworkConfig = (network: NetworkType): NetworkConfig => {
  return networks[network]
}

// Get current network config (for client-side)
export const getCurrentNetworkConfig = (): NetworkConfig => {
  if (typeof window === "undefined") {
    return networks[getDefaultNetwork()]
  }
  
  // Check sessionStorage for user's network preference
  const storedNetwork = sessionStorage.getItem("baseDaily:selectedNetwork") as NetworkType
  const network = storedNetwork && networks[storedNetwork] ? storedNetwork : getDefaultNetwork()
  
  return networks[network]
}

// Set network preference in sessionStorage
export const setNetworkPreference = (network: NetworkType): void => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("baseDaily:selectedNetwork", network)
  }
}

// Get wagmi transport configuration
export const getWagmiTransports = () => {
  return {
    [baseSepolia.id]: http(networks.sepolia.rpcUrl),
    [base.id]: http(networks.mainnet.rpcUrl),
  }
}

// Get wagmi chains configuration
export const getWagmiChains = () => {
  return [baseSepolia, base]
}

// Get transaction URL for a network
export const getTransactionUrl = (txHash: string, network: NetworkType): string => {
  const config = getNetworkConfig(network)
  return `${config.explorerUrl}/tx/${txHash}`
}

// Check if mainnet confirmation is required and valid
export const isMainnetConfirmed = (): boolean => {
  if (typeof window === "undefined") return false
  
  try {
    const confirmed = sessionStorage.getItem("baseDaily:mainnetConfirmed")
    if (!confirmed) return false
    
    const data = JSON.parse(confirmed)
    const now = Date.now()
    const ttl = 24 * 60 * 60 * 1000 // 24 hours
    
    return data.timestamp && (now - data.timestamp) < ttl
  } catch {
    return false
  }
}

// Set mainnet confirmation with TTL
export const setMainnetConfirmed = (): void => {
  if (typeof window !== "undefined") {
    const data = {
      timestamp: Date.now(),
      confirmed: true,
    }
    sessionStorage.setItem("baseDaily:mainnetConfirmed", JSON.stringify(data))
  }
}

// Clear mainnet confirmation
export const clearMainnetConfirmed = (): void => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("baseDaily:mainnetConfirmed")
  }
}
