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

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
