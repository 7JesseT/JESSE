import { NextRequest, NextResponse } from 'next/server';
import { getEventStats, Period } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const period = searchParams.get('period') as Period || 'all';

    if (!event) {
      return NextResponse.json(
        { error: 'Event parameter is required' },
        { status: 400 }
      );
    }

    const stats = await getEventStats(event, period);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in event-stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

