import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "./providers"
import { Suspense } from "react"

// Runtime safety check for mainnet configuration
if (typeof window === 'undefined') {
  const defaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK
  const paywallRecipient = process.env.NEXT_PUBLIC_PAYWALL_RECIPIENT
  const confirmMainnet = process.env.CONFIRM_MAINNET

  if (defaultNetwork === 'mainnet' && paywallRecipient && confirmMainnet !== 'true') {
    console.warn('⚠️  WARNING: Running on mainnet with paywall recipient but CONFIRM_MAINNET is not set to true!')
    console.warn('   This could result in real funds being sent to the paywall recipient.')
    console.warn('   Set CONFIRM_MAINNET=true in your environment to confirm this is intentional.')
  }
}

export const metadata: Metadata = {
  title: "Base Daily - Onchain Interactions",
  description: "Daily onchain interactions on Base Sepolia - tip, mint, and access premium content",
  generator: "v0.app",
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
