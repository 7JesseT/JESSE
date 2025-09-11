"use client"

import { useEffect, useMemo, useState } from "react"
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract, useBalance, useContractRead } from "wagmi"
import { parseEther, parseUnits, isAddress, formatEther, formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Copy, Heart, Gift } from "lucide-react"
import { USDC_ADDRESS, BASESCAN_TX_URL, type SupportedCurrency } from "@/config/addresses"
import { RECIPIENTS, getRecipientAddress } from "@/config/recipients"
import { saveTipTransaction, type TipTransaction } from "@/lib/tips-tracking"
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet"
import { NetworkToggle } from "@/components/network-toggle"
import { MainnetConfirmModal } from "@/components/mainnet-confirm-modal"
import { getCurrentNetworkConfig, isMainnetConfirmed, NetworkType } from "@/lib/networks"

type StoredTx = {
  txHash: string
  amount: number
  currency: SupportedCurrency
  recipient: string
  timestamp: string
}

type InvitePrefill = {
  recipientId: string
  currency: SupportedCurrency
  amount: string
  token: string
}

const STORAGE_KEY = "baseDaily:txs"
const INVITE_PREFILL_KEY = "baseDaily:invitePrefill"

const erc20Abi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const

// Detect if we're in an in-app browser
const isInAppBrowser = () => {
  if (typeof window === "undefined") return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const isBaseApp = userAgent.includes("base")
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  
  return isBaseApp || isStandalone
}

