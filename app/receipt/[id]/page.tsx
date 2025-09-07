'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, Share2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Receipt } from '@/lib/receipts';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const receiptId = params.id as string;

  useEffect(() => {
    if (receiptId) {
      fetchReceipt();
    }
  }, [receiptId]);

  const fetchReceipt = async () => {
    try {
      const response = await fetch(`/api/receipt/${receiptId}`);
      const data = await response.json();

      if (data.ok) {
        setReceipt(data.receipt);
      } else {
        setError(data.error || 'Receipt not found');
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      setError('Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const copyTxHash = async () => {
    if (receipt?.txHash) {
      await navigator.clipboard.writeText(receipt.txHash);
      toast.success('Transaction hash copied to clipboard');
    }
  };

  const shareReceipt = async () => {
    if (!receipt) return;

    const basescanUrl = `https://sepolia.basescan.org/tx/${receipt.txHash}`;
    const shareUrl = `${window.location.origin}/receipt/${receipt.id}`;
    
    const shareText = `I just bought ${receipt.assetTitle} — tx: ${receipt.txHash} on Basescan: ${basescanUrl} — check it out ${shareUrl} #BuildOnBase`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Purchase Receipt - ${receipt.assetTitle}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Share text copied to clipboard');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText);
      toast.success('Share text copied to clipboard');
    }
  };

  const openBasescan = () => {
    if (receipt?.txHash) {
      window.open(`https://sepolia.basescan.org/tx/${receipt.txHash}`, '_blank');
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading receipt...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Error</CardTitle>
                <CardDescription>{error || 'Receipt not found'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/checkout')} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button onClick={() => router.push('/checkout')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Checkout
            </Button>
            <Badge variant="secondary" className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Confirmed
            </Badge>
          </div>

          {/* Receipt Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Purchase Receipt</span>
                <Badge variant="outline">{receipt.currency}</Badge>
              </CardTitle>
              <CardDescription>
                Transaction confirmed on Base Sepolia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Asset Details */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{receipt.assetTitle}</h3>
                {receipt.assetDescription && (
                  <p className="text-muted-foreground">{receipt.assetDescription}</p>
                )}
              </div>

              <Separator />

              {/* Transaction Details */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-semibold">{receipt.amount} {receipt.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction Hash:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {receipt.txHash.slice(0, 10)}...{receipt.txHash.slice(-8)}
                    </code>
                    <Button size="sm" variant="ghost" onClick={copyTxHash}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyer Address:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {receipt.buyer.slice(0, 6)}...{receipt.buyer.slice(-4)}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Date:</span>
                  <span>{formatDate(receipt.timestamp)}</span>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={openBasescan} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Basescan
                </Button>
                <Button onClick={shareReceipt} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Receipt
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Receipt Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• This receipt proves your purchase of the digital asset</p>
              <p>• Transaction is verified on-chain and cannot be modified</p>
              <p>• You can share this receipt to prove ownership</p>
              <p>• Receipt ID: {receipt.id}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
