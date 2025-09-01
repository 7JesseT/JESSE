"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ExternalLink, Heart } from "lucide-react"

const TIP_ADDRESS = process.env.NEXT_PUBLIC_TIP_ADDRESS as `0x${string}`

export function TipJar() {
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleTip = async () => {
    if (!amount || !isConnected) return

    try {
      writeContract({
        address: TIP_ADDRESS,
        abi: [],
        functionName: "transfer",
        value: parseEther(amount),
      })
    } catch (error) {
      console.error("Tip failed:", error)
    }
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
        <div className="space-y-2">
          <Label htmlFor="tip-amount">Amount (ETH)</Label>
          <Input
            id="tip-amount"
            type="number"
            step="0.001"
            placeholder="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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

        <Button onClick={handleTip} disabled={!isConnected || !amount || isPending || isConfirming} className="w-full">
          {isPending || isConfirming ? "Sending..." : "Send Tip"}
        </Button>

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

        {!isConnected && <p className="text-sm text-muted-foreground text-center">Connect your wallet to send tips</p>}
      </CardContent>
    </Card>
  )
}
