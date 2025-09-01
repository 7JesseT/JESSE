import { baseSepolia } from "viem/chains"

export const onchainKitConfig = {
  apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
  chain: baseSepolia,
  config: {
    appearance: {
      mode: "auto" as const,
      theme: "default" as const,
    },
  },
}
