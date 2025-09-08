import { NextRequest, NextResponse } from 'next/server';
import { getEventStats, toCsv, Period } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, period = 'all' } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event parameter is required' },
        { status: 400 }
      );
    }

    const stats = await getEventStats(event, period as Period);
    const csvContent = toCsv(stats.transactions);

    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `event-${event}-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error in export-csv API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

