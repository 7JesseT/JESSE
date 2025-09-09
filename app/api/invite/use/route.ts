import { NextRequest, NextResponse } from 'next/server'
import { markInviteUsed } from '@/lib/invites'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, txHash, walletAddress } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    if (!txHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 })
    }

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    const success = markInviteUsed(token, txHash, walletAddress)
    
    if (!success) {
      return NextResponse.json({ error: 'Invite not found, already used, or expired' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error using invite:', error)
    return NextResponse.json({ error: 'Failed to use invite' }, { status: 500 })
  }
}