export function MiniTipJar() {
  const [currency, setCurrency] = useState<SupportedCurrency>("ETH")
  const [amount, setAmount] = useState("0.5")
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(RECIPIENTS[0]?.id || "")
  const [error, setError] = useState<string>("")
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [invitePrefill, setInvitePrefill] = useState<InvitePrefill | null>(null)
  const [showReceipts, setShowReceipts] = useState(false)
  const [latest, setLatest] = useState<StoredTx[]>([])
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>("sepolia")
  const [showMainnetModal, setShowMainnetModal] = useState(false)

  const { isConnected, chainId, address } = useAccount()
  const { sendTransaction, data: ethHash, isPending: isSendingEth } = useSendTransaction()
  const { isLoading: isConfirmingEth, isSuccess: isEthSuccess } = useWaitForTransactionReceipt({ hash: ethHash })
  const { writeContract, data: usdcHash, isPending: isSendingUsdc } = useWriteContract()
  const { isLoading: isConfirmingUsdc, isSuccess: isUsdcSuccess } = useWaitForTransactionReceipt({ hash: usdcHash })

  // Balance checking
  const { data: ethBalance } = useBalance({
    address,
    chainId: getCurrentNetworkConfig().chain.id,
  })

  const { data: usdcBalance } = useContractRead({
    address: USDC_ADDRESS as `0x${string}`,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: getCurrentNetworkConfig().chain.id,
  })

  const selectedRecipient = RECIPIENTS.find(r => r.id === selectedRecipientId)
  const recipientAddress = selectedRecipient ? getRecipientAddress(selectedRecipientId, currency) : undefined
  const isValidRecipient = useMemo(() => recipientAddress && isAddress(recipientAddress), [recipientAddress])
  const numericAmount = Number(amount)
  const isAmountValid = !Number.isNaN(numericAmount) && numericAmount > 0
  const isUsdcConfigured = typeof USDC_ADDRESS === "string" && USDC_ADDRESS.length === 42 && isAddress(USDC_ADDRESS)
  const isLoading = isSendingEth || isSendingUsdc || isConfirmingEth || isConfirmingUsdc
  const inAppBrowser = isInAppBrowser()

  // Network configuration
  const networkConfig = getCurrentNetworkConfig()
  const isMainnet = currentNetwork === "mainnet"
  const isMainnetConfirmedFlag = isMainnetConfirmed()

  // Balance checking for mainnet
  const ethBalanceFormatted = ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0
  const usdcBalanceFormatted = usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)) : 0
  
  // Conservative estimate: $2 worth of ETH (assuming $2000/ETH)
  const minEthBalance = 0.001 // ~$2 at $2000/ETH
  const hasLowBalance = isMainnet && ethBalanceFormatted < minEthBalance
  const hasLowUsdcBalance = isMainnet && currency === "USDC" && usdcBalanceFormatted < 2

  // Initialize network from sessionStorage
  useEffect(() => {
    const config = getCurrentNetworkConfig()
    setCurrentNetwork(config.type)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: StoredTx[] = raw ? JSON.parse(raw) : []
      setLatest(list.slice(-3).reverse())
    } catch {}
  }, [isEthSuccess, isUsdcSuccess])

  // Handle invite prefill
  useEffect(() => {
    try {
      const prefillRaw = localStorage.getItem(INVITE_PREFILL_KEY)
      if (prefillRaw) {
        const prefill: InvitePrefill = JSON.parse(prefillRaw)
        setInvitePrefill(prefill)
        
        // Apply prefill values
        setSelectedRecipientId(prefill.recipientId)
        setCurrency(prefill.currency)
        setAmount(prefill.amount)
        
        // Clear prefill from localStorage
        localStorage.removeItem(INVITE_PREFILL_KEY)
      }
    } catch (error) {
      console.error('Error handling invite prefill:', error)
    }
  }, [])

  useEffect(() => {
    const h = ethHash || usdcHash
    if (h) setTxHash(h)
  }, [ethHash, usdcHash])

  const saveTx = async (hash: string) => {
    try {
      const entry: StoredTx = {
        txHash: hash,
        amount: numericAmount,
        currency,
        recipient: recipientAddress || "",
        timestamp: new Date().toISOString(),
      }
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: StoredTx[] = raw ? JSON.parse(raw) : []
      list.push(entry)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      setLatest(list.slice(-3).reverse())

      // Save to new tips tracking system
      if (selectedRecipient) {
        const tipTransaction: TipTransaction = {
          txHash: hash,
          amount: numericAmount,
          currency,
          recipientId: selectedRecipientId,
          recipientName: selectedRecipient.name,
          timestamp: new Date().toISOString(),
        }
        saveTipTransaction(tipTransaction)
      }

      // If this was from an invite, mark the invite as used
      if (invitePrefill) {
        try {
          const response = await fetch('/api/invite/use', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: invitePrefill.token,
              txHash: hash,
              walletAddress: address || 'unknown'
            }),
          })

          if (response.ok) {
            // Clear the invite prefill state
            setInvitePrefill(null)
          }
        } catch (error) {
          console.error('Failed to mark invite as used:', error)
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (isEthSuccess && ethHash) saveTx(ethHash)
  }, [isEthSuccess, ethHash])

  useEffect(() => {
    if (isUsdcSuccess && usdcHash) saveTx(usdcHash)
  }, [isUsdcSuccess, usdcHash])

  const handleSend = async () => {
    setError("")
    if (!isConnected) {
      setError("Please connect your wallet")
      return
    }
    if (!isValidRecipient || !recipientAddress) {
      setError("Recipient address is invalid or not configured")
      return
    }
    if (!isAmountValid) {
      setError("Enter a valid amount greater than 0")
      return
    }

    // Mainnet safety checks
    if (isMainnet) {
      if (!isMainnetConfirmedFlag) {
        setShowMainnetModal(true)
        return
      }
      
      if (hasLowBalance) {
        setError("Low balance — sending on mainnet requires at least $2 for gas. Type CONFIRM MAINNET to enable.")
        return
      }
      
      if (hasLowUsdcBalance) {
        setError("Insufficient USDC balance for mainnet transaction")
        return
      }
    }

    try {
      if (currency === "ETH") {
        sendTransaction({ to: recipientAddress, value: parseEther(amount) })
      } else {
        if (!isUsdcConfigured) {
          setError("USDC not configured — set NEXT_PUBLIC_USDC_ADDRESS or use ETH")
          return
        }
        writeContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipientAddress, parseUnits(amount, 6)],
        })
      }
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Transaction failed")
    }
  }

  const disabled = !isConnected || !isValidRecipient || !isAmountValid || isLoading || (currency === "USDC" && !isUsdcConfigured) || (isMainnet && !isMainnetConfirmedFlag) || (isMainnet && hasLowBalance)

  const handleCopy = async () => {
    if (!txHash) return
    try {
      await navigator.clipboard.writeText(txHash)
    } catch {}
  }

  const presets = ["0.5", "1", "2"] as const

  return (
    <div className="space-y-6">
      {/* Main Tip Jar Card */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-red-500" />
            Tip Jar
            {invitePrefill && (
              <Badge variant="secondary" className="ml-2 text-xs">
                <Gift className="h-3 w-3 mr-1" />
                Invite
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            Send tips on {networkConfig.name}
            {isMainnet && (
              <span className="text-red-600 font-medium ml-1">— REAL FUNDS</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Network Toggle */}
          <NetworkToggle 
            onNetworkChange={setCurrentNetwork}
            showLabel={true}
          />

          {/* Mainnet Balance Warning */}
          {isMainnet && hasLowBalance && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                ⚠️ Low Balance Warning
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Your ETH balance ({ethBalanceFormatted.toFixed(4)} ETH) is below the recommended minimum for mainnet transactions. 
                You need at least {minEthBalance} ETH (~$2) for gas fees.
              </p>
            </div>
          )}

          {/* Mainnet USDC Balance Warning */}
          {isMainnet && currency === "USDC" && hasLowUsdcBalance && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                ⚠️ Insufficient USDC Balance
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Your USDC balance ({usdcBalanceFormatted.toFixed(2)} USDC) is insufficient for this transaction.
              </p>
            </div>
          )}

          {/* Mainnet Confirmation Required */}
          {isMainnet && !isMainnetConfirmedFlag && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                🔒 Mainnet Confirmation Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You must confirm that you understand this will use real funds before sending on mainnet.
              </p>
            </div>
          )}

          {/* Connect Wallet Button */}
          {!isConnected && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {inAppBrowser ? "Tap to connect your Base wallet" : "Connect your wallet to send tips"}
              </p>
              <Wallet>
                <ConnectWallet>
                  <Button className="w-full h-14 text-base font-medium">
                    Connect Wallet
                  </Button>
                </ConnectWallet>
              </Wallet>
              {!inAppBrowser && (
                <p className="text-xs text-muted-foreground mt-2">
                  If you're in the Base app, use the in-app wallet
                </p>
              )}
            </div>
          )}

          {/* Currency Selection */}
          {isConnected && (
            <div className="flex items-center gap-2">
              <Button 
                variant={currency === "ETH" ? "default" : "outline"} 
                onClick={() => setCurrency("ETH")}
                className="flex-1 h-12"
              >
                ETH
              </Button>
              <Button 
                variant={currency === "USDC" ? "default" : "outline"} 
                onClick={() => setCurrency("USDC")}
                className="flex-1 h-12"
              >
                USDC
              </Button>
            </div>
          )}

          {/* USDC Warning */}
          {currency === "USDC" && !isUsdcConfigured && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
              USDC not configured — use ETH instead
            </div>
          )}

          {/* Amount Selection */}
          {isConnected && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Amount</Label>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => (
                  <Button 
                    key={p} 
                    variant="secondary" 
                    onClick={() => setAmount(p)}
                    className="h-12 text-base"
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Input 
                type="number" 
                step="0.000001" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="Custom amount" 
                inputMode="decimal"
                className="h-12 text-base"
              />
            </div>
          )}

          {/* Recipient Selection */}
          {isConnected && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recipient</Label>
              <Select value={selectedRecipientId} onValueChange={setSelectedRecipientId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a recipient" />
                </SelectTrigger>
                <SelectContent>
                  {RECIPIENTS.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Send Button */}
          {isConnected && (
            <Button 
              onClick={handleSend} 
              disabled={disabled} 
              className="w-full h-14 text-base font-medium"
            >
              {isLoading ? "Sending..." : `Send ${amount || ""} ${currency}`}
            </Button>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Success Panel */}
          {(isEthSuccess || isUsdcSuccess) && (ethHash || usdcHash) && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 space-y-3">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">Tip sent successfully!</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="text-xs break-all flex-1">{txHash}</code>
                  <Button size="sm" variant="outline" onClick={handleCopy} aria-label="Copy tx hash">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <a
                  href={BASESCAN_TX_URL(txHash as string)}
                  target={inAppBrowser ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View on Basescan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Receipts Button */}
      {isConnected && (
        <Button 
          variant="outline" 
          onClick={() => setShowReceipts(!showReceipts)}
          className="w-full h-12"
        >
          {showReceipts ? "Hide" : "View"} Receipts
        </Button>
      )}

      {/* Receipts Modal */}
      {showReceipts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Tips</CardTitle>
          </CardHeader>
          <CardContent>
            {latest.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tips sent yet</p>
            ) : (
              <div className="space-y-3">
                {latest.map((t) => (
                  <div key={t.txHash} className="flex flex-col gap-2 p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">{t.amount} {t.currency}</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(t.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <a 
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1" 
                      href={BASESCAN_TX_URL(t.txHash)} 
                      target={inAppBrowser ? "_self" : "_blank"} 
                      rel="noopener noreferrer"
                    >
                      View on Basescan <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* In-app browser notice */}
      {inAppBrowser && (
        <div className="text-center text-xs text-muted-foreground">
          <p>Using Base app wallet</p>
        </div>
      )}

      {/* Mainnet Confirmation Modal */}
      <MainnetConfirmModal
        open={showMainnetModal}
        onOpenChange={setShowMainnetModal}
        onConfirm={() => {
          setShowMainnetModal(false)
          // Retry the transaction after confirmation
          setTimeout(() => handleSend(), 100)
        }}
      />
    </div>
  )
}
