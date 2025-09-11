import { NetworkType, getCurrentNetworkConfig } from "@/lib/networks"

export const DEFAULT_RECIPIENT = (process.env.NEXT_PUBLIC_TIP_ADDRESS || "") as `0x${string}` | "";

// Prefer explicit env; allow empty string to indicate not configured
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "") as `0x${string}` | "";

// Get transaction URL based on current network
export const getTransactionUrl = (txHash: string): string => {
  const config = getCurrentNetworkConfig()
  return `${config.explorerUrl}/tx/${txHash}`
}

// Legacy function for backward compatibility
export const BASESCAN_TX_URL = (txHash: string) => getTransactionUrl(txHash);

export type SupportedCurrency = "ETH" | "USDC";
