"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { BASESCAN_TX_URL, type SupportedCurrency } from "@/config/addresses"
import { getRecentTransactions, getAllTotals, type TipTransaction } from "@/lib/tips-tracking"
import { RECIPIENTS } from "@/config/recipients"

type StoredTx = {
  txHash: string
  amount: number
  currency: SupportedCurrency
  recipient: string
  timestamp: string
}

const STORAGE_KEY = "baseDaily:txs"

export default function ShipmentsPage() {
  const [txs, setTxs] = useState<StoredTx[]>([])
  const [tipTransactions, setTipTransactions] = useState<TipTransaction[]>([])
  const [totals, setTotals] = useState<Record<string, Record<SupportedCurrency, number>>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: StoredTx[] = raw ? JSON.parse(raw) : []
      setTxs(list.slice().reverse())
    } catch {}
  }, [])

  useEffect(() => {
    setTipTransactions(getRecentTransactions(50))
    setTotals(getAllTotals())
  }, [])

  const copy = async (hash: string) => {
    try { await navigator.clipboard.writeText(hash) } catch {}
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Totals Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tip Totals by Recipient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RECIPIENTS.map((recipient) => {
              const recipientTotals = totals[recipient.id] || { ETH: 0, USDC: 0 }
              return (
                <div key={recipient.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{recipient.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div>ETH: {recipientTotals.ETH.toFixed(4)}</div>
                    <div>USDC: {recipientTotals.USDC.toFixed(2)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tip Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tip Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {tipTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tip transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Time</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Recipient</th>
                    <th className="p-2">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {tipTransactions.map((t) => (
                    <tr key={t.txHash} className="border-t">
                      <td className="p-2">{new Date(t.timestamp).toLocaleString()}</td>
                      <td className="p-2">{t.amount} {t.currency}</td>
                      <td className="p-2">{t.recipientName}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <a className="text-blue-600 hover:underline inline-flex items-center gap-1" href={BASESCAN_TX_URL(t.txHash)} target="_blank" rel="noreferrer">
                            View <ExternalLink className="h-4 w-4" />
                          </a>
                          <Button size="icon" variant="outline" onClick={() => copy(t.txHash)} aria-label="Copy tx hash">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legacy Transactions */}
      {txs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Legacy Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Time</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Recipient</th>
                    <th className="p-2">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => (
                    <tr key={t.txHash} className="border-t">
                      <td className="p-2">{new Date(t.timestamp).toLocaleString()}</td>
                      <td className="p-2">{t.amount} {t.currency}</td>
                      <td className="p-2 break-all">{t.recipient}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <a className="text-blue-600 hover:underline inline-flex items-center gap-1" href={BASESCAN_TX_URL(t.txHash)} target="_blank" rel="noreferrer">
                            View <ExternalLink className="h-4 w-4" />
                          </a>
                          <Button size="icon" variant="outline" onClick={() => copy(t.txHash)} aria-label="Copy tx hash">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


