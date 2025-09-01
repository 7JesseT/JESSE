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
    walletConnect({ projectId }),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
