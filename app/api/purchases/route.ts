import { NextRequest, NextResponse } from 'next/server';
import { getPurchasesByBuyer, getAllPurchases } from '@/lib/purchases';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyer = searchParams.get('buyer');

    if (buyer) {
      // Get purchases for specific buyer
      const purchases = await getPurchasesByBuyer(buyer);
      return NextResponse.json({ purchases });
    } else {
      // Get all purchases for analytics
      const purchases = await getAllPurchases();
      return NextResponse.json({ purchases });
    }
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
