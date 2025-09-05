"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink } from "lucide-react"

const BASESCAN_TX_URL = (hash: string) => `https://sepolia.basescan.org/tx/${hash}`

interface Shipment {
  wallet: string
  tokenId: number
  date: string
  txHash: string
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<Shipment>({ wallet: "", tokenId: 0, date: "", txHash: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/data/shipments.json")
      .then((res) => res.json())
      .then(setShipments)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.wallet || !form.tokenId || !form.date || !form.txHash) return
    setLoading(true)
    const newShipment = { ...form, tokenId: Number(form.tokenId) }
    const updated = [...shipments, newShipment]
    setShipments(updated)
    setForm({ wallet: "", tokenId: 0, date: "", txHash: "" })
    // Save to server (simulate API or use a real endpoint in production)
    await fetch("/api/save-shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
    setLoading(false)
  }

  const handleExportCSV = () => {
    const csv = [
      ["Wallet", "Token ID", "Date/Time", "Tx Hash"],
      ...filtered.map((s) => [s.wallet, s.tokenId, s.date, s.txHash]),
    ]
      .map((row) => row.join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "shipments.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = shipments.filter(
    (s) =>
      s.wallet.toLowerCase().includes(search.toLowerCase()) ||
      String(s.tokenId).includes(search)
  )

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipments Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <Input
              placeholder="Search by wallet or token ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleExportCSV} className="ml-auto w-fit">Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Wallet</th>
                  <th className="p-2">Token ID</th>
                  <th className="p-2">Date/Time</th>
                  <th className="p-2">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="p-2 text-center text-muted-foreground">No shipments found.</td></tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 break-all">{s.wallet}</td>
                      <td className="p-2">{s.tokenId}</td>
                      <td className="p-2">{s.date}</td>
                      <td className="p-2">
                        <a className="text-blue-600 hover:underline inline-flex items-center gap-1" href={BASESCAN_TX_URL(s.txHash)} target="_blank" rel="noreferrer">
                          {s.txHash.slice(0, 10)}...<ExternalLink className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleAdd}>
            <Input name="wallet" placeholder="Wallet address" value={form.wallet} onChange={handleChange} required />
            <Input name="tokenId" type="number" placeholder="Token ID" value={form.tokenId} onChange={handleChange} required />
            <Input name="date" type="datetime-local" value={form.date} onChange={handleChange} required />
            <Input name="txHash" placeholder="Transaction hash" value={form.txHash} onChange={handleChange} required />
            <Button type="submit" disabled={loading} className="col-span-1 md:col-span-4">{loading ? "Saving..." : "Add Shipment"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


