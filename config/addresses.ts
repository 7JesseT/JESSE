export const DEFAULT_RECIPIENT = (process.env.NEXT_PUBLIC_TIP_ADDRESS || "") as `0x${string}` | "";

// Prefer explicit env; allow empty string to indicate not configured
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "") as `0x${string}` | "";

export const BASESCAN_TX_URL = (txHash: string) => `https://sepolia.basescan.org/tx/${txHash}`;

export type SupportedCurrency = "ETH" | "USDC";
