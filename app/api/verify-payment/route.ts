import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
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
    const { chain, txHash, expectedRecipient, expectedAmount, currency } = await request.json();

    if (!txHash || !expectedRecipient || !expectedAmount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (chain !== 'sepolia') {
      return NextResponse.json(
        { error: 'Only Base Sepolia is supported' },
        { status: 400 }
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
          if (transferEvent?.to?.toLowerCase() === expectedRecipient.toLowerCase()) {
            isValid = true;
            actualAmount = formatUnits(transferEvent.value!, USDC_DECIMALS);
            break;
          }
        }
      }
    } else if (currency === 'ETH') {
      // Check ETH transfer
      if (tx.to?.toLowerCase() === expectedRecipient.toLowerCase()) {
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

    const expectedAmountFormatted = parseFloat(expectedAmount.toString());
    const actualAmountFormatted = parseFloat(actualAmount);

    if (actualAmountFormatted < expectedAmountFormatted) {
      return NextResponse.json(
        { ok: false, reason: 'Insufficient payment amount' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      details: {
        txHash,
        amount: actualAmount,
        currency,
        recipient: expectedRecipient,
        blockNumber: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { ok: false, reason: 'Verification failed' },
      { status: 500 }
    );
  }
}
