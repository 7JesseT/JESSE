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
  Link,
  AlertCircle
} from "lucide-react"
import { formatAddress } from "@/lib/utils"
import { getCurrentNetworkConfig } from "@/lib/networks"

export function WalletConnection() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
  const [connectionError, setConnectionError] = useState<string>("")

  // Check if MetaMask is installed and handle connection errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMetaMaskInstalled(!!window.ethereum?.isMetaMask)
      
      // Check for common connection issues
      if (!window.ethereum) {
        setConnectionError("No wallet detected. Please install MetaMask or another Web3 wallet.")
      } else if (!window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
        setConnectionError("Unsupported wallet detected. Please use MetaMask or Coinbase Wallet.")
      }
    }
  }, [])

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      console.error("Wallet connection error:", connectError)
      setConnectionError(connectError.message || "Failed to connect wallet")
    }
  }, [connectError])

  const handleConnectMetaMask = async () => {
    setConnectionError("")
    const metaMaskConnector = connectors.find(c => c.id === "metaMask")
    if (metaMaskConnector) {
      try {
        await connect({ connector: metaMaskConnector })
      } catch (error) {
        console.error("Failed to connect MetaMask:", error)
        setConnectionError("Failed to connect MetaMask. Please try again.")
      }
    } else {
      setConnectionError("MetaMask connector not available")
    }
  }

  const handleConnectWalletConnect = async () => {
    setConnectionError("")
    const walletConnectConnector = connectors.find(c => c.id === "walletConnect")
    if (walletConnectConnector) {
      try {
        await connect({ connector: walletConnectConnector })
      } catch (error) {
        console.error("Failed to connect WalletConnect:", error)
        setConnectionError("Failed to connect WalletConnect. Please try again.")
      }
    } else {
      setConnectionError("WalletConnect connector not available")
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
    setConnectionError("")
    disconnect()
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-2">
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
        
        {/* Show connection errors */}
        {connectionError && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 max-w-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs">{connectionError}</span>
          </div>
        )}
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
