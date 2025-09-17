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
import { ExternalLink, Heart, Copy, Gift } from "lucide-react"
import { USDC_ADDRESS, BASESCAN_TX_URL, type SupportedCurrency } from "@/config/addresses"
import { RECIPIENTS, getRecipientAddress } from "@/config/recipients"
import { saveTipTransaction, getRecipientTotals, getAllTotals, type TipTransaction } from "@/lib/tips-tracking"
import { NetworkToggle } from "@/components/network-toggle"
import { MainnetConfirmModal } from "@/components/mainnet-confirm-modal"
import { getCurrentNetworkConfig, isMainnetConfirmed, NetworkType } from "@/lib/networks"
import { toast } from "sonner"

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

export function TipJar() {
  const [currency, setCurrency] = useState<SupportedCurrency>("ETH")
  const [amount, setAmount] = useState("0.5")
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(RECIPIENTS[0]?.id || "")
  const [error, setError] = useState<string>("")
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [latest, setLatest] = useState<StoredTx[]>([])
  const [totals, setTotals] = useState<Record<string, Record<SupportedCurrency, number>>>({})
  const [invitePrefill, setInvitePrefill] = useState<InvitePrefill | null>(null)
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
    setTotals(getAllTotals())
  }, [isEthSuccess, isUsdcSuccess])

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
        setTotals(getAllTotals())

        // Create transaction record for tracking
        try {
          const response = await fetch('/api/transactions/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user: address || 'unknown',
              amount: numericAmount,
              currency,
              type: 'tip',
              status: 'confirmed', // Tips are confirmed when transaction succeeds
              timestamp: new Date().toISOString(),
              txHash: hash,
              metadata: {
                recipientId: selectedRecipientId
              }
            })
          })
          
          if (!response.ok) {
            console.error('Failed to create transaction record:', await response.text())
          }
        } catch (error) {
          console.error('Failed to create transaction record:', error)
        }
      }

      // Random reward logic - 10% chance to mint special NFT
      const randomChance = Math.random()
      const rewardThreshold = 0.1 // 10% chance
      
      console.log(`TipJar Payment Success - Wallet: ${address}, Amount: ${numericAmount} ${currency}, TX: ${hash}`)
      
      if (randomChance < rewardThreshold && address) {
        console.log(`Random Reward Triggered - Wallet: ${address}, Chance: ${randomChance.toFixed(3)}`)
        
        try {
          const response = await fetch('/api/mint-special', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: address,
              tokenId: 2, // Special NFT token ID
              amount: 1
            }),
          })

          const result = await response.json()

          if (response.ok && result.success) {
            console.log(`Random Reward Success - Wallet: ${address}, Special NFT TX: ${result.txHash}`)
            toast.success("Congrats! You received a Special NFT 🎁")
          } else {
            console.error(`Random Reward Failed - Wallet: ${address}, Error: ${result.error}`)
          }
        } catch (error) {
          console.error(`Random Reward Error - Wallet: ${address}, Error:`, error)
        }
      } else {
        console.log(`No Random Reward - Wallet: ${address}, Chance: ${randomChance.toFixed(3)}`)
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Tip Jar
          {invitePrefill && (
            <Badge variant="secondary" className="ml-2">
              <Gift className="h-3 w-3 mr-1" />
              Using invite — one-time link
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Send tips on {networkConfig.name} (ETH or USDC)
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

        <div className="flex items-center gap-2">
          <Button variant={currency === "ETH" ? "default" : "outline"} onClick={() => setCurrency("ETH")}>ETH</Button>
          <Button variant={currency === "USDC" ? "default" : "outline"} onClick={() => setCurrency("USDC")}>USDC</Button>
        </div>

        {currency === "USDC" && !isUsdcConfigured && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
            USDC not configured — set NEXT_PUBLIC_USDC_ADDRESS in .env.local or use ETH.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button key={p} variant="secondary" size="sm" onClick={() => setAmount(p)}>
              {p}
            </Button>
          ))}
          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="tip-amount" className="sr-only">Amount</Label>
            <Input id="tip-amount" type="number" step="0.000001" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" inputMode="decimal" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient</Label>
          <Select value={selectedRecipientId} onValueChange={setSelectedRecipientId}>
            <SelectTrigger>
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
          {selectedRecipient && (
            <div className="text-xs text-muted-foreground">
              {currency} Address: {getRecipientAddress(selectedRecipientId, currency)}
            </div>
          )}
        </div>

        <Button onClick={handleSend} disabled={disabled} className="w-full">
          {isLoading ? "Sending..." : `Send ${amount || ""} ${currency}`}
        </Button>

        {/* Debug info for disabled button */}
        {disabled && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-xs text-yellow-800 dark:text-yellow-200">
            <div>Debug - Button disabled because:</div>
            <div>• Wallet connected: {isConnected ? "Yes" : "No"}</div>
            <div>• Valid recipient: {isValidRecipient ? "Yes" : "No"}</div>
            <div>• Valid amount: {isAmountValid ? "Yes" : "No"}</div>
            <div>• Loading: {isLoading ? "Yes" : "No"}</div>
            <div>• USDC configured: {isUsdcConfigured ? "Yes" : "No"}</div>
            <div>• Chain ID: {chainId}</div>
            <div>• Recipient address: {recipientAddress || "None"}</div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        {(isEthSuccess || isUsdcSuccess) && (ethHash || usdcHash) && (
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
            <p className="text-sm text-green-800 dark:text-green-200">Tip sent successfully!</p>
            <div className="flex items-center gap-2">
              <code className="text-xs break-all">{(ethHash || usdcHash) as string}</code>
              <Button size="icon" variant="outline" onClick={handleCopy} aria-label="Copy tx hash">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <a
              href={BASESCAN_TX_URL((ethHash || usdcHash) as string)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View on Basescan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Total Tips by Recipient</p>
            <div className="grid grid-cols-1 gap-2">
              {RECIPIENTS.map((recipient) => {
                const recipientTotals = totals[recipient.id] || { ETH: 0, USDC: 0 }
                return (
                  <div key={recipient.id} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{recipient.name}</span>
                    <div className="text-xs text-muted-foreground">
                      ETH: {recipientTotals.ETH.toFixed(4)} | USDC: {recipientTotals.USDC.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Latest shipments</p>
            {latest.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shipments yet</p>
            ) : (
              <ul className="space-y-2">
                {latest.map((t) => (
                  <li key={t.txHash} className="text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span>{new Date(t.timestamp).toLocaleString()} — {t.amount} {t.currency}</span>
                    <a className="text-blue-600 hover:underline" href={BASESCAN_TX_URL(t.txHash)} target="_blank" rel="noreferrer">Basescan</a>
                  </li>
                ))}
              </ul>
            )}
            <a href="/shipments" className="text-sm text-blue-600 hover:underline">View all shipments</a>
          </div>
        </div>
      </CardContent>

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
    </Card>
  )
}
