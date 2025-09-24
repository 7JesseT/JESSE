import { NextRequest, NextResponse } from 'next/server'
import { addInvite, validateInviteData, calculateExpiryAt } from '@/lib/invites'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, currency, amount, expiryMinutes } = body

    // Validate input
    const validation = validateInviteData(recipientId, currency, amount, expiryMinutes)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Calculate expiry
    const expiryAt = calculateExpiryAt(expiryMinutes)

    // Create invite
    const result = addInvite({
      recipientId,
      currency,
      amount,
      expiryAt
    })

    // Create audit log for invite creation
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'invite',
          actor: 'admin', // Invite creation is admin-only
          details: {
            inviteToken: result.token,
            recipientId,
            currency,
            amount,
            expiryAt: expiryAt.toISOString()
          },
          metadata: `Invite created: ${amount} ${currency} for ${recipientId}, expires ${expiryAt.toISOString()}`
        })
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
