import { NextRequest, NextResponse } from 'next/server';
import { getPurchasesByBuyer } from '@/lib/purchases';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyer = searchParams.get('buyer');

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer address required' },
        { status: 400 }
      );
    }

    const purchases = await getPurchasesByBuyer(buyer);
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
