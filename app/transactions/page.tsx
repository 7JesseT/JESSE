"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink, RefreshCw, Package, Heart, FileText, Gift } from "lucide-react"
import { BASESCAN_TX_URL } from "@/config/addresses"
import { Transaction } from "@/lib/transactions"

export default function TransactionsPage() {
  const { address, isConnected } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const fetchTransactions = async () => {
    if (!address) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/transactions?user=${address}`)
      const data = await response.json()
      
      if (response.ok) {
        setTransactions(data.transactions || [])
        setError("")
      } else {
        setError(data.error || "Failed to fetch transactions")
      }
    } catch (err) {
      setError("Failed to fetch transactions")
      console.error("Error fetching transactions:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions()
    }
  }, [isConnected, address])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case "confirmed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Confirmed</Badge>
      case "shipped":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Shipped</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tip":
        return <Heart className="h-4 w-4 text-red-500" />
      case "nft_mint":
        return <Gift className="h-4 w-4 text-purple-500" />
      case "file_purchase":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "special_reward":
        return <Package className="h-4 w-4 text-green-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(currency === 'USDC' ? 2 : 4)} ${currency}`
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Please connect your wallet to view transactions</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                View all your transactions and their current status
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTransactions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.timestamp)}
                      </TableCell>
                      <TableCell>
                        {transaction.txHash && transaction.txHash !== 'demo-mode' ? (
                          <a
                            href={BASESCAN_TX_URL(transaction.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">Demo Mode</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
