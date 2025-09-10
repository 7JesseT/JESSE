"use client"

import { WalletConnection } from "@/components/wallet-connection"

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BD</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Base Daily</h1>
          </div>

          <div className="flex items-center space-x-4">
            <WalletConnection />
          </div>
        </div>
      </div>
    </header>
  )
}
