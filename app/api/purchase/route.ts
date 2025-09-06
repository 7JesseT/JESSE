import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addPurchase, Purchase } from '@/lib/purchases';
import { getFileById } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    const { txHash, fileId, buyerAddress } = await request.json();

    if (!txHash || !fileId || !buyerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify payment
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

    const verifyResult = await verifyResponse.json();

    if (!verifyResult.ok) {
      return NextResponse.json(
        { error: verifyResult.reason || 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Create purchase record
    const token = uuidv4();
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const purchase: Purchase = {
      token,
      fileId,
      txHash,
      buyer: buyerAddress,
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
