"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut,
  Link
} from "lucide-react"
import { formatAddress } from "@/lib/utils"
import { getCurrentNetworkConfig } from "@/lib/networks"

export function WalletConnection() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)

  // Check if MetaMask is installed
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMetaMaskInstalled(!!window.ethereum?.isMetaMask)
    }
  }, [])

  const handleConnectMetaMask = async () => {
    const metaMaskConnector = connectors.find(c => c.id === "metaMask")
    if (metaMaskConnector) {
      try {
        await connect({ connector: metaMaskConnector })
      } catch (error) {
        console.error("Failed to connect MetaMask:", error)
      }
    }
  }

  const handleConnectWalletConnect = async () => {
    const walletConnectConnector = connectors.find(c => c.id === "walletConnect")
    if (walletConnectConnector) {
      try {
        await connect({ connector: walletConnectConnector })
      } catch (error) {
        console.error("Failed to connect WalletConnect:", error)
      }
    }
  }

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
      } catch (error) {
        console.error("Failed to copy address:", error)
      }
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2">
        {isMetaMaskInstalled ? (
          <Button onClick={handleConnectMetaMask} className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Connect MetaMask
          </Button>
        ) : (
          <Button onClick={handleConnectMetaMask} variant="outline" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Connect MetaMask
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleConnectWalletConnect}>
              <Link className="h-4 w-4 mr-2" />
              WalletConnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {formatAddress(address || "")}
          </span>
          <Badge variant="secondary" className="text-xs">
            {connector?.name || "Connected"}
          </Badge>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4" />
            <span className="font-medium">{connector?.name || "Wallet"}</span>
          </div>
          <div className="text-sm text-muted-foreground font-mono">
            {address}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a 
            href={`${getCurrentNetworkConfig().explorerUrl}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Basescan
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
