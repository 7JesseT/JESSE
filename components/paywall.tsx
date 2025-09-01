"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Unlock, ExternalLink } from "lucide-react"

const PAYWALL_PRICE = process.env.NEXT_PUBLIC_PAYWALL_PRICE || "0.001"
const PAYWALL_ADDRESS = process.env.NEXT_PUBLIC_TIP_ADDRESS as `0x${string}`

export function Paywall() {
  const [hasPaid, setHasPaid] = useState(false)
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handlePayment = async () => {
    if (!isConnected) return

    try {
      writeContract({
        address: PAYWALL_ADDRESS,
        abi: [],
        functionName: "transfer",
        value: parseEther(PAYWALL_PRICE),
      })
    } catch (error) {
      console.error("Payment failed:", error)
    }
  }

  // Set paid status when transaction succeeds
  if (isSuccess && !hasPaid) {
    setHasPaid(true)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasPaid ? <Unlock className="h-5 w-5 text-green-500" /> : <Lock className="h-5 w-5 text-orange-500" />}
          Premium Content
        </CardTitle>
        <CardDescription>Pay {PAYWALL_PRICE} ETH to unlock exclusive content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPaid ? (
          <>
            <div className="text-center space-y-2">
              <Lock className="h-12 w-12 mx-auto text-orange-500" />
              <h3 className="font-medium">Content Locked</h3>
              <p className="text-sm text-muted-foreground">This premium content is protected by a paywall</p>
            </div>

            <Button onClick={handlePayment} disabled={!isConnected || isPending || isConfirming} className="w-full">
              {isPending || isConfirming ? "Processing..." : `Pay ${PAYWALL_PRICE} ETH to Unlock`}
            </Button>

            {isSuccess && hash && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">Payment successful! Content unlocked.</p>
                <a
                  href={`https://sepolia.basescan.org/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View on Basescan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-4">
            <Unlock className="h-12 w-12 mx-auto text-green-500" />
            <div className="space-y-2">
              <h3 className="font-medium text-green-700 dark:text-green-300">Content Unlocked!</h3>
              <div className="p-4 bg-muted rounded-lg text-left">
                <h4 className="font-medium mb-2">🎉 Premium Content</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Welcome to the exclusive content! Here's what you get:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Advanced onchain interaction tutorials</li>
                  <li>• Early access to new Base features</li>
                  <li>• Exclusive community Discord access</li>
                  <li>• Weekly alpha calls with the team</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {!isConnected && (
          <p className="text-sm text-muted-foreground text-center">Connect your wallet to access premium content</p>
        )}
      </CardContent>
    </Card>
  )
}
