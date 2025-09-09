import { NextRequest, NextResponse } from 'next/server'
import { findInviteByToken, getInviteStatus } from '@/lib/invites'

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const invite = findInviteByToken(token)
    
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Check if expired (server-side check)
    const status = getInviteStatus(invite)
    
    return NextResponse.json({
      ...invite,
      status
    })
  } catch (error) {
    console.error('Error fetching invite:', error)
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 })
  }
}
