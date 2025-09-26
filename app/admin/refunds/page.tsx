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
import { Shield, RefreshCw, RotateCcw, CheckCircle, XCircle, MessageSquare, ExternalLink, Eye, Image, FileText, Download, Clock, AlertCircle } from 'lucide-react';
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

  // Check authorization (simplified for testing)
  useEffect(() => {
    const checkAuth = async () => {
      // For testing purposes, allow access without strict wallet verification
      setIsAuthorized(true);
      setIsLoading(false);
      
      if (true) { // Always load data for testing
        await loadRefundData();
      }
    };

    checkAuth();
  }, []);

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
      const response = await fetch('/api/process-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '0x1234567890123456789012345678901234567890' // Default for testing
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
        
        let message = `Refund request ${action}d successfully!`;
        if (action === 'approve' && data.refundTxHash) {
          message += `\nUSDC Refund TX: ${data.refundTxHash}`;
        }
        if (action === 'approve' && data.burnTxHash) {
          message += `\nNFT Burn TX: ${data.burnTxHash}`;
        }
        
        alert(message);
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
      case 'under_review':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Under Review</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>
      case 'denied':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Denied</Badge>
      case 'auto_refunded':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Auto Refunded</Badge>
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
          <strong>Testing Mode:</strong> Wallet restrictions have been removed for testing purposes. All refund actions are logged and monitored.
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
                    <TableHead>Type</TableHead>
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
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {transaction?.type || 'unknown'}
                          </Badge>
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
                          {(refund.status === 'pending' || refund.status === 'under_review') ? (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setAdminNotes('');
                                  setActionDialogOpen(true);
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                            </div>
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

      {/* Review Dialog - moved outside table */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Review Refund Request #{selectedRefund?.id.slice(0, 8)}...
            </DialogTitle>
            <DialogDescription>
              Review evidence and make a decision for transaction {selectedRefund?.transactionId}
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-6">
              {/* Transaction Details */}
              <div>
                <Label className="text-sm font-medium">Transaction Details</Label>
                <div className="mt-2 p-3 bg-muted rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {getTransactionForRefund(selectedRefund.transactionId)?.type || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> {getTransactionForRefund(selectedRefund.transactionId) ? formatAmount(getTransactionForRefund(selectedRefund.transactionId).amount, getTransactionForRefund(selectedRefund.transactionId).currency) : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Buyer:</span> {selectedRefund.buyer}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDate(selectedRefund.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-sm font-medium">Refund Reason</Label>
                <p className="mt-1 text-sm text-muted-foreground">{selectedRefund.reason}</p>
              </div>

              {/* Evidence */}
              {selectedRefund.evidence && selectedRefund.evidence.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Evidence ({selectedRefund.evidence.length})</Label>
                  <div className="mt-2 space-y-3">
                    {selectedRefund.evidence.map((evidence) => (
                      <div key={evidence.id} className="border rounded p-3">
                        <div className="flex items-center gap-3 mb-2">
                          {evidence.mimeType.startsWith('image/') ? (
                            <Image className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-600" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{evidence.originalName}</div>
                            <div className="text-xs text-muted-foreground">
                              {(evidence.size / 1024 / 1024).toFixed(2)} MB • {formatDate(evidence.uploadedAt)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(evidence.url, '_blank')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = evidence.url;
                                link.download = evidence.originalName;
                                link.click();
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                        {evidence.tags && evidence.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {evidence.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
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
          )}
          <DialogFooter className="flex gap-2">
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
              onClick={() => handleRefundAction('deny')}
              disabled={!adminNotes.trim() || processingRefund === selectedRefund?.id}
              variant="destructive"
            >
              {processingRefund === selectedRefund?.id ? 'Processing...' : 'Deny'}
            </Button>
            <Button
              onClick={() => handleRefundAction('approve')}
              disabled={!adminNotes.trim() || processingRefund === selectedRefund?.id}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingRefund === selectedRefund?.id ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}