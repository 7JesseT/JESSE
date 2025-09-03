"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { BASESCAN_TX_URL, type SupportedCurrency } from "@/config/addresses"

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: StoredTx[] = raw ? JSON.parse(raw) : []
      setTxs(list.slice().reverse())
    } catch {}
  }, [])

  const copy = async (hash: string) => {
    try { await navigator.clipboard.writeText(hash) } catch {}
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shipments yet.</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}


