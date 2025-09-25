'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageIcon, Zap, ExternalLink } from 'lucide-react';
import { erc1155Abi } from '@/lib/contracts';
import { BASESCAN_TX_URL } from '@/config/addresses';

// Sample NFT items for purchase
const NFT_ITEMS = [
  {
    id: '1',
    name: 'Base Daily VIP Pass',
    description: 'Exclusive VIP access to Base Daily events and features',
    price: 5, // USDC
    tokenId: 1,
    image: '/placeholder.jpg'
  },
  {
    id: '2', 
    name: 'Developer Badge',
    description: 'Show off your developer skills with this exclusive badge',
    price: 3, // USDC
    tokenId: 2,
    image: '/placeholder.jpg'
  },
  {
    id: '3',
    name: 'Community Member',
    description: 'Join the Base Daily community with this membership NFT',
    price: 2, // USDC
    tokenId: 3,
    image: '/placeholder.jpg'
  }
];

export default function NFTPurchasePage() {
  const { address, isConnected } = useAccount();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [purchaseTxHash, setPurchaseTxHash] = useState<string | null>(null);
  const [refundRequested, setRefundRequested] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handlePurchase = async (item: typeof NFT_ITEMS[0]) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // For demo purposes, we'll simulate a purchase by creating a transaction record
      // In a real implementation, you would call the NFT contract's purchase function
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: address,
          amount: item.price,
          currency: 'USDC',
          type: 'nft_purchase',
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Demo hash
          metadata: {
            tokenId: item.tokenId.toString(),
            contractAddress: process.env.NEXT_PUBLIC_ATTENDANCE_CONTRACT || '0x1234567890123456789012345678901234567890',
            tokenAmount: 1
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseTxHash(data.transaction.txHash);
        setSelectedItem(item.id);
        alert(`NFT purchased successfully! Transaction: ${data.transaction.txHash}`);
      } else {
        alert('Failed to purchase NFT');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Failed to purchase NFT');
    }
  };

  const handleRefundRequest = async (item: typeof NFT_ITEMS[0]) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    const reason = prompt('Please provide a reason for the refund request:');
    if (!reason) return;

    try {
      const response = await fetch('/api/request-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: `sample-nft-${item.id}`, // In real implementation, use actual transaction ID
          reason,
          buyerAddress: address
        })
      });

      if (response.ok) {
        setRefundRequested(item.id);
        alert('Refund request submitted successfully! An admin will review it shortly.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit refund request');
      }
    } catch (err) {
      console.error('Refund request error:', err);
      alert('Failed to submit refund request');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">NFT Marketplace</h1>
        <p className="text-muted-foreground">
          Purchase exclusive NFTs and test the refund system with NFT burning
        </p>
      </div>

      <Alert className="mb-6">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> This is a demonstration of the NFT purchase and refund system. 
          When you request a refund, the NFT will be burned and USDC will be returned.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {NFT_ITEMS.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Token ID: {item.tokenId}</Badge>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{item.price} USDC</div>
                    <div className="text-sm text-muted-foreground">per NFT</div>
                  </div>
                </div>

                {purchaseTxHash && selectedItem === item.id ? (
                  <div className="space-y-2">
                    <Alert>
                      <AlertDescription>
                        ✅ NFT purchased successfully!
                      </AlertDescription>
                    </Alert>
                    <div className="text-sm">
                      <div className="font-mono text-xs break-all">
                        TX: {purchaseTxHash}
                      </div>
                      <a
                        href={BASESCAN_TX_URL(purchaseTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs mt-1"
                      >
                        View on Basescan <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    {refundRequested === item.id ? (
                      <Alert>
                        <AlertDescription>
                          🔄 Refund request submitted! Admin will review shortly.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefundRequest(item)}
                        className="w-full"
                      >
                        Request Refund
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handlePurchase(item)}
                    disabled={!isConnected || isPending}
                    className="w-full"
                  >
                    {isPending ? 'Processing...' : 'Purchase NFT'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How the Refund System Works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Purchase an NFT using the buttons above</li>
          <li>Click "Request Refund" to submit a refund request</li>
          <li>Admin reviews the request in the admin dashboard</li>
          <li>When approved: USDC is returned + NFT is burned</li>
          <li>All actions are logged in the audit system</li>
        </ol>
      </div>
    </div>
  );
}
