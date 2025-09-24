import { NextRequest, NextResponse } from 'next/server';
import { appendAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || typeof body.type !== 'string') {
      return NextResponse.json(
        { error: 'Type is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Extract IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               request.ip || 
               null;
    
    // Prepare audit event data
    const auditData = {
      type: body.type,
      actor: body.actor || undefined,
      user: body.user || undefined,
      details: body.details || undefined,
      metadata: body.metadata || undefined,
      ip: ip,
    };
    
    // Append the audit event
    const savedEvent = await appendAudit(auditData);
    
    return NextResponse.json(savedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating audit event:', error);
    return NextResponse.json(
      { error: 'Failed to create audit event' },
      { status: 500 }
    );
  }
}
