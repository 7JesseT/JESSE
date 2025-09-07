'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Header } from '@/components/header';
import { CheckoutCard } from '@/components/checkout-card';
import { getAllAssets } from '@/lib/assets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ShoppingCart } from 'lucide-react';

export default function CheckoutPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [assets] = useState(getAllAssets());

  const handlePurchaseSuccess = (txHash: string, receiptId: string) => {
    // Redirect to receipt page
    router.push(`/receipt/${receiptId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Creator Checkout
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Purchase digital assets and get instant access with shareable receipts
            </p>
          </div>

          {/* Wallet Connection Prompt */}
          {!isConnected && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Your Wallet
                </CardTitle>
                <CardDescription>
                  Connect your wallet to purchase digital assets and view your receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/')} className="w-full">
                  Go to Home to Connect Wallet
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Assets Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Available Assets
              </h2>
              <div className="flex items-center text-sm text-muted-foreground">
                <ShoppingCart className="h-4 w-4 mr-1" />
                {assets.length} items
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <CheckoutCard
                  key={asset.id}
                  asset={asset}
                  onPurchaseSuccess={handlePurchaseSuccess}
                />
              ))}
            </div>
          </div>

          {/* Info Section */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-1">Connect Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to Base Sepolia network
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-1">Pay with USDC</h3>
                  <p className="text-sm text-muted-foreground">
                    Send USDC payment to complete your purchase
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-1">Get Receipt</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive a shareable receipt with Basescan link
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
