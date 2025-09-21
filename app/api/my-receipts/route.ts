import { NextRequest, NextResponse } from 'next/server';
import { getReceiptsByBuyer } from '@/lib/receipts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const receipts = await getReceiptsByBuyer(wallet);
    
    return NextResponse.json({
      ok: true,
      receipts,
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}
