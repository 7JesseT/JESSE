"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { config } from "@/lib/wagmi"
import { useState, useEffect } from "react"
import { useWalletPersistence } from "@/hooks/use-wallet-persistence"
import { I18nextProvider } from "react-i18next"
import i18n from "@/lib/i18n"

/**
 * Wallet Persistence Wrapper
 * Handles automatic wallet reconnection on app load
 */
function WalletPersistenceWrapper({ children }: { children: React.ReactNode }) {
  useWalletPersistence()
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [mounted, setMounted] = useState(false)

  // Ensure we're mounted on the client side before rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <I18nextProvider i18n={i18n}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <WalletPersistenceWrapper>
            {children}
          </WalletPersistenceWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </I18nextProvider>
  )
}
