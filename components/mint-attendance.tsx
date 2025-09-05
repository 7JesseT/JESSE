"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge, ExternalLink, Copy } from "lucide-react"
import QRCode from "react-qr-code"

export function MintAttendance() {
  const [isMinting, setIsMinting] = useState(false)
  const [mintSuccess, setMintSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [remaining, setRemaining] = useState<number>(50)
  const { address, isConnected } = useAccount()

  useEffect(() => {
    fetch("/data/mints.json")
      .then((res) => res.json())
      .then((mints) => {
        const count = mints.filter((m: any) => m.event === "week1").length
        setRemaining(50 - count)
      })
  }, [mintSuccess])

  const handleMint = async () => {
    if (!isConnected || !address) return
    setIsMinting(true)
    try {
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: address, tokenId: 1, amount: 1, event: "week1" }),
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

  const handleCopy = async () => {
    if (txHash) await navigator.clipboard.writeText(txHash)
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
          <div className="w-24 h-24 mx-auto flex items-center justify-center">
            <QRCode value="/api/mint?event=week1" size={96} />
          </div>
          <h3 className="font-medium">Daily Attendance NFT</h3>
          <p className="text-sm text-muted-foreground">Proof of your Base Daily interaction</p>
          <div className="text-sm mt-2">{remaining} of 50 mints left</div>
        </div>
        <Button onClick={handleMint} disabled={!isConnected || isMinting || mintSuccess || remaining <= 0} className="w-full">
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
            <Button size="icon" variant="outline" onClick={handleCopy} aria-label="Copy tx hash" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!isConnected && <p className="text-sm text-muted-foreground text-center">Connect your wallet to mint NFT</p>}
        {remaining <= 0 && <p className="text-sm text-red-600 text-center">Mint limit reached for this event.</p>}
      </CardContent>
    </Card>
  )
}
