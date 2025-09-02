"use client"

import { useState } from "react"
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, isAddress } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ExternalLink, Heart } from "lucide-react"

const TIP_ADDRESS = process.env.NEXT_PUBLIC_TIP_ADDRESS as `0x${string}` | undefined

export function TipJar() {
  const [amount, setAmount] = useState("0.001")
  const [message, setMessage] = useState("")
  const { address, isConnected } = useAccount()
  const { sendTransaction, data: hash, isPending } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isValidTo = typeof TIP_ADDRESS === "string" && isAddress(TIP_ADDRESS)

  const handleTip = async () => {
    if (!isConnected) return
    const numeric = Number(amount)
    if (!amount || Number.isNaN(numeric) || numeric <= 0) return

    try {
      if (!isValidTo) {
        console.error("Invalid or missing NEXT_PUBLIC_TIP_ADDRESS")
        return
      }
      // Send native ETH directly to the tip address
      sendTransaction({
        to: TIP_ADDRESS as `0x${string}`,
        value: parseEther(amount),
      })
    } catch (error) {
      console.error("Tip failed:", error)
    }
  }

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    handleTip()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Tip Jar
        </CardTitle>
        <CardDescription>Send ETH tips to creators on Base Sepolia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tip-amount">Amount (ETH)</Label>
            <Input
              id="tip-amount"
              type="number"
              step="0.001"
              placeholder="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tip-message">Message (optional)</Label>
            <Input
              id="tip-message"
              placeholder="Thanks for the great content!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={!isConnected || !amount || !isValidTo || isPending || isConfirming} className="w-full">
            {isPending || isConfirming ? "Sending..." : "Send Tip"}
          </Button>
        </form>

        {isSuccess && hash && (
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200 mb-2">Tip sent successfully!</p>
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

        {!isConnected && (
          <div className="flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">Connect your wallet to send tips</p>
          </div>
        )}

        {!isValidTo && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Tip address is not configured. Set <code className="font-mono">NEXT_PUBLIC_TIP_ADDRESS</code> in your environment (e.g., <code className="font-mono">.env.local</code>) to a valid 0x address.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
