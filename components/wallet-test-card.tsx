"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function WalletTestCard() {
  const { address, isConnected, connector } = useAccount()
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMetaMaskInstalled(!!window.ethereum?.isMetaMask)
    }
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Wallet Connection Test</CardTitle>
        <CardDescription>
          Testing MetaMask-first wallet connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">MetaMask Installed:</span>
            <Badge variant={isMetaMaskInstalled ? "default" : "secondary"}>
              {isMetaMaskInstalled ? "Yes" : "No"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Connection Status:</span>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
          
          {connector && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Connector:</span>
              <Badge variant="outline">{connector.name}</Badge>
            </div>
          )}
          
          {address && (
            <div className="space-y-1">
              <span className="text-sm font-medium">Address:</span>
              <div className="text-sm font-mono bg-muted p-2 rounded">
                {address}
              </div>
            </div>
          )}
        </div>
        
        {address === "0x29E2481F55Ac8fb3f7c223E018688D98a514fCca" && (
          <div className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Test address detected! MetaMask connection working correctly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
