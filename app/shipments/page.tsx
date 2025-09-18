"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Package, Truck, CheckCircle, Clock } from "lucide-react"
import { Transaction } from "@/lib/transactions"

const BASESCAN_TX_URL = (hash: string) => `https://sepolia.basescan.org/tx/${hash}`

interface ShipmentTransaction extends Transaction {
  itemName?: string
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />
    case 'confirmed':
      return <Package className="h-4 w-4" />
    case 'shipped':
      return <Truck className="h-4 w-4" />
    case 'delivered':
      return <CheckCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'shipped':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getItemName = (transaction: Transaction): string => {
  if (transaction.type === 'file_purchase' && transaction.metadata?.fileId) {
    // Map file IDs to actual file names
    const fileMap: Record<string, string> = {
      'base-guide-2024': 'Base Development Guide 2024',
      'nft-course-advanced': 'Advanced NFT Development Course',
      'defi-protocol-guide': 'DeFi Protocol Tutorial',
      'file1': 'File 1',
      'file2': 'File 2',
      'file3': 'File 3',
      'file4': 'File 4',
      'file5': 'File 5',
      'file6': 'File 6',
      'file7': 'File 7'
    }
    return fileMap[transaction.metadata.fileId] || transaction.metadata.fileId
  } else if (transaction.type === 'nft_mint' && transaction.metadata?.event) {
    return `NFT - ${transaction.metadata.event} (Token #${transaction.metadata.tokenId})`
  } else if (transaction.type === 'tip') {
    return `Tip to ${transaction.metadata?.recipientId || 'Recipient'}`
  }
  return 'Unknown Item'
}

export default function ShipmentsPage() {
  const [transactions, setTransactions] = useState<ShipmentTransaction[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if user is admin
    const adminKey = localStorage.getItem('adminKey')
    setIsAdmin(adminKey === 'base-daily-admin-2024')

    // Fetch transactions
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        const shipmentTransactions = data.transactions.map((tx: Transaction) => ({
          ...tx,
          itemName: getItemName(tx)
        }))
        setTransactions(shipmentTransactions)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching transactions:', error)
        setLoading(false)
      })
  }, [])

  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: transactionId,
          status: newStatus
        })
      })

      if (response.ok) {
        // Update local state
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === transactionId 
              ? { ...tx, status: newStatus as any }
              : tx
          )
        )
      } else {
        console.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const filtered = transactions.filter(
    (tx) =>
      tx.user.toLowerCase().includes(search.toLowerCase()) ||
      tx.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.txHash?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading shipments...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Shipment Tracking</h1>
        <p className="text-muted-foreground">
          Track the status of all transactions and shipments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <Input
              placeholder="Search by wallet, item name, or transaction hash"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <div className="flex gap-2 ml-auto">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Confirmed
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Shipped
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Delivered
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-3 font-medium">Transaction Hash</th>
                  <th className="p-3 font-medium">Item Name</th>
                  <th className="p-3 font-medium">Buyer Address</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Date</th>
                  {isAdmin && <th className="p-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="p-3 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        {tx.txHash ? (
                          <a 
                            className="text-blue-600 hover:underline inline-flex items-center gap-1" 
                            href={BASESCAN_TX_URL(tx.txHash)} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No hash</span>
                        )}
                      </td>
                      <td className="p-3 font-medium">{tx.itemName}</td>
                      <td className="p-3 font-mono text-sm">{formatAddress(tx.user)}</td>
                      <td className="p-3">
                        <Badge 
                          variant="outline" 
                          className={`flex items-center gap-1 w-fit ${getStatusColor(tx.status)}`}
                        >
                          {getStatusIcon(tx.status)}
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(tx.timestamp)}</td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="flex gap-1">
                            {tx.status === 'shipped' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(tx.id, 'delivered')}
                                className="text-green-600 hover:text-green-700"
                              >
                                Mark Delivered
                              </Button>
                            )}
                            {tx.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(tx.id, 'shipped')}
                                className="text-purple-600 hover:text-purple-700"
                              >
                                Mark Shipped
                              </Button>
                            )}
                            {tx.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(tx.id, 'confirmed')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Confirm
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Admin access required to update shipment status.</p>
              <p className="text-sm mt-1">
                Contact support if you need to update a shipment status.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}