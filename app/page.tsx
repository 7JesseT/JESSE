import { Header } from "@/components/header"
import { TipJar } from "@/components/tip-jar"
import { MintAttendance } from "@/components/mint-attendance"
import { Paywall } from "@/components/paywall"
import { PayPerFile } from "@/components/pay-per-file"
import { DailyFeatures } from "@/components/daily-features"
import { WalletTestCard } from "@/components/wallet-test-card"
import { NotificationDemo } from "@/components/notifications/notification-demo"
import { HomePageClient } from "@/components/home-page-client"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-12">
        <HomePageClient 
          TipJar={TipJar}
          MintAttendance={MintAttendance}
          Paywall={Paywall}
          PayPerFile={PayPerFile}
          DailyFeatures={DailyFeatures}
          WalletTestCard={WalletTestCard}
          NotificationDemo={NotificationDemo}
        />
      </main>
    </div>
  )
}
