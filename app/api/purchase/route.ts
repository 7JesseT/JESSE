import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addPurchase, Purchase } from '@/lib/purchases';
import { getFileById } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    const { txHash, fileId, buyerAddress, demoMode } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // For demo mode, we don't need txHash or buyerAddress
    if (!demoMode && (!txHash || !buyerAddress)) {
      return NextResponse.json(
        { error: 'Transaction hash and buyer address are required for onchain mode' },
        { status: 400 }
      );
    }

    // Get file details
    const file = await getFileById(fileId);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    let verifyResult = { ok: true, details: {} };

    // Skip payment verification for demo mode
    if (!demoMode) {
      // Verify payment for onchain mode
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chain: 'sepolia',
          txHash,
          expectedRecipient: file.recipient,
          expectedAmount: file.priceUsd,
          currency: file.priceToken,
        }),
      });

      verifyResult = await verifyResponse.json();

      if (!verifyResult.ok) {
        return NextResponse.json(
          { error: verifyResult.reason || 'Payment verification failed' },
          { status: 400 }
        );
      }
    }

    // Create purchase record
    const token = uuidv4();
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const purchase: Purchase = {
      token,
      fileId,
      txHash: txHash || 'demo-mode',
      buyer: buyerAddress || 'demo-user',
      timestamp: now.toISOString(),
      expiry: expiry.toISOString(),
    };

    await addPurchase(purchase);

    return NextResponse.json({
      success: true,
      token,
      expiry: expiry.toISOString(),
      details: verifyResult.details,
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: 'Purchase failed' },
      { status: 500 }
    );
  }
}
