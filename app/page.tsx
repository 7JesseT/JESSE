import { Header } from "@/components/header"
import { TipJar } from "@/components/tip-jar"
import { MintAttendance } from "@/components/mint-attendance"
import { Paywall } from "@/components/paywall"
import { PayPerFile } from "@/components/pay-per-file"
import { DailyFeatures } from "@/components/daily-features"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Base Daily</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your daily onchain interactions on Base Sepolia. Tip creators, mint attendance NFTs, access premium
            content, purchase files, and enjoy daily feature updates with automatic transactions.
          </p>
          <div className="flex justify-center">
            <Link href="/checkout">
              <Button size="lg" className="mt-4">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Creator Checkout
              </Button>
            </Link>
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
      </main>
    </div>
  )
}
