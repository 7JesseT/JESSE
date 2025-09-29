'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useTranslation } from "react-i18next"

interface HomePageClientProps {
  TipJar: React.ComponentType
  MintAttendance: React.ComponentType
  Paywall: React.ComponentType
  PayPerFile: React.ComponentType
  DailyFeatures: React.ComponentType
  WalletTestCard: React.ComponentType
  NotificationDemo: React.ComponentType
}

export function HomePageClient({
  TipJar,
  MintAttendance,
  Paywall,
  PayPerFile,
  DailyFeatures,
  WalletTestCard,
  NotificationDemo,
}: HomePageClientProps) {
  const { t } = useTranslation()

  return (
    <>
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">{t('home.title')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('home.description')}
        </p>
        <div className="flex justify-center">
          <Link href="/checkout">
            <Button size="lg" className="mt-4">
              <ShoppingCart className="h-5 w-5 mr-2" />
              {t('home.checkout')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Wallet Connection Test */}
      <section className="flex justify-center">
        <WalletTestCard />
      </section>

      {/* Notification System Demo */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
          Notification System Demo
        </h2>
        <div className="flex justify-center">
          <NotificationDemo />
        </div>
      </section>

      {/* Daily Features Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
          Daily Features & Operations
        </h2>
        <DailyFeatures />
      </section>

      {/* Existing Features */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
          Onchain Interactions
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          <TipJar />
          <MintAttendance />
          <Paywall />
          <PayPerFile />
        </div>
      </section>
    </>
  )
}
