import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { v4 as uuidv4 } from 'uuid';
import { addReceipt, Receipt } from '@/lib/receipts';
import { getAssetById } from '@/lib/assets';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_DECIMALS = 6;

// USDC ABI for transfer events
const USDC_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const { txHash, assetId, buyerAddress, amount, currency } = await request.json();

    if (!txHash || !assetId || !buyerAddress || !amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get asset details
    const asset = getAssetById(assetId);
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // Get transaction details
    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
    
    if (!tx) {
      return NextResponse.json(
        { ok: false, reason: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if transaction is confirmed
    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json(
        { ok: false, reason: 'Transaction not confirmed or failed' },
        { status: 400 }
      );
    }

    let isValid = false;
    let actualAmount = '0';

    if (currency === 'USDC') {
      // Check for USDC transfer events
      const logs = await client.getLogs({
        address: USDC_ADDRESS,
        event: USDC_ABI[0],
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      for (const log of logs) {
        if (log.transactionHash === txHash) {
          const transferEvent = log.args;
          if (transferEvent?.to?.toLowerCase() === asset.recipient.toLowerCase()) {
            isValid = true;
            actualAmount = formatUnits(transferEvent.value!, USDC_DECIMALS);
            break;
          }
        }
      }
    } else if (currency === 'ETH') {
      // Check ETH transfer
      if (tx.to?.toLowerCase() === asset.recipient.toLowerCase()) {
        isValid = true;
        actualAmount = formatUnits(tx.value, 18);
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { ok: false, reason: 'Payment not found or recipient mismatch' },
        { status: 400 }
      );
    }

    const expectedAmountFormatted = parseFloat(amount.toString());
    const actualAmountFormatted = parseFloat(actualAmount);

    if (actualAmountFormatted < expectedAmountFormatted) {
      return NextResponse.json(
        { ok: false, reason: 'Insufficient payment amount' },
        { status: 400 }
      );
    }

    // Create receipt
    const receiptId = uuidv4();
    const receiptData: Receipt = {
      id: receiptId,
      txHash,
      assetId,
      buyer: buyerAddress,
      amount: actualAmount,
      currency,
      timestamp: new Date().toISOString(),
      assetTitle: asset.title,
      assetDescription: asset.description,
      assetPrice: amount.toString(),
    };

    await addReceipt(receiptData);

    return NextResponse.json({
      ok: true,
      receiptId,
      details: {
        txHash,
        amount: actualAmount,
        currency,
        recipient: asset.recipient,
        blockNumber: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error('Receipt recording error:', error);
    return NextResponse.json(
      { ok: false, reason: 'Receipt recording failed' },
      { status: 500 }
    );
  }
}
