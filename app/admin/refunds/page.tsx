'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, RefreshCw, RotateCcw, CheckCircle, XCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { isAdminWallet } from '@/lib/admin-auth';
import { RefundRequest } from '@/lib/refunds';
import { Transaction } from '@/lib/transactions';
import { BASESCAN_TX_URL } from '@/config/addresses';

export default function AdminRefundsPage() {
  const { address, isConnected } = useAccount();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      if (!isConnected || !address) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/check?wallet=${address}`);
        const data = await response.json();
        setIsAuthorized(data.isAdmin);
        
        if (data.isAdmin) {
          await loadRefundData();
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAuthorized(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [isConnected, address]);

  const loadRefundData = async () => {
    try {
      const [refundsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/refund?admin=true'),
        fetch('/api/transactions')
      ]);
      
      const refundsData = await refundsResponse.json();
      const transactionsData = await transactionsResponse.json();
      
      if (refundsResponse.ok) {
        setRefundRequests(refundsData.refundRequests || []);
      }
      
      if (transactionsResponse.ok) {
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load refund data:', error);
    }
  };

  const handleRefundAction = async (action: 'approve' | 'deny') => {
    if (!selectedRefund || !adminNotes.trim()) return;
    
    try {
      setProcessingRefund(selectedRefund.id);
      const response = await fetch('/api/refund', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address!
        },
        body: JSON.stringify({
          refundId: selectedRefund.id,
          action,
          adminNotes: adminNotes.trim()
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setActionDialogOpen(false);
        setAdminNotes('');
        setSelectedRefund(null);
        await loadRefundData(); // Refresh data
        alert(`Refund request ${action}d successfully!`);
      } else {
        alert(data.error || `Failed to ${action} refund request`);
      }
    } catch (err) {
      console.error(`Error ${action}ing refund request:`, err);
      alert(`Failed to ${action} refund request`);
    } finally {
      setProcessingRefund(null);
    }
  };

  const getTransactionForRefund = (transactionId: string) => {
    return transactions.find(t => t.id === transactionId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>
      case 'denied':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Denied</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(currency === 'USDC' ? 2 : 4)} ${currency}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Access Required
              </CardTitle>
              <CardDescription>
                Connect your wallet to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Please connect your wallet to access the admin panel. Only authorized admin wallets can access this dashboard.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This wallet address is not authorized for admin access. Please contact the administrator.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Refund Management</h1>
            <p className="text-muted-foreground">
              Review and process refund requests
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadRefundData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access:</strong> You are logged in as an administrator. All refund actions are logged and monitored.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Refund Requests
          </CardTitle>
          <CardDescription>
            Review and approve or deny refund requests from buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {refundRequests.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No refund requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundRequests.map((refund) => {
                    const transaction = getTransactionForRefund(refund.transactionId);
                    return (
                      <TableRow key={refund.id}>
                        <TableCell className="font-mono text-sm">
                          {refund.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-sm">
                              {refund.transactionId.slice(0, 8)}...
                            </div>
                            {transaction?.txHash && transaction.txHash !== 'demo-mode' && (
                              <a
                                href={BASESCAN_TX_URL(transaction.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                              >
                                View TX <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {refund.buyer.slice(0, 6)}...{refund.buyer.slice(-4)}
                        </TableCell>
                        <TableCell>
                          {transaction ? formatAmount(transaction.amount, transaction.currency) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm truncate" title={refund.reason}>
                              {refund.reason}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(refund.status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(refund.createdAt)}
                        </TableCell>
                        <TableCell>
                          {refund.status === 'pending' ? (
                            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                              <DialogTrigger asChild>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRefund(refund);
                                      setAdminNotes('');
                                    }}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRefund(refund);
                                      setAdminNotes('');
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Deny
                                  </Button>
                                </div>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    {selectedRefund?.id === refund.id ? 'Approve' : 'Deny'} Refund Request
                                  </DialogTitle>
                                  <DialogDescription>
                                    {selectedRefund?.id === refund.id ? 'Approve' : 'Deny'} refund request for transaction {refund.transactionId}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="adminNotes">Admin Notes</Label>
                                    <Textarea
                                      id="adminNotes"
                                      placeholder="Add notes about this decision..."
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setActionDialogOpen(false);
                                      setAdminNotes('');
                                      setSelectedRefund(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => handleRefundAction(selectedRefund?.id === refund.id ? 'approve' : 'deny')}
                                    disabled={!adminNotes.trim() || processingRefund === refund.id}
                                    className={selectedRefund?.id === refund.id ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                                  >
                                    {processingRefund === refund.id ? 'Processing...' : 
                                     selectedRefund?.id === refund.id ? 'Approve' : 'Deny'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {refund.processedAt && (
                                <div>Processed: {formatDate(refund.processedAt)}</div>
                              )}
                              {refund.adminNotes && (
                                <div className="mt-1 max-w-xs truncate" title={refund.adminNotes}>
                                  Note: {refund.adminNotes}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
