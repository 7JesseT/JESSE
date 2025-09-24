import { NextRequest, NextResponse } from 'next/server';
import { readAudits, filterAudits, exportAuditsToCSV, getAuditEventTypes } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const type = searchParams.get('type') || undefined;
    const q = searchParams.get('q') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const format = searchParams.get('format') || 'json';
    
    // Read all audit events
    const allAudits = await readAudits();
    
    // Apply filters
    const { events, total } = filterAudits(allAudits, {
      from,
      to,
      type,
      q,
      limit,
      offset,
    });
    
    // Return CSV format if requested
    if (format === 'csv') {
      const csv = exportAuditsToCSV(events);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit-logs.csv"',
        },
      });
    }
    
    // Return JSON format
    return NextResponse.json({
      events,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error reading audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to read audit logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'export-all') {
      // Export all audit logs as CSV
      const allAudits = await readAudits();
      const csv = exportAuditsToCSV(allAudits);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit-logs-full.csv"',
        },
      });
    }
    
    if (action === 'types') {
      // Get available event types
      const types = await getAuditEventTypes();
      return NextResponse.json({ types });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing admin audit request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
