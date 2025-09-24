import { NextRequest, NextResponse } from 'next/server'
import { revokeInvite } from '@/lib/invites'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const success = revokeInvite(token)
    
    if (!success) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Create audit log for invite revocation
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'admin',
          actor: 'admin', // Invite revocation is admin-only
          details: {
            action: 'revoke_invite',
            inviteToken: token
          },
          metadata: `Invite revoked: ${token}`
        })
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking invite:', error)
    return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })
  }
}
