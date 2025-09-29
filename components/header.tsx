"use client"

import { WalletConnection } from "@/components/wallet-connection"
import { NetworkToggle } from "@/components/network-toggle"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { LanguageSwitcher } from "@/components/language-switcher"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, Receipt, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

export function Header() {
  const { t } = useTranslation()
  
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BD</span>
              </div>
               <h1 className="text-xl font-semibold text-foreground">Base Daily</h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  {t('nav.transactions')}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {t('nav.orders')}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/shipments" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('nav.shipments')}
                </Link>
              </Button>
            </div>
            <LanguageSwitcher />
            <NotificationDropdown />
            <NetworkToggle compact />
            <WalletConnection />
          </div>
        </div>
      </div>
    </header>
  )
}
