"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, ExternalLink } from "lucide-react"

export function MintAttendance() {
  const [isMinting, setIsMinting] = useState(false)
  const [mintSuccess, setMintSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const { address, isConnected } = useAccount()

  const handleMint = async () => {
    if (!isConnected || !address) return

    setIsMinting(true)
    try {
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: address,
          tokenId: 1,
          amount: 1,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTxHash(data.txHash)
        setMintSuccess(true)
      } else {
        throw new Error(data.error || "Minting failed")
      }
    } catch (error) {
      console.error("Minting failed:", error)
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge className="h-5 w-5 text-purple-500" />
          Mint Attendance
        </CardTitle>
        <CardDescription>Mint your daily attendance NFT (ERC-1155)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Badge className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-medium">Daily Attendance NFT</h3>
          <p className="text-sm text-muted-foreground">Proof of your Base Daily interaction</p>
        </div>

        <Button onClick={handleMint} disabled={!isConnected || isMinting || mintSuccess} className="w-full">
          {isMinting ? "Minting..." : mintSuccess ? "Minted!" : "Mint NFT"}
        </Button>

        {mintSuccess && txHash && (
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200 mb-2">NFT minted successfully!</p>
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View on Basescan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {!isConnected && <p className="text-sm text-muted-foreground text-center">Connect your wallet to mint NFT</p>}
      </CardContent>
    </Card>
  )
}
