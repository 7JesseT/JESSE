export const DEFAULT_RECIPIENT = (process.env.NEXT_PUBLIC_TIP_ADDRESS || "") as `0x${string}` | "";

// Prefer explicit env; allow empty string to indicate not configured
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "") as `0x${string}` | "";

export const BASESCAN_TX_URL = (txHash: string) => `https://sepolia.basescan.org/tx/${txHash}`;

export type SupportedCurrency = "ETH" | "USDC";
// Configuration for addresses used in the TipJar component
// Base Sepolia addresses

// Default recipient address for tips
export const DEFAULT_RECIPIENT = process.env.NEXT_PUBLIC_TIP_ADDRESS as `0x${string}` | undefined

// USDC contract address on Base Sepolia
// Note: This is a placeholder. Set NEXT_PUBLIC_USDC_ADDRESS in your environment
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined

// Validate that required addresses are configured
export const isRecipientConfigured = (): boolean => {
  return typeof DEFAULT_RECIPIENT === "string" && DEFAULT_RECIPIENT.startsWith("0x") && DEFAULT_RECIPIENT.length === 42
}

export const isUSDCConfigured = (): boolean => {
  return typeof USDC_ADDRESS === "string" && USDC_ADDRESS.startsWith("0x") && USDC_ADDRESS.length === 42
}
