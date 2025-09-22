"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ExternalLink, RefreshCw, Package, Heart, FileText, Gift, RotateCcw, MessageSquare } from "lucide-react"
import { BASESCAN_TX_URL } from "@/config/addresses"
import { Transaction } from "@/lib/transactions"
import { RefundRequest } from "@/lib/refunds"

export default function TransactionsPage() {
  const { address, isConnected } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [submittingRefund, setSubmittingRefund] = useState(false)

  const fetchTransactions = async () => {
    if (!address) return
    
    try {
      setLoading(true)
      const [transactionsResponse, refundsResponse] = await Promise.all([
        fetch(`/api/transactions?user=${address}`),
        fetch(`/api/refund?buyer=${address}`)
      ])
      
      const transactionsData = await transactionsResponse.json()
      const refundsData = await refundsResponse.json()
      
      if (transactionsResponse.ok) {
        setTransactions(transactionsData.transactions || [])
        setError("")
      } else {
        setError(transactionsData.error || "Failed to fetch transactions")
      }
      
      if (refundsResponse.ok) {
        setRefundRequests(refundsData.refundRequests || [])
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
      case "delivered":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Delivered</Badge>
      case "refunded":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Refunded</Badge>
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

  const handleRefundRequest = async () => {
    if (!selectedTransaction || !refundReason.trim()) return
    
    try {
      setSubmittingRefund(true)
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address!
        },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          reason: refundReason.trim()
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setRefundDialogOpen(false)
        setRefundReason("")
        setSelectedTransaction(null)
        await fetchTransactions() // Refresh data
        alert('Refund request submitted successfully!')
      } else {
        alert(data.error || 'Failed to submit refund request')
      }
    } catch (err) {
      console.error('Error submitting refund request:', err)
      alert('Failed to submit refund request')
    } finally {
      setSubmittingRefund(false)
    }
  }

  const getRefundStatusForTransaction = (transactionId: string) => {
    return refundRequests.find(r => r.transactionId === transactionId)
  }

  const canRequestRefund = (transaction: Transaction) => {
    // Can request refund if transaction is confirmed, shipped, or delivered
    // and no refund request already exists
    const eligibleStatuses = ['confirmed', 'shipped', 'delivered']
    const existingRefund = getRefundStatusForTransaction(transaction.id)
    
    return eligibleStatuses.includes(transaction.status) && !existingRefund
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
                    <TableHead>Refund Info</TableHead>
                    <TableHead>Actions</TableHead>
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
                      <TableCell>
                        {transaction.status === 'refunded' && transaction.refundTxHash ? (
                          <div className="text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <RotateCcw className="h-3 w-3 text-red-500" />
                              <span className="text-red-600 dark:text-red-400">Refunded</span>
                            </div>
                            <a
                              href={BASESCAN_TX_URL(transaction.refundTxHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View Refund <ExternalLink className="h-3 w-3" />
                            </a>
                            {transaction.refundedAt && (
                              <div className="text-muted-foreground mt-1">
                                {formatDate(transaction.refundedAt)}
                              </div>
                            )}
                          </div>
                        ) : (() => {
                          const refundRequest = getRefundStatusForTransaction(transaction.id)
                          if (refundRequest) {
                            return (
                              <div className="text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <MessageSquare className="h-3 w-3 text-orange-500" />
                                  <span className={`${
                                    refundRequest.status === 'pending' ? 'text-orange-600 dark:text-orange-400' :
                                    refundRequest.status === 'approved' ? 'text-green-600 dark:text-green-400' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {refundRequest.status === 'pending' ? 'Refund Pending' :
                                     refundRequest.status === 'approved' ? 'Refund Approved' :
                                     'Refund Denied'}
                                  </span>
                                </div>
                                <div className="text-muted-foreground">
                                  {formatDate(refundRequest.createdAt)}
                                </div>
                                {refundRequest.adminNotes && (
                                  <div className="text-muted-foreground mt-1 text-xs">
                                    Note: {refundRequest.adminNotes}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          return <span className="text-muted-foreground text-sm">-</span>
                        })()}
                      </TableCell>
                      <TableCell>
                        {canRequestRefund(transaction) ? (
                          <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTransaction(transaction)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Request Refund
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Refund</DialogTitle>
                                <DialogDescription>
                                  Request a refund for transaction {selectedTransaction?.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="reason">Reason for refund</Label>
                                  <Textarea
                                    id="reason"
                                    placeholder="Please explain why you need a refund..."
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRefundDialogOpen(false)
                                    setRefundReason("")
                                    setSelectedTransaction(null)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleRefundRequest}
                                  disabled={!refundReason.trim() || submittingRefund}
                                >
                                  {submittingRefund ? 'Submitting...' : 'Submit Request'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
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
