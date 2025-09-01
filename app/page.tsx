import { Header } from "@/components/header"
import { TipJar } from "@/components/tip-jar"
import { MintAttendance } from "@/components/mint-attendance"
import { Paywall } from "@/components/paywall"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Base Daily</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your daily onchain interactions on Base Sepolia. Tip creators, mint attendance NFTs, and access premium
            content.
          </p>
        </section>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <TipJar />
          <MintAttendance />
          <Paywall />
        </div>
      </main>
    </div>
  )
}
