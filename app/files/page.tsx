'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Download, ExternalLink, Loader2 } from 'lucide-react';

interface FileMetadata {
  id: string;
  filename: string;
  title: string;
  description: string;
  priceUsd: number;
  priceToken: string;
  recipient: string;
  uploadedAt: string;
}

interface Purchase {
  token: string;
  fileId: string;
  txHash: string;
  buyer: string;
  timestamp: string;
  expiry: string;
}

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// USDC ABI for transfer function
const USDC_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export default function FilesPage() {
  const { address, isConnected } = useAccount();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingFile, setPurchasingFile] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<Record<string, string>>({});
  const [successTx, setSuccessTx] = useState<Record<string, string>>({});

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    fetchFiles();
    if (address) {
      fetchPurchases();
    }
  }, [address]);

  useEffect(() => {
    if (isConfirmed && hash && purchasingFile) {
      handlePurchaseComplete(hash);
    }
  }, [isConfirmed, hash, purchasingFile]);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/purchases?buyer=${address}`);
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const handlePurchaseComplete = async (txHash: string) => {
    if (!purchasingFile || !address) return;

    setPurchaseStatus(prev => ({ ...prev, [purchasingFile]: 'verifying' }));

    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txHash,
          fileId: purchasingFile,
          buyerAddress: address,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPurchaseStatus(prev => ({ ...prev, [purchasingFile]: 'completed' }));
        setSuccessTx(prev => ({ ...prev, [purchasingFile]: txHash }));
        await fetchPurchases(); // Refresh purchases
      } else {
        setPurchaseStatus(prev => ({ ...prev, [purchasingFile]: 'failed' }));
      }
    } catch (error) {
      console.error('Purchase completion error:', error);
      setPurchaseStatus(prev => ({ ...prev, [purchasingFile]: 'failed' }));
    } finally {
      setPurchasingFile(null);
    }
  };

  const handleBuyFile = async (file: FileMetadata) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setPurchasingFile(file.id);
    setPurchaseStatus(prev => ({ ...prev, [file.id]: 'preparing' }));

    try {
      const amount = parseUnits(file.priceUsd.toString(), 6); // USDC has 6 decimals

      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [file.recipient as `0x${string}`, amount],
      });

      setPurchaseStatus(prev => ({ ...prev, [file.id]: 'pending' }));
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseStatus(prev => ({ ...prev, [file.id]: 'failed' }));
      setPurchasingFile(null);
    }
  };

  const getPurchaseStatus = (fileId: string) => {
    return purchaseStatus[fileId] || 'idle';
  };

  const isFilePurchased = (fileId: string) => {
    return purchases.some(p => p.fileId === fileId);
  };

  const getDownloadToken = (fileId: string) => {
    const purchase = purchases.find(p => p.fileId === fileId);
    return purchase?.token;
  };

  const getBasescanUrl = (txHash: string) => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pay-Per-File Downloads</h1>
        <p className="text-muted-foreground">
          Purchase files with USDC on Base Sepolia testnet
        </p>
      </div>

      {!isConnected && (
        <Alert className="mb-6">
          <AlertDescription>
            Please connect your wallet to purchase files.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => {
          const isPurchased = isFilePurchased(file.id);
          const downloadToken = getDownloadToken(file.id);
          const status = getPurchaseStatus(file.id);
          const txHash = successTx[file.id];

          return (
            <Card key={file.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {file.title}
                  {isPurchased && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Purchased
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{file.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Price:</span>
                    <Badge variant="outline">
                      {file.priceUsd} {file.priceToken}
                    </Badge>
                  </div>

                  {isPurchased && downloadToken ? (
                    <Button
                      className="w-full"
                      onClick={() => {
                        window.open(`/api/download?token=${downloadToken}`, '_blank');
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleBuyFile(file)}
                      disabled={!isConnected || status !== 'idle'}
                    >
                      {status === 'preparing' && (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Preparing...
                        </>
                      )}
                      {status === 'pending' && (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Waiting for confirmation...
                        </>
                      )}
                      {status === 'verifying' && (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying payment...
                        </>
                      )}
                      {status === 'completed' && (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Purchase Complete!
                        </>
                      )}
                      {status === 'failed' && 'Purchase Failed'}
                      {status === 'idle' && 'Buy File'}
                    </Button>
                  )}

                  {txHash && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="space-y-2">
                          <p>Payment successful!</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono">
                              {txHash.slice(0, 10)}...{txHash.slice(-8)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(txHash)}
                            >
                              Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(getBasescanUrl(txHash), '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && status === 'failed' && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Transaction failed: {error.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {files.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No files available for purchase.</p>
        </div>
      )}
    </div>
  );
}
