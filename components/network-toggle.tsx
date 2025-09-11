"use client"

import { useState, useEffect } from "react"
import { useAccount, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  NetworkType, 
  getCurrentNetworkConfig, 
  setNetworkPreference, 
  isMainnetConfirmed,
  getWagmiChains 
} from "@/lib/networks"
import { MainnetConfirmModal } from "@/components/mainnet-confirm-modal"
import { AlertTriangle, CheckCircle, Wifi, WifiOff } from "lucide-react"

interface NetworkToggleProps {
  onNetworkChange?: (network: NetworkType) => void
  showLabel?: boolean
  compact?: boolean
}

export function NetworkToggle({ onNetworkChange, showLabel = true, compact = false }: NetworkToggleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("sepolia")
  const [showMainnetModal, setShowMainnetModal] = useState(false)
  const [pendingNetwork, setPendingNetwork] = useState<NetworkType | null>(null)

  const { chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const chains = getWagmiChains()

  // Initialize network from sessionStorage or default
  useEffect(() => {
    const config = getCurrentNetworkConfig()
    setSelectedNetwork(config.type)
  }, [])

  // Check if wallet is on the correct network
  const isWalletOnCorrectNetwork = () => {
    if (!isConnected || !chainId) return false
    const config = getCurrentNetworkConfig()
    return chainId === config.chain.id
  }

  const handleNetworkToggle = async (checked: boolean) => {
    const newNetwork: NetworkType = checked ? "mainnet" : "sepolia"
    
    // If switching to mainnet, check if confirmation is required
    if (newNetwork === "mainnet" && !isMainnetConfirmed()) {
      setPendingNetwork(newNetwork)
      setShowMainnetModal(true)
      return
    }

    await switchToNetwork(newNetwork)
  }

  const switchToNetwork = async (network: NetworkType) => {
    try {
      const config = getCurrentNetworkConfig()
      const targetChain = network === "mainnet" ? chains[1] : chains[0] // base or baseSepolia
      
      // Update local state
      setSelectedNetwork(network)
      setNetworkPreference(network)
      
      // Switch wallet network if connected
      if (isConnected && switchChain) {
        await switchChain({ chainId: targetChain.id })
      }
      
      // Notify parent component
      onNetworkChange?.(network)
    } catch (error) {
      console.error("Failed to switch network:", error)
      // Revert local state on error
      setSelectedNetwork(selectedNetwork)
    }
  }

  const handleMainnetConfirm = () => {
    if (pendingNetwork) {
      switchToNetwork(pendingNetwork)
      setPendingNetwork(null)
    }
  }

  const getNetworkBadge = () => {
    const config = getCurrentNetworkConfig()
    const isCorrectNetwork = isWalletOnCorrectNetwork()
    
    return (
      <Badge 
        variant={config.isTestnet ? "secondary" : "default"}
        className={`flex items-center gap-1 ${
          config.isTestnet 
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        }`}
      >
        {isCorrectNetwork ? (
          <CheckCircle className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {config.name}
        {config.isTestnet && " (testnet)"}
      </Badge>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getNetworkBadge()}
        <div className="flex items-center gap-2">
          <Switch
            checked={selectedNetwork === "mainnet"}
            onCheckedChange={handleNetworkToggle}
            disabled={!isConnected}
          />
          <span className="text-sm text-muted-foreground">
            {selectedNetwork === "mainnet" ? "Mainnet" : "Sepolia"}
          </span>
        </div>
        <MainnetConfirmModal
          open={showMainnetModal}
          onOpenChange={setShowMainnetModal}
          onConfirm={handleMainnetConfirm}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {showLabel && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Network</Label>
          {getNetworkBadge()}
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={selectedNetwork === "mainnet"}
            onCheckedChange={handleNetworkToggle}
            disabled={!isConnected}
          />
          <span className="text-sm">
            {selectedNetwork === "mainnet" ? "Mainnet" : "Sepolia"}
          </span>
        </div>
        
        {selectedNetwork === "mainnet" && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            REAL FUNDS
          </Badge>
        )}
      </div>

      {!isWalletOnCorrectNetwork() && isConnected && (
        <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            ⚠️ Wallet network doesn't match selected network. Switch your wallet or use the toggle above.
          </p>
        </div>
      )}

      {!isConnected && (
        <div className="p-2 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            Connect wallet to switch networks
          </p>
        </div>
      )}

      <MainnetConfirmModal
        open={showMainnetModal}
        onOpenChange={setShowMainnetModal}
        onConfirm={handleMainnetConfirm}
      />
    </div>
  )
}
