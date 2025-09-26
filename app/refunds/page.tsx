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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  RotateCcw, 
  Upload, 
  FileText, 
  Image, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  Plus
} from 'lucide-react';
import { RefundRequest } from '@/lib/refunds';
import { Transaction } from '@/lib/transactions';

interface EvidenceUploadDialogProps {
  refund: RefundRequest;
  onClose: () => void;
  onSuccess: () => void;
}

function EvidenceUploadDialog({ refund, onClose, onSuccess }: EvidenceUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('refundId', refund.id);
      formData.append('tags', tags);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload-evidence', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadProgress(100);
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to upload evidence');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload evidence');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Evidence</DialogTitle>
        <DialogDescription>
          Upload supporting documents, screenshots, or other evidence for your refund request.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="files">Select Files</Label>
          <Input
            id="files"
            type="file"
            multiple
            accept="image/*,.pdf,.txt"
            onChange={handleFileChange}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Supported formats: Images (JPEG, PNG, GIF, WebP), PDF, Text files. Max 10MB per file.
          </p>
        </div>

        {files.length > 0 && (
          <div>
            <Label>Selected Files</Label>
            <div className="mt-2 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="tags">Tags (optional)</Label>
          <Input
            id="tags"
            placeholder="e.g., duplicate, failed_delivery, technical_issue"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Comma-separated tags to help categorize your evidence.
          </p>
        </div>

        {isUploading && (
          <div>
            <Label>Upload Progress</Label>
            <Progress value={uploadProgress} className="mt-2" />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Evidence'}
        </Button>
      </DialogFooter>
    </>
  );
}

export default function RefundsPage() {
  const { address, isConnected } = useAccount();
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadRefundData();
    }
  }, [isConnected, address]);

  const loadRefundData = async () => {
    try {
      setIsLoading(true);
      const [refundsResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/refund?buyer=${address}`),
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
    } finally {
      setIsLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'under_review':
        return <Eye className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'denied':
        return <XCircle className="h-4 w-4" />
      case 'auto_refunded':
        return <RotateCcw className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(currency === 'USDC' ? 2 : 4)} ${currency}`;
  };

  const getEstimatedResponseTime = (status: string, createdAt: string) => {
    if (status === 'approved' || status === 'denied' || status === 'auto_refunded') {
      return 'Completed';
    }
    
    const daysSinceCreated = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (status === 'pending') {
      return `Response within 3-5 business days (${daysSinceCreated} days ago)`;
    } else if (status === 'under_review') {
      return `Response within 1-2 business days (${daysSinceCreated} days ago)`;
    }
    
    return 'Processing...';
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">Please connect your wallet to view your refund requests.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading your refund requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Refund Requests</h1>
            <p className="text-muted-foreground">
              Track the status of your refund requests and upload evidence
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadRefundData}
            disabled={isLoading}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {refundRequests.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Refund Requests</h3>
              <p className="text-muted-foreground">
                You haven't submitted any refund requests yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {refundRequests.map((refund) => {
            const transaction = getTransactionForRefund(refund.transactionId);
            return (
              <Card key={refund.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(refund.status)}
                      <div>
                        <CardTitle className="text-lg">
                          Refund Request #{refund.id.slice(0, 8)}...
                        </CardTitle>
                        <CardDescription>
                          {transaction ? formatAmount(transaction.amount, transaction.currency) : 'N/A'} • {transaction?.type || 'Unknown'}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(refund.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Reason</Label>
                      <p className="text-sm text-muted-foreground mt-1">{refund.reason}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Status Timeline</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Submitted: {formatDate(refund.createdAt)}</span>
                        </div>
                        {refund.updatedAt && refund.updatedAt !== refund.createdAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span>Last Updated: {formatDate(refund.updatedAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span>{getEstimatedResponseTime(refund.status, refund.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {refund.evidence && refund.evidence.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Evidence ({refund.evidence.length})</Label>
                        <div className="mt-2 space-y-2">
                          {refund.evidence.map((evidence) => (
                            <div key={evidence.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                              {evidence.mimeType.startsWith('image/') ? (
                                <Image className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              <span className="text-sm flex-1">{evidence.originalName}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(evidence.url, '_blank')}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {evidence.tags && evidence.tags.length > 0 && (
                                <div className="flex gap-1">
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

                    {refund.adminNotes && (
                      <div>
                        <Label className="text-sm font-medium">Admin Notes</Label>
                        <p className="text-sm text-muted-foreground mt-1">{refund.adminNotes}</p>
                      </div>
                    )}

                    {(refund.status === 'pending' || refund.status === 'under_review') && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRefund(refund);
                            setEvidenceDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Evidence
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <EvidenceUploadDialog
          refund={selectedRefund!}
          onClose={() => {
            setEvidenceDialogOpen(false);
            setSelectedRefund(null);
          }}
          onSuccess={loadRefundData}
        />
      </Dialog>
    </div>
  );
}
