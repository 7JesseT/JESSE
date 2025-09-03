"use client"

import { useEffect, useMemo, useState } from "react"
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import { parseEther, parseUnits, isAddress } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ExternalLink, Heart, Copy } from "lucide-react"
import { DEFAULT_RECIPIENT, USDC_ADDRESS, BASESCAN_TX_URL, type SupportedCurrency } from "@/config/addresses"

type StoredTx = {
  txHash: string
  amount: number
  currency: SupportedCurrency
  recipient: string
  timestamp: string
}

const STORAGE_KEY = "baseDaily:txs"

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
  const [recipient, setRecipient] = useState<string>(DEFAULT_RECIPIENT)
  const [error, setError] = useState<string>("")
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [latest, setLatest] = useState<StoredTx[]>([])

  const { isConnected, chainId } = useAccount()
  const { sendTransaction, data: ethHash, isPending: isSendingEth } = useSendTransaction()
  const { isLoading: isConfirmingEth, isSuccess: isEthSuccess } = useWaitForTransactionReceipt({ hash: ethHash })
  const { writeContract, data: usdcHash, isPending: isSendingUsdc } = useWriteContract()
  const { isLoading: isConfirmingUsdc, isSuccess: isUsdcSuccess } = useWaitForTransactionReceipt({ hash: usdcHash })

  const isValidRecipient = useMemo(() => isAddress(recipient), [recipient])
  const numericAmount = Number(amount)
  const isAmountValid = !Number.isNaN(numericAmount) && numericAmount > 0
  const isUsdcConfigured = typeof USDC_ADDRESS === "string" && USDC_ADDRESS.length === 42 && isAddress(USDC_ADDRESS)
  const isLoading = isSendingEth || isSendingUsdc || isConfirmingEth || isConfirmingUsdc

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: StoredTx[] = raw ? JSON.parse(raw) : []
      setLatest(list.slice(-3).reverse())
    } catch {}
  }, [isEthSuccess, isUsdcSuccess])

  useEffect(() => {
    const h = ethHash || usdcHash
    if (h) setTxHash(h)
  }, [ethHash, usdcHash])

  const saveTx = (hash: string) => {
    try {
      const entry: StoredTx = {
        txHash: hash,
        amount: numericAmount,
        currency,
        recipient,
        timestamp: new Date().toISOString(),
      }
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: StoredTx[] = raw ? JSON.parse(raw) : []
      list.push(entry)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      setLatest(list.slice(-3).reverse())
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
    if (!isValidRecipient) {
      setError("Recipient address is invalid or not configured")
      return
    }
    if (!isAmountValid) {
      setError("Enter a valid amount greater than 0")
      return
    }

    try {
      if (currency === "ETH") {
        sendTransaction({ to: recipient as `0x${string}`, value: parseEther(amount) })
      } else {
        if (!isUsdcConfigured) {
          setError("USDC not configured — set NEXT_PUBLIC_USDC_ADDRESS or use ETH")
          return
        }
        writeContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient as `0x${string}`, parseUnits(amount, 6)],
        })
      }
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Transaction failed")
    }
  }

  const disabled = !isConnected || !isValidRecipient || !isAmountValid || isLoading || (currency === "USDC" && !isUsdcConfigured)

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
        </CardTitle>
        <CardDescription>Send tips on Base Sepolia (ETH or USDC)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..." />
        </div>

        <Button onClick={handleSend} disabled={disabled} className="w-full">
          {isLoading ? "Sending..." : `Send ${amount || ""} ${currency}`}
        </Button>

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
      </CardContent>
    </Card>
  )
}
