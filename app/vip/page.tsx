"use client"

import { useEffect, useState } from "react"
import { useAccount, useContractRead } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Gift } from "lucide-react"
import { erc1155Abi } from "@/lib/contracts"
import { CONTRACTS } from "@/lib/contracts"
import { getCurrentNetworkConfig } from "@/lib/networks"
import { toast } from "sonner"

// VIP Pass NFT ID - this should match what's configured in your contract
const VIP_PASS_ID = 1

// Allow VIP access without wallet connection (useful for Vercel deployment issues)
const ALLOW_VIP_WITHOUT_WALLET = process.env.NEXT_PUBLIC_ALLOW_VIP_WITHOUT_WALLET === "true"

export default function VipPage() {
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(true)
  const [isMinting, setIsMinting] = useState(false)
  const [ownsVipPass, setOwnsVipPass] = useState(false)
  const [balance, setBalance] = useState(0)

  const { isConnected, address } = useAccount()
  const networkConfig = getCurrentNetworkConfig()

  // Check VIP Pass ownership
  const { data: vipBalance, refetch: refetchVipBalance } = useContractRead({
    address: CONTRACTS.VIP || CONTRACTS.ATTENDANCE,
    abi: erc1155Abi,
    functionName: "balanceOf",
    args: address ? [address, BigInt(VIP_PASS_ID)] : undefined,
    chainId: networkConfig.chain.id,
    enabled: !!address && !!(CONTRACTS.VIP || CONTRACTS.ATTENDANCE) && !ALLOW_VIP_WITHOUT_WALLET,
  })

  useEffect(() => {
    // If bypass is enabled, grant VIP access immediately
    if (ALLOW_VIP_WITHOUT_WALLET) {
      setOwnsVipPass(true)
      setBalance(1) // Simulate having 1 VIP pass
      setIsCheckingOwnership(false)
      console.log("VIP access granted via bypass mode (no wallet required)")
      return
    }

    if (vipBalance !== undefined) {
      const balanceNumber = Number(vipBalance)
      setBalance(balanceNumber)
      setOwnsVipPass(balanceNumber > 0)
      setIsCheckingOwnership(false)
      
      console.log(`VIP NFT Check - Wallet: ${address}, Balance: ${balanceNumber}, Owns VIP: ${balanceNumber > 0}`)
    }
  }, [vipBalance, address])

  const handleMintVipPass = async () => {
    if (!address) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsMinting(true)
    console.log(`VIP Mint Attempt - Wallet: ${address}, Token ID: ${VIP_PASS_ID}`)

    try {
      const response = await fetch('/api/mint-vip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: address,
          tokenId: VIP_PASS_ID,
          amount: 1
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("VIP Pass minted successfully! 🎉")
        console.log(`VIP Mint Success - Wallet: ${address}, TX: ${result.txHash}`)
        
        // Refetch balance to update UI
        setTimeout(() => {
          refetchVipBalance()
        }, 2000)
      } else {
        toast.error(result.error || "Failed to mint VIP Pass")
        console.error(`VIP Mint Failed - Wallet: ${address}, Error: ${result.error}`)
      }
    } catch (error) {
      console.error(`VIP Mint Error - Wallet: ${address}, Error:`, error)
      toast.error("Failed to mint VIP Pass")
    } finally {
      setIsMinting(false)
    }
  }

  // Only require wallet connection if bypass is not enabled
  if (!isConnected && !ALLOW_VIP_WITHOUT_WALLET) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              VIP Area
            </CardTitle>
            <CardDescription>
              Connect your wallet to access VIP content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Please connect your wallet to check VIP access
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isCheckingOwnership) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              VIP Area
            </CardTitle>
            <CardDescription>
              Checking VIP access...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            VIP Area
            {ownsVipPass && (
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                VIP Member
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {ownsVipPass 
              ? ALLOW_VIP_WITHOUT_WALLET 
                ? "Welcome to the exclusive VIP area! (Bypass mode active)" 
                : "Welcome to the exclusive VIP area!"
              : "Get VIP access by minting a VIP Pass NFT"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ownsVipPass ? (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-primary">Secret VIP Content</h2>
              <p className="text-muted-foreground">
                {ALLOW_VIP_WITHOUT_WALLET 
                  ? "VIP access granted via bypass mode - enjoy exclusive content!"
                  : `Congratulations! You own ${balance} VIP Pass${balance > 1 ? 'es' : ''} and have access to exclusive content.`
                }
              </p>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-semibold mb-2">🎁 VIP Benefits</h3>
                <ul className="text-left space-y-2 text-sm">
                  <li>• Access to exclusive VIP-only features</li>
                  <li>• Priority support and updates</li>
                  <li>• Special NFT drops and rewards</li>
                  <li>• Early access to new features</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-6xl">🔒</div>
              <h2 className="text-2xl font-bold">VIP Access Required</h2>
              <p className="text-muted-foreground">
                You need a VIP Pass NFT to access this exclusive content.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Mint a VIP Pass NFT to unlock:
                </p>
                <ul className="text-left space-y-1 text-sm">
                  <li>• Secret VIP content and features</li>
                  <li>• Exclusive NFT drops</li>
                  <li>• Special rewards and benefits</li>
                </ul>
              </div>
              <Button 
                onClick={handleMintVipPass} 
                disabled={isMinting}
                className="w-full"
                size="lg"
              >
                <Gift className="h-4 w-4 mr-2" />
                {isMinting ? "Minting VIP Pass..." : "Mint VIP Pass"}
              </Button>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground text-center">
            {ALLOW_VIP_WITHOUT_WALLET ? (
              <>
                Bypass Mode Active | 
                Network: {networkConfig.name} | 
                Contract: {(CONTRACTS.VIP || CONTRACTS.ATTENDANCE)?.slice(0, 6)}...{(CONTRACTS.VIP || CONTRACTS.ATTENDANCE)?.slice(-4)}
              </>
            ) : (
              <>
                Wallet: {address?.slice(0, 6)}...{address?.slice(-4)} | 
                Network: {networkConfig.name} | 
                Contract: {(CONTRACTS.VIP || CONTRACTS.ATTENDANCE)?.slice(0, 6)}...{(CONTRACTS.VIP || CONTRACTS.ATTENDANCE)?.slice(-4)}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
