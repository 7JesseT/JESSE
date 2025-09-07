'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { DigitalAsset } from '@/lib/assets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutCardProps {
  asset: DigitalAsset;
  onPurchaseSuccess?: (txHash: string, receiptId: string) => void;
}

export function CheckoutCard({ asset, onPurchaseSuccess }: CheckoutCardProps) {
  const { address, isConnected } = useAccount();
  const [isPurchased, setIsPurchased] = useState(false);
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check ownership on mount
  useEffect(() => {
    if (address && isConnected) {
      checkOwnership();
    }
  }, [address, isConnected]);

  const checkOwnership = async () => {
    if (!address) return;
    
    setIsCheckingOwnership(true);
    try {
      const response = await fetch(`/api/my-receipts?wallet=${address}`);
      const data = await response.json();
      
      if (data.ok) {
        const purchased = data.receipts.some((receipt: any) => receipt.assetId === asset.id);
        setIsPurchased(purchased);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    } finally {
      setIsCheckingOwnership(false);
    }
  };

  const handlePurchase = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!USDC_ADDRESS) {
      toast.error('USDC contract address not configured');
      return;
    }

    setIsProcessing(true);

    try {
      const amountInUnits = parseUnits(asset.priceUsdc.toString(), 6);
      
      writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'transfer',
        args: [asset.recipient as `0x${string}`, amountInUnits],
      });
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to initiate purchase');
      setIsProcessing(false);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash && address) {
      recordReceipt();
    }
  }, [isConfirmed, hash, address]);

  const recordReceipt = async () => {
    if (!hash || !address) return;

    try {
      const response = await fetch('/api/record-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txHash: hash,
          assetId: asset.id,
          buyerAddress: address,
          amount: asset.priceUsdc,
          currency: 'USDC',
        }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success('Purchase successful!');
        setIsPurchased(true);
        onPurchaseSuccess?.(hash, result.receiptId);
      } else {
        toast.error(result.reason || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Receipt recording error:', error);
      toast.error('Failed to record receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const getBasescanUrl = (txHash: string) => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{asset.title}</CardTitle>
          <Badge variant="secondary">{asset.priceUsdc} USDC</Badge>
        </div>
        <CardDescription>{asset.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {asset.thumbnail && (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Thumbnail</span>
          </div>
        )}
        
        {isCheckingOwnership ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Checking ownership...</span>
          </div>
        ) : isPurchased ? (
          <div className="space-y-2">
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Owned</span>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Receipt
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handlePurchase}
            disabled={!isConnected || isPending || isConfirming || isProcessing}
            className="w-full"
          >
            {(isPending || isConfirming || isProcessing) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Recording...'}
              </>
            ) : (
              'Buy Now'
            )}
          </Button>
        )}

        {error && (
          <div className="text-sm text-red-600">
            Error: {error.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
